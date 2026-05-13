import Link from "next/link";
import { BriefCard } from "@/components/brief-card";
import { createServerSupabase } from "@/lib/supabase";

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createServerSupabase();

  const { data: owner } = await supabase.from("business_owners").select("id").maybeSingle();

  const [clientRes, briefsRes] = await Promise.all([
    owner?.id 
      ? supabase.from("clients").select("*").eq("id", clientId).eq("owner_id", owner.id).maybeSingle()
      : Promise.resolve({ data: null }),
    owner?.id
      ? supabase.from("briefs").select("*").eq("client_id", clientId).eq("owner_id", owner.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const client = clientRes.data;
  const clientBriefs = briefsRes.data;

  if (!client) {
    return <p>Client not found.</p>;
  }

  const briefs = clientBriefs ?? [];
  
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
              {client.email ?? "No email"} · {client.company ?? "No company"}
            </p>
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

      {briefs.length === 0 ? (
        <p className="text-[#7b6f63]">No briefs for this client yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {briefs.map((brief) => (
            <BriefCard key={brief.id} brief={brief} />
          ))}
        </div>
      )}
    </div>
  );
}
