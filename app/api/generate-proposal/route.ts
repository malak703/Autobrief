import { createServerSupabase } from '@/lib/supabase';
import { getExtractServiceBaseUrl } from '@/lib/extract-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pageData, token } = await request.json();

    // Extract all content for the proposal
    const sections = pageData.sections.map((section: any) => {
      if (section.id === 'followup') {
        const questions = section.content
          .split('\n')
          .map((q: string) => q.trim())
          .filter((q: string) => q.length > 0 && !q.includes('@@@') && !q.includes('---'));

        const questionsWithAnswers = questions.map((q: string, idx: number) => {
          const answerKey = `followup-${idx}`;
          const answer = pageData.followupAnswers[answerKey] || 'No answer provided';
          return `Q: ${q}\nA: ${answer}`;
        }).join('\n\n');

        return `## ${section.title}\n\n${questionsWithAnswers}`;
      }

      return `## ${section.title}\n\n${section.content}`;
    }).join('\n\n');

    const additionalComments = pageData.additionalComments || 'No additional comments';

    const truncate = (text: string, maxChars: number = 4000) => {
      if (text.length <= maxChars) return text;
      return text.slice(0, maxChars) + '... [truncated for length]';
    };

    const prompt = `Based on the following project brief information, generate a comprehensive, professional project proposal. Create a well-structured, detailed proposal.

Project Brief Content:
${truncate(sections)}

Additional Comments:
${truncate(additionalComments, 2000)}

Please generate a final project proposal that includes:
1. Executive Summary
2. Project Scope & Deliverables  
3. Next Steps

Format the response as clean, professional markdown that would be suitable for client presentation.
If something wasn't stated, do not include it. Do not hallucinate or make assumptions.`;

    // Route through FastAPI backend on Railway (which has GROQ_API_KEY)
    const baseUrl = getExtractServiceBaseUrl();
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 120_000);

    let proposal: string;

    try {
      const response = await fetch(`${baseUrl}/generate-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: ctrl.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FastAPI proposal error:', response.status, errorText);
        throw new Error(`FastAPI returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      proposal = result.proposal || result.project_brief || '';

      if (!proposal) {
        throw new Error('FastAPI returned empty proposal');
      }
    } finally {
      clearTimeout(timeout);
    }

    console.log('Proposal generated successfully via FastAPI');

    // Save the proposal to Supabase
    if (token) {
      try {
        const supabase = await createServerSupabase();
        const { error: updateError } = await supabase
          .from('briefs')
          .update({ final_proposal: proposal })
          .eq('token', token);

        if (updateError) {
          console.error('Failed to save proposal to DB:', updateError);
        } else {
          console.log('Proposal saved to Supabase successfully');
        }
      } catch (dbError) {
        console.error('DB error saving proposal:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      proposal
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error generating proposal:', message);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate proposal: ${message}`
      },
      { status: 500 }
    );
  }
}
