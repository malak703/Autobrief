import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { getExtractServiceBaseUrl } from "@/lib/extract-service";

export async function POST(request: Request) {
  try {
    const { token, followupAnswers, feedback } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Get the brief data
    const supabase = await createServerSupabase();
    const { data: brief, error } = await supabase
      .from("briefs")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !brief) {
      return NextResponse.json(
        { error: "Brief not found" },
        { status: 404 }
      );
    }

    // Prepare the feedback for AI processing
    const feedbackText = Object.entries(followupAnswers)
      .filter(([_, answer]) => typeof answer === 'string' && answer.trim())
      .map(([key, answer]) => {
        const questionNum = key.replace('followup-', '');
        return `Question ${parseInt(questionNum) + 1}: ${answer}`;
      })
      .join('\n\n');

    const generalFeedback = feedback.general || '';
    const combinedFeedback = feedbackText + (generalFeedback ? `\n\nAdditional feedback: ${generalFeedback}` : '');

    if (!combinedFeedback.trim()) {
      return NextResponse.json(
        { error: "No feedback provided" },
        { status: 400 }
      );
    }

    // Send feedback to AI for processing
    const extractServiceUrl = getExtractServiceBaseUrl();
    const aiResponse = await fetch(`${extractServiceUrl}/process-client-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brief_id: brief.id,
        original_content: brief.content,
        client_feedback: combinedFeedback,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI service error:', await aiResponse.text());
      return NextResponse.json(
        { error: "Failed to process feedback with AI" },
        { status: 500 }
      );
    }

    const aiResult = await aiResponse.json();

    // Update the brief with AI-generated changes
    const { error: updateError } = await supabase
      .from("briefs")
      .update({
        content: aiResult.updated_content || brief.content,
        client_feedback: combinedFeedback,
        ai_processed_feedback: aiResult,
        updated_at: new Date().toISOString(),
      })
      .eq("id", brief.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: "Failed to update brief" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Feedback processed successfully",
      updated_content: aiResult.updated_content,
    });

  } catch (error) {
    console.error('Feedback processing error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
