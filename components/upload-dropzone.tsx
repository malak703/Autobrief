"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Mic, Image, MessageSquare, Send } from "lucide-react";
import { createBriefFromUpload } from "@/app/actions/briefs";
import {
  normalizeIntakeFromFiles,
  type NormalizedTextEntry,
} from "@/lib/intake-parser";

export function UploadDropzone({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pastedText, setPastedText] = useState("");
  const [previewTexts, setPreviewTexts] = useState<NormalizedTextEntry[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [extractStatus, setExtractStatus] = useState<"checking" | "ok" | "error">("checking");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/extract-health")
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
        if (cancelled) return;
        if (res.ok && data.ok) setExtractStatus("ok");
        else setExtractStatus("error");
      })
      .catch(() => {
        if (!cancelled) setExtractStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fileLabel = useMemo(() => {
    if (files.length === 0) return "No files selected yet";
    if (files.length === 1) return files[0].name;
    return `${files.length} files selected`;
  }, [files]);

  function submitForm(formData: FormData) {
    formData.set("selectedTextIndexes", JSON.stringify(selectedIndexes));
    setError(null);
    startTransition(async () => {
      const result = await createBriefFromUpload(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/briefs/${result.briefId}`);
    });
  }

  async function rebuildPreview(nextFiles: File[], nextPastedText: string) {
    try {
      const parsed = await normalizeIntakeFromFiles(nextFiles, nextPastedText);
      setPreviewTexts(parsed.texts);
      setSelectedIndexes(parsed.texts.map((_, idx) => idx));
    } catch {
      setPreviewTexts([]);
      setSelectedIndexes([]);
    }
  }

  function applyRangeSelection() {
    const start = Number.parseInt(rangeStart, 10);
    const end = Number.parseInt(rangeEnd, 10);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;
    const s = Math.max(1, Math.min(start, end));
    const e = Math.min(previewTexts.length, Math.max(start, end));
    const range = Array.from({ length: e - s + 1 }, (_, i) => i + (s - 1));
    setSelectedIndexes((prev) => Array.from(new Set([...prev, ...range])).sort((a, b) => a - b));
  }

  return (
    <form action={submitForm} className="card p-8">
      <input type="hidden" name="clientId" value={clientId} />

      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#d8c7b5] bg-[#fbf3e8] px-8 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#efe0cc] text-[#5b3f2a]">
          <UploadCloud size={36} />
        </div>

        <h2 className="text-3xl font-bold text-[#2a2118]">
          Drop client materials here
        </h2>

        <p className="mt-3 max-w-xl text-[#7b6f63]">
          Upload WhatsApp/Telegram exports (.zip, .txt, .json), voice notes,
          screenshots, or all at once. We organize the output under texts,
          voice, images, and documents.
        </p>

        <p className="mt-4 max-w-xl text-xs leading-relaxed text-[#5f5246]">
          {extractStatus === "checking" && "Checking extract service (voice + image OCR)…"}
          {extractStatus === "ok" && (
            <>
              <span className="font-semibold text-[#2d6a4f]">Extract service: connected.</span> Voice
              notes and screenshots are sent for transcription/OCR when you generate the brief.{" "}
              <a
                href="/api/extract-health"
                target="_blank"
                rel="noreferrer"
                className="text-[#5b3f2a] underline"
              >
                Open health JSON
              </a>
            </>
          )}
          {extractStatus === "error" && (
            <>
              <span className="font-semibold text-[#9d574d]">Extract service: not reachable.</span> From
              the <code className="rounded bg-white/80 px-1">fastapi-service</code> folder run uvicorn on port
              8000 (see README), or set{" "}
              <code className="rounded bg-white/80 px-1">EXTRACT_SERVICE_URL</code> in{" "}
              <code className="rounded bg-white/80 px-1">.env.local</code>, then refresh.{" "}
              <a
                href="/api/extract-health"
                target="_blank"
                rel="noreferrer"
                className="text-[#5b3f2a] underline"
              >
                Diagnostics
              </a>
            </>
          )}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5f5246]">
            <MessageSquare className="mr-2 inline" size={16} />
            WhatsApp + Telegram export
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5f5246]">
            <Mic className="mr-2 inline" size={16} />
            Voice note
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5f5246]">
            <Image className="mr-2 inline" size={16} />
            Screenshot
          </span>
        </div>

        <label className="btn-primary mt-8 cursor-pointer">
          Choose files
          <input
            name="assets"
            type="file"
            multiple
            className="hidden"
            accept=".zip,.txt,.json,image/*,audio/*,.pdf,.doc,.docx,.csv"
            onChange={(event) => {
              const nextFiles = Array.from(event.target.files ?? []);
              setFiles(nextFiles);
              void rebuildPreview(nextFiles, pastedText);
            }}
          />
        </label>
        <p className="mt-4 text-sm text-[#7b6f63]">{fileLabel}</p>
      </div>

      <textarea
        name="pastedText"
        placeholder="Or paste client messages here..."
        className="mt-6 min-h-40 w-full rounded-3xl border border-[#e8dccd] bg-[#fffaf2] p-5 text-[#2a2118] outline-none placeholder:text-[#a4998d]"
        value={pastedText}
        onChange={(event) => {
          const next = event.target.value;
          setPastedText(next);
          void rebuildPreview(files, next);
        }}
      />

      <div className="mt-4 rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4">
        <p className="text-sm font-semibold text-[#5f5246]">Message selection</p>
        {previewTexts.length > 0 ? (
          <div className="mt-3">
            <div className="mb-3 flex items-center gap-3 text-sm">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedIndexes(previewTexts.map((_, idx) => idx))}
              >
                Select all
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedIndexes([])}
              >
                Clear all
              </button>
              <span className="text-[#7b6f63]">
                {selectedIndexes.length} / {previewTexts.length} selected
              </span>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                max={previewTexts.length}
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                placeholder="From #"
                className="w-28 rounded-xl border border-[#e8dccd] px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={1}
                max={previewTexts.length}
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                placeholder="To #"
                className="w-28 rounded-xl border border-[#e8dccd] px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={applyRangeSelection}
              >
                Select range
              </button>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-[#eadfce] bg-white p-3">
              {previewTexts.map((row, idx) => {
                const checked = selectedIndexes.includes(idx);
                return (
                  <label
                    key={`${row.at ?? "na"}-${row.from ?? "unknown"}-${idx}`}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#f1e6d6] p-2"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedIndexes((prev) =>
                          checked ? prev.filter((v) => v !== idx) : [...prev, idx]
                        );
                      }}
                    />
                    <div className="text-sm text-[#5f5246]">
                      <p className="font-semibold">
                        #{idx + 1} · {row.from ?? "Unknown"}
                      </p>
                      <p>{row.content}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#7b6f63]">
            Upload or paste messages to show ordered chat lines with checkboxes.
          </p>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-[#efc9c2] bg-[#fff1ef] px-4 py-3 text-sm text-[#9d574d]">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setFiles([]);
            setPastedText("");
            setError(null);
            setPreviewTexts([]);
            setSelectedIndexes([]);
            setRangeStart("");
            setRangeEnd("");
          }}
          disabled={isPending}
        >
          Clear
        </button>
        <button type="submit" className="btn-primary" disabled={isPending}>
          <Send className="mr-2 inline" size={16} />
          {isPending ? "Processing..." : "Generate brief"}
        </button>
      </div>
    </form>
  );
}