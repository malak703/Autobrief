"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  normalizeIntakeFromFiles,
  type NormalizedMediaEntry,
  type NormalizedTextEntry,
} from "@/lib/intake-parser";
import {
  extractDeadlinesRemote,
  extractImageRemote,
  filterAndGenerateBriefRemote,
  transcribeVoiceRemote,
} from "@/lib/extract-service";
import {
  extractBriefTitleLine,
  parseProjectBriefIntoSections,
} from "@/lib/brief-helpers";
import type { BriefSection } from "@/lib/types";
import JSZip from "jszip";

export type CreateBriefFromUploadResult =
  | { ok: true; briefId: string }
  | { ok: false; error: string };

export type UpdateBriefSectionResult = { ok: true } | { ok: false; error: string };

export type MarkBriefSentResult = { ok: true } | { ok: false; error: string };

function makeToken() {
  return crypto.randomUUID().replace(/-/g, "");
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

/** Keep only chat-export images whose basenames are selected; always keep `source: "raw"` uploads. */
function applyChatImageNameSelection(
  images: NormalizedMediaEntry[],
  selectedLowerNames: string[] | null
): NormalizedMediaEntry[] {
  if (selectedLowerNames === null) return images;
  const selected = new Set(selectedLowerNames);
  return images.filter((img) => {
    if (img.source === "raw") return true;
    return selected.has(img.fileName.toLowerCase());
  });
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
  const selectedImageFileNamesField = formData.get("selectedImageFileNames");
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

  let selectedImageLowerNames: string[] | null = null;
  if (selectedImageFileNamesField != null) {
    const raw = String(selectedImageFileNamesField).trim();
    if (raw !== "") {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.every((x): x is string => typeof x === "string")) {
          selectedImageLowerNames = parsed.map((s) => s.toLowerCase());
        }
      } catch {
        selectedImageLowerNames = null;
      }
    } else {
      selectedImageLowerNames = [];
    }
  }
  normalized.images = applyChatImageNameSelection(normalized.images, selectedImageLowerNames);

  const uiVoiceTranscript = String(formData.get("uiVoiceTranscript") ?? "").trim();
  const uiImageTranscript = String(formData.get("uiImageTranscript") ?? "").trim();

  // If the UI already extracted the text, bypass backend extraction to save time!
  let voiceTranscriptionFailures = 0;
  if (normalized.voice.length > 0 && !uiVoiceTranscript) {
    voiceTranscriptionFailures = await transcribeAllVoiceNotes(supabase, normalized.voice);
  }

  let imageExtractionFailures = 0;
  if (normalized.images.length > 0 && !uiImageTranscript) {
    imageExtractionFailures = await extractAllImageScreenshots(supabase, normalized.images);
  }

  const finalRawInput = JSON.stringify(normalized);

  const voiceTranscripts = uiVoiceTranscript 
    ? [uiVoiceTranscript] 
    : normalized.voice.map((v) => v.transcript?.trim()).filter((t): t is string => Boolean(t));
    
  const imageTranscripts = uiImageTranscript 
    ? [uiImageTranscript] 
    : normalized.images.map((img) => img.transcript?.trim()).filter((t): t is string => Boolean(t));

  const labeledPipelineParts: string[] = [];
  for (const row of normalized.texts) {
    const c = row.content?.trim();
    if (c) labeledPipelineParts.push(`[FROM TEXT]: ${c}`);
  }
  for (const vt of voiceTranscripts) {
    labeledPipelineParts.push(`[FROM VOICE]: ${vt}`);
  }
  for (const it of imageTranscripts) {
    labeledPipelineParts.push(`[FROM IMAGE]: ${it}`);
  }
  const pipelineInput = labeledPipelineParts.join("\n\n");

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
  const opsNotes = [baseFollowup, followupExtra].filter(Boolean).join("\n\n") || null;

  const shouldRunPipeline = hasUsableContent && pipelineInput.trim().length > 0;
  const pipelineResult = shouldRunPipeline
    ? await filterAndGenerateBriefRemote(pipelineInput)
    : null;

  let filtered_content: string | null = null;
  let summary: string | null = `New brief for ${client.name}`;
  let goals: string | null = null;
  let gaps: string | null = null;
  let followup_questions: string | null = null;
  let completion_score = 20;

  if (!hasUsableContent) {
    gaps = "No text messages detected; upload chat export or paste messages.";
    followup_questions = opsNotes;
    completion_score = 15;
  } else if (!shouldRunPipeline) {
    summary = "Nothing reached the AI brief pipeline.";
    gaps =
      "After extraction there was no non-empty text to send to the filter (check message selection, voice transcription, and image OCR). Intake was still saved.";
    followup_questions = opsNotes;
    completion_score = Math.max(20, 40 - (voiceTranscriptionFailures + imageExtractionFailures) * 10);
  } else if (!pipelineResult || !pipelineResult.ok) {
    const errMsg =
      pipelineResult && !pipelineResult.ok ? pipelineResult.error : "No pipeline response.";
    summary = "Automated brief generation failed.";
    gaps = [
      "Intake was saved in your workspace, but the filter + brief pipeline did not finish.",
      errMsg,
      "Confirm EXTRACT_SERVICE_URL points at your running FastAPI service and GROQ_API_KEY is set on that service (needed for filter + project brief, not only transcription/OCR).",
    ]
      .filter(Boolean)
      .join("\n\n");
    followup_questions = opsNotes;
    completion_score = Math.max(
      25,
      50 - (voiceTranscriptionFailures + imageExtractionFailures) * 8
    );
  } else {
    filtered_content = pipelineResult.filteredText.trim() || null;
    const { clientTitle, body } = extractBriefTitleLine(pipelineResult.projectBrief);
    const parsed = parseProjectBriefIntoSections(body);

    // Generate a fallback title from the summary section if the AI didn't produce one
    let finalTitle = clientTitle;
    if (!finalTitle && parsed.summary) {
      const firstLine = parsed.summary
        .split(/\n/)
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .find((l) => l.length > 5 && l.length < 100);
      if (firstLine) {
        finalTitle = firstLine.length > 60
          ? firstLine.slice(0, 57).replace(/\s+\S*$/, "") + "…"
          : firstLine;
      }
    }
    if (!finalTitle) {
      finalTitle = `Brief for ${client.name}`;
    }

    const summaryBody =
      parsed.summary?.trim() || body.trim().slice(0, 280) || summary;
    summary = `TITLE: ${finalTitle}\n\n${summaryBody}`;
    goals = parsed.goals?.trim() || null;
    gaps = parsed.gaps?.trim() || null;
    const followParts = [
      parsed.followup_questions?.trim(),
      baseFollowup,
      followupExtra,
    ].filter(Boolean);
    followup_questions = followParts.length > 0 ? followParts.join("\n\n---\n\n") : null;
    completion_score = Math.min(
      95,
      72 +
        (normalized.texts.length > 0 ? 12 : 0) +
        (voiceTranscripts.length > 0 ? 5 : 0) +
        (imageTranscripts.length > 0 ? 5 : 0) -
        (voiceTranscriptionFailures + imageExtractionFailures) * 6
    );
  }

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
      summary,
      goals,
      gaps,
      followup_questions,
      original_sections: { summary, goals, gaps, followup_questions },
      voice_url: normalized.voice.length > 0 ? normalized.voice[0].fileUrl : null,
      image_urls: normalized.images.map((row) => row.fileUrl).filter(Boolean),
      extracted_date: new Date().toISOString(),
      completion_score,
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    return {
      ok: false,
      error: insertError?.message ?? "Failed to save brief. Please try again.",
    };
  }

  if (filtered_content?.trim()) {
    const dl = await extractDeadlinesRemote(filtered_content);
    if (!dl.ok) {
      console.error("[createBriefFromUpload] extractDeadlinesRemote:", dl.error);
    }
    if (dl.ok && dl.deadlines.length > 0) {
      let insertedDeadlines = 0;
      for (const row of dl.deadlines) {
        const { error: dErr } = await supabase.from("deadlines").insert({
          client_id: client.id,
          extracted_text: row.extracted_text,
          parsed_date: row.parsed_date,
          calendar_event_id: null,
        });
        if (!dErr) insertedDeadlines++;
      }
      if (insertedDeadlines > 0) {
        revalidatePath("/calendar");
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/briefs");
  revalidatePath(`/clients/${client.id}`);
  revalidatePath(`/briefs/${inserted.id}`);
  return { ok: true, briefId: inserted.id };
}

export async function updateBriefSection(
  briefId: string,
  sectionId: BriefSection["id"],
  content: string
): Promise<UpdateBriefSectionResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "You must be signed in." };
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

  const { data: brief, error: briefError } = await supabase
    .from("briefs")
    .select("id")
    .eq("id", briefId)
    .eq("owner_id", owner.id)
    .maybeSingle();
  if (briefError || !brief?.id) {
    return { ok: false, error: briefError?.message ?? "Brief not found." };
  }

  const column = sectionId === "followup" ? "followup_questions" : sectionId;
  const { error: updateError } = await supabase
    .from("briefs")
    .update({ [column]: content })
    .eq("id", briefId)
    .eq("owner_id", owner.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  // Recalculate completion_score based on all four sections now stored in DB
  const { data: refreshed } = await supabase
    .from("briefs")
    .select("summary, goals, gaps, followup_questions, filtered_content")
    .eq("id", briefId)
    .eq("owner_id", owner.id)
    .maybeSingle();

  if (refreshed) {
    const hasSection = (v: string | null | undefined) => (v?.trim().length ?? 0) > 10;
    const sectionScore =
      (hasSection(refreshed.summary) ? 20 : 0) +
      (hasSection(refreshed.goals) ? 20 : 0) +
      (hasSection(refreshed.gaps) ? 20 : 0) +
      (hasSection(refreshed.followup_questions) ? 20 : 0);
    const aiBonus = hasSection(refreshed.filtered_content) ? 15 : 0;
    const newScore = Math.min(95, sectionScore + aiBonus);

    await supabase
      .from("briefs")
      .update({ completion_score: newScore })
      .eq("id", briefId)
      .eq("owner_id", owner.id);
  }

  revalidatePath(`/briefs/${briefId}`);
  return { ok: true };
}

export async function markBriefSentToClient(briefId: string): Promise<MarkBriefSentResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "You must be signed in." };
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

  const { data: row, error: briefError } = await supabase
    .from("briefs")
    .select("id,status")
    .eq("id", briefId)
    .eq("owner_id", owner.id)
    .maybeSingle();
  if (briefError || !row?.id) {
    return { ok: false, error: briefError?.message ?? "Brief not found." };
  }

  if (row.status === "draft") {
    const { error: updateError } = await supabase
      .from("briefs")
      .update({ status: "sent" })
      .eq("id", briefId)
      .eq("owner_id", owner.id);
    if (updateError) {
      return { ok: false, error: updateError.message };
    }
  }

  revalidatePath(`/briefs/${briefId}`);
  revalidatePath("/briefs");
  revalidatePath("/");
  return { ok: true };
}
