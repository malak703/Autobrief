import type { Brief } from "@/lib/types";
import type { BriefSection } from "@/lib/types";

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
