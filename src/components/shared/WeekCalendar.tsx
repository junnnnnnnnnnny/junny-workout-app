"use client";

import { WEEKDAY_SHORT, todayStr, weekDatesForOffset, weekRangeLabel } from "@/lib/date-utils";

interface WeekCalendarProps {
  weekOffset: number;
  selectedDate: string;
  hasEntry: (date: string) => boolean;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function WeekCalendar({
  weekOffset,
  selectedDate,
  hasEntry,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: WeekCalendarProps) {
  const dates = weekDatesForOffset(weekOffset);
  const today = todayStr();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button onClick={onPrevWeek} className="text-xs font-bold text-brand">
          ‹ 이전 주
        </button>
        <span className="text-[11px] text-muted">{weekRangeLabel(weekOffset)}</span>
        <button onClick={onNextWeek} className="text-xs font-bold text-brand">
          다음 주 ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {dates.map((date, i) => {
          const selected = date === selectedDate;
          const isToday = date === today;
          const dateNum = Number(date.slice(-2));
          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className="rounded-xl border px-0.5 py-2 text-center"
              style={{
                background: selected ? "var(--color-brand)" : "#fff",
                borderColor: selected
                  ? "var(--color-brand)"
                  : isToday
                    ? "var(--color-brand)"
                    : "var(--color-card-border)",
              }}
            >
              <div
                className="text-[10px] font-semibold"
                style={{ color: selected ? "rgba(255,255,255,.75)" : "var(--color-muted)" }}
              >
                {WEEKDAY_SHORT[i]}
              </div>
              <div
                className="mt-0.5 text-[13px] font-bold"
                style={{ color: selected ? "#fff" : "var(--color-ink)" }}
              >
                {dateNum}
              </div>
              <div
                className="mx-auto mt-1 h-1 w-1 rounded-full bg-brand"
                style={{ opacity: hasEntry(date) ? 1 : 0 }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
