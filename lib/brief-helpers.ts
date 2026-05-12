import type { Brief } from "@/lib/types";
import type { BriefSection } from "@/lib/types";
import type { NormalizedIntake } from "@/lib/intake-parser";

const SECTION_META: { id: BriefSection["id"]; title: string }[] = [
  { id: "summary", title: "What the client wants" },
  { id: "goals", title: "Goals & success criteria" },
  { id: "gaps", title: "Gaps & unclear points" },
  { id: "followup", title: "Suggested follow-up questions" },
];

export function briefCardTitle(brief: Brief): string {
  const s = brief.summary?.trim();
  if (s) return s.length > 72 ? `${s.slice(0, 72)}…` : s;
  return "Brief";
}

export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString();
}

export function gapsToMissingList(gaps: string | null): string[] {
  if (!gaps?.trim()) return [];
  return gaps
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function briefToSections(brief: Brief): BriefSection[] {
  const contentMap = {
    summary: brief.summary,
    goals: brief.goals,
    gaps: brief.gaps,
    followup: brief.followup_questions,
  };

  return SECTION_META.map(({ id, title }) => ({
    id,
    title,
    content: contentMap[id]?.trim() ?? "",
    status: "pending" as const,
  }));
}

/** Split FastAPI / Groq 4-section project brief into DB columns (best-effort). */
export function parseProjectBriefIntoSections(full: string): {
  summary: string | null;
  goals: string | null;
  gaps: string | null;
  followup_questions: string | null;
} {
  const empty = {
    summary: null as string | null,
    goals: null as string | null,
    gaps: null as string | null,
    followup_questions: null as string | null,
  };
  const text = full.trim();
  if (!text) return empty;

  const stripTitleLine = (block: string) => {
    const lines = block.split("\n");
    if (lines.length <= 1) {
      return block.replace(/^\d+\.\s*[^\n]*/, "").trim();
    }
    return lines.slice(1).join("\n").trim();
  };

  let blocks = text
    .split(/###+/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 1 && !full.includes("###")) {
    blocks = text
      .split(/\n(?=\d+\.\s)/)
      .map((b) => b.trim())
      .filter(Boolean);
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const lower = block.toLowerCase();
    
    if (/^1\.\s/.test(block) || lower.includes("what the client wants")) empty.summary = stripTitleLine(block) || block;
    else if (/^2\.\s/.test(block) || lower.includes("goals & success criteria") || lower.includes("goals and success")) empty.goals = stripTitleLine(block) || block;
    else if (/^3\.\s/.test(block) || lower.includes("gaps & unclear points") || lower.includes("gaps and unclear")) empty.gaps = stripTitleLine(block) || block;
    else if (/^4\.\s/.test(block) || lower.includes("follow-up questions") || lower.includes("follow up questions")) empty.followup_questions = stripTitleLine(block) || block;
    else {
      if (i === 0 && !empty.summary) empty.summary = stripTitleLine(block) || block;
      else if (i === 1 && !empty.goals) empty.goals = stripTitleLine(block) || block;
      else if (i === 2 && !empty.gaps) empty.gaps = stripTitleLine(block) || block;
      else if (i === 3 && !empty.followup_questions) empty.followup_questions = stripTitleLine(block) || block;
    }
  }

  if (!empty.summary && blocks.length === 1) {
    empty.summary = blocks[0] ?? null;
  }

  return empty;
}

export function parseNormalizedInput(rawInput: string | null): NormalizedIntake | null {
  if (!rawInput?.trim()) return null;
  try {
    const parsed = JSON.parse(rawInput) as Partial<NormalizedIntake>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      texts: Array.isArray(parsed.texts) ? parsed.texts : [],
      voice: Array.isArray(parsed.voice) ? parsed.voice : [],
      images: Array.isArray(parsed.images) ? parsed.images : [],
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
      other: Array.isArray(parsed.other) ? parsed.other : [],
    };
  } catch {
    return null;
  }
}
