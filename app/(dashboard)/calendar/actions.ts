"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

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

export async function updateDeadlineName(
  deadlineId: string,
  extractedText: string
) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("deadlines")
    .update({
      extracted_text: extractedText,
    })
    .eq("id", deadlineId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/calendar");
}

export async function deleteDeadline(deadlineId: string) {
  const supabase = await createServerSupabase();

  const { error: delError } = await supabase
    .from("deadlines")
    .delete()
    .eq("id", deadlineId);

  if (delError) {
    throw new Error(delError.message);
  }

  revalidatePath("/calendar");
}