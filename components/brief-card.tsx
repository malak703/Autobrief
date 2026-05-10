import Link from "next/link";
import { Brief } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { CompletionMeter } from "./completion-meter";

export function BriefCard({ brief }: { brief: Brief }) {
  return (
    <Link href={`/briefs/${brief.id}`} className="card block p-6 transition hover:-translate-y-1">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold leading-tight text-[#2a2118]">
            {brief.title}
          </h3>
          <p className="mt-2 text-sm text-[#7b6f63]">
            Version {brief.version} · Updated {brief.updatedAt}
          </p>
        </div>

        <StatusBadge status={brief.status} />
      </div>

      <CompletionMeter value={brief.completion} missing={brief.missing} />
    </Link>
  );
}