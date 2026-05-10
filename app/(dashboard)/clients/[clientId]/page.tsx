import Link from "next/link";
import { BriefCard } from "@/components/brief-card";
import { briefs, clients } from "@/lib/mock-data";

export default function ClientDetailsPage({
  params,
}: {
  params: { clientId: string };
}) {
  const client = clients.find((item) => item.id === params.clientId);
  const clientBriefs = briefs.filter((brief) => brief.clientId === params.clientId);

  if (!client) {
    return <p>Client not found.</p>;
  }

  return (
    <div>
      <div className="card mb-8 p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
              Client page
            </p>
            <h1 className="mt-2 text-5xl font-bold text-[#2a2118]">
              {client.name}
            </h1>
            <p className="mt-3 text-lg text-[#7b6f63]">
              {client.contactPerson} · {client.email}
            </p>
            <p className="mt-1 text-[#7b6f63]">{client.industry}</p>
          </div>

          <Link href={`/clients/${client.id}/upload`} className="btn-primary">
            Upload brief for this client
          </Link>
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#2a2118]">
          Briefs & versions
        </h2>
        <p className="text-[#7b6f63]">
          All proposal versions are saved forever.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {clientBriefs.map((brief) => (
          <BriefCard key={brief.id} brief={brief} />
        ))}
      </div>
    </div>
  );
}