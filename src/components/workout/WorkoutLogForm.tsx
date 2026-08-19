"use client";

import { useState } from "react";
import type { WorkoutSetEntry } from "@/types";

interface WorkoutLogFormProps {
  exerciseName: string;
  initialSets: WorkoutSetEntry[];
  isEditing: boolean;
  onSave: (sets: WorkoutSetEntry[]) => Promise<void>;
}

export function WorkoutLogForm({ exerciseName, initialSets, isEditing, onSave }: WorkoutLogFormProps) {
  const [sets, setSets] = useState<WorkoutSetEntry[]>(initialSets);
  const [saving, setSaving] = useState(false);

  function updateSet(index: number, field: keyof WorkoutSetEntry, value: number) {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSet() {
    setSets((prev) => [...prev, prev.length ? { ...prev[prev.length - 1] } : { weightKg: 0, reps: 0 }]);
  }

  function removeSet(index: number) {
    setSets((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validSets = sets.filter((s) => s.weightKg > 0 || s.reps > 0);
    if (validSets.length === 0) return;
    setSaving(true);
    try {
      await onSave(validSets);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        {sets.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-4 shrink-0 text-[11px] text-muted">{i + 1}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={s.weightKg || ""}
              onChange={(e) => updateSet(i, "weightKg", Number(e.target.value))}
              placeholder="무게(kg)"
              className="w-full rounded-[10px] border border-input-border bg-white px-3 py-2.5 text-[13px] text-ink focus:border-brand focus:outline-none"
            />
            <span className="shrink-0 text-muted">×</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={s.reps || ""}
              onChange={(e) => updateSet(i, "reps", Number(e.target.value))}
              placeholder="횟수"
              className="w-full rounded-[10px] border border-input-border bg-white px-3 py-2.5 text-[13px] text-ink focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeSet(i)}
              className="shrink-0 px-1 text-x-icon"
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
        className="rounded-[10px] border border-dashed border-dashed py-2.5 text-center text-[13px] text-muted"
        style={{ borderColor: "var(--color-dashed)" }}
      >
        + 세트 추가
      </button>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-brand py-3.5 text-center text-sm font-bold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : isEditing ? "수정 저장" : `${exerciseName} 기록 저장`}
      </button>
    </form>
  );
}
