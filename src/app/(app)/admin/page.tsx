"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getGoal, saveGoal } from "@/lib/data";
import { GoalForm } from "@/components/goals/GoalForm";
import type { Goal } from "@/types";

export default function AdminPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    getGoal(user.uid)
      .then(setGoal)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSubmit(g: Omit<Goal, "updatedAt">) {
    if (!user) return;
    await saveGoal(user.uid, g);
    setGoal({ ...g, updatedAt: new Date().toISOString() });
    setSavedAt(Date.now());
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight">관리자 메뉴</h1>
        <p className="mt-1 text-sm text-neutral-500">목표 설정 및 앱 환경설정을 관리해요.</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-700">목표 설정</h2>
        {loading ? (
          <p className="text-sm text-neutral-400">불러오는 중...</p>
        ) : (
          <GoalForm initialGoal={goal} submitLabel="목표 저장" onSubmit={handleSubmit} />
        )}
        {savedAt && <p className="mt-3 text-xs text-emerald-600">저장했어요!</p>}
      </section>

      <section className="rounded-2xl border border-dashed border-neutral-300 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">헬스장 기구 & 즐겨찾기 운동</h2>
        <p className="text-xs text-neutral-400">
          준비 중이에요 — 다니는 헬스장의 보유 기구를 등록하면 할 수 있는 운동을 추천하고, 자주 하는 운동을 즐겨찾기할 수 있게 됩니다.
        </p>
      </section>
    </div>
  );
}
