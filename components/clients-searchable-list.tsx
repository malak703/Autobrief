"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { Client } from "@/lib/types";
import { ClientCard } from "@/components/client-card";

export type ClientListItem = {
  client: Client;
  activeBriefs: number;
};

function clientSearchHaystack(client: Client): string {
  const parts = [client.name, client.email, client.company, client.notes, client.id];
  return parts
    .filter((p) => p != null && p !== "")
    .map((p) => String(p))
    .join("\n")
    .toLowerCase();
}

function matchesSearch(client: Client, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = clientSearchHaystack(client);
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}

export function ClientsSearchableList({ items }: { items: ClientListItem[] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(
    () => items.filter(({ client }) => matchesSearch(client, deferredQuery)),
    [items, deferredQuery]
  );

  const isStale = query !== deferredQuery;
  const showingAll = filtered.length === items.length && !query.trim();

  return (
    <div>
      <div className="mb-8">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search clients"
          placeholder="Search clients by name, email, company, or notes…"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-3xl border border-[#e8dccd] bg-[#fffaf2] px-5 py-4 text-[#2a2118] outline-none placeholder:text-[#a4998d] focus:border-[#9a7b52] focus:ring-1 focus:ring-[#9a7b52]"
        />
        {!showingAll && (
          <p
            className={`mt-3 text-sm text-[#7b6f63] ${isStale ? "opacity-70" : ""}`}
          >
            Showing {filtered.length} of {items.length} clients
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#7b6f63]">
          No clients match your search. Try different keywords or clear the field.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {filtered.map(({ client, activeBriefs }) => (
            <ClientCard
              key={client.id}
              client={client}
              activeBriefs={activeBriefs}
            />
          ))}
        </div>
      )}
    </div>
  );
}
