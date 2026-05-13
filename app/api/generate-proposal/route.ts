import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

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
    
    const prompt = `Based on the following project brief information, generate a comprehensive, professional project proposal. Use the chatgpt-4o-latest model capabilities to create a well-structured, detailed proposal.

Project Brief Content:
${sections}

Additional Comments:
${additionalComments}

Please generate a final project proposal that includes:
1. Executive Summary
2. Project Scope & Deliverables  
3. Timeline & Milestones
4. Budget Considerations
5. Next Steps

Format the response as clean, professional markdown that would be suitable for client presentation.`;

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      throw new Error(`Failed to call Groq API: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const proposal = result.choices?.[0]?.message?.content || 'Failed to generate proposal';
    
    console.log('Proposal generated successfully');

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
    console.error('Error generating proposal:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate proposal' 
      },
      { status: 500 }
    );
  }
}
