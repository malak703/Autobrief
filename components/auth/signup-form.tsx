"use client";

import { formatAuthError } from "@/lib/auth/format-auth-error";
import { isProbablyValidEmail, normalizeEmail } from "@/lib/auth/email";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Spinner } from "@/components/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const normalizedEmail = normalizeEmail(email);
    if (!isProbablyValidEmail(normalizedEmail)) {
      setError(
        "Enter a valid email like name@example.com (check for typos or extra spaces)."
      );
      return;
    }

    setLoading(true);

    const siteBase =
      typeof process.env.NEXT_PUBLIC_SITE_URL === "string" &&
      process.env.NEXT_PUBLIC_SITE_URL.length > 0
        ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
        : window.location.origin;

    const supabase = createBrowserSupabase();

    const { data, error: signError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${siteBase}/auth/callback?next=/`,
        data: {
          full_name: fullName.trim(),
          company_name: companyName.trim(),
        },
      },
    });

    setLoading(false);

    if (signError) {
      setError(formatAuthError(signError));
      return;
    }

    if (data.session) {
      router.refresh();
      router.push("/");
      return;
    }

    setInfo(
      "Check your inbox to confirm your email. After confirming, you’ll be signed in automatically."
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-2xl border border-[#efc9c2] bg-[#fff1ef] px-4 py-3 text-sm text-[#9d574d]">
          {error}
        </p>
      )}

      {info && (
        <p className="rounded-2xl border border-[#e5f0df] bg-[#f4faf4] px-4 py-3 text-sm text-[#55745a]">
          {info}
        </p>
      )}

      <div>
        <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-[#5f5246]">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none placeholder:text-[#a4998d]"
          placeholder="Alex Rivera"
        />
      </div>

      <div>
        <label htmlFor="companyName" className="mb-2 block text-sm font-medium text-[#5f5246]">
          Company name
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          autoComplete="organization"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none placeholder:text-[#a4998d]"
          placeholder="Northline Studio"
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none placeholder:text-[#a4998d]"
        />
        <p className="mt-1 text-xs text-[#a4998d]">At least 8 characters.</p>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading && <Spinner size={16} className="text-white" />}
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-[#7b6f63]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#5b3f2a] underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
