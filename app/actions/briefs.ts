"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  normalizeIntakeFromFiles,
  type NormalizedMediaEntry,
  type NormalizedTextEntry,
} from "@/lib/intake-parser";
import { extractImageRemote, transcribeVoiceRemote } from "@/lib/extract-service";
import JSZip from "jszip";

export type CreateBriefFromUploadResult =
  | { ok: true; briefId: string }
  | { ok: false; error: string };

function makeToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function safeExtractTexts(rawInput: string | null): string[] {
  if (!rawInput) return [];
  try {
    const parsed = JSON.parse(rawInput) as { texts?: { content?: string }[] };
    if (!Array.isArray(parsed.texts)) return [];
    return parsed.texts
      .map((row) => (typeof row?.content === "string" ? row.content.trim() : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function sanitizePathPart(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function extOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

function guessMimeType(fileName: string): string {
  const ext = extOf(fileName);
  if ([".jpg", ".jpeg"].includes(ext)) return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a") return "audio/mp4";
  if (ext === ".ogg" || ext === ".opus") return "audio/ogg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".aac") return "audio/aac";
  if (ext === ".webm") return "audio/webm";
  if (ext === ".pdf") return "application/pdf";
  return "application/octet-stream";
}

function supportsInlinePreview(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType.startsWith("audio/");
}

function toDataUrl(bytes: ArrayBuffer, mimeType: string): string {
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

async function uploadAsset(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  bucket: string,
  ownerId: string,
  clientId: string,
  fileName: string,
  bytes: ArrayBuffer,
  contentType: string
): Promise<{ bucket: string; path: string } | null> {
  const path = `owners/${ownerId}/clients/${clientId}/${Date.now()}-${crypto.randomUUID()}-${sanitizePathPart(fileName)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) return null;
  return { bucket, path };
}

function getPublicUrlForAsset(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  bucket: string,
  path: string
) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl ?? null;
}

async function uploadAllAssets(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  ownerId: string,
  clientId: string,
  files: File[]
) {
  const bucket = process.env.BRIEF_ASSETS_BUCKET ?? "brief-assets";
  const assetsByFileName = new Map<string, { bucket: string; path: string }[]>();
  const inlinePreviewByFileName = new Map<string, string[]>();

  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".txt") || lower.endsWith(".json")) continue;

    if (lower.endsWith(".zip")) {
      try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        for (const entry of Object.values(zip.files)) {
          if (entry.dir) continue;
          const fileName = entry.name.split("/").pop() ?? entry.name;
          const entryLower = fileName.toLowerCase();
          if (entryLower.endsWith(".txt") || entryLower.endsWith(".json")) continue;
          const bytes = await entry.async("arraybuffer");
          const uploaded = await uploadAsset(
            supabase,
            bucket,
            ownerId,
            clientId,
            fileName,
            bytes,
            guessMimeType(fileName)
          );
          if (uploaded) {
            const key = fileName.toLowerCase();
            const rows = assetsByFileName.get(key) ?? [];
            rows.push(uploaded);
            assetsByFileName.set(key, rows);
          }
          const mimeType = guessMimeType(fileName);
          if (supportsInlinePreview(mimeType) && bytes.byteLength <= 8 * 1024 * 1024) {
            const key = fileName.toLowerCase();
            const rows = inlinePreviewByFileName.get(key) ?? [];
            rows.push(toDataUrl(bytes, mimeType));
            inlinePreviewByFileName.set(key, rows);
          }
        }
      } catch {
        // Parser will still process text; this only affects previews.
      }
      continue;
    }

    const uploaded = await uploadAsset(
      supabase,
      bucket,
      ownerId,
      clientId,
      file.name,
      await file.arrayBuffer(),
      file.type || guessMimeType(file.name)
    );
    if (uploaded) {
      const key = file.name.toLowerCase();
      const rows = assetsByFileName.get(key) ?? [];
      rows.push(uploaded);
      assetsByFileName.set(key, rows);
    }
    const mimeType = file.type || guessMimeType(file.name);
    const bytes = await file.arrayBuffer();
    if (supportsInlinePreview(mimeType) && bytes.byteLength <= 8 * 1024 * 1024) {
      const key = file.name.toLowerCase();
      const rows = inlinePreviewByFileName.get(key) ?? [];
      rows.push(toDataUrl(bytes, mimeType));
      inlinePreviewByFileName.set(key, rows);
    }
  }

  return { assetsByFileName, inlinePreviewByFileName };
}

function applyTextSelection(
  texts: NormalizedTextEntry[],
  selectedIndexes: number[]
) {
  if (selectedIndexes.length === 0) return [];
  const selectedSet = new Set(selectedIndexes);
  return texts.filter((_, idx) => selectedSet.has(idx));
}

async function loadMediaBytesForSection(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  section: NormalizedMediaEntry
): Promise<ArrayBuffer | null> {
  if (section.storageBucket && section.storagePath) {
    const { data, error } = await supabase.storage
      .from(section.storageBucket)
      .download(section.storagePath);
    if (error || !data) return null;
    return await data.arrayBuffer();
  }
  const url = section.fileUrl;
  if (url?.startsWith("data:")) {
    const comma = url.indexOf(",");
    if (comma === -1) return null;
    const meta = url.slice(5, comma);
    const payload = url.slice(comma + 1);
    if (meta.endsWith(";base64")) {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    }
    return null;
  }
  if (url?.startsWith("http://") || url?.startsWith("https://")) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
  }
  return null;
}

async function transcribeAllVoiceNotes(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  voiceSections: NormalizedMediaEntry[]
): Promise<number> {
  let failures = 0;
  for (const section of voiceSections) {
    const bytes = await loadMediaBytesForSection(supabase, section);
    if (!bytes) {
      failures++;
      continue;
    }
    const mimeType =
      section.mimeType && section.mimeType !== "application/octet-stream"
        ? section.mimeType
        : guessMimeType(section.fileName);
    const result = await transcribeVoiceRemote(section.fileName, bytes, mimeType);
    if (result.ok) {
      section.transcript = result.extractedText;
    } else {
      failures++;
    }
  }
  return failures;
}

async function extractAllImageScreenshots(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  imageSections: NormalizedMediaEntry[]
): Promise<number> {
  let failures = 0;
  for (const section of imageSections) {
    const bytes = await loadMediaBytesForSection(supabase, section);
    if (!bytes) {
      failures++;
      continue;
    }
    const mimeType =
      section.mimeType && section.mimeType !== "application/octet-stream"
        ? section.mimeType
        : guessMimeType(section.fileName);
    const result = await extractImageRemote(section.fileName, bytes, mimeType);
    if (result.ok) {
      section.transcript = result.extractedText;
    } else {
      failures++;
    }
  }
  return failures;
}

export async function createBriefFromUpload(
  formData: FormData
): Promise<CreateBriefFromUploadResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "You must be signed in." };
  }

  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!clientId) {
    return { ok: false, error: "Missing client." };
  }

  const pastedText = String(formData.get("pastedText") ?? "");
  const selectedTextIndexesRaw = String(formData.get("selectedTextIndexes") ?? "[]");
  const files = formData
    .getAll("assets")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0 && !pastedText.trim()) {
    return { ok: false, error: "Please upload at least one file or paste text." };
  }

  const { data: owner, error: ownerError } = await supabase
    .from("business_owners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (ownerError || !owner?.id) {
    return {
      ok: false,
      error: ownerError?.message ?? "Workspace profile is missing for this account.",
    };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id,name")
    .eq("id", clientId)
    .eq("owner_id", owner.id)
    .maybeSingle();
  if (clientError || !client) {
    return {
      ok: false,
      error: clientError?.message ?? "Client was not found in your workspace.",
    };
  }

  let normalized: Awaited<ReturnType<typeof normalizeIntakeFromFiles>>;
  try {
    normalized = await normalizeIntakeFromFiles(files, pastedText);
  } catch {
    return {
      ok: false,
      error:
        "We could not read one of the uploaded files. Please re-export the chat and try again.",
    };
  }
  const { assetsByFileName, inlinePreviewByFileName } = await uploadAllAssets(
    supabase,
    owner.id,
    client.id,
    files
  );

  for (const section of [
    ...normalized.voice,
    ...normalized.images,
    ...normalized.documents,
    ...normalized.other,
  ]) {
    const key = section.fileName.toLowerCase();
    const rows = assetsByFileName.get(key) ?? [];
    const uploaded = rows.shift() ?? null;
    const inlineRows = inlinePreviewByFileName.get(key) ?? [];
    const inlinePreview = inlineRows.shift() ?? null;
    section.fileUrl = uploaded
      ? getPublicUrlForAsset(supabase, uploaded.bucket, uploaded.path)
      : inlinePreview;
    section.storageBucket = uploaded?.bucket ?? null;
    section.storagePath = uploaded?.path ?? null;
    assetsByFileName.set(key, rows);
    inlinePreviewByFileName.set(key, inlineRows);
  }

  let selectedTextIndexes: number[] = [];
  try {
    const parsed = JSON.parse(selectedTextIndexesRaw) as unknown;
    if (Array.isArray(parsed)) {
      selectedTextIndexes = parsed
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0);
    }
  } catch {
    selectedTextIndexes = [];
  }
  normalized.texts = applyTextSelection(normalized.texts, selectedTextIndexes);

  const voiceTranscriptionFailures =
    normalized.voice.length > 0
      ? await transcribeAllVoiceNotes(supabase, normalized.voice)
      : 0;

  const imageExtractionFailures =
    normalized.images.length > 0
      ? await extractAllImageScreenshots(supabase, normalized.images)
      : 0;

  const finalRawInput = JSON.stringify(normalized);
  const extractedTexts = safeExtractTexts(finalRawInput);
  const combinedText = extractedTexts.join("\n");
  const voiceTranscripts = normalized.voice
    .map((v) => v.transcript?.trim())
    .filter((t): t is string => Boolean(t));
  const imageTranscripts = normalized.images
    .map((img) => img.transcript?.trim())
    .filter((t): t is string => Boolean(t));
  const filteredParts = [combinedText, ...voiceTranscripts, ...imageTranscripts].filter(Boolean);
  const filtered_content = filteredParts.length > 0 ? filteredParts.join("\n\n") : null;

  const hasUsableContent =
    normalized.texts.length > 0 ||
    voiceTranscripts.length > 0 ||
    imageTranscripts.length > 0;

  const baseFollowup =
    normalized.voice.length > 0 || normalized.images.length > 0
      ? "Review uploaded media for missing context before sending."
      : null;
  const followupProblems: string[] = [];
  if (voiceTranscriptionFailures > 0) {
    followupProblems.push(
      `${voiceTranscriptionFailures} voice note(s) could not be transcribed. Ensure the extract service is reachable (EXTRACT_SERVICE_URL / FASTAPI_URL) and GROQ_API_KEY is set on the API.`
    );
  }
  if (imageExtractionFailures > 0) {
    followupProblems.push(
      `${imageExtractionFailures} image(s) could not be OCR’d. Same checks: extract service running and GROQ_API_KEY set for vision.`
    );
  }
  const followupExtra = followupProblems.length > 0 ? followupProblems.join("\n\n") : null;
  const followup_questions = [baseFollowup, followupExtra].filter(Boolean).join("\n\n") || null;

  const { data: inserted, error: insertError } = await supabase
    .from("briefs")
    .insert({
      owner_id: owner.id,
      client_id: client.id,
      token: makeToken(),
      version: 1,
      status: "draft",
      raw_input: finalRawInput,
      filtered_content,
      summary:
        extractedTexts[0]?.slice(0, 280) ||
        voiceTranscripts[0]?.slice(0, 280) ||
        imageTranscripts[0]?.slice(0, 280) ||
        `New brief for ${client.name}`,
      goals: null,
      gaps: !hasUsableContent
        ? "No text messages detected; upload chat export or paste messages."
        : null,
      followup_questions,
      voice_url: normalized.voice.length > 0 ? normalized.voice[0].fileUrl : null,
      image_urls: normalized.images.map((row) => row.fileUrl).filter(Boolean),
      extracted_date: new Date().toISOString(),
      completion_score: Math.min(
        95,
        (normalized.texts.length > 0 ? 45 : 20) +
          (voiceTranscripts.length > 0 ? 12 : 0) +
          (imageTranscripts.length > 0 ? 12 : 0)
      ),
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    return {
      ok: false,
      error: insertError?.message ?? "Failed to save brief. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/briefs");
  revalidatePath(`/clients/${client.id}`);
  revalidatePath(`/briefs/${inserted.id}`);
  return { ok: true, briefId: inserted.id };
}
