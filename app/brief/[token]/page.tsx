import { SectionCard } from "@/components/section-card";
import { VoiceFeedback } from "@/components/voice-feedback";
import { VersionDiff } from "@/components/version-diff";
import { briefSections } from "@/lib/mock-data";

export default function PublicBriefPage({
  params,
}: {
  params: { token: string };
}) {
  return (
    <main className="min-h-screen bg-[#f6efe4] px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="card mb-8 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
            Client confirmation
          </p>
          <h1 className="mt-2 text-5xl font-bold text-[#2a2118]">
            Review your project brief
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#7b6f63]">
            Please review each section. Mark it as correct or request a change.
            You can type feedback or record a voice note.
          </p>
        </div>

        <VersionDiff />

        <div className="mt-8 space-y-5">
          {briefSections.map((section) => (
            <div key={section.id} className="card p-6">
              <h2 className="text-2xl font-bold text-[#2a2118]">
                {section.title}
              </h2>

              <p className="mt-4 leading-8 text-[#5f5246]">
                {section.content}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="btn-primary">✓ Looks right</button>
                <button className="btn-secondary">✕ Edit this</button>
              </div>

              <textarea
                placeholder="Write what needs to change..."
                className="mt-5 min-h-28 w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4 outline-none"
              />

              <VoiceFeedback />
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button className="btn-primary">Submit feedback</button>
        </div>
      </div>
    </main>
  );
}