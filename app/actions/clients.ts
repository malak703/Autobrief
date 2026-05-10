"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateClientResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createClientRecord(input: {
  name: string;
  email?: string;
  company?: string;
  notes?: string;
}): Promise<CreateClientResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { data: owners, error: ownerError } = await supabase
    .from("business_owners")
    .select("id")
    .eq("user_id", user.id);

  if (ownerError) {
    return { ok: false, error: ownerError.message };
  }

  if (!owners || owners.length === 0) {
    return {
      ok: false,
      error:
        "Workspace profile is missing. Reload the page once, or sign out and back in.",
    };
  }

  // Use the first (or newest) business owner ID
  const owner = owners[0];

  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Client name is required." };
  }

  const { error } = await supabase.from("clients").insert({
    owner_id: owner.id,
    name,
    email: input.email?.trim() || null,
    company: input.company?.trim() || null,
    notes: input.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/clients");
  revalidatePath("/");
  return { ok: true };
}
