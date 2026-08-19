"use client";

import { useState } from "react";
import type { Goal, GoalMode } from "@/types";

const MODE_OPTIONS: { value: GoalMode; label: string; hint: string }[] = [
  { value: "calorie", label: "칼로리만", hint: "하루 목표 칼로리만 관리" },
  { value: "protein", label: "단백질만", hint: "하루 목표 단백질량만 관리" },
  { value: "both", label: "칼로리 + 단백질", hint: "둘 다 목표로 관리 (추천)" },
];

interface GoalFormProps {
  initialGoal?: Goal | null;
  submitLabel: string;
  onSubmit: (goal: Omit<Goal, "updatedAt">) => Promise<void>;
}

export function GoalForm({ initialGoal, submitLabel, onSubmit }: GoalFormProps) {
  const [mode, setMode] = useState<GoalMode>(initialGoal?.mode ?? "both");
  const [calorieTarget, setCalorieTarget] = useState(
    initialGoal?.calorieTarget?.toString() ?? ""
  );
  const [proteinTarget, setProteinTarget] = useState(
    initialGoal?.proteinTarget?.toString() ?? ""
  );
  const [targetWeightKg, setTargetWeightKg] = useState(
    initialGoal?.targetWeightKg?.toString() ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsCalorie = mode === "calorie" || mode === "both";
  const needsProtein = mode === "protein" || mode === "both";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (needsCalorie && !calorieTarget) {
      setError("목표 칼로리를 입력해주세요.");
      return;
    }
    if (needsProtein && !proteinTarget) {
      setError("목표 단백질량을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        mode,
        calorieTarget: needsCalorie ? Number(calorieTarget) : undefined,
        proteinTarget: needsProtein ? Number(proteinTarget) : undefined,
        targetWeightKg: targetWeightKg ? Number(targetWeightKg) : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">목표 방식</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {MODE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                mode === opt.value
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white hover:border-neutral-400"
              }`}
            >
              <div className="text-sm font-semibold">{opt.label}</div>
              <div className={`mt-0.5 text-xs ${mode === opt.value ? "text-neutral-300" : "text-neutral-500"}`}>
                {opt.hint}
              </div>
            </button>
          ))}
        </div>
      </div>

      {needsCalorie && (
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            목표 칼로리 (kcal/일)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(e.target.value)}
            placeholder="예: 2200"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-900 focus:outline-none"
          />
        </div>
      )}

      {needsProtein && (
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            목표 단백질 (g/일)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={proteinTarget}
            onChange={(e) => setProteinTarget(e.target.value)}
            placeholder="예: 150"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-900 focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          목표 체중 (kg, 선택)
        </label>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.1}
          value={targetWeightKg}
          onChange={(e) => setTargetWeightKg(e.target.value)}
          placeholder="예: 72.0"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-neutral-900 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {submitting ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}
