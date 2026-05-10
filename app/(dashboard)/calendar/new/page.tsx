import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase";

export default async function NewDeadlinePage() {
  const supabase = await createServerSupabase();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name", { ascending: true });

  async function createDeadline(formData: FormData) {
    "use server";

    const supabase = await createServerSupabase();

    const clientId = formData.get("client_id") as string;
    const extractedText = formData.get("extracted_text") as string;
    const parsedDate = formData.get("parsed_date") as string;

    const { error } = await supabase.from("deadlines").insert({
  client_id: clientId,
  extracted_text: extractedText,
  parsed_date: parsedDate,
  calendar_event_id: null,
});

if (error) {
  throw new Error(error.message);
}

redirect("/calendar");
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#5b3f2a]"
        >
          <ArrowLeft size={16} />
          Back to calendar
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
          Manual deadline
        </p>

        <h1 className="mt-2 text-5xl font-bold text-[#2a2118]">
          Add new deadline
        </h1>

        <p className="mt-3 max-w-2xl text-lg text-[#7b6f63]">
          Add a manual deadline for a client. It will appear in the calendar
          dashboard.
        </p>
      </div>

      <form action={createDeadline} className="card max-w-3xl p-8">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
              Client
            </label>

            <select
              name="client_id"
              required
              className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none"
            >
              <option value="">Select client</option>

              {(clients ?? []).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
              Deadline title / note
            </label>

            <input
              name="extracted_text"
              required
              placeholder="Example: Website launch deadline"
              className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
              Date
            </label>

            <input
              name="parsed_date"
              type="date"
              required
              className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Link href="/calendar" className="btn-secondary">
            Cancel
          </Link>

          <button type="submit" className="btn-primary">
            Save deadline
          </button>
        </div>
      </form>
    </div>
  );
}