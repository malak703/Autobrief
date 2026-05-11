/**
 * Calls the Labtea FastAPI extract service (voice transcription, image OCR, etc.).
 * Configure EXTRACT_SERVICE_URL (e.g. http://127.0.0.1:8000) in the Next.js server env.
 */

const DEFAULT_EXTRACT_URL = "http://127.0.0.1:8000";
const VOICE_REQUEST_TIMEOUT_MS = 180_000;
const IMAGE_REQUEST_TIMEOUT_MS = 180_000;
const PIPELINE_REQUEST_TIMEOUT_MS = 300_000;
const DEADLINE_EXTRACT_TIMEOUT_MS = 90_000;

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

export type FilterAndBriefRemoteResult =
  | { ok: true; filteredText: string; projectBrief: string }
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

/**
 * Raw combined intake text → Groq work filter → Groq project brief (FastAPI).
 * Requires GROQ_API_KEY on the extract service. Response is not shown to end users in the app UI.
 */
export async function filterAndGenerateBriefRemote(
  combinedText: string
): Promise<FilterAndBriefRemoteResult> {
  const baseUrl = getExtractServiceBaseUrl();
  const url = `${baseUrl}/filter-and-generate-brief`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PIPELINE_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: combinedText }),
      signal: controller.signal,
    });

    const text = await res.text();
    let json: {
      filtered_text?: unknown;
      project_brief?: unknown;
      detail?: unknown;
    } = {};
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
      const base = message || `HTTP ${res.status}`;
      if (res.status === 404) {
        return {
          ok: false,
          error: `${base} (POST ${url}). Nothing is listening for this path: use the FastAPI app root (same host where GET /health returns "autobrief-fastapi-extract"), restart uvicorn from autobrief/fastapi-service after pulling latest code, and ensure EXTRACT_SERVICE_URL in Next.js .env.local is not pointing at the Next.js site (port 3000).`,
        };
      }
      return { ok: false, error: base };
    }

    const filtered =
      typeof json.filtered_text === "string" ? json.filtered_text.trim() : "";
    const projectBrief =
      typeof json.project_brief === "string" ? json.project_brief.trim() : "";
    if (!projectBrief) {
      return { ok: false, error: "Empty project_brief in pipeline response" };
    }
    return { ok: true, filteredText: filtered, projectBrief };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("abort")) {
      return { ok: false, error: "Brief pipeline timed out" };
    }
    return {
      ok: false,
      error: `Cannot reach extract service at ${baseUrl}: ${msg}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

export type ExtractedDeadlineRow = { parsed_date: string; extracted_text: string };

export type ExtractDeadlinesRemoteResult =
  | { ok: true; deadlines: ExtractedDeadlineRow[] }
  | { ok: false; error: string };

/**
 * Uses FastAPI + Groq to find explicit YYYY-MM-DD deadlines in filtered work bullets.
 */
export async function extractDeadlinesRemote(
  filteredWorkBullets: string
): Promise<ExtractDeadlinesRemoteResult> {
  const baseUrl = getExtractServiceBaseUrl();
  const url = `${baseUrl}/extract-deadlines`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEADLINE_EXTRACT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: filteredWorkBullets }),
      signal: controller.signal,
    });

    const text = await res.text();
    let json: { deadlines?: unknown; detail?: unknown } = {};
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

    const arr = json.deadlines;
    const deadlines: ExtractedDeadlineRow[] = [];
    if (Array.isArray(arr)) {
      const iso = /^\d{4}-\d{2}-\d{2}$/;
      for (const item of arr) {
        if (!item || typeof item !== "object") continue;
        const o = item as Record<string, unknown>;
        const pd = typeof o.parsed_date === "string" ? o.parsed_date.trim() : "";
        const name =
          (typeof o.extracted_text === "string" ? o.extracted_text.trim() : "") ||
          (typeof o.requirement === "string" ? o.requirement.trim() : "") ||
          (typeof o.deliverable === "string" ? o.deliverable.trim() : "") ||
          (typeof o.title === "string" ? o.title.trim() : "");
        if (!iso.test(pd) || !name) continue;
        deadlines.push({ parsed_date: pd, extracted_text: name });
      }
    }
    return { ok: true, deadlines };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("abort")) {
      return { ok: false, error: "Deadline extraction timed out" };
    }
    return {
      ok: false,
      error: `Cannot reach extract service at ${baseUrl}: ${msg}`,
    };
  } finally {
    clearTimeout(timer);
  }
}
