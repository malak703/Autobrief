/**
 * Normalizes email input so Supabase/Gotrue parsing matches what users typed (case, stray spaces).
 */
export function normalizeEmail(raw: string): string {
  return raw
    .trim()
    .replace(/[\uFEFF\u200B-\u200D\u2060]/g, "")
    .toLowerCase();
}

/**
 * Lightweight check before hitting the API (avoids inconsistent browser `type="email"` quirks).
 * Supabase still validates; this only catches obvious mistakes.
 */
export function isProbablyValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || !domain || domain.length > 253) return false;
  if (!domain.includes(".")) return false;
  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  if (tld.length < 2) return false;
  return true;
}
