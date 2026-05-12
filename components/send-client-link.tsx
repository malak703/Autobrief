"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markBriefSentToClient } from "@/app/actions/briefs";
import type { BriefStatus } from "@/lib/types";

export function SendClientLink({
  briefId,
  clientUrl,
  status,
  completion,
}: {
  briefId: string;
  clientUrl: string;
  status: BriefStatus;
  completion: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function copyOnly() {
    setError(null);
    setNotice(null);
    void navigator.clipboard.writeText(clientUrl).then(
      () => {
        setNotice("Link copied to clipboard.");
        setTimeout(() => setNotice(null), 2500);
      },
      () => setError("Could not copy automatically; select the link and copy it.")
    );
  }

  function sendToClient() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await markBriefSentToClient(briefId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      try {
        await navigator.clipboard.writeText(clientUrl);
      } catch {
        // still open tab
      }
      setNotice("Marked as sent. Opening client page in a new tab.");
      window.open(clientUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => setNotice(null), 4000);
      router.refresh();
    });
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-stretch gap-3 sm:max-w-2xl sm:items-end">
      <label className="block w-full text-left text-xs font-medium text-[#5f5246] sm:text-right">
        Client review link
        <input
          readOnly
          type="text"
          value={clientUrl}
          className="mt-1 w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-2.5 text-sm text-[#2a2118] outline-none sm:text-right"
          onFocus={(e) => e.target.select()}
        />
      </label>
      {completion < 80 && (
        <p className="text-left text-xs text-[#9a7b52] sm:text-right">
          Completeness is {completion}%. You can still send the link when you are ready.
        </p>
      )}
      {error && (
        <p className="text-left text-sm text-[#9d574d] sm:text-right" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="text-left text-sm text-[#2d6a4f] sm:text-right">{notice}</p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={copyOnly} disabled={isPending}>
          Copy link
        </button>
        <button type="button" className="btn-primary" onClick={sendToClient} disabled={isPending}>
          {isPending ? "Working…" : status === "sent" ? "Open client link again" : "Send to client"}
        </button>
      </div>
    </div>
  );
}
