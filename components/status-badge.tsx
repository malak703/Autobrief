import { BriefStatus } from "@/lib/types";

const styles: Record<BriefStatus, string> = {
  draft: "bg-stone-100 text-stone-700",
  sent: "bg-blue-100 text-blue-800",
  needs_revision: "bg-rose-100 text-rose-800",
  confirmed: "bg-green-100 text-green-800",
};

const labels: Record<BriefStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  needs_revision: "Needs revision",
  confirmed: "Confirmed",
};

export function StatusBadge({ status }: { status: BriefStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
