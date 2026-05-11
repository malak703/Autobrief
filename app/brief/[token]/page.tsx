import { VoiceFeedback } from "@/components/voice-feedback";
import { VersionDiff } from "@/components/version-diff";
import { briefToSections, parseNormalizedInput } from "@/lib/brief-helpers";
import { supabase } from "@/lib/supabase";

export default async function PublicBriefPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: brief, error } = await supabase
    .from("briefs")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !brief) {
    return (
      <main className="min-h-screen bg-[#f6efe4] px-5 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold text-[#2a2118]">Brief not found</h1>
          <p className="mt-2 text-[#7b6f63]">
            This link may be invalid or the brief was removed.
          </p>
        </div>
      </main>
    );
  }

  const sections = briefToSections(brief);
  const intake = parseNormalizedInput(brief.raw_input);

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

        {intake && (intake.voice.length > 0 || intake.images.length > 0) && (
          <div className="card mb-8 p-6">
            <h2 className="text-2xl font-bold text-[#2a2118]">Uploaded Media</h2>
            
            {intake.voice.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-[#2a2118]">Voice Notes ({intake.voice.length})</h3>
                <div className="mt-2 space-y-2">
                  {intake.voice.map((row, idx) => (
                    <div key={`${row.fileName}-${idx}`} className="rounded-xl bg-white p-3">
                      <p className="text-sm text-[#5f5246]">{row.fileName}</p>
                      {row.fileUrl && (
                        <audio className="mt-2 w-full" controls src={row.fileUrl} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {intake.images.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-[#2a2118]">Images ({intake.images.length})</h3>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {intake.images.map((row, idx) => (
                    <div key={`${row.fileName}-${idx}`} className="rounded-xl bg-white p-3">
                      <p className="text-sm text-[#5f5246]">{row.fileName}</p>
                      {row.fileUrl && (
                        <img
                          src={row.fileUrl}
                          alt={row.fileName}
                          className="mt-2 h-40 w-full rounded-lg object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 space-y-5">
          {sections.map((section) => (
            <div key={section.id} className="card p-6">
              <h2 className="text-2xl font-bold text-[#2a2118]">
                {section.title}
              </h2>

              <p className="mt-4 leading-8 text-[#5f5246]">
                {section.content || "—"}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="btn-primary">
                  ✓ Looks right
                </button>
                <button type="button" className="btn-secondary">
                  ✕ Edit this
                </button>
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
          <button type="button" className="btn-primary">
            Submit feedback
          </button>
        </div>
      </div>
    </main>
  );
}
