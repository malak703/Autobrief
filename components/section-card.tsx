"use client";

import { useEffect, useState, useTransition } from "react";
import { updateBriefSection } from "@/app/actions/briefs";
import type { BriefSection } from "@/lib/types";

export function SectionCard({
  briefId,
  section,
}: {
  briefId: string;
  section: BriefSection;
}) {
  const [content, setContent] = useState(section.content);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setContent(section.content);
  }, [section.content]);

  function save() {
    setErrorMsg(null);
    setSaveState("saving");
    startTransition(async () => {
      const res = await updateBriefSection(briefId, section.id, content);
      if (!res.ok) {
        setSaveState("error");
        setErrorMsg(res.error);
        return;
      }
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    });
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-2xl font-bold text-[#2a2118]">{section.title}</h3>

        <span className="rounded-full bg-[#f1e2cc] px-3 py-1 text-xs font-semibold text-[#5b3f2a]">
          {section.status.replace("_", " ")}
        </span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-32 w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4 text-[#2a2118] outline-none"
      />

      {section.clientComment && (
        <div className="mt-4 rounded-2xl border border-[#efc9c2] bg-[#fff1ef] p-4">
          <p className="text-sm font-bold text-[#9d574d]">Client comment</p>
          <p className="mt-1 text-[#7b6f63]">{section.clientComment}</p>
        </div>
      )}

      {errorMsg ? (
        <p className="mt-3 text-sm text-[#9d574d]" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        {saveState === "saved" ? (
          <span className="text-sm font-medium text-[#2d6a4f]">Saved</span>
        ) : null}
        <button type="button" className="btn-secondary" disabled>
          Ask AI to rewrite
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={isPending}
          onClick={save}
        >
          {isPending || saveState === "saving" ? "Saving…" : "Save section"}
        </button>
      </div>
    </div>
  );
}
