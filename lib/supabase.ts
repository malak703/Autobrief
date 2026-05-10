import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./supabase/env";

export { createBrowserSupabase } from "./supabase/browser";
export { createServerSupabase } from "./supabase/server";

/**
 * Server-side anon client (no auth cookies). Use for public reads that rely on RLS only
 * (e.g. brief by `token`). Prefer `createServerSupabase()` when the user session matters.
 */
export const supabase = createClient(supabaseUrl(), supabaseAnonKey());
