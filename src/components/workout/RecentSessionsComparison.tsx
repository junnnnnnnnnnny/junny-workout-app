"use client";

import { format, parseISO } from "date-fns";
import type { WorkoutLog } from "@/types";

export function RecentSessionsComparison({ logs }: { logs: WorkoutLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-sm text-neutral-400">
        이 운동의 이전 기록이 없어요. 첫 기록을 남겨보세요!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-neutral-500">최근 {logs.length}회차 기록</h3>
      <div className="flex flex-col gap-2">
        {logs.map((log) => {
          const topSet = log.sets.reduce(
            (best, s) => (s.weightKg > best.weightKg ? s : best),
            log.sets[0]
          );
          return (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2.5"
            >
              <div className="text-xs text-neutral-500">
                {(() => {
                  try {
                    return format(parseISO(log.date), "M/d");
                  } catch {
                    return log.date;
                  }
                })()}
              </div>
              <div className="flex flex-wrap justify-end gap-1.5 text-sm">
                {log.sets.map((s, i) => (
                  <span
                    key={i}
                    className={`rounded-md px-2 py-0.5 ${
                      s.weightKg === topSet.weightKg
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {s.weightKg}kg×{s.reps}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
