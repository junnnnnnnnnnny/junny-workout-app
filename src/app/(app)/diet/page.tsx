"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { addDietLog, getDietLogsForDate, getGoal } from "@/lib/data";
import { ChatDietInput } from "@/components/diet/ChatDietInput";
import { GoalBar } from "@/components/goals/GoalBar";
import type { DietLog, Goal, MealItem } from "@/types";

export default function DietPage() {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [logs, setLogs] = useState<DietLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    Promise.all([getGoal(user.uid), getDietLogsForDate(user.uid, today)])
      .then(([g, l]) => {
        if (ignore) return;
        setGoal(g);
        setLogs(l);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user, today]);

  async function handleConfirm(meals: MealItem[], rawInput: string) {
    if (!user) return;
    await addDietLog(user.uid, { date: today, rawInput, meals });
    const [g, l] = await Promise.all([getGoal(user.uid), getDietLogsForDate(user.uid, today)]);
    setGoal(g);
    setLogs(l);
  }

  const consumedCalories = logs.reduce((sum, l) => sum + l.totalCalories, 0);
  const consumedProtein = logs.reduce((sum, l) => sum + l.totalProteinG, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">식단 기록</h1>
        <p className="mt-1 text-sm text-neutral-500">먹은 내용을 편하게 입력하면 알아서 분석해드려요.</p>
      </div>

      {!loading && goal && (
        <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5">
          {(goal.mode === "calorie" || goal.mode === "both") && goal.calorieTarget && (
            <GoalBar label="칼로리" consumed={consumedCalories} target={goal.calorieTarget} unit="kcal" />
          )}
          {(goal.mode === "protein" || goal.mode === "both") && goal.proteinTarget && (
            <GoalBar label="단백질" consumed={consumedProtein} target={goal.proteinTarget} unit="g" />
          )}
        </section>
      )}

      <ChatDietInput onConfirm={handleConfirm} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-700">오늘 기록 ({logs.length})</h2>
        {loading ? (
          <p className="text-sm text-neutral-400">불러오는 중...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-neutral-400">아직 기록이 없어요.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-neutral-600">{log.rawInput}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-400">
                  {log.meals.map((m, i) => (
                    <span key={i}>
                      {m.name} {Math.round(m.calories)}kcal
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs font-medium text-neutral-500">
                  합계 {Math.round(log.totalCalories)}kcal · 단백질 {Math.round(log.totalProteinG)}g
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
