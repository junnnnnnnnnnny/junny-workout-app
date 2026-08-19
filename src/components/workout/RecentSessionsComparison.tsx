"use client";

import type { WorkoutLog } from "@/types";

export function RecentSessionsComparison({ logs }: { logs: WorkoutLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="rounded-xl border border-card-border bg-white px-3.5 py-3 text-xs text-muted">
        이 운동의 이전 기록이 없어요. 첫 기록을 남겨보세요!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-bold text-muted-dark">최근 {logs.length}회차 기록</div>
      <div className="flex flex-col gap-2">
        {logs.map((log) => {
          const sets = log.sets ?? [];
          const setsText = sets.map((s) => `${s.weightKg}kg×${s.reps}`).join(" · ");
          return (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-xl border border-card-border bg-white px-3.5 py-2.5"
            >
              <div className="text-[11px] text-muted">{log.date.slice(5).replace("-", "/")}</div>
              <div className="text-xs font-semibold text-ink">{setsText}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
