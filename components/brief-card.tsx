import Link from "next/link";
import { Brief } from "@/lib/types";
import {
  briefCardTitle,
  formatRelativeTime,
  gapsToMissingList,
} from "@/lib/brief-helpers";
import { StatusBadge } from "./status-badge";
import { CompletionMeter } from "./completion-meter";

export function BriefCard({ brief }: { brief: Brief }) {
  const completion = brief.completion_score ?? 0;
  const missing = gapsToMissingList(brief.gaps);

  return (
    <Link href={`/briefs/${brief.id}`} className="card block p-6 transition hover:-translate-y-1">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold leading-tight text-[#2a2118]">
            {briefCardTitle(brief)}
          </h3>
          <p className="mt-2 text-sm text-[#7b6f63]">
            Version {brief.version} · Updated {formatRelativeTime(brief.created_at)}
          </p>
        </div>

        <StatusBadge status={brief.status} />
      </div>

      <CompletionMeter value={completion} missing={missing} />
    </Link>
  );
}
