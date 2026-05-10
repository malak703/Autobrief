import { BriefStatus } from "@/lib/types";

const styles: Record<BriefStatus, string> = {
  draft: "bg-stone-100 text-stone-700",
  ready: "bg-amber-100 text-amber-800",
  sent: "bg-blue-100 text-blue-800",
  needs_revision: "bg-rose-100 text-rose-800",
  confirmed: "bg-green-100 text-green-800",
  locked: "bg-zinc-200 text-zinc-800",
};

const labels: Record<BriefStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  sent: "Sent",
  needs_revision: "Needs revision",
  confirmed: "Confirmed",
  locked: "Locked",
};

export function StatusBadge({ status }: { status: BriefStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}