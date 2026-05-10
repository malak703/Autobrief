import { BriefCard } from "@/components/brief-card";
import { StatCard } from "@/components/stat-card";
import { briefs, clients, companies } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
          Company dashboard
        </p>
        <h1 className="mt-2 text-5xl font-bold tracking-tight text-[#2a2118]">
          Brief workspace
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-[#7b6f63]">
          Manage companies, employees, clients, proposals, versions, and client feedback from one calm workspace.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard label="Companies" value={companies.length.toString()} />
        <StatCard label="Clients" value={clients.length.toString()} />
        <StatCard label="Active briefs" value={briefs.length.toString()} />
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#2a2118]">Recent briefs</h2>
        <button className="btn-secondary">View all</button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {briefs.map((brief) => (
          <BriefCard key={brief.id} brief={brief} />
        ))}
      </div>
    </div>
  );
}