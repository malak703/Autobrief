import { CompletionMeter } from "@/components/completion-meter";
import { SectionCard } from "@/components/section-card";
import { VersionDiff } from "@/components/version-diff";
import {
  briefToSections,
  gapsToMissingList,
  parseNormalizedInput,
} from "@/lib/brief-helpers";
import { createServerSupabase } from "@/lib/supabase";

async function addSignedPreviewUrls(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  intake: NonNullable<ReturnType<typeof parseNormalizedInput>>
) {
  const allMedia = [
    ...intake.voice,
    ...intake.images,
    ...intake.documents,
    ...intake.other,
  ];

  for (const row of allMedia) {
    if (!row.storageBucket || !row.storagePath) continue;
    const { data: signedData } = await supabase.storage
      .from(row.storageBucket)
      .createSignedUrl(row.storagePath, 60 * 60);
    if (signedData?.signedUrl) {
      row.fileUrl = signedData.signedUrl;
      continue;
    }
    if (!row.fileUrl) {
      const { data: publicData } = supabase.storage
        .from(row.storageBucket)
        .getPublicUrl(row.storagePath);
      row.fileUrl = publicData.publicUrl ?? null;
    }
  }
}

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
  const intake = parseNormalizedInput(brief.raw_input);
  if (intake) {
    await addSignedPreviewUrls(supabase, intake);
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

      {intake && (
        <div className="card mb-8 p-6">
          <h2 className="text-2xl font-bold text-[#2a2118]">Uploaded material</h2>
          <p className="mt-2 text-[#7b6f63]">
            Input is grouped by content type to make review faster.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl bg-[#fbf3e8] p-4">
              <p className="font-semibold text-[#2a2118]">Texts ({intake.texts.length})</p>
              <div className="mt-3 space-y-2 text-sm text-[#5f5246]">
                {intake.texts.slice(0, 12).map((row, idx) => (
                  <p key={`${row.content}-${idx}`}>
                    <span className="font-semibold">{row.from ?? "Unknown"}:</span>{" "}
                    {row.content}
                  </p>
                ))}
                {intake.texts.length === 0 && <p>No text detected.</p>}
              </div>
            </div>

            <div className="rounded-2xl bg-[#fbf3e8] p-4">
              <p className="font-semibold text-[#2a2118]">Voice ({intake.voice.length})</p>
              <div className="mt-3 space-y-2 text-sm text-[#5f5246]">
                {intake.voice.slice(0, 12).map((row, idx) => (
                  <div key={`${row.fileName}-${idx}`} className="rounded-xl bg-white p-3">
                    <p>
                      <span className="font-semibold">{row.from ?? "Unknown"}:</span>{" "}
                      {row.fileName}
                    </p>
                    {row.fileUrl ? (
                      <audio className="mt-2 w-full" controls src={row.fileUrl} />
                    ) : (
                      <p className="mt-1 text-xs text-[#8b7c6c]">No preview URL found.</p>
                    )}
                    {row.transcript ? (
                      <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[#f5efe6] p-2 text-xs text-[#3d342c]">
                        <span className="font-semibold text-[#2a2118]">Transcript:</span>{" "}
                        {row.transcript}
                      </p>
                    ) : null}
                  </div>
                ))}
                {intake.voice.length === 0 && <p>No voice files detected.</p>}
              </div>
            </div>

            <div className="rounded-2xl bg-[#fbf3e8] p-4">
              <p className="font-semibold text-[#2a2118]">Images ({intake.images.length})</p>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-[#5f5246]">
                {intake.images.slice(0, 12).map((row, idx) => (
                  <div key={`${row.fileName}-${idx}`} className="rounded-xl bg-white p-3">
                    <p className="mb-2">{row.fileName}</p>
                    {row.fileUrl ? (
                      <img
                        src={row.fileUrl}
                        alt={row.fileName}
                        className="max-h-56 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <p className="text-xs text-[#8b7c6c]">No preview URL found.</p>
                    )}
                    {row.transcript ? (
                      <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[#f5efe6] p-2 text-xs text-[#3d342c]">
                        <span className="font-semibold text-[#2a2118]">Text from image:</span>{" "}
                        {row.transcript}
                      </p>
                    ) : null}
                  </div>
                ))}
                {intake.images.length === 0 && <p>No images detected.</p>}
              </div>
            </div>

            <div className="rounded-2xl bg-[#fbf3e8] p-4">
              <p className="font-semibold text-[#2a2118]">
                Documents & other ({intake.documents.length + intake.other.length})
              </p>
              <div className="mt-3 space-y-2 text-sm text-[#5f5246]">
                {[...intake.documents, ...intake.other].slice(0, 12).map((row, idx) => (
                  <p key={`${row.fileName}-${idx}`}>
                    {row.fileUrl ? (
                      <a
                        href={row.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#5b3f2a] underline"
                      >
                        {row.fileName}
                      </a>
                    ) : (
                      row.fileName
                    )}
                  </p>
                ))}
                {intake.documents.length + intake.other.length === 0 && (
                  <p>No additional files detected.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {sections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
