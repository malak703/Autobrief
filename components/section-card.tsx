"use client";

import { updateBriefSection } from "@/app/actions/briefs";
import {
  joinFollowupQuestionsField,
  splitFollowupQuestionsField,
} from "@/lib/brief-helpers";
import type { BriefSection } from "@/lib/types";
import { computeWordDiff, hasChanges } from "@/lib/word-diff";
import { useEffect, useState, useTransition } from "react";

function DiffDisplay({ original, current }: { original: string; current: string }) {
  if (!hasChanges(original, current)) return null;

  const segments = computeWordDiff(original, current);

  return (
    <div className="mt-4 rounded-2xl border border-[#e8dccd] bg-[#fbf3e8] p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9a7b52]">
        Changes from original
      </p>
      <div className="leading-8 text-[#2a2118]">
        {segments.map((seg, i) => {
          if (seg.type === "removed") {
            return (
              <span key={i} className="rounded bg-[#ffd9d5] px-1 line-through">
                {seg.text}
              </span>
            );
          }
          if (seg.type === "added") {
            return (
              <span key={i} className="rounded bg-[#dcebd6] px-1">
                {seg.text}
              </span>
            );
          }
          return <span key={i}>{seg.text}</span>;
        })}
      </div>
    </div>
  );
}

export function SectionCard({
  briefId,
  section,
}: {
  briefId: string;
  section: BriefSection;
}) {
  const [content, setContent] = useState(section.content);
  const [followupMode, setFollowupMode] = useState<"single" | "multi">("single");
  const [followupQuestions, setFollowupQuestions] = useState<string[]>([]);
  const [followupOps, setFollowupOps] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showDiff, setShowDiff] = useState(false);

  const originalContent = section.originalContent ?? "";
  const hasDiff = originalContent && hasChanges(originalContent, content);

  useEffect(() => {
    if (section.id !== "followup") {
      setFollowupMode("single");
      setContent(section.content);
      return;
    }
    const parsed = splitFollowupQuestionsField(section.content);
    if (parsed.questions.length > 0) {
      setFollowupMode("multi");
      setFollowupQuestions(parsed.questions);
      setFollowupOps(parsed.opsNotes ?? "");
    } else {
      setFollowupMode("single");
      setContent(section.content);
    }
  }, [section.content, section.id]);

  function payloadForSave(): string {
    if (section.id === "followup" && followupMode === "multi") {
      return joinFollowupQuestionsField(followupQuestions, followupOps || null);
    }
    return content;
  }

  function save() {
    setErrorMsg(null);
    setSaveState("saving");
    startTransition(async () => {
      const res = await updateBriefSection(briefId, section.id, payloadForSave());
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
      <div className="mb-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-bold text-[#2a2118] md:text-2xl">{section.title}</h3>

        <div className="flex items-center gap-2">
          {hasDiff && (
            <button
              type="button"
              className="rounded-full bg-[#dcebd6] px-3 py-1 text-xs font-semibold text-[#2d6a4f] hover:bg-[#c8dfc0] transition-colors"
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? "Hide changes" : "Show changes"}
            </button>
          )}
          <span className="rounded-full bg-[#f1e2cc] px-3 py-1 text-xs font-semibold text-[#5b3f2a]">
            {section.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {section.id === "followup" && followupMode === "multi" ? (
        <div className="space-y-5">
          {followupQuestions.map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#e8dccd] bg-[#fffaf2]/80 p-4"
            >
              <label className="block text-sm font-medium text-[#5f5246]">
                Question {idx + 1}
                <textarea
                  value={followupQuestions[idx]}
                  onChange={(e) => {
                    const next = [...followupQuestions];
                    next[idx] = e.target.value;
                    setFollowupQuestions(next);
                  }}
                  className="mt-2 min-h-24 w-full rounded-2xl border border-[#e8dccd] bg-white p-4 text-base leading-relaxed text-[#2a2118] outline-none"
                />
              </label>
            </div>
          ))}
          <div className="rounded-2xl border border-[#e8dccd] bg-[#fbf3e8] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9a7b52]">
              Team / pipeline notes
            </p>
            <textarea
              value={followupOps}
              onChange={(e) => setFollowupOps(e.target.value)}
              placeholder="Internal notes (saved after --- in the brief field)"
              className="mt-3 min-h-20 w-full rounded-2xl border border-[#e8dccd] bg-white p-4 text-sm text-[#2a2118] outline-none"
            />
          </div>
        </div>
      ) : section.id === "gaps" ? (
        <div className="min-h-32 w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4 text-[#2a2118]">
          <p className="whitespace-pre-wrap">{content || "—"}</p>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-32 w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4 text-[#2a2118] outline-none"
        />
      )}

      {/* Diff display */}
      {showDiff && hasDiff && (
        <DiffDisplay original={originalContent} current={content} />
      )}

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

      {section.id !== "gaps" && (
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          {saveState === "saved" ? (
            <span className="text-sm font-medium text-[#2d6a4f]">Saved</span>
          ) : null}

          <button
            type="button"
            className="btn-primary"
            disabled={isPending}
            onClick={save}
          >
            {isPending || saveState === "saving" ? "Saving…" : "Save section"}
          </button>
        </div>
      )}
    </div>
  );
}
