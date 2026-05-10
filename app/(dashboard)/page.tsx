import { BriefCard } from "@/components/brief-card";
import { StatCard } from "@/components/stat-card";
import { createServerSupabase } from "@/lib/supabase";
import { syncBusinessOwnerFromAuth } from "@/lib/profile/sync-business-owner";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  
  // Ensure business owner record exists for authenticated users
  await syncBusinessOwnerFromAuth();

  const [{ data: owner }, { data: clientRows }, { data: briefRows }] =
    await Promise.all([
      supabase.from("business_owners").select("*").maybeSingle(),
      supabase.from("clients").select("id"),
      supabase.from("briefs").select("*").order("created_at", { ascending: false }),
    ]);

  const briefs = briefRows ?? [];
  const clientsCount = clientRows?.length ?? 0;

  return (
    <div>
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
          Company dashboard
        </p>
        <h1 className="mt-2 text-5xl font-bold tracking-tight text-[#2a2118]">
          Brief workspace
        </h1>
        {owner?.company_name && (
          <p className="mt-2 text-lg font-medium text-[#5f5246]">
            {owner.company_name}
          </p>
        )}
        <p className="mt-3 max-w-2xl text-lg text-[#7b6f63]">
          Manage companies, employees, clients, proposals, versions, and client feedback from one calm workspace.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard label="Workspace" value={owner ? "Connected" : "—"} />
        <StatCard label="Clients" value={clientsCount.toString()} />
        <StatCard label="Briefs" value={briefs.length.toString()} />
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#2a2118]">Recent briefs</h2>
        <button type="button" className="btn-secondary">
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
