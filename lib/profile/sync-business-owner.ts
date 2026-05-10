import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Ensures `business_owners` has a row for the signed-in user.
 * A row is required so `clients.owner_id` can reference it under RLS.
 */
export async function syncBusinessOwnerFromAuth() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const meta = user.user_metadata ?? {};
  const full_name = typeof meta.full_name === "string" ? meta.full_name.trim() || null : null;
  const company_name = typeof meta.company_name === "string" ? meta.company_name.trim() || null : null;

  await supabase.from("business_owners").upsert(
    { user_id: user.id, full_name, company_name },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
}