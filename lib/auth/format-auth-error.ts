import type { AuthError } from "@supabase/supabase-js";

/**
 * Maps Supabase Auth errors to clearer copy (rate limits, redirect URL, email shape).
 */
export function formatAuthError(error: AuthError): string {
  const raw = error.message ?? "";
  const lower = raw.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("email rate limit") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return (
      "Too many signup or login attempts were sent from this IP or for this email. " +
      "Wait several minutes and try again. For local testing you can turn off “Confirm email” " +
      "under Supabase → Authentication → Providers → Email."
    );
  }

  if (
    lower.includes("invalid email") ||
    lower.includes("email address is invalid") ||
    lower.includes("unable to validate email") ||
    (lower.includes("invalid") && lower.includes("email"))
  ) {
    return (
      "Supabase rejected this email address. Use a real inbox (e.g. Gmail), fix typos, " +
      "and avoid spaces. If it still fails, check Authentication → Providers → Email in Supabase " +
      "(disable disposable-email blocking while testing)."
    );
  }

  if (
    lower.includes("redirect") ||
    lower.includes("redirect_uri") ||
    lower.includes("redirect url")
  ) {
    return (
      "Redirect URL is not allowed. In Supabase → Authentication → URL Configuration, add " +
      "your app URL and exactly: …/auth/callback (e.g. http://localhost:3000/auth/callback). " +
      "Match http vs https and localhost vs 127.0.0.1 to what you use in the browser."
    );
  }

  return raw;
}
