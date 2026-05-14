"use client";

import { markBriefSentToClient } from "@/app/actions/briefs";
import type { BriefStatus } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

  function sendLink() {
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
      setNotice("Link copied & opened in a new tab.");
      window.open(clientUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => setNotice(null), 4000);
      router.refresh();
    });
  }

  const copyLink = () => {
    navigator.clipboard.writeText(clientUrl);
    setNotice("Link copied!");
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="flex flex-col items-end gap-3">
      {completion < 80 && (
        <p className="text-right text-xs text-[#9a7b52]">
          Completeness is {completion}%. You can still send the link when you are ready.
        </p>
      )}
      {error && (
        <p className="text-right text-sm text-[#9d574d]" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="text-right text-sm text-[#2d6a4f]">{notice}</p>
      )}
      <div className="flex w-full flex-col sm:flex-row sm:flex-wrap justify-end gap-2">
        <button
          type="button"
          className="btn-secondary w-full sm:w-auto"
          onClick={copyLink}
          disabled={isPending}
        >
          Copy link
        </button>
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          onClick={sendLink}
          disabled={isPending}
        >
          {isPending ? "Working…" : status === "sent" ? "Open client link again" : "Send to client"}
        </button>
      </div>
    </div>
  );
}
