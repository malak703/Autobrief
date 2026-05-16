import Link from "next/link";
import { Plus } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase";
import { InternalCalendar } from "@/components/internal_calendar";

export default async function CalendarPage() {
  const supabase = await createServerSupabase();

  // Get the current user's owner_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="card p-8">
        <h1 className="text-3xl font-bold text-[#2a2118]">
          Please sign in
        </h1>
        <p className="mt-3 text-[#7b6f63]">You must be signed in to view your calendar.</p>
      </div>
    );
  }

  const { data: owner } = await supabase
    .from("business_owners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!owner?.id) {
    return (
      <div className="card p-8">
        <h1 className="text-3xl font-bold text-[#2a2118]">
          No workspace found
        </h1>
        <p className="mt-3 text-[#7b6f63]">Your workspace profile is missing.</p>
      </div>
    );
  }

  // First get the user's client IDs
  const { data: userClients } = await supabase
    .from("clients")
    .select("id")
    .eq("owner_id", owner.id);

  const clientIds = (userClients ?? []).map((c) => c.id);

  // Then fetch deadlines only for those clients
  let rows: any[] = [];
  if (clientIds.length > 0) {
    const { data: deadlines, error } = await supabase
      .from("deadlines")
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .in("client_id", clientIds)
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

    rows = deadlines ?? [];
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:mb-8 sm:flex-row sm:justify-between sm:gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
            Calendar
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2a2118] sm:text-5xl">
            Deadlines & follow-ups
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[#7b6f63] sm:mt-3 sm:text-lg">
            View all deadlines inside AutoBrief. Move between months and track
            upcoming or ended deadlines.
          </p>
        </div>

        <Link href="/calendar/new" className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto">
          <Plus size={18} />
          Add manual deadline
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 sm:mb-8 sm:gap-5">
  <div className="card p-3 sm:p-5">
    <p className="text-xs font-medium text-[#7b6f63] sm:text-sm">All deadlines</p>
    <p className="mt-1 text-2xl font-bold text-[#2a2118] sm:mt-2 sm:text-4xl">
      {rows.length}
    </p>
  </div>

  <div className="card p-3 sm:p-5">
    <p className="text-xs font-medium text-[#7b6f63] sm:text-sm">Active</p>
    <p className="mt-1 text-2xl font-bold text-[#2a2118] sm:mt-2 sm:text-4xl">
      {rows.filter((deadline) => !deadline.is_submitted).length}
    </p>
  </div>

  <div className="card p-3 sm:p-5">
    <p className="text-xs font-medium text-[#7b6f63] sm:text-sm">Submitted</p>
    <p className="mt-1 text-2xl font-bold text-[#2a2118] sm:mt-2 sm:text-4xl">
      {rows.filter((deadline) => deadline.is_submitted).length}
    </p>
  </div>
</div>

      <InternalCalendar deadlines={rows} />
    </div>
  );
}