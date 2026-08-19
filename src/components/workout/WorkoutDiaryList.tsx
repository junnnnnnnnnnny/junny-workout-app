"use client";

import type { WorkoutLog } from "@/types";

interface WorkoutDiaryListProps {
  dayLabel: string;
  entries: WorkoutLog[];
  onEdit: (entry: WorkoutLog) => void;
  onAdd: () => void;
}

export function WorkoutDiaryList({ dayLabel, entries, onEdit, onAdd }: WorkoutDiaryListProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[13px] font-bold text-muted-dark">{dayLabel}</div>
      {entries.length > 0 ? (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between rounded-2xl border border-card-border bg-white p-3.5"
            >
              <div>
                <div className="text-sm font-bold text-ink">
                  {entry.kind === "cardio" ? entry.activityType : entry.exerciseName}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {entry.kind === "cardio"
                    ? `${entry.durationMin}분${entry.caloriesBurned ? ` · ${entry.caloriesBurned}kcal` : ""}`
                    : (entry.sets ?? []).map((s) => `${s.weightKg}kg×${s.reps}`).join(" · ")}
                </div>
              </div>
              {entry.kind === "strength" && (
                <button onClick={() => onEdit(entry)} className="shrink-0 text-xs font-bold text-brand">
                  수정
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-white px-4 py-4 text-center text-xs text-muted">
          이 날의 운동 기록이 없어요.
        </div>
      )}
      <button
        onClick={onAdd}
        className="rounded-xl border border-dashed py-3 text-center text-[13px] font-bold text-brand"
        style={{ borderColor: "var(--color-dashed)" }}
      >
        + 운동 추가
      </button>
    </div>
  );
}
