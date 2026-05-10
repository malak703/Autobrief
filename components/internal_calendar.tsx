"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toggleDeadlineSubmitted } from "@/app/(dashboard)/calendar/actions";

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
  return date.toISOString().split("T")[0];
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
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isPending, startTransition] = useTransition();

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
      toggleDeadlineSubmitted(deadlineId, isSubmitted);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="card p-6">
        <div className="relative mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#2a2118]">
              AutoBrief calendar
            </h2>
            <p className="mt-1 text-[#7b6f63]">{monthName}</p>
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
              <CalendarDays className="text-[#5b3f2a]" size={32} />
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
                    ? "border-[#5b3f2a] bg-[#fffaf2]"
                    : "border-[#e8dccd] bg-[#fbf3e8]"
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
                            : "bg-[#5b3f2a] text-white"
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
          <h2 className="text-2xl font-bold text-[#2a2118]">
            Upcoming deadlines
          </h2>
          <p className="mt-1 text-[#7b6f63]">
            Check a deadline when it is submitted or completed.
          </p>

          <div className="mt-5 space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-[#7b6f63]">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="rounded-3xl border border-[#e8dccd] bg-[#fbf3e8] p-5"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#9a7b52]">
                    <Clock size={16} />
                    {deadline.parsed_date}
                  </div>

                  <h3 className="text-xl font-bold text-[#2a2118]">
                    {deadline.extracted_text ?? "Untitled deadline"}
                  </h3>

                  <p className="mt-2 text-[#7b6f63]">
                    Client: {deadline.clients?.name ?? "Unknown client"}
                  </p>

                  <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-[#fffaf2] p-3 font-semibold text-[#5b3f2a]">
                    <input
                      type="checkbox"
                      disabled={isPending}
                      checked={false}
                      onChange={() => markDeadline(deadline.id, true)}
                      className="h-5 w-5"
                    />
                    Mark as submitted
                  </label>
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

                  <h3 className="text-xl font-bold text-[#2a2118]">
                    {deadline.extracted_text ?? "Untitled deadline"}
                  </h3>

                  <p className="mt-2 text-[#7b6f63]">
                    Client: {deadline.clients?.name ?? "Unknown client"}
                  </p>

                  <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-[#fffaf2] p-3 font-semibold text-[#5b3f2a]">
                    <input
                      type="checkbox"
                      disabled={isPending}
                      checked={false}
                      onChange={() => markDeadline(deadline.id, true)}
                      className="h-5 w-5"
                    />
                    Mark as submitted
                  </label>
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

                  <h3 className="text-xl font-bold text-[#2a2118] line-through">
                    {deadline.extracted_text ?? "Untitled deadline"}
                  </h3>

                  <p className="mt-2 text-[#7b6f63]">
                    Client: {deadline.clients?.name ?? "Unknown client"}
                  </p>

                  <button
                    disabled={isPending}
                    onClick={() => markDeadline(deadline.id, false)}
                    className="btn-secondary mt-4"
                  >
                    Undo submit
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}