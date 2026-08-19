"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { saveGoal } from "@/lib/data";
import { GoalForm } from "@/components/goals/GoalForm";
import type { Goal } from "@/types";

export default function OnboardingPage() {
  const { user, loading, markOnboardingCompleted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  async function handleSubmit(goal: Omit<Goal, "updatedAt">) {
    if (!user) return;
    await saveGoal(user.uid, goal);
    markOnboardingCompleted();
    router.replace("/dashboard");
  }

  if (loading || !user) return null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium text-neutral-500">환영합니다, {user.displayName ?? "회원"}님</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">목표를 설정해주세요</h1>
        <p className="mt-2 text-sm text-neutral-500">
          설정한 목표는 식단 기록과 추천에 바로 반영돼요. 나중에 관리자 메뉴에서 언제든 수정할 수 있어요.
        </p>
      </div>
      <GoalForm submitLabel="시작하기" onSubmit={handleSubmit} />
    </main>
  );
}
