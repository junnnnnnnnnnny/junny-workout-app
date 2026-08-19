"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { Exercise, WorkoutSetEntry } from "@/types";

interface WorkoutLogFormProps {
  exercise: Exercise;
  onSave: (sets: WorkoutSetEntry[], date: string) => Promise<void>;
}

export function WorkoutLogForm({ exercise, onSave }: WorkoutLogFormProps) {
  const [date] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [sets, setSets] = useState<WorkoutSetEntry[]>([{ weightKg: 0, reps: 0 }]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateSet(index: number, field: keyof WorkoutSetEntry, value: number) {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSet() {
    setSets((prev) => [...prev, prev.length ? { ...prev[prev.length - 1] } : { weightKg: 0, reps: 0 }]);
  }

  function removeSet(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validSets = sets.filter((s) => s.weightKg > 0 || s.reps > 0);
    if (validSets.length === 0) return;
    setSaving(true);
    setSaved(false);
    try {
      await onSave(validSets, date);
      setSets([{ weightKg: 0, reps: 0 }]);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {sets.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-xs text-neutral-400">{i + 1}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={s.weightKg || ""}
              onChange={(e) => updateSet(i, "weightKg", Number(e.target.value))}
              placeholder="무게(kg)"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <span className="shrink-0 text-neutral-400">×</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={s.reps || ""}
              onChange={(e) => updateSet(i, "reps", Number(e.target.value))}
              placeholder="횟수"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeSet(i)}
              disabled={sets.length === 1}
              className="shrink-0 px-1 text-neutral-300 hover:text-red-500 disabled:opacity-0"
              aria-label="세트 삭제"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSet}
        className="rounded-lg border border-dashed border-neutral-300 py-2 text-sm text-neutral-500 hover:border-neutral-400"
      >
        + 세트 추가
      </button>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {saving ? "저장 중..." : `${exercise.nameKo} 기록 저장`}
      </button>
      {saved && <p className="text-center text-xs text-emerald-600">저장했어요!</p>}
    </form>
  );
}
