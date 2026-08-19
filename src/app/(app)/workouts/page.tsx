"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { addWorkoutLog, getRecentWorkoutLogsForExercise } from "@/lib/data";
import { ExercisePicker } from "@/components/workout/ExercisePicker";
import { WorkoutLogForm } from "@/components/workout/WorkoutLogForm";
import { RecentSessionsComparison } from "@/components/workout/RecentSessionsComparison";
import type { Exercise, WorkoutLog, WorkoutSetEntry } from "@/types";

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    if (!user || !selected) return;
    let ignore = false;
    getRecentWorkoutLogsForExercise(user.uid, selected.id, 3).then((logs) => {
      if (!ignore) setRecentLogs(logs);
    });
    return () => {
      ignore = true;
    };
  }, [user, selected]);

  async function handleSave(sets: WorkoutSetEntry[], date: string) {
    if (!user || !selected) return;
    await addWorkoutLog(user.uid, {
      date,
      exerciseId: selected.id,
      exerciseName: selected.nameKo,
      sets,
    });
    const logs = await getRecentWorkoutLogsForExercise(user.uid, selected.id, 3);
    setRecentLogs(logs);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">운동 기록</h1>
        <p className="mt-1 text-sm text-neutral-500">웨이트 트레이닝 기록을 남겨보세요.</p>
      </div>

      {!selected ? (
        <ExercisePicker onSelect={setSelected} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">{selected.nameKo}</h2>
              <p className="text-xs text-neutral-400">{selected.equipment}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xs font-medium text-neutral-500 underline underline-offset-2"
            >
              다른 운동 선택
            </button>
          </div>

          <RecentSessionsComparison logs={recentLogs} />

          <WorkoutLogForm exercise={selected} onSave={handleSave} />
        </div>
      )}
    </div>
  );
}
