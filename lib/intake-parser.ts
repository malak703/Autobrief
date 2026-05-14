import JSZip from "jszip";

export type NormalizedTextEntry = {
  source: "whatsapp" | "telegram" | "raw";
  from: string | null;
  at: string | null;
  content: string;
};

export type NormalizedMediaEntry = {
  source: "whatsapp" | "telegram" | "raw";
  from: string | null;
  fileName: string;
  mimeType: string;
  fileUrl?: string | null;
  storageBucket?: string | null;
  storagePath?: string | null;
  /** Filled after upload when the extract service transcribes/OCRs this file. */
  transcript?: string | null;
};

export type NormalizedIntake = {
  texts: NormalizedTextEntry[];
  voice: NormalizedMediaEntry[];
  images: NormalizedMediaEntry[];
  documents: NormalizedMediaEntry[];
  other: NormalizedMediaEntry[];
};

type AttachmentHint = {
  sender: string | null;
  kind: "voice" | "images" | "documents" | "other";
};

const VOICE_EXT = new Set([".opus", ".ogg", ".m4a", ".mp3", ".wav", ".aac"]);
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"]);
const DOC_EXT = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
]);

function extOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

function classifyByName(fileName: string): "voice" | "images" | "documents" | "other" {
  const ext = extOf(fileName);
  if (VOICE_EXT.has(ext)) return "voice";
  if (IMAGE_EXT.has(ext)) return "images";
  if (DOC_EXT.has(ext)) return "documents";
  return "other";
}

function normalizeSpaces(input: string): string {
  return input.replace(/\u202f/g, " ").trim();
}

function parseWhatsAppLine(line: string) {
  const normalized = normalizeSpaces(line);

  // Try multiple WhatsApp export formats:
  // Format 1: "M/D/YY, TIME - sender: message"
  // Format 2: "[M/D/YY, TIME] sender: message"
  // Format 3: "DD/MM/YYYY, TIME - sender: message"
  // Format 4: "D.M.YYYY, TIME - sender: message"
  const patterns = [
    // Standard: "1/2/24, 12:00 PM - Name: msg"
    /^(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),?\s*(.+?)\s-\s(.*)$/,
    // Bracketed: "[1/2/24, 12:00:00 PM] Name: msg"
    /^\[(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),?\s*(.+?)\]\s*(.*)$/,
    // No comma between date and time: "1/2/24 12:00 PM - Name: msg"
    /^(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})\s+(.+?)\s-\s(.*)$/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const [, datePart, timePart, remainder] = match;
    const senderIdx = remainder.indexOf(": ");
    if (senderIdx === -1) {
      return { at: `${datePart} ${timePart}`, from: null, content: remainder };
    }
    return {
      at: `${datePart} ${timePart}`,
      from: remainder.slice(0, senderIdx).trim() || null,
      content: remainder.slice(senderIdx + 2).trim(),
    };
  }

  return null;
}

function captureAttachmentHint(content: string): string | null {
  const attached = content.match(/<attached:\s*([^>]+)>/i);
  if (attached?.[1]) return attached[1].trim();

  const omitted = content.match(/(?:image|video|audio|sticker|document)-\d+[^ ]*/i);
  if (omitted?.[0]) return omitted[0].trim();

  return null;
}

function parseWhatsAppText(content: string, intake: NormalizedIntake, hints: Map<string, AttachmentHint>) {
  const lines = content.split(/\r?\n/);
  let lastEntry: NormalizedTextEntry | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const parsed = parseWhatsAppLine(line);

    if (parsed?.content) {
      // New timestamped message
      lastEntry = {
        source: "whatsapp",
        from: parsed.from,
        at: parsed.at,
        content: parsed.content,
      };
      intake.texts.push(lastEntry);

      const attachmentName = captureAttachmentHint(parsed.content);
      if (attachmentName) {
        hints.set(attachmentName.toLowerCase(), {
          sender: parsed.from,
          kind: classifyByName(attachmentName),
        });
      }
    } else if (lastEntry) {
      // Continuation line — append to previous message
      lastEntry.content += "\n" + line;
    }
  }
}

function flattenTelegramText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value
    .map((chunk) => {
      if (typeof chunk === "string") return chunk;
      if (chunk && typeof chunk === "object" && "text" in chunk) {
        const t = (chunk as { text?: unknown }).text;
        return typeof t === "string" ? t : "";
      }
      return "";
    })
    .join("");
}

function parseTelegramJson(content: string, intake: NormalizedIntake) {
  try {
    const parsed = JSON.parse(content) as { messages?: unknown[] };
    if (!Array.isArray(parsed.messages)) return;
    for (const message of parsed.messages) {
      if (!message || typeof message !== "object") continue;
      const row = message as {
        type?: string;
        from?: string;
        date?: string;
        text?: unknown;
        file?: string;
      };

      if (row.type === "message") {
        const text = flattenTelegramText(row.text).trim();
        if (text) {
          intake.texts.push({
            source: "telegram",
            from: row.from ?? null,
            at: row.date ?? null,
            content: text,
          });
        }
      }

      if (row.file) {
        const kind = classifyByName(row.file);
        intake[kind].push({
          source: "telegram",
          from: row.from ?? null,
          fileName: row.file,
          mimeType: "application/octet-stream",
          fileUrl: null,
          storageBucket: null,
          storagePath: null,
        });
      }
    }
  } catch {
    // Keep the parser resilient to malformed Telegram exports.
  }
}

