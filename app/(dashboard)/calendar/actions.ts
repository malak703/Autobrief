"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

/** Get the current user's owner_id, or throw if not authenticated. */
async function getOwnerId() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { data: owner } = await supabase
    .from("business_owners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!owner?.id) throw new Error("Workspace profile is missing.");
  return { supabase, ownerId: owner.id };
}

/** Verify that a deadline belongs to one of the current user's clients. */
async function verifyDeadlineOwnership(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  ownerId: string,
  deadlineId: string
) {
  // Get the deadline's client_id
  const { data: deadline } = await supabase
    .from("deadlines")
    .select("client_id")
    .eq("id", deadlineId)
    .maybeSingle();

  if (!deadline?.client_id) throw new Error("Deadline not found.");

  // Verify the client belongs to the current user
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", deadline.client_id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!client) throw new Error("You do not have access to this deadline.");
}

export async function toggleDeadlineSubmitted(
  deadlineId: string,
  isSubmitted: boolean
) {
  const { supabase, ownerId } = await getOwnerId();
  await verifyDeadlineOwnership(supabase, ownerId, deadlineId);

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
  const { supabase, ownerId } = await getOwnerId();
  await verifyDeadlineOwnership(supabase, ownerId, deadlineId);

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
  const { supabase, ownerId } = await getOwnerId();
  await verifyDeadlineOwnership(supabase, ownerId, deadlineId);

  const { error: delError } = await supabase
    .from("deadlines")
    .delete()
    .eq("id", deadlineId);

  if (delError) {
    throw new Error(delError.message);
  }

  revalidatePath("/calendar");
}