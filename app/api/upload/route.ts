import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const allowedExtensions = ["mp3", "wav", "m4a", "mp4", "webm"];

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();

    const formData = await req.formData();

    const title = formData.get("title") as string;
    const clientId = formData.get("clientId") as string;
    const file = formData.get("file") as File | null;

    if (!title || !clientId || !file) {
      return NextResponse.json(
        { error: "Client ID, title, and file are required." },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use mp3, wav, m4a, mp4, or webm." },
        { status: 400 }
      );
    }

    console.log("[Next] Upload received:", {
      title,
      clientId,
      fileName: file.name,
      fileSize: file.size,
      extension,
    });

    const fastApiUrl = process.env.EXTRACT_SERVICE_URL;

    if (!fastApiUrl) {
      return NextResponse.json(
        { error: "EXTRACT_SERVICE_URL is missing in .env.local" },
        { status: 500 }
      );
    }

    const fastApiForm = new FormData();
    fastApiForm.append("title", title);
    fastApiForm.append("clientName", clientId);
    fastApiForm.append("file", file);

    console.log("[Next] Sending file to FastAPI...");

    const response = await fetch(`${fastApiUrl}/process-meeting`, {
      method: "POST",
      body: fastApiForm,
    });

    console.log("[Next] FastAPI responded:", response.status);

    if (!response.ok) {
      const errorText = await response.text();

      console.error("[Next] FastAPI error:", errorText);

      return NextResponse.json(
        {
          error: "FastAPI failed to process meeting.",
          details: errorText,
        },
        { status: 500 }
      );
    }

    const result = await response.json();

    console.log("[Next] Saving meeting to Supabase...");

    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        client_id: clientId,
        title,
        file_name: file.name,
        file_type: extension,
        transcript: result.transcript,
        report: result.report,
        status: "report_ready",
      })
      .select()
      .single();

    if (error) {
      console.error("[Next] Supabase insert error:", error);

      return NextResponse.json(
        {
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    console.log("[Next] Meeting saved:", meeting.id);

    return NextResponse.json({
      meetingId: meeting.id,
    });
  } catch (error) {
    console.error("[Next] Unexpected upload error:", error);

    return NextResponse.json(
      {
        error: "Unexpected error while uploading meeting.",
        details: String(error),
      },
      { status: 500 }
    );
  }
}