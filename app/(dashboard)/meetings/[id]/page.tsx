import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import GenerateBriefButton from "@/components/generate-brief-button";

interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select(`
      *,
      clients (
        id,
        name
      ),
      briefs (
        id,
        title,
        summary,
        goals,
        gaps,
        followup_questions,
        status,
        created_at
      )
    `)
    .eq("id", id)
    .single();

  if (error || !meeting) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/meetings"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          >
            ← Back to Meetings
          </Link>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-600">
            {error ? `Error loading meeting: ${error.message}` : "Meeting not found"}
          </p>
        </div>
      </div>
    );
  }

  const summary = meeting.summary ? JSON.parse(meeting.summary) : {};

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/meetings"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          ← Back to Meetings
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">{meeting.title}</h1>
        <p className="text-[var(--color-text-secondary)] mt-2">
          Client: {meeting.clients?.name || "No client"} · Project: {meeting.briefs?.title || "No brief"}
        </p>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Status: {meeting.status}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Meeting Overview">
          <p className="text-[var(--color-text-secondary)] leading-7">
            {summary.meeting_overview || "No overview generated."}
          </p>
        </Section>

        <Section title="What Client Wants">
          <List items={summary.what_client_wants} />
        </Section>

        <Section title="Goals & Success Criteria">
          <List items={summary.goals_and_success_criteria} />
        </Section>

        <Section title="Key Decisions">
          <List items={summary.key_decisions} />
        </Section>

        <Section title="Requirements">
          <List items={summary.requirements} />
        </Section>

        <Section title="Action Items">
          <div className="space-y-3">
            {summary.action_items?.length ? (
              summary.action_items.map((item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <p className="font-medium text-[var(--color-text)]">{item.task}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Owner: {item.owner} {item.due_date && `· Due: ${item.due_date}`}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[var(--color-text-secondary)]">No action items.</p>
            )}
          </div>
        </Section>

        <Section title="Deadline Mentions">
          <div className="space-y-3">
            {summary.deadline_mentions?.length ? (
              summary.deadline_mentions.map((item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <p className="text-[var(--color-text)]">Original: {item.original_text}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Interpreted date: {item.interpreted_date || "Needs confirmation"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[var(--color-text-secondary)]">No deadlines mentioned.</p>
            )}
          </div>
        </Section>

        <Section title="Budget Mentions">
          <List items={summary.budget_mentions} />
        </Section>

        <Section title="Gaps">
          <List items={summary.gaps} />
        </Section>

        <Section title="Unclear Points">
          <List items={summary.unclear_points} />
        </Section>

        <Section title="Risks">
          <List items={summary.risks} />
        </Section>

        <Section title="Suggested Follow-up Questions" fullWidth>
          <List items={summary.suggested_follow_up_questions} />
        </Section>

        <Section title="Suggested Brief Updates" fullWidth>
          <List items={summary.suggested_brief_updates} />

          <GenerateBriefButton 
            meetingId={meeting.id} 
            hasBrief={!!meeting.briefs?.id} 
          />
        </Section>

        <Section title="Project Brief" fullWidth>
          {meeting.briefs?.id ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">
                    {meeting.briefs.title || 'Untitled Brief'}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Status: {meeting.briefs.status} · Created: {new Date(meeting.briefs.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/briefs/${meeting.briefs.id}`}
                  className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary)]/90"
                >
                  View Full Brief
                </Link>
              </div>

              {meeting.briefs.summary && (
                <div>
                  <h4 className="font-semibold text-[var(--color-text)] mb-2">Summary</h4>
                  <p className="text-[var(--color-text-secondary)] leading-7">
                    {meeting.briefs.summary}
                  </p>
                </div>
              )}

              {meeting.briefs.goals && (
                <div>
                  <h4 className="font-semibold text-[var(--color-text)] mb-2">Goals</h4>
                  <p className="text-[var(--color-text-secondary)] leading-7">
                    {meeting.briefs.goals}
                  </p>
                </div>
              )}

              {meeting.briefs.gaps && (
                <div>
                  <h4 className="font-semibold text-[var(--color-text)] mb-2">Gaps & Questions</h4>
                  <p className="text-[var(--color-text-secondary)] leading-7">
                    {meeting.briefs.gaps}
                  </p>
                </div>
              )}

              {meeting.briefs.followup_questions && (
                <div>
                  <h4 className="font-semibold text-[var(--color-text)] mb-2">Follow-up Questions</h4>
                  <p className="text-[var(--color-text-secondary)] leading-7">
                    {meeting.briefs.followup_questions}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-secondary)] mb-4">
                No project brief has been generated for this meeting yet.
              </p>
              <GenerateBriefButton 
                meetingId={meeting.id} 
                hasBrief={false} 
              />
            </div>
          )}
        </Section>

        <Section title="Client Quotes" fullWidth>
          <List items={summary.client_quotes} />
        </Section>

        <Section title="Transcript" fullWidth>
          <p className="whitespace-pre-line text-[var(--color-text-secondary)] leading-7">
            {meeting.transcript}
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  fullWidth = false,
}: {
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <section className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm ${fullWidth ? 'md:col-span-2' : ''}`}>
      <h2 className="mb-4 text-xl font-bold text-[var(--color-text)]">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <p className="text-[var(--color-text-secondary)]">Nothing found.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={index}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[var(--color-text-secondary)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}