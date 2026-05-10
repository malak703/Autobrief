"use client";

import { createBrowserSupabase } from "@/lib/supabase/browser";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[#5f5246] transition hover:bg-[#f6efe4] hover:text-[#2a2118]"
    >
      <LogOut size={20} />
      <span className="font-medium">{loading ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
