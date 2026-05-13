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
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("You must be signed in.");
  }

  const { data: owner, error: ownerError } = await supabase
    .from("business_owners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (ownerError || !owner?.id) {
    throw new Error(ownerError?.message ?? "Workspace not found.");
  }

  const { data: dl, error: dlError } = await supabase
    .from("deadlines")
    .select("id, client_id")
    .eq("id", deadlineId)
    .maybeSingle();
  if (dlError || !dl?.client_id) {
    throw new Error(dlError?.message ?? "Deadline not found.");
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", dl.client_id)
    .eq("owner_id", owner.id)
    .maybeSingle();
  if (clientError || !client?.id) {
    throw new Error("Deadline not found or access denied.");
  }

  const { error: delError } = await supabase.from("deadlines").delete().eq("id", deadlineId);
  if (delError) {
    throw new Error(delError.message);
  }

  revalidatePath("/calendar");
}