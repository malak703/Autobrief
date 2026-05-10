import { BriefCard } from "@/components/brief-card";
<<<<<<< HEAD
import { createServerSupabase } from "@/lib/supabase";

export default async function BriefsIndexPage() {
  const supabase = await createServerSupabase();
  const { data: briefs } = await supabase
    .from("briefs")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = briefs ?? [];

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
          Briefs
        </p>
        <h1 className="mt-2 text-5xl font-bold text-[#2a2118]">All briefs</h1>
      </div>

      {rows.length === 0 ? (
        <p className="text-[#7b6f63]">No briefs yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {rows.map((brief) => (
            <BriefCard key={brief.id} brief={brief} />
          ))}
=======
import { briefs, clients } from "@/lib/mock-data";
import Link from "next/link";

export default function BriefsPage() {
  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
            Briefs
          </p>

          <h1 className="mt-2 text-5xl font-bold tracking-tight text-[#2a2118]">
            All proposals
          </h1>

          <p className="mt-3 max-w-2xl text-lg text-[#7b6f63]">
            View every client proposal, its status, completion score, version
            history, and client feedback.
          </p>
        </div>

        <Link href="/clients" className="btn-primary">
          Upload from client page
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm font-medium text-[#7b6f63]">Total briefs</p>
          <p className="mt-2 text-4xl font-bold text-[#2a2118]">
            {briefs.length}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm font-medium text-[#7b6f63]">Needs revision</p>
          <p className="mt-2 text-4xl font-bold text-[#2a2118]">
            {briefs.filter((brief) => brief.status === "needs_revision").length}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm font-medium text-[#7b6f63]">Sent</p>
          <p className="mt-2 text-4xl font-bold text-[#2a2118]">
            {briefs.filter((brief) => brief.status === "sent").length}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm font-medium text-[#7b6f63]">Confirmed</p>
          <p className="mt-2 text-4xl font-bold text-[#2a2118]">
            {briefs.filter((brief) => brief.status === "confirmed").length}
          </p>
        </div>
      </div>

      <div className="card mb-8 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_220px]">
          <input
            placeholder="Search briefs..."
            className="rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none placeholder:text-[#a4998d]"
          />

          <select className="rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none">
            <option>All clients</option>
            {clients.map((client) => (
              <option key={client.id}>{client.name}</option>
            ))}
          </select>

          <select className="rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none">
            <option>All statuses</option>
            <option>Draft</option>
            <option>Sent</option>
            <option>Needs revision</option>
            <option>Confirmed</option>
            <option>Locked</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {briefs.map((brief) => (
          <BriefCard key={brief.id} brief={brief} />
        ))}
      </div>

      {briefs.length === 0 && (
        <div className="card p-10 text-center">
          <h2 className="text-2xl font-bold text-[#2a2118]">
            No briefs yet
          </h2>
          <p className="mt-3 text-[#7b6f63]">
            Open a client page first, then upload WhatsApp chats, screenshots,
            or voice notes to generate a new brief.
          </p>

          <Link href="/clients" className="btn-primary mt-6 inline-block">
            Go to clients
          </Link>
>>>>>>> c8cbc6b2a6724a3f8e08ddc0b9a64d0d0c241a62
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> c8cbc6b2a6724a3f8e08ddc0b9a64d0d0c241a62
