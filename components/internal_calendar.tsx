"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Trash2,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  deleteDeadline,
  toggleDeadlineSubmitted,
  updateDeadlineName,
} from "@/app/(dashboard)/calendar/actions";

type Deadline = {
  id: string;
  extracted_text: string | null;
  parsed_date: string | null;
  is_submitted?: boolean | null;
  submitted_at?: string | null;
  clients?: {
    id?: string;
    name?: string | null;
  } | null;
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthDays(selectedMonth: Date, deadlines: Deadline[]) {
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const calendarDays: Array<
    | null
    | {
        day: number;
        dateString: string;
        deadlines: Deadline[];
      }
  > = [];

  for (let i = 0; i < startPadding; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = toDateOnly(date);

    const dayDeadlines = deadlines.filter(
      (deadline) => deadline.parsed_date === dateString
    );

    calendarDays.push({
      day,
      dateString,
      deadlines: dayDeadlines,
    });
  }

  return calendarDays;
}

export function InternalCalendar({ deadlines }: { deadlines: Deadline[] }) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const today = toDateOnly(new Date());

  const activeDeadlines = deadlines.filter((deadline) => !deadline.is_submitted);
  const submittedDeadlines = deadlines.filter(
    (deadline) => deadline.is_submitted
  );

  const calendarDays = useMemo(
    () => getMonthDays(selectedMonth, activeDeadlines),
    [selectedMonth, activeDeadlines]
  );

  const monthName = selectedMonth.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const upcomingDeadlines = activeDeadlines.filter(
    (deadline) => deadline.parsed_date && deadline.parsed_date >= today
  );

  const pastDeadlines = activeDeadlines.filter(
    (deadline) => deadline.parsed_date && deadline.parsed_date < today
  );

  function goToPreviousMonth() {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
    );
  }

  function goToToday() {
    setSelectedMonth(new Date());
  }

  function chooseMonth(monthIndex: number) {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), monthIndex, 1));
    setShowMonthPicker(false);
  }

  function markDeadline(deadlineId: string, isSubmitted: boolean) {
    startTransition(() => {
      void toggleDeadlineSubmitted(deadlineId, isSubmitted).then(() => router.refresh());
    });
  }

  function removeDeadline(deadlineId: string) {
    if (!window.confirm("Delete this deadline? This cannot be undone.")) {
      return;
    }
    startTransition(() => {
      void deleteDeadline(deadlineId)
        .then(() => router.refresh())
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          window.alert(message);
        });
    });
  }

  function startEditingDeadline(deadlineId: string, currentText: string) {
    setEditingDeadlineId(deadlineId);
    setEditingText(currentText);
  }

  function cancelEditingDeadline() {
    setEditingDeadlineId(null);
    setEditingText("");
  }

  function saveDeadlineName(deadlineId: string) {
    if (!editingText.trim()) return;

    startTransition(() => {
      void updateDeadlineName(deadlineId, editingText.trim())
        .then(() => {
          setEditingDeadlineId(null);
          setEditingText("");
          router.refresh();
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          window.alert(message);
        });
    });
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>, deadlineId: string) {
    if (e.key === "Enter") {
      saveDeadlineName(deadlineId);
    } else if (e.key === "Escape") {
      cancelEditingDeadline();
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="card p-6">
        <div className="relative mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)]">
              AutoBrief calendar
            </h2>
            <p className="mt-1 text-[var(--color-text-secondary)]">{monthName}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="rounded-full border border-[#e8dccd] bg-[#fbf3e8] p-2 transition hover:scale-95"
            >
              <ChevronLeft size={20} />
            </button>

            <button onClick={goToToday} className="btn-secondary">
              Today
            </button>

            <button
              onClick={goToNextMonth}
              className="rounded-full border border-[#e8dccd] bg-[#fbf3e8] p-2 transition hover:scale-95"
            >
              <ChevronRight size={20} />
            </button>

            <button
              onClick={() => setShowMonthPicker((current) => !current)}
              className="ml-2 rounded-full p-1 transition-transform duration-200 hover:scale-90"
              title="Choose month"
            >
              <CalendarDays className="text-[var(--color-primary)]" size={32} />
            </button>
          </div>

          {showMonthPicker && (
            <div className="absolute right-0 top-20 z-20 w-80 rounded-3xl border border-[#e8dccd] bg-[#fffaf2] p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-bold text-[#2a2118]">Choose month</p>

                <select
                  value={selectedMonth.getFullYear()}
                  onChange={(event) =>
                    setSelectedMonth(
                      new Date(
                        Number(event.target.value),
                        selectedMonth.getMonth(),
                        1
                      )
                    )
                  }
                  className="rounded-xl border border-[#e8dccd] bg-[#fbf3e8] px-3 py-2 text-sm outline-none"
                >
                  {Array.from({ length: 7 }).map((_, index) => {
                    const year = new Date().getFullYear() - 2 + index;

                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => chooseMonth(index)}
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold transition hover:bg-[#f1e2cc] ${
                      selectedMonth.getMonth() === index
                        ? "bg-[#5b3f2a] text-white"
                        : "bg-[#fbf3e8] text-[#5f5246]"
                    }`}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-sm font-bold text-[#7b6f63]">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) =>
            day === null ? (
              <div key={`empty-${index}`} className="min-h-28 rounded-2xl" />
            ) : (
              <div
                key={day.dateString}
                className={`min-h-28 rounded-2xl border p-3 transition hover:-translate-y-1 ${
                  day.dateString === today
                    ? "border-[var(--color-primary)] bg-[var(--color-surface)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-soft)]"
                }`}
              >
                <p className="mb-2 text-sm font-bold text-[#2a2118]">
                  {day.day}
                </p>

                <div className="space-y-1">
                  {day.deadlines.slice(0, 2).map((deadline) => {
                    const isPast =
                      deadline.parsed_date && deadline.parsed_date < today;

                    return (
                      <div
                        key={deadline.id}
                        className={`rounded-xl px-2 py-1 text-left text-xs font-semibold ${
                          isPast
                            ? "bg-[#d8c7b5] text-[#5f5246]"
                            : "bg-[var(--color-primary)] text-white"
                        }`}
                        title={deadline.extracted_text ?? ""}
                      >
                        {deadline.extracted_text}
                      </div>
                    );
                  })}

                  {day.deadlines.length > 2 && (
                    <p className="text-xs font-semibold text-[#9a7b52]">
                      +{day.deadlines.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            Upcoming deadlines
          </h2>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            Check a deadline when it is submitted or completed.
          </p>

          <div className="mt-5 space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-[var(--color-text-secondary)]">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-5"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#9a7b52]">
                    <Clock size={16} />
                    {deadline.parsed_date}
                  </div>

                  {editingDeadlineId === deadline.id ? (
                    <div className="mb-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, deadline.id)}
                        className="flex-1 rounded-xl border border-[#e8dccd] bg-[#fffaf2] px-3 py-2 text-[#2a2118] outline-none"
                        placeholder="Deadline name"
                        disabled={isPending}
                      />
                      <button
                        onClick={() => saveDeadlineName(deadline.id)}
                        disabled={isPending || !editingText.trim()}
                        className="rounded-xl bg-[#5b3f2a] p-2 text-white transition hover:bg-[#4a3220] disabled:opacity-50"
                        title="Save"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEditingDeadline}
                        disabled={isPending}
                        className="rounded-xl border border-[#e8c4c0] bg-white p-2 text-[#9d574d] transition hover:bg-[#fff5f4]"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-[#2a2118]">
                        {deadline.extracted_text ?? "Untitled deadline"}
                      </h3>
                      <button
                        onClick={() => startEditingDeadline(deadline.id, deadline.extracted_text ?? "")}
                        className="rounded-xl p-2 text-[#7b6f63] transition hover:bg-[#f1e2cc] hover:text-[#2a2118]"
                        title="Edit deadline name"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  )}

                  <p className="mt-2 text-[#7b6f63]">
                    Client: {deadline.clients?.name ?? "Unknown client"}
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#fffaf2] p-3 font-semibold text-[#5b3f2a]">
                      <input
                        type="checkbox"
                        disabled={isPending}
                        checked={false}
                        onChange={() => markDeadline(deadline.id, true)}
                        className="h-5 w-5"
                      />
                      Mark as submitted
                    </label>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => removeDeadline(deadline.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e8c4c0] bg-white px-4 py-3 text-sm font-semibold text-[#9d574d] transition hover:bg-[#fff5f4]"
                    >
                      <Trash2 size={16} aria-hidden />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-bold text-[#2a2118]">
            Past deadlines
          </h2>
          <p className="mt-1 text-[#7b6f63]">
            Deadlines that passed but are not submitted yet.
          </p>

          <div className="mt-5 space-y-4">
            {pastDeadlines.length === 0 ? (
              <p className="text-[#7b6f63]">No past deadlines.</p>
            ) : (
              pastDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="rounded-3xl border border-[#e8dccd] bg-[#f1e6d8] p-5 opacity-90"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#9a7b52]">
                    <Clock size={16} />
                    {deadline.parsed_date}
                  </div>

                  {editingDeadlineId === deadline.id ? (
                    <div className="mb-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, deadline.id)}
                        className="flex-1 rounded-xl border border-[#e8dccd] bg-[#fffaf2] px-3 py-2 text-[#2a2118] outline-none"
                        placeholder="Deadline name"
                        disabled={isPending}
                      />
                      <button
                        onClick={() => saveDeadlineName(deadline.id)}
                        disabled={isPending || !editingText.trim()}
                        className="rounded-xl bg-[#5b3f2a] p-2 text-white transition hover:bg-[#4a3220] disabled:opacity-50"
                        title="Save"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEditingDeadline}
                        disabled={isPending}
                        className="rounded-xl border border-[#e8c4c0] bg-white p-2 text-[#9d574d] transition hover:bg-[#fff5f4]"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-[#2a2118]">
                        {deadline.extracted_text ?? "Untitled deadline"}
                      </h3>
                      <button
                        onClick={() => startEditingDeadline(deadline.id, deadline.extracted_text ?? "")}
                        className="rounded-xl p-2 text-[#7b6f63] transition hover:bg-[#f1e2cc] hover:text-[#2a2118]"
                        title="Edit deadline name"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  )}

                  <p className="mt-2 text-[#7b6f63]">
                    Client: {deadline.clients?.name ?? "Unknown client"}
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#fffaf2] p-3 font-semibold text-[#5b3f2a]">
                      <input
                        type="checkbox"
                        disabled={isPending}
                        checked={false}
                        onChange={() => markDeadline(deadline.id, true)}
                        className="h-5 w-5"
                      />
                      Mark as submitted
                    </label>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => removeDeadline(deadline.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e8c4c0] bg-white px-4 py-3 text-sm font-semibold text-[#9d574d] transition hover:bg-[#fff5f4]"
                    >
                      <Trash2 size={16} aria-hidden />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#2a2118]">
            <CheckCircle2 size={24} />
            Submitted deadlines
          </h2>
          <p className="mt-1 text-[#7b6f63]">
            Completed items are removed from the active calendar.
          </p>

          <div className="mt-5 space-y-4">
            {submittedDeadlines.length === 0 ? (
              <p className="text-[#7b6f63]">No submitted deadlines yet.</p>
            ) : (
              submittedDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="rounded-3xl border border-[#d7e7cf] bg-[#eef7e9] p-5"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#55745a]">
                    <CheckCircle2 size={16} />
                    Submitted
                  </div>

                  {editingDeadlineId === deadline.id ? (
                    <div className="mb-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, deadline.id)}
                        className="flex-1 rounded-xl border border-[#d7e7cf] bg-[#f0f8e9] px-3 py-2 text-[#2a2118] outline-none"
                        placeholder="Deadline name"
                        disabled={isPending}
                      />
                      <button
                        onClick={() => saveDeadlineName(deadline.id)}
                        disabled={isPending || !editingText.trim()}
                        className="rounded-xl bg-[#5b3f2a] p-2 text-white transition hover:bg-[#4a3220] disabled:opacity-50"
                        title="Save"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEditingDeadline}
                        disabled={isPending}
                        className="rounded-xl border border-[#e8c4c0] bg-white p-2 text-[#9d574d] transition hover:bg-[#fff5f4]"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-[#2a2118] line-through">
                        {deadline.extracted_text ?? "Untitled deadline"}
                      </h3>
                      <button
                        onClick={() => startEditingDeadline(deadline.id, deadline.extracted_text ?? "")}
                        className="rounded-xl p-2 text-[#7b6f63] transition hover:bg-[#e0f0d0] hover:text-[#2a2118]"
                        title="Edit deadline name"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  )}

                  <p className="mt-2 text-[#7b6f63]">
                    Client: {deadline.clients?.name ?? "Unknown client"}
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => markDeadline(deadline.id, false)}
                      className="btn-secondary"
                    >
                      Undo submit
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => removeDeadline(deadline.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e8c4c0] bg-white px-4 py-3 text-sm font-semibold text-[#9d574d] transition hover:bg-[#fff5f4]"
                    >
                      <Trash2 size={16} aria-hidden />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}