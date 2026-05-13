import { createServerSupabase } from "@/lib/supabase";
import { briefToSections } from "@/lib/brief-helpers";
import { createNotificationIfEnabled } from "@/lib/notifications/createNotification";

export default async function ClientBriefPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createServerSupabase();

  const { data: brief } = await supabase
    .from("briefs")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!brief) {
    return (
      <div className="min-h-screen bg-[#f7efe4] p-8">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-[#2a2118]">
            Brief not found
          </h1>
          <p className="mt-3 text-[#7b6f63]">
            This client review link is invalid or no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!brief.viewed_at) {
    await supabase
      .from("briefs")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", brief.id);

    await createNotificationIfEnabled({
      supabase,
      userId: brief.user_id,
      type: "client_viewed_brief",
      title: "Client viewed brief",
      message: "A client opened your brief.",
      link: `/briefs/${brief.id}`,
    });
  }

  const sections = briefToSections(brief);

  return (
    <div className="min-h-screen bg-[#f7efe4] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
            Client review
          </p>

          <h1 className="mt-2 text-4xl font-bold text-[#2a2118]">
            Project brief
          </h1>

          <p className="mt-3 text-[#7b6f63]">
            Please review the brief below and confirm whether everything looks
            correct.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {sections.map((section) => (
            <div key={section.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#2a2118]">
                {section.title}
              </h2>

              <div className="mt-3 whitespace-pre-wrap text-[#5f5246]">
                {section.content || "No information provided."}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-[#2a2118]">
            Review actions
          </h2>

          <p className="mt-2 text-[#7b6f63]">
            Confirmation and edit-request buttons can be added here next.
          </p>
        </div>
      </div>
    </div>
  );
}