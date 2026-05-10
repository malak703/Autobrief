import { LoginForm } from "@/components/auth/login-form";
import { FileText } from "lucide-react";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="card p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5b3f2a] text-white">
          <FileText size={28} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
          Welcome back
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#2a2118]">Sign in to AutoBrief</h1>
        <p className="mt-2 text-[#7b6f63]">Use the email and password for your workspace.</p>
      </div>

      <Suspense fallback={<p className="text-center text-[#7b6f63]">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
