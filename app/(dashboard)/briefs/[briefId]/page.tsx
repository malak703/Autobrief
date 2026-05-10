import { CompletionMeter } from "@/components/completion-meter";
import { SectionCard } from "@/components/section-card";
import { VersionDiff } from "@/components/version-diff";
import {
  briefToSections,
  gapsToMissingList,
} from "@/lib/brief-helpers";
import { createServerSupabase } from "@/lib/supabase";

export default async function BriefDetailsPage({
  params,
}: {
  params: Promise<{ briefId: string }>;
}) {
  const { briefId } = await params;
  const supabase = await createServerSupabase();

  const { data: brief } = await supabase
    .from("briefs")
    .select("*")
    .eq("id", briefId)
    .maybeSingle();

  if (!brief) {
    return <p>Brief not found.</p>;
  }

  const completion = brief.completion_score ?? 0;
  const missing = gapsToMissingList(brief.gaps);
  const sections = briefToSections(brief);

  return (
    <div>
      <div className="card mb-8 p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
              Brief review
            </p>
            <h1 className="mt-2 text-5xl font-bold text-[#2a2118]">
              {(brief.summary ?? "Brief").slice(0, 120)}
              {(brief.summary?.length ?? 0) > 120 ? "…" : ""}
            </h1>
            <p className="mt-3 text-lg text-[#7b6f63]">
              Version {brief.version} · {brief.status.replace("_", " ")}
            </p>
          </div>

          <button type="button" className="btn-primary" disabled={completion < 100}>
            Send to client
          </button>
        </div>

        <div className="mt-8">
          <CompletionMeter value={completion} missing={missing} />
        </div>
      </div>

      <div className="mb-8">
        <VersionDiff />
      </div>

      <div className="space-y-5">
        {sections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
