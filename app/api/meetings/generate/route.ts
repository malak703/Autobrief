import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();

    const body = await req.json();

    const { title, client_id, brief_id, transcript } = body;

    if (!title || !transcript) {
      return NextResponse.json(
        { error: "Title and transcript are required" },
        { status: 400 }
      );
    }

    const aiRes = await fetch(
      `${process.env.EXTRACT_SERVICE_URL}/generate-meeting-summary`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          transcript,
        }),
      }
    );

    if (!aiRes.ok) {
      return NextResponse.json(
        { error: "AI service failed to generate meeting summary" },
        { status: 500 }
      );
    }

    const summary = await aiRes.json();

    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        title,
        client_id,
        brief_id,
        transcript,
        summary: JSON.stringify(summary), // Store as JSON string
        status: "summary_ready",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      meetingId: meeting.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error while generating meeting summary" },
      { status: 500 }
    );
  }
}