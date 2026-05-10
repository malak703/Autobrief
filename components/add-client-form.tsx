"use client";

import { createClientRecord } from "@/app/actions/clients";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddClientForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    setPending(true);

    const res = await createClientRecord({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      company: String(fd.get("company") ?? ""),
      notes: String(fd.get("notes") ?? ""),
    });

    setPending(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    // Safely reset form if it still exists
    if (e.currentTarget) {
      e.currentTarget.reset();
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        className="btn-primary"
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
        }}
      >
        {open ? "Cancel" : "Add client"}
      </button>

      {open && (
        <form
          onSubmit={onSubmit}
          className="card mt-6 space-y-4 p-6"
        >
          <h2 className="text-lg font-bold text-[#2a2118]">New client</h2>

          {error && (
            <p className="rounded-2xl border border-[#efc9c2] bg-[#fff1ef] px-4 py-3 text-sm text-[#9d574d]">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="client-name" className="mb-1 block text-sm font-medium text-[#5f5246]">
              Name <span className="text-[#b86b60]">*</span>
            </label>
            <input
              id="client-name"
              name="name"
              required
              className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label htmlFor="client-email" className="mb-1 block text-sm font-medium text-[#5f5246]">
              Email
            </label>
            <input
              id="client-email"
              name="email"
              type="text"
              inputMode="email"
              autoComplete="off"
              className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none"
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label htmlFor="client-company" className="mb-1 block text-sm font-medium text-[#5f5246]">
              Company
            </label>
            <input
              id="client-company"
              name="company"
              className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none"
              placeholder="Optional"
            />
          </div>

          <div>
            <label htmlFor="client-notes" className="mb-1 block text-sm font-medium text-[#5f5246]">
              Notes
            </label>
            <textarea
              id="client-notes"
              name="notes"
              rows={3}
              className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none"
              placeholder="Private notes (optional)"
            />
          </div>

          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Saving…" : "Save client"}
          </button>
        </form>
      )}
    </div>
  );
}