function registerRawFile(intake: NormalizedIntake, fileName: string, mimeType: string) {
  const kind = classifyByName(fileName);
  intake[kind].push({
    source: "raw",
    from: null,
    fileName,
    mimeType: mimeType || "application/octet-stream",
    fileUrl: null,
    storageBucket: null,
    storagePath: null,
  });
}

async function parseZip(
  file: File,
  intake: NormalizedIntake,
  hints: Map<string, AttachmentHint>
) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(zip.files);

  for (const entry of entries) {
    if (entry.dir) continue;
    const fileName = entry.name.split("/").pop() ?? entry.name;
    const lower = fileName.toLowerCase();

    if (lower.endsWith(".txt")) {
      parseWhatsAppText(await entry.async("text"), intake, hints);
      continue;
    }

    if (lower.endsWith(".json")) {
      parseTelegramJson(await entry.async("text"), intake);
      continue;
    }

    const hinted = hints.get(lower);
    const kind = hinted?.kind ?? classifyByName(fileName);
    intake[kind].push({
      source: lower.includes("telegram") ? "telegram" : "whatsapp",
      from: hinted?.sender ?? null,
      fileName,
      mimeType: "application/octet-stream",
      fileUrl: null,
      storageBucket: null,
      storagePath: null,
    });
  }
}

export async function normalizeIntakeFromFiles(
  files: File[],
  pastedText: string
): Promise<NormalizedIntake> {
  const intake: NormalizedIntake = {
    texts: [],
    voice: [],
    images: [],
    documents: [],
    other: [],
  };

  const hints = new Map<string, AttachmentHint>();

  for (const file of files) {
    if (!file || file.size <= 0) continue;
    const lower = file.name.toLowerCase();

    if (lower.endsWith(".zip")) {
      await parseZip(file, intake, hints);
      continue;
    }

    if (lower.endsWith(".txt")) {
      const text = await file.text();
      if (text.trim()) parseWhatsAppText(text, intake, hints);
      continue;
    }

    if (lower.endsWith(".json")) {
      parseTelegramJson(await file.text(), intake);
      continue;
    }

    registerRawFile(intake, file.name, file.type);
  }

  if (pastedText.trim()) {
    for (const line of pastedText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
      const parsed = parseWhatsAppLine(line);
      if (parsed?.content) {
        intake.texts.push({
          source: "raw",
          from: parsed.from,
          at: parsed.at,
          content: parsed.content,
        });
      } else {
        intake.texts.push({
          source: "raw",
          from: null,
          at: null,
          content: line,
        });
      }
    }
  }

  return intake;
}

/**
 * Build blob: URLs for chat-export images so the upload UI can show thumbnails
 * before upload. Caller must revoke URLs when replacing or unmounting.
 */
export async function resolveZipImagePreviewBlobUrls(
  chatFiles: File[],
  imageEntries: NormalizedMediaEntry[]
): Promise<string[]> {
  const urls: string[] = imageEntries.map(() => "");
  const zips = chatFiles.filter((f) => f.name.toLowerCase().endsWith(".zip"));
  if (zips.length === 0 || imageEntries.length === 0) return urls;

  const zipInstances: JSZip[] = [];
  for (const zf of zips) {
    try {
      zipInstances.push(await JSZip.loadAsync(await zf.arrayBuffer()));
    } catch {
      // skip invalid zip
    }
  }
  if (zipInstances.length === 0) return urls;

  for (let i = 0; i < imageEntries.length; i++) {
    const row = imageEntries[i];
    if (classifyByName(row.fileName) !== "images") continue;
    const target = row.fileName.toLowerCase();
    for (const zip of zipInstances) {
      let found: JSZip.JSZipObject | null = null;
      for (const entry of Object.values(zip.files)) {
        if (entry.dir) continue;
        const base = (entry.name.split("/").pop() ?? entry.name).toLowerCase();
        if (base === target) {
          found = entry;
          break;
        }
      }
      if (!found) continue;
      try {
        const blob = await found.async("blob");
        urls[i] = URL.createObjectURL(blob);
        break;
      } catch {
        // skip bad entry
      }
    }
  }

  return urls;
}

/**
 * Build blob: URLs for chat-export voice notes so the upload UI can show
 * audio players before upload. Caller must revoke URLs when replacing or unmounting.
 */
export async function resolveZipVoicePreviewBlobUrls(
  chatFiles: File[],
  voiceEntries: NormalizedMediaEntry[]
): Promise<string[]> {
  const urls: string[] = voiceEntries.map(() => "");
  const zips = chatFiles.filter((f) => f.name.toLowerCase().endsWith(".zip"));
  if (zips.length === 0 || voiceEntries.length === 0) return urls;

  const zipInstances: JSZip[] = [];
  for (const zf of zips) {
    try {
      zipInstances.push(await JSZip.loadAsync(await zf.arrayBuffer()));
    } catch {
      // skip invalid zip
    }
  }
  if (zipInstances.length === 0) return urls;

  for (let i = 0; i < voiceEntries.length; i++) {
    const row = voiceEntries[i];
    const target = row.fileName.toLowerCase();
    for (const zip of zipInstances) {
      let found: JSZip.JSZipObject | null = null;
      for (const entry of Object.values(zip.files)) {
        if (entry.dir) continue;
        const base = (entry.name.split("/").pop() ?? entry.name).toLowerCase();
        if (base === target) {
          found = entry;
          break;
        }
      }
      if (!found) continue;
      try {
        const blob = await found.async("blob");
        urls[i] = URL.createObjectURL(blob);
        break;
      } catch {
        // skip bad entry
      }
    }
  }

  return urls;
}
