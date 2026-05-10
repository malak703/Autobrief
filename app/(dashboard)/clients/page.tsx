import { ClientCard } from "@/components/client-card";
import { clients } from "@/lib/mock-data";

export default function ClientsPage() {
  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
            Clients
          </p>
          <h1 className="mt-2 text-5xl font-bold text-[#2a2118]">
            Client library
          </h1>
          <p className="mt-3 text-lg text-[#7b6f63]">
            Each client has their own page, uploads, proposals, versions, and comments.
          </p>
        </div>

        <button className="btn-primary">Add client</button>
      </div>

      <div className="mb-8">
        <input
          placeholder="Search clients..."
          className="w-full rounded-3xl border border-[#e8dccd] bg-[#fffaf2] px-5 py-4 text-[#2a2118] outline-none placeholder:text-[#a4998d]"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>
    </div>
  );
}