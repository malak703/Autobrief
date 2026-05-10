"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase";

export async function toggleDeadlineSubmitted(
  deadlineId: string,
  isSubmitted: boolean
) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("deadlines")
    .update({
      is_submitted: isSubmitted,
      submitted_at: isSubmitted ? new Date().toISOString() : null,
    })
    .eq("id", deadlineId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/calendar");
}