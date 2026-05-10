import Link from "next/link";
import { Client } from "@/lib/types";
import { formatRelativeTime } from "@/lib/brief-helpers";

export function ClientCard({
  client,
  activeBriefs = 0,
}: {
  client: Client;
  activeBriefs?: number;
}) {
  return (
    <Link href={`/clients/${client.id}`} className="card block p-6 transition hover:-translate-y-1">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f1e2cc] text-xl font-bold text-[#5b3f2a]">
          {client.name.charAt(0)}
        </div>

        <span className="rounded-full bg-[#e5f0df] px-3 py-1 text-sm font-semibold text-[#55745a]">
          Active
        </span>
      </div>

      <h3 className="text-2xl font-bold text-[#2a2118]">{client.name}</h3>
      <p className="mt-1 text-[#7b6f63]">{client.email ?? "—"}</p>
      {client.company && (
        <p className="mt-1 text-sm text-[#7b6f63]">{client.company}</p>
      )}

      <div className="mt-8 flex items-center justify-between text-sm text-[#7b6f63]">
        <span>
          {activeBriefs} active brief{activeBriefs === 1 ? "" : "s"}
        </span>
        <span>Added {formatRelativeTime(client.created_at)}</span>
      </div>
    </Link>
  );
}
