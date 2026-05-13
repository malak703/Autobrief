import { BriefsSearchableList } from "@/components/briefs-searchable-list";
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
        <BriefsSearchableList briefs={rows} />
      )}
    </div>
  );
}