import { BriefCard } from "@/components/brief-card";
import { StatCard } from "@/components/stat-card";
import { createServerSupabase } from "@/lib/supabase";
import { syncBusinessOwnerFromAuth } from "@/lib/profile/sync-business-owner";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  
  // Ensure business owner record exists for authenticated users
  await syncBusinessOwnerFromAuth();

  const { data: owner } = await supabase.from("business_owners").select("*").maybeSingle();

  const [clientRes, briefRes] = await Promise.all([
    owner?.id ? supabase.from("clients").select("id").eq("owner_id", owner.id) : Promise.resolve({ data: [] }),
    owner?.id ? supabase.from("briefs").select("*").eq("owner_id", owner.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);

  const clientRows = clientRes.data;
  const briefRows = briefRes.data;

  const briefs = briefRows ?? [];
  const clientsCount = clientRows?.length ?? 0;

  return (
    <div>
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2a2118] md:text-5xl">
          Brief workspace
        </h1>
        {owner?.company_name && (
          <p className="mt-2 text-base font-medium text-[#5f5246] md:text-lg">
            {owner.company_name}
          </p>
        )}
        <p className="mt-3 max-w-2xl text-base text-[#7b6f63] md:text-lg">
          Manage clients, proposals, versions, and client feedback from one calm workspace.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3">
        <StatCard label="Clients" value={clientsCount.toString()} />
        <StatCard label="Briefs" value={briefs.length.toString()} />
      </div>

      <div className="mb-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-[#2a2118] md:text-2xl">Recent briefs</h2>
        <button type="button" className="btn-secondary w-full sm:w-auto">
          View all
        </button>
      </div>

      {briefs.length === 0 ? (
        <p className="text-[#7b6f63]">
          No briefs yet. Sign in and create data in Supabase, or check Row Level Security policies.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {briefs.map((brief) => (
            <BriefCard key={brief.id} brief={brief} />
          ))}
        </div>
      )}
    </div>
  );
}
