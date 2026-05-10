import Link from "next/link";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  await params;

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
        Legacy route
      </p>
      <h1 className="mt-2 text-3xl font-bold text-[#2a2118]">
        Company pages are not used
      </h1>
      <p className="mt-4 text-[#7b6f63]">
        Data is scoped per signed-in user via{" "}
        <code className="rounded bg-[#efe3d4] px-2 py-0.5 text-sm">business_owners</code>{" "}
        and clients/briefs in Supabase.
      </p>
      <Link href="/" className="btn-primary mt-8 inline-block">
        Dashboard
      </Link>
    </div>
  );
}
