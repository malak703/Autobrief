/** Allows import during `next build` when env is missing; real `.env.local` overrides at runtime. */
export function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
}

export function supabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.missing-env-placeholder"
  );
}
