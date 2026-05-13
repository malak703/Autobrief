import { CompletionMeter } from "@/components/completion-meter";
import { SectionCard } from "@/components/section-card";
import { SendClientLink } from "@/components/send-client-link";
import { VersionDiff } from "@/components/version-diff";
import { briefCardTitle, briefToSections, gapsToMissingList } from "@/lib/brief-helpers";
import { createServerSupabase } from "@/lib/supabase";
import { headers } from "next/headers";
import { ProposalView } from "@/components/proposal-view";


async function clientReviewAbsoluteUrl(token: string): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return `${fromEnv}/brief/${token}`;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}/brief/${token}`;
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

    

  const completion = brief.completion_score ?? 0;
  const missing = gapsToMissingList(brief.gaps);
  const sections = briefToSections(brief);
  const clientUrl = await clientReviewAbsoluteUrl(brief.token);

  return (
    <div>
      <div className="card mb-8 p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
              Brief review
            </p>
            <h1 className="mt-2 text-5xl font-bold text-[#2a2118]">{briefCardTitle(brief)}</h1>
            <p className="mt-3 text-lg text-[#7b6f63]">
              Version {brief.version} · {brief.status.replace("_", " ")}
            </p>
          </div>

          <SendClientLink
            briefId={brief.id}
            clientUrl={clientUrl}
            status={brief.status}
            completion={completion}
          />
        </div>

        <div className="mt-8">
          <CompletionMeter value={completion} missing={missing} />
        </div>
      </div>

      <div className="mb-8">
        <VersionDiff />
      </div>

      {brief.final_proposal ? (
        <ProposalView proposal={brief.final_proposal} sections={sections} briefId={brief.id} />
      ) : (
        <>
          <p className="mb-6 max-w-2xl text-[#7b6f63]">
            Raw client messages, transcripts, and OCR are processed into this draft only. Edit each
            section, then send the client link when you are ready.
          </p>

          <div className="space-y-5">
            {sections.map((section) => (
              <SectionCard key={section.id} briefId={brief.id} section={section} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
