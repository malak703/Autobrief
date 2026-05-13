"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { Brief } from "@/lib/types";
import { BriefCard } from "@/components/brief-card";

function briefSearchHaystack(brief: Brief): string {
  const parts = [
    brief.summary,
    brief.goals,
    brief.gaps,
    brief.followup_questions,
    brief.status,
    brief.version,
    brief.id,
    brief.raw_input,
    brief.filtered_content,
    brief.extracted_date,
  ];
  return parts
    .filter((p) => p != null && p !== "")
    .map((p) => String(p))
    .join("\n")
    .toLowerCase();
}

function matchesSearch(brief: Brief, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = briefSearchHaystack(brief);
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}

export function BriefsSearchableList({ briefs }: { briefs: Brief[] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(
    () => briefs.filter((b) => matchesSearch(b, deferredQuery)),
    [briefs, deferredQuery]
  );

  const isStale = query !== deferredQuery;
  const showingAll = filtered.length === briefs.length && !query.trim();

  return (
    <div>
      <div className="mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search briefs"
          placeholder="Search briefs by title, goals, gaps, status, or keywords…"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-3xl border border-[#e8dccd] bg-[#fffaf2] px-5 py-4 text-[#2a2118] outline-none placeholder:text-[#a4998d] focus:border-[#9a7b52] focus:ring-1 focus:ring-[#9a7b52]"
        />
        {!showingAll && (
          <p
            className={`mt-3 text-sm text-[#7b6f63] ${isStale ? "opacity-70" : ""}`}
          >
            Showing {filtered.length} of {briefs.length} briefs
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#7b6f63]">
          No briefs match your search. Try different keywords or clear the field.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {filtered.map((brief) => (
            <BriefCard key={brief.id} brief={brief} />
          ))}
        </div>
      )}
    </div>
  );
}
