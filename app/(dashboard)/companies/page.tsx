import Link from "next/link";

export default function CompaniesPage() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
        Companies
      </p>
      <h1 className="mt-2 text-5xl font-bold text-[#2a2118]">
        Workspace profile
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-[#7b6f63]">
        Company records now live in Supabase as{" "}
        <code className="rounded bg-[#efe3d4] px-2 py-0.5 text-sm">business_owners</code>.
        Use the dashboard to manage clients and briefs.
      </p>
      <Link href="/" className="btn-primary mt-8 inline-block">
        Back to dashboard
      </Link>
    </div>
  );
}
