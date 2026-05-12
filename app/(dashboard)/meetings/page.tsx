import Link from "next/link";

export default function MeetingsPage() {
  const meetings: any[] = [];

  return (
    <main className="min-h-screen bg-[#fbf6ee] px-14 py-10 text-[#2b2118]">
      <div className="max-w-6xl">
        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-6xl font-bold tracking-tight">
              Client meetings
            </h1>

            <p className="mt-5 max-w-3xl text-xl leading-8 text-[#7a6a5a]">
              Upload meeting recordings, paste transcripts, generate AI meeting
              summaries, extract action items, and update the project brief.
            </p>
          </div>

          <Link
            href="/meetings/new"
            className="rounded-full bg-[#5b3a24] px-6 py-3 text-base font-bold text-white shadow-sm hover:bg-[#432918]"
          >
            + New meeting
          </Link>
        </div>

        <section className="rounded-[2rem] border border-[#eadfce] bg-[#fbf6ee] p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">All meetings</h2>

            <div className="flex gap-3">
              <button className="rounded-full bg-white px-4 py-2 text-sm text-[#7a6a5a] shadow-sm">
                All
              </button>
              <button className="rounded-full bg-white px-4 py-2 text-sm text-[#7a6a5a] shadow-sm">
                Processing
              </button>
              <button className="rounded-full bg-white px-4 py-2 text-sm text-[#7a6a5a] shadow-sm">
                Ready
              </button>
            </div>
          </div>

          {meetings.length === 0 ? (
            <div className="rounded-[2rem] border-2 border-dashed border-[#d8c8b4] bg-[#f8f1e7] px-8 py-20 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#eadcc8] text-[#5b3a24]">
                <span className="text-4xl">🎙️</span>
              </div>

              <h3 className="text-4xl font-bold">No meetings yet</h3>

              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#7a6a5a]">
                Create your first client meeting. Upload a recording or paste a
                transcript, then AutoBrief will generate a structured meeting
                summary.
              </p>

              <Link
                href="/meetings/new"
                className="mt-8 inline-flex rounded-full bg-[#5b3a24] px-8 py-4 text-lg font-bold text-white hover:bg-[#432918]"
              >
                Create meeting
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="rounded-2xl border border-[#eadfce] bg-white p-6"
                >
                  <h3 className="text-xl font-bold">{meeting.title}</h3>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}