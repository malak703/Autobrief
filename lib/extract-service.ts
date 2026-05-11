/**
 * Calls the Labtea FastAPI extract service (voice transcription, image OCR, etc.).
 * Configure EXTRACT_SERVICE_URL (e.g. http://127.0.0.1:8000) in the Next.js server env.
 */

const DEFAULT_EXTRACT_URL = "http://127.0.0.1:8000";
const VOICE_REQUEST_TIMEOUT_MS = 180_000;
const IMAGE_REQUEST_TIMEOUT_MS = 180_000;

export function getExtractServiceBaseUrl(): string {
  const raw =
    process.env.EXTRACT_SERVICE_URL?.trim() ||
    process.env.FASTAPI_URL?.trim() ||
    DEFAULT_EXTRACT_URL;
  return raw.replace(/\/$/, "");
}

export type ExtractRemoteResult =
  | { ok: true; extractedText: string }
  | { ok: false; error: string };

/** @deprecated use ExtractRemoteResult */
export type TranscribeVoiceResult = ExtractRemoteResult;

function parseExtractJsonResponse(text: string, res: Response): ExtractRemoteResult {
  let json: { extracted_text?: unknown; detail?: unknown } = {};
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const detail = json.detail;
    let message: string;
    if (typeof detail === "string") message = detail;
    else if (Array.isArray(detail)) {
      message = detail
        .map((d) =>
          typeof d === "object" && d && "msg" in d ? String((d as { msg?: unknown }).msg) : ""
        )
        .filter(Boolean)
        .join("; ");
    } else message = text.slice(0, 400);
    return { ok: false, error: message || `HTTP ${res.status}` };
  }

  const extracted =
    typeof json.extracted_text === "string" ? json.extracted_text.trim() : "";
  if (!extracted) {
    return { ok: false, error: "Empty extract response" };
  }
  return { ok: true, extractedText: extracted };
}

export async function transcribeVoiceRemote(
  fileName: string,
  bytes: ArrayBuffer,
  mimeType: string
): Promise<ExtractRemoteResult> {
  const baseUrl = getExtractServiceBaseUrl();
  const url = `${baseUrl}/extract-voice`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VOICE_REQUEST_TIMEOUT_MS);

  try {
    const body = new FormData();
    const blob = new Blob([bytes], { type: mimeType || "application/octet-stream" });
    body.append("voice", blob, fileName);

    const res = await fetch(url, {
      method: "POST",
      body,
      signal: controller.signal,
    });

    const text = await res.text();
    return parseExtractJsonResponse(text, res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("abort")) {
      return { ok: false, error: "Transcription timed out" };
    }
    return {
      ok: false,
      error: `Cannot reach extract service at ${baseUrl}: ${msg}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * OCR / vision extract for one image (FastAPI accepts one file per request under `images`).
 */
export async function extractImageRemote(
  fileName: string,
  bytes: ArrayBuffer,
  mimeType: string
): Promise<ExtractRemoteResult> {
  const baseUrl = getExtractServiceBaseUrl();
  const url = `${baseUrl}/extract-image`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_REQUEST_TIMEOUT_MS);

  try {
    const body = new FormData();
    const blob = new Blob([bytes], { type: mimeType || "application/octet-stream" });
    body.append("images", blob, fileName);

    const res = await fetch(url, {
      method: "POST",
      body,
      signal: controller.signal,
    });

    const text = await res.text();
    const parsed = parseExtractJsonResponse(text, res);
    if (!parsed.ok) return parsed;
    return { ok: true, extractedText: parsed.extractedText };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("abort")) {
      return { ok: false, error: "Image extraction timed out" };
    }
    return {
      ok: false,
      error: `Cannot reach extract service at ${baseUrl}: ${msg}`,
    };
  } finally {
    clearTimeout(timer);
  }
}
