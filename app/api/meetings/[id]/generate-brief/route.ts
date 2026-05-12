import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createBriefFromUpload } from "@/app/actions/briefs";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max duration

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    // Get the meeting with client info
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .eq("id", id)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json(
        { error: "Meeting not found." },
        { status: 404 }
      );
    }

    if (!meeting.client_id) {
      return NextResponse.json(
        { error: "Meeting has no associated client." },
        { status: 400 }
      );
    }

    // Create a brief from meeting transcript
    console.log(`[GenerateBrief] Starting brief generation for meeting ${id}`);
    console.log(`[GenerateBrief] Transcript length: ${meeting.transcript?.length || 0} characters`);
    
    const formData = new FormData();
    formData.append("clientId", meeting.client_id);
    formData.append("pastedText", meeting.transcript || "");

    console.log(`[GenerateBrief] Calling createBriefFromUpload...`);
    const result = await createBriefFromUpload(formData);
    console.log(`[GenerateBrief] createBriefFromUpload result:`, result);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Update the meeting to link it to the brief
    const { error: updateError } = await supabase
      .from("meetings")
      .update({ brief_id: result.briefId })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to link meeting to brief:", updateError);
    }

    return NextResponse.json({
      briefId: result.briefId,
      message: "Brief generated successfully from meeting transcript."
    });

  } catch (error) {
    console.error("Error generating brief from meeting:", error);
    return NextResponse.json(
      { error: "Unexpected error while generating brief." },
      { status: 500 }
    );
  }
}
