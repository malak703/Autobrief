import { CalendarDays, Clock, Plus } from "lucide-react";
import { briefs, clients } from "@/lib/mock-data";

const deadlines = [
  {
    id: "deadline-1",
    title: "Website redesign launch",
    clientId: "client-1",
    date: "June 28, 2026",
    time: "10:00 AM",
    source: "Extracted from client message",
    status: "Needs calendar block",
  },
  {
    id: "deadline-2",
    title: "Mobile app review meeting",
    clientId: "client-2",
    date: "July 3, 2026",
    time: "2:30 PM",
    source: "Added by employee",
    status: "Added to calendar",
  },
  {
    id: "deadline-3",
    title: "Brand identity final approval",
    clientId: "client-3",
    date: "July 10, 2026",
    time: "12:00 PM",
    source: "Extracted from uploaded brief",
    status: "Needs calendar block",
  },
];

export default function CalendarPage() {
  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
            Calendar
          </p>

          <h1 className="mt-2 text-5xl font-bold tracking-tight text-[#2a2118]">
            Deadlines & follow-ups
          </h1>

          <p className="mt-3 max-w-2xl text-lg text-[#7b6f63]">
            View deadlines extracted from client chats, voice notes, screenshots,
            and brief versions. Add important dates to Google Calendar with one
            click.
          </p>
        </div>

        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add manual deadline
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm font-medium text-[#7b6f63]">Extracted dates</p>
          <p className="mt-2 text-4xl font-bold text-[#2a2118]">
            {deadlines.length}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm font-medium text-[#7b6f63]">
            Need calendar block
          </p>
          <p className="mt-2 text-4xl font-bold text-[#2a2118]">
            {
              deadlines.filter(
                (deadline) => deadline.status === "Needs calendar block"
              ).length
            }
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm font-medium text-[#7b6f63]">Active briefs</p>
          <p className="mt-2 text-4xl font-bold text-[#2a2118]">
            {briefs.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#2a2118]">
                Upcoming extracted deadlines
              </h2>
              <p className="mt-1 text-[#7b6f63]">
                Dates found by AI from client input.
              </p>
            </div>

            <CalendarDays className="text-[#5b3f2a]" size={28} />
          </div>

          <div className="space-y-4">
            {deadlines.map((deadline) => {
              const client = clients.find(
                (item) => item.id === deadline.clientId
              );

              return (
                <div
                  key={deadline.id}
                  className="rounded-3xl border border-[#e8dccd] bg-[#fbf3e8] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#9a7b52]">
                        <Clock size={16} />
                        {deadline.date} · {deadline.time}
                      </div>

                      <h3 className="text-xl font-bold text-[#2a2118]">
                        {deadline.title}
                      </h3>

                      <p className="mt-2 text-[#7b6f63]">
                        Client: {client?.name ?? "Unknown client"}
                      </p>

                      <p className="mt-1 text-sm text-[#9a8f83]">
                        {deadline.source}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          deadline.status === "Added to calendar"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {deadline.status}
                      </span>

                      <button className="btn-secondary">
                        Add to Google Calendar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-bold text-[#2a2118]">
            AI date extraction
          </h2>

          <p className="mt-3 text-[#7b6f63]">
            When a client says something like “before Ramadan”, “end of June”,
            or “launch before summer”, AutoBrief extracts the date and shows it
            here before creating a calendar event.
          </p>

          <div className="mt-6 rounded-3xl bg-[#fbf3e8] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9a7b52]">
              Example
            </p>

            <p className="mt-3 leading-7 text-[#5f5246]">
              Client message: “We need the campaign ready by the end of June.”
            </p>

            <div className="mt-4 rounded-2xl bg-white p-4">
              <p className="text-sm text-[#7b6f63]">Extracted deadline</p>
              <p className="mt-1 text-xl font-bold text-[#2a2118]">
                June 30, 2026
              </p>
            </div>
          </div>

          <button className="btn-primary mt-6 w-full">
            Review extracted dates
          </button>
        </div>
      </div>
    </div>
  );
}