"use client";

import { formatAuthError } from "@/lib/auth/format-auth-error";
import { isProbablyValidEmail, normalizeEmail } from "@/lib/auth/email";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Spinner } from "@/components/spinner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalizedEmail = normalizeEmail(email);
    if (!isProbablyValidEmail(normalizedEmail)) {
      setError(
        "Enter a valid email like name@example.com (check for typos or extra spaces)."
      );
      return;
    }

    setLoading(true);

    const supabase = createBrowserSupabase();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    setLoading(false);

    if (signError) {
      setError(formatAuthError(signError));
      return;
    }

    router.refresh();
    router.push(next.startsWith("/") ? next : "/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {searchParams.get("error") === "auth" && (
        <p className="rounded-2xl border border-[#efc9c2] bg-[#fff1ef] px-4 py-3 text-sm text-[#9d574d]">
          Email link expired or invalid. Try signing in again.
        </p>
      )}

      {error && (
        <p className="rounded-2xl border border-[#efc9c2] bg-[#fff1ef] px-4 py-3 text-sm text-[#9d574d]">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#5f5246]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="text"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none placeholder:text-[#a4998d]"
          placeholder="you@agency.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#5f5246]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none placeholder:text-[#a4998d]"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading && <Spinner size={16} className="text-white" />}
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-[#7b6f63]">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-[#5b3f2a] underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
