"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Mic, Image, MessageSquare, Send, FileText, X } from "lucide-react";
import { createBriefFromUpload } from "@/app/actions/briefs";
import { transcribeVoiceRemote, extractImageRemote, getExtractServiceBaseUrl } from "@/lib/extract-service";

interface UploadSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accept: string;
  files: File[];
  extractedText?: string;
  isProcessing: boolean;
}

export function MultiUploadArea({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [extractStatus, setExtractStatus] = useState<"checking" | "ok" | "error">("checking");

  const [sections, setSections] = useState<UploadSection[]>([
    {
      id: "whatsapp",
      title: "WhatsApp/Telegram Chat",
      description: "Upload chat exports (.zip, .txt, .json)",
      icon: <MessageSquare size={20} />,
      accept: ".zip,.txt,.json",
      files: [],
      isProcessing: false,
    },
    {
      id: "voice",
      title: "Voice Records",
      description: "Upload voice notes (.mp3, .m4a, .ogg, .wav)",
      icon: <Mic size={20} />,
      accept: "audio/*,.mp3,.m4a,.ogg,.wav",
      files: [],
      isProcessing: false,
    },
    {
      id: "images",
      title: "Screenshots & Images",
      description: "Upload screenshots (.jpg, .png, .webp)",
      icon: <Image size={20} />,
      accept: "image/*,.jpg,.jpeg,.png,.webp",
      files: [],
      isProcessing: false,
    },
    {
      id: "text",
      title: "Text Messages",
      description: "Paste or upload text content",
      icon: <FileText size={20} />,
      accept: ".txt,.csv,.pdf,.doc,.docx",
      files: [],
      isProcessing: false,
    },
  ]);

  const [pastedText, setPastedText] = useState("");

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

  async function extractFromFiles(files: File[], type: string): Promise<string> {
    if (files.length === 0) return "";

    try {
      switch (type) {
        case "voice":
          if (files.length > 0) {
            const file = files[0];
            const bytes = await file.arrayBuffer();
            const result = await transcribeVoiceRemote(file.name, bytes, file.type);
            return result.ok ? result.extractedText : `[Voice extraction failed: ${result.error}]`;
          }
          return "";

        case "images":
          if (files.length > 0) {
            const results = await Promise.all(
              files.map(async (file) => {
                const bytes = await file.arrayBuffer();
                const result = await extractImageRemote(file.name, bytes, file.type);
                return result.ok ? result.extractedText : `[Image extraction failed: ${result.error}]`;
              })
            );
            return results.filter(text => !text.includes("[Image extraction failed")).join("\n\n");
          }
          return "";

        case "text":
          // For text files, we'll read the content directly
          const textContent = await Promise.all(
            files.map(async (file) => {
              if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
                return await file.text();
              }
              return `[FILE: ${file.name}]`;
            })
          );
          return `[FROM TEXT]: ${textContent.join("\n\n")}`;

        default:
          return "";
      }
    } catch (err) {
      console.error(`Extraction error for ${type}:`, err);
      return `[Extraction failed: ${err instanceof Error ? err.message : "Unknown error"}]`;
    }
  }

  async function handleFileUpload(sectionId: string, files: FileList | null) {
    if (!files) return;

    const newFiles = Array.from(files);
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, files: [...section.files, ...newFiles] }
          : section
      )
    );

    // Auto-extract for voice, images, and text
    if (["voice", "images", "text"].includes(sectionId)) {
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? { ...section, isProcessing: true }
            : section
        )
      );

      const extractedText = await extractFromFiles(newFiles, sectionId);
      
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? { ...section, extractedText, isProcessing: false }
            : section
        )
      );
    }
  }

  function removeFile(sectionId: string, fileIndex: number) {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              files: section.files.filter((_, i) => i !== fileIndex),
              extractedText: section.files.length <= 1 ? "" : section.extractedText,
            }
          : section
      )
    );
  }

  function clearSection(sectionId: string) {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, files: [], extractedText: "", isProcessing: false }
          : section
      )
    );
  }

  function submitForm() {
    setError(null);
    
    // Collect all files from all sections
    const allFiles = sections.flatMap((section) => section.files);
    
    if (allFiles.length === 0 && !pastedText.trim()) {
      setError("Please upload at least one file or enter some text.");
      return;
    }

    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("pastedText", pastedText);
    
    // Add all files
    allFiles.forEach((file) => {
      formData.append("assets", file);
    });

    startTransition(async () => {
      const result = await createBriefFromUpload(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/briefs/${result.briefId}`);
    });
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

      {/* Upload Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sections.map((section) => (
          <div key={section.id} className="card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe0cc] text-[#5b3f2a]">
                {section.icon}
              </div>
              <div>
                <h3 className="font-semibold text-[#2a2118]">{section.title}</h3>
                <p className="text-sm text-[#7b6f63]">{section.description}</p>
              </div>
            </div>

            {/* File Upload Area */}
            <label className="mb-3 block cursor-pointer">
              <div className="flex min-h-20 items-center justify-center rounded-xl border-2 border-dashed border-[#d8c7b5] bg-[#fbf3e8] px-4 py-3 text-center">
                <UploadCloud size={20} className="mx-auto mb-2 text-[#5b3f2a]" />
                <p className="text-sm text-[#7b6f63]">
                  {section.files.length === 0 ? "Click to upload" : `${section.files.length} file(s) selected`}
                </p>
              </div>
              <input
                type="file"
                multiple={section.id !== "voice"} // Voice: single file, others: multiple
                accept={section.accept}
                className="hidden"
                onChange={(e) => handleFileUpload(section.id, e.target.files)}
              />
            </label>

            {/* Files List */}
            {section.files.length > 0 && (
              <div className="mb-3 space-y-2">
                {section.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg bg-[#f8f4ed] px-3 py-2">
                    <span className="truncate text-sm text-[#5f5246]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(section.id, index)}
                      className="text-[#9d574d] hover:text-[#7b3f2f]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => clearSection(section.id)}
                  className="text-sm text-[#5b3f2a] hover:text-[#3b2f1f]"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Processing Status */}
            {section.isProcessing && (
              <div className="mb-3 rounded-lg bg-[#fff1ef] px-3 py-2">
                <p className="text-sm text-[#9d574d">Processing {section.title.toLowerCase()}...</p>
              </div>
            )}

            {/* Extracted Text Preview */}
            {section.extractedText && (
              <div className="rounded-lg bg-[#f0f9ff] p-3">
                <p className="mb-1 text-xs font-semibold text-[#1e40af]">Extracted:</p>
                <p className="text-sm text-[#1e293b] line-clamp-3">{section.extractedText}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Text Paste Area */}
      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-[#2a2118]">Additional Text Content</h3>
        <textarea
          placeholder="Paste any additional messages, notes, or text content here..."
          className="min-h-32 w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4 text-[#2a2118] outline-none placeholder:text-[#a4998d]"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-2xl border border-[#efc9c2] bg-[#fff1ef] px-4 py-3">
          <p className="text-sm text-[#9d574d]">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={submitForm}
          disabled={isPending}
          className="btn-primary"
        >
          <Send className="mr-2 inline" size={16} />
          {isPending ? "Processing..." : "Generate Brief"}
        </button>
      </div>
    </div>
  );
}
