"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Mic, Image, MessageSquare, Send, FileText, X } from "lucide-react";
import { createBriefFromUpload } from "@/app/actions/briefs";
import {
  normalizeIntakeFromFiles,
  resolveZipImagePreviewBlobUrls,
  type NormalizedMediaEntry,
  type NormalizedTextEntry,
} from "@/lib/intake-parser";
import { transcribeVoiceRemote, extractImageRemote } from "@/lib/extract-service";

export function EnhancedUploadArea({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pastedText, setPastedText] = useState("");
  const [previewTexts, setPreviewTexts] = useState<NormalizedTextEntry[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [previewChatImages, setPreviewChatImages] = useState<NormalizedMediaEntry[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [selectedImageNames, setSelectedImageNames] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [extractStatus, setExtractStatus] = useState<"checking" | "ok" | "error">("checking");

  // Separate file states for different types
  const [voiceFiles, setVoiceFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [voiceExtractedText, setVoiceExtractedText] = useState("");
  const [imageExtractedText, setImageExtractedText] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

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

  function submitForm() {
    setError(null);
    startTransition(async () => {
      // Create FormData with all files from all sections
      const formData = new FormData();
      formData.set("clientId", clientId);
      formData.set("pastedText", pastedText);
      formData.set("selectedTextIndexes", JSON.stringify(selectedIndexes));
      if (previewChatImages.length > 0) {
        formData.set("selectedImageFileNames", JSON.stringify(selectedImageNames));
      }

      // Add all files from all sections
      [...files, ...voiceFiles, ...imageFiles].forEach((file) => {
        formData.append("assets", file);
      });

      const result = await createBriefFromUpload(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/briefs/${result.briefId}`);
    });
  }

  async function rebuildPreview(nextFiles: File[], nextPastedText: string) {
    setImagePreviewUrls((prev) => {
      for (const u of prev) {
        if (u) URL.revokeObjectURL(u);
      }
      return [];
    });
    try {
      const parsed = await normalizeIntakeFromFiles(nextFiles, nextPastedText);
      setPreviewTexts(parsed.texts);
      setSelectedIndexes(parsed.texts.map((_, idx) => idx));
      setPreviewChatImages(parsed.images);
      const names = parsed.images.map((img) => img.fileName.toLowerCase());
      setSelectedImageNames(names);
      const urls = await resolveZipImagePreviewBlobUrls(nextFiles, parsed.images);
      setImagePreviewUrls(urls);
    } catch {
      setPreviewTexts([]);
      setSelectedIndexes([]);
      setPreviewChatImages([]);
      setSelectedImageNames([]);
      setImagePreviewUrls([]);
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

  async function handleVoiceUpload(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    setVoiceFiles(newFiles);
    
    if (newFiles.length > 0) {
      setIsProcessingVoice(true);
      try {
        const file = newFiles[0];
        const bytes = await file.arrayBuffer();
        const result = await transcribeVoiceRemote(file.name, bytes, file.type);
        setVoiceExtractedText(result.ok ? result.extractedText : `[Voice extraction failed: ${result.error}]`);
      } catch (err) {
        setVoiceExtractedText(`[Voice extraction failed: ${err instanceof Error ? err.message : "Unknown error"}]`);
      } finally {
        setIsProcessingVoice(false);
      }
    }
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    setImageFiles(newFiles);
    
    if (newFiles.length > 0) {
      setIsProcessingImages(true);
      try {
        const results = await Promise.all(
          newFiles.map(async (file) => {
            const bytes = await file.arrayBuffer();
            const result = await extractImageRemote(file.name, bytes, file.type);
            return result.ok ? result.extractedText : `[Image extraction failed: ${result.error}]`;
          })
        );
        const validResults = results.filter(text => !text.includes("[Image extraction failed"));
        setImageExtractedText(validResults.join("\n\n"));
      } catch (err) {
        setImageExtractedText(`[Image extraction failed: ${err instanceof Error ? err.message : "Unknown error"}]`);
      } finally {
        setIsProcessingImages(false);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Extract Service Status */}
      <div className="rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4">
        <p className="text-sm">
          {extractStatus === "checking" && "Checking extract service (voice + image OCR)…"}
          {extractStatus === "ok" && (
            <span className="font-semibold text-[#2d6a4f]">
              ✓ Extract service connected - Voice notes and images will be processed automatically
            </span>
          )}
          {extractStatus === "error" && (
            <span className="font-semibold text-[#9d574d]">
              ✗ Extract service not available - Voice/image processing disabled
            </span>
          )}
        </p>
      </div>

      {/* WhatsApp/Telegram Section with Message Selection */}
      <div className="card p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe0cc] text-[#5b3f2a]">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-[#2a2118]">WhatsApp/Telegram Chat</h3>
              <p className="text-sm text-[#7b6f63]">Upload chat exports (.zip, .txt, .json)</p>
            </div>
          </div>
        </div>

        <input type="hidden" name="clientId" value={clientId} />

        <div className="flex min-h-90 flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#d8c7b5] bg-[#fbf3e8] px-8 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#efe0cc] text-[#5b3f2a]">
            <UploadCloud size={36} />
          </div>

          <h2 className="text-3xl font-bold text-[#2a2118]">
            Drop client materials here
          </h2>

          <p className="mt-3 max-w-xl text-[#7b6f63]">
            Upload WhatsApp/Telegram exports (.zip, .txt, .json). After upload, select which messages to include in the brief.
          </p>

          <label className="btn-primary mt-8 cursor-pointer">
            Choose files
            <input
              name="assets"
              type="file"
              multiple
              className="hidden"
              accept=".zip,.txt,.json"
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

        {/* Message Selection */}
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

        <div className="mt-6 rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4">
          <p className="text-sm font-semibold text-[#5f5246]">
            Images from this export (optional)
          </p>
          <p className="mt-1 text-xs text-[#7b6f63]">
            For WhatsApp/Telegram zips, pick which images go into the brief (for example skip pure
            inspiration). Files you add under Screenshots and Images below are always included.
          </p>
          {previewChatImages.length > 0 ? (
            <div className="mt-3">
              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setSelectedImageNames(previewChatImages.map((img) => img.fileName.toLowerCase()))
                  }
                >
                  Select all images
                </button>
                <button type="button" className="btn-secondary" onClick={() => setSelectedImageNames([])}>
                  Clear all images
                </button>
                <span className="text-[#7b6f63]">
                  {selectedImageNames.length} / {previewChatImages.length} selected
                </span>
              </div>
              <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
                {previewChatImages.map((img, idx) => {
                  const key = img.fileName.toLowerCase();
                  const checked = selectedImageNames.includes(key);
                  const previewUrl = imagePreviewUrls[idx];
                  return (
                    <label
                      key={`${key}-${idx}`}
                      className={`flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white ${
                        checked ? "border-[#9a7b52] ring-2 ring-[#d4c4a8]" : "border-[#eadfce]"
                      }`}
                    >
                      <div className="relative aspect-square bg-[#f5efe6]">
                        {previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-2 text-center text-xs text-[#7b6f63]">
                            Preview unavailable
                          </div>
                        )}
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedImageNames((prev) =>
                              checked ? prev.filter((k) => k !== key) : [...prev, key]
                            );
                          }}
                          className="absolute left-2 top-2 h-4 w-4 rounded border-[#c4b5a4]"
                        />
                      </div>
                      <div className="border-t border-[#f1e6d6] p-2">
                        <p className="truncate text-xs font-medium text-[#2a2118]" title={img.fileName}>
                          {img.fileName}
                        </p>
                        {img.from && (
                          <p className="truncate text-xs text-[#7b6f63]">From {img.from}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#7b6f63]">
              No images detected in this export yet. They appear here when the chat references
              image files inside a .zip.
            </p>
          )}
        </div>
      </div>

      {/* Voice and Image Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Voice Section */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe0cc] text-[#5b3f2a]">
              <Mic size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-[#2a2118]">Voice Records</h3>
              <p className="text-sm text-[#7b6f63]">Upload voice notes (.mp3, .m4a, .ogg, .wav)</p>
            </div>
          </div>

          <label className="mb-3 block cursor-pointer">
            <div className="flex min-h-20 items-center justify-center rounded-xl border-2 border-dashed border-[#d8c7b5] bg-[#fbf3e8] px-4 py-3 text-center">
              <UploadCloud size={20} className="mx-auto mb-2 text-[#5b3f2a]" />
              <p className="text-sm text-[#7b6f63]">
                {voiceFiles.length === 0 ? "Click to upload voice" : `${voiceFiles.length} voice file(s)`}
              </p>
            </div>
            <input
              type="file"
              accept="audio/*,.mp3,.m4a,.ogg,.wav"
              className="hidden"
              onChange={(e) => handleVoiceUpload(e.target.files)}
            />
          </label>

          {voiceFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              {voiceFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-[#f8f4ed] px-3 py-2">
                  <span className="truncate text-sm text-[#5f5246]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceFiles([]);
                      setVoiceExtractedText("");
                    }}
                    className="text-[#9d574d] hover:text-[#7b3f2f]"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isProcessingVoice && (
            <div className="mb-3 rounded-lg bg-[#fff1ef] px-3 py-2">
              <p className="text-sm text-[#9d574d]">Processing voice...</p>
            </div>
          )}

          {voiceExtractedText && (
            <div className="rounded-lg bg-[#f0f9ff] p-3">
              <p className="mb-1 text-xs font-semibold text-[#1e40af]">Transcribed:</p>
              <p className="text-sm text-[#1e293b] line-clamp-3">{voiceExtractedText}</p>
            </div>
          )}
        </div>

        {/* Images Section */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe0cc] text-[#5b3f2a]">
              <Image size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-[#2a2118]">Screenshots & Images</h3>
              <p className="text-sm text-[#7b6f63]">Upload screenshots (.jpg, .png, .webp)</p>
            </div>
          </div>

          <label className="mb-3 block cursor-pointer">
            <div className="flex min-h-20 items-center justify-center rounded-xl border-2 border-dashed border-[#d8c7b5] bg-[#fbf3e8] px-4 py-3 text-center">
              <UploadCloud size={20} className="mx-auto mb-2 text-[#5b3f2a]" />
              <p className="text-sm text-[#7b6f63]">
                {imageFiles.length === 0 ? "Click to upload images" : `${imageFiles.length} image(s)`}
              </p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />
          </label>

          {imageFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              {imageFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-[#f8f4ed] px-3 py-2">
                  <span className="truncate text-sm text-[#5f5246]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFiles([]);
                      setImageExtractedText("");
                    }}
                    className="text-[#9d574d] hover:text-[#7b3f2f]"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isProcessingImages && (
            <div className="mb-3 rounded-lg bg-[#fff1ef] px-3 py-2">
              <p className="text-sm text-[#9d574d]">Processing images...</p>
            </div>
          )}

          {imageExtractedText && (
            <div className="rounded-lg bg-[#f0f9ff] p-3">
              <p className="mb-1 text-xs font-semibold text-[#1e40af]">Extracted:</p>
              <p className="text-sm text-[#1e293b] line-clamp-3">{imageExtractedText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <p className="mt-4 rounded-2xl border border-[#efc9c2] bg-[#fff1ef] px-4 py-3 text-sm text-[#9d574d]">
          {error}
        </p>
      )}

      {/* Submit Button */}
      <div className="flex w-full flex-col justify-end gap-3 sm:flex-row">
        <button
          type="button"
          className="btn-secondary w-full sm:w-auto"
          onClick={() => {
            setFiles([]);
            setPastedText("");
            setError(null);
            setPreviewTexts([]);
            setSelectedIndexes([]);
            setRangeStart("");
            setRangeEnd("");
            setPreviewChatImages([]);
            setSelectedImageNames([]);
            setImagePreviewUrls((prev) => {
              for (const u of prev) {
                if (u) URL.revokeObjectURL(u);
              }
              return [];
            });
            setVoiceFiles([]);
            setImageFiles([]);
            setVoiceExtractedText("");
            setImageExtractedText("");
          }}
          disabled={isPending}
        >
          Clear all
        </button>
        <button
          onClick={submitForm}
          className="btn-primary w-full sm:w-auto"
          disabled={isPending}
        >
          <Send className="mr-2 inline" size={16} />
          {isPending ? "Processing..." : "Generate brief"}
        </button>
      </div>
    </div>
  );
}
