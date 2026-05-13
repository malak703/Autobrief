"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateNotificationPreference(
  key:
    | "client_viewed_proposal"
    | "client_confirmed_proposal"
    | "client_edited_proposal"
    | "deadline_24h_left",
  value: boolean
) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        [key]: value,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");

  return { success: true };
}