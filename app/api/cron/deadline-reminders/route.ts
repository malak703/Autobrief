import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { createNotificationIfEnabled } from "@/lib/notifications/createNotification";

export async function GET() {
  const supabase = await createServerSupabase();

  const now = new Date();

  // Since parsed_date is a DATE column, we compare using YYYY-MM-DD.
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowDate = tomorrow.toISOString().slice(0, 10);

  const { data: deadlines, error } = await supabase
    .from("deadlines")
    .select(
      `
      id,
      client_id,
      extracted_text,
      parsed_date,
      reminder_24h_sent,
      clients (
        id,
        name,
        owner_id
      )
    `
    )
    .eq("reminder_24h_sent", false)
    .eq("parsed_date", tomorrowDate);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  for (const deadline of deadlines ?? []) {
    const client = Array.isArray(deadline.clients)
      ? deadline.clients[0]
      : deadline.clients;

    if (!client?.owner_id) {
      continue;
    }

    await createNotificationIfEnabled({
      supabase,
      userId: client.owner_id,
      type: "deadline_24h_left",
      title: "Deadline reminder",
      message: `24 hours left for ${
        deadline.extracted_text ?? "a client deadline"
      }`,
      link: "/calendar",
    });

    await supabase
      .from("deadlines")
      .update({
        reminder_24h_sent: true,
      })
      .eq("id", deadline.id);
  }

  return NextResponse.json({
    success: true,
    date_checked: tomorrowDate,
    checked: deadlines?.length ?? 0,
  });
}