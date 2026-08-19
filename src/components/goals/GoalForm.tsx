"use client";

import { useState } from "react";
import type { Goal, GoalMode } from "@/types";

const MODE_OPTIONS: { value: GoalMode; label: string }[] = [
  { value: "calorie", label: "칼로리만" },
  { value: "protein", label: "단백질만" },
  { value: "both", label: "칼로리 + 단백질" },
];

interface GoalFormProps {
  initialGoal?: Goal | null;
  submitLabel: string;
  onSubmit: (goal: Omit<Goal, "updatedAt">) => Promise<void>;
}

export function GoalForm({ initialGoal, submitLabel, onSubmit }: GoalFormProps) {
  const [mode, setMode] = useState<GoalMode>(initialGoal?.mode ?? "both");
  const [calorieTarget, setCalorieTarget] = useState(initialGoal?.calorieTarget?.toString() ?? "");
  const [proteinTarget, setProteinTarget] = useState(initialGoal?.proteinTarget?.toString() ?? "");
  const [targetWeightKg, setTargetWeightKg] = useState(initialGoal?.targetWeightKg?.toString() ?? "");
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
      setError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-2">
        {MODE_OPTIONS.map((opt) => {
          const active = mode === opt.value;
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className="rounded-xl border px-3.5 py-3 text-left text-[13px] font-bold"
              style={{
                borderColor: active ? "var(--color-brand)" : "var(--color-input-border)",
                background: active ? "var(--color-brand)" : "#fff",
                color: active ? "#fff" : "var(--color-ink)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {needsCalorie && (
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={calorieTarget}
          onChange={(e) => setCalorieTarget(e.target.value)}
          placeholder="목표 칼로리(kcal)"
          className="w-full rounded-[10px] border border-input-border bg-ivory px-3.5 py-2.5 text-[13px] text-ink focus:border-brand focus:outline-none"
        />
      )}
      {needsProtein && (
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={proteinTarget}
          onChange={(e) => setProteinTarget(e.target.value)}
          placeholder="목표 단백질(g)"
          className="w-full rounded-[10px] border border-input-border bg-ivory px-3.5 py-2.5 text-[13px] text-ink focus:border-brand focus:outline-none"
        />
      )}
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={0.1}
        value={targetWeightKg}
        onChange={(e) => setTargetWeightKg(e.target.value)}
        placeholder="목표 체중(kg, 선택)"
        className="w-full rounded-[10px] border border-input-border bg-ivory px-3.5 py-2.5 text-[13px] text-ink focus:border-brand focus:outline-none"
      />

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-[10px] bg-brand py-2.5 text-center text-[13px] font-bold text-white disabled:opacity-50"
      >
        {submitting ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}
