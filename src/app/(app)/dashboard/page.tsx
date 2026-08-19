"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { getDietLogsForDate, getGoal } from "@/lib/data";
import { GoalBar } from "@/components/goals/GoalBar";
import type { DietLog, Goal } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [dietLogs, setDietLogs] = useState<DietLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    Promise.all([getGoal(user.uid), getDietLogsForDate(user.uid, today)])
      .then(([g, logs]) => {
        setGoal(g);
        setDietLogs(logs);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const consumedCalories = dietLogs.reduce((sum, l) => sum + l.totalCalories, 0);
  const consumedProtein = dietLogs.reduce((sum, l) => sum + l.totalProteinG, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-neutral-500">
          {format(new Date(), "yyyy년 M월 d일")}
        </p>
        <h1 className="text-xl font-bold tracking-tight">
          안녕하세요{user?.displayName ? `, ${user.displayName}님` : ""}
        </h1>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">오늘의 식단</h2>
        {loading ? (
          <p className="text-sm text-neutral-400">불러오는 중...</p>
        ) : goal ? (
          <div className="flex flex-col gap-3">
            {(goal.mode === "calorie" || goal.mode === "both") && goal.calorieTarget && (
              <GoalBar
                label="칼로리"
                consumed={consumedCalories}
                target={goal.calorieTarget}
                unit="kcal"
              />
            )}
            {(goal.mode === "protein" || goal.mode === "both") && goal.proteinTarget && (
              <GoalBar
                label="단백질"
                consumed={consumedProtein}
                target={goal.proteinTarget}
                unit="g"
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">목표가 설정되지 않았어요.</p>
        )}
        <Link
          href="/diet"
          className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-2"
        >
          식단 기록하러 가기 →
        </Link>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/workouts"
          className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400"
        >
          <div className="text-2xl">🏋️</div>
          <div className="mt-2 text-sm font-semibold">운동 기록</div>
          <div className="text-xs text-neutral-500">오늘 운동을 기록해보세요</div>
        </Link>
        <Link
          href="/diet"
          className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400"
        >
          <div className="text-2xl">🍽️</div>
          <div className="mt-2 text-sm font-semibold">식단 기록</div>
          <div className="text-xs text-neutral-500">먹은 음식을 채팅처럼 입력</div>
        </Link>
      </div>
    </div>
  );
}
