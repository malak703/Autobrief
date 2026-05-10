import { SignupForm } from "@/components/auth/signup-form";
import { FileText } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="card p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5b3f2a] text-white">
          <FileText size={28} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
          Get started
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#2a2118]">Create your workspace</h1>
        <p className="mt-2 text-[#7b6f63]">
          One account per agency. You can invite teammates later.
        </p>
      </div>

      <SignupForm />
    </div>
  );
}
