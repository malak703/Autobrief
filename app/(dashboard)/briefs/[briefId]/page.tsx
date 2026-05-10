import { CompletionMeter } from "@/components/completion-meter";
import { SectionCard } from "@/components/section-card";
import { VersionDiff } from "@/components/version-diff";
import { briefSections, briefs } from "@/lib/mock-data";

export default function BriefDetailsPage({
  params,
}: {
  params: { briefId: string };
}) {
  const brief = briefs.find((item) => item.id === params.briefId);

  if (!brief) {
    return <p>Brief not found.</p>;
  }

  return (
    <div>
      <div className="card mb-8 p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
              Brief review
            </p>
            <h1 className="mt-2 text-5xl font-bold text-[#2a2118]">
              {brief.title}
            </h1>
            <p className="mt-3 text-lg text-[#7b6f63]">
              Version {brief.version} · {brief.status.replace("_", " ")}
            </p>
          </div>

          <button className="btn-primary" disabled={brief.completion < 100}>
            Send to client
          </button>
        </div>

        <div className="mt-8">
          <CompletionMeter value={brief.completion} missing={brief.missing} />
        </div>
      </div>

      <div className="mb-8">
        <VersionDiff />
      </div>

      <div className="space-y-5">
        {briefSections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}