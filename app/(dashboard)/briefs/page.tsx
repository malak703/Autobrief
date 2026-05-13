import { BriefsSearchableList } from "@/components/briefs-searchable-list";
import { createServerSupabase } from "@/lib/supabase";

export default async function BriefsIndexPage() {
  const supabase = await createServerSupabase();
  const { data: owner } = await supabase.from("business_owners").select("id").maybeSingle();

  const { data: briefs } = owner?.id 
    ? await supabase
        .from("briefs")
        .select("*")
        .eq("owner_id", owner.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const rows = briefs ?? [];

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
          Briefs
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#2a2118] md:text-5xl">All briefs</h1>
      </div>

      {rows.length === 0 ? (
        <p className="text-[#7b6f63]">No briefs yet.</p>
      ) : (
        <BriefsSearchableList briefs={rows} />
      )}
    </div>
  );
}