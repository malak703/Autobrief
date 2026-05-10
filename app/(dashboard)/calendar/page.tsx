import Link from "next/link";
import { Plus } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase";
import { InternalCalendar } from "@/components/internal_calendar";

export default async function CalendarPage() {
  const supabase = await createServerSupabase();

  const { data: deadlines, error } = await supabase
    .from("deadlines")
    .select(`
      *,
      clients (
        id,
        name
      )
    `)
    .order("parsed_date", { ascending: true });

  if (error) {
    return (
      <div className="card p-8">
        <h1 className="text-3xl font-bold text-[#2a2118]">
          Could not load deadlines
        </h1>
        <p className="mt-3 text-[#7b6f63]">{error.message}</p>
      </div>
    );
  }

  const rows = deadlines ?? [];

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
            View all deadlines inside AutoBrief. Move between months and track
            upcoming or ended deadlines.
          </p>
        </div>

        <Link href="/calendar/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add manual deadline
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
  <div className="card p-5">
    <p className="text-sm font-medium text-[#7b6f63]">All deadlines</p>
    <p className="mt-2 text-4xl font-bold text-[#2a2118]">
      {rows.length}
    </p>
  </div>

  <div className="card p-5">
    <p className="text-sm font-medium text-[#7b6f63]">Active</p>
    <p className="mt-2 text-4xl font-bold text-[#2a2118]">
      {rows.filter((deadline) => !deadline.is_submitted).length}
    </p>
  </div>

  <div className="card p-5">
    <p className="text-sm font-medium text-[#7b6f63]">Submitted</p>
    <p className="mt-2 text-4xl font-bold text-[#2a2118]">
      {rows.filter((deadline) => deadline.is_submitted).length}
    </p>
  </div>
</div>

      <InternalCalendar deadlines={rows} />
    </div>
  );
}