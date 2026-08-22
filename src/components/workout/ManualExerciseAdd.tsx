"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { addSharedExercise } from "@/lib/data";
import { MUSCLE_LABELS } from "@/lib/muscle-labels";
import type { Exercise, MuscleGroup } from "@/types";

const EQUIPMENT_OPTIONS = ["바벨", "덤벨", "머신", "케이블", "맨몸"];
const MUSCLE_OPTIONS = Object.entries(MUSCLE_LABELS) as [MuscleGroup, string][];

interface ManualExerciseAddProps {
  initialName: string;
  onCancel: () => void;
  onSaved: (exercise: Exercise) => void;
}

export function ManualExerciseAdd({ initialName, onCancel, onSaved }: ManualExerciseAddProps) {
  const { user } = useAuth();
  const [nameKo, setNameKo] = useState(initialName);
  const [name, setName] = useState("");
  const [equipment, setEquipment] = useState<string | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleMuscle(m: MuscleGroup) {
    setMuscleGroups((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  async function handleSave() {
    if (!user) return;
    if (!nameKo.trim() || !equipment || muscleGroups.length === 0) {
      setError("이름, 기구, 근육 부위를 모두 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const exercise = await addSharedExercise(user.uid, {
        name: name.trim() || nameKo.trim(),
        nameKo: nameKo.trim(),
        equipment,
        muscleGroups,
      });
      onSaved(exercise);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-dashed border-input-border bg-ivory p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-ink">운동 수동으로 추가하기</div>
        <button onClick={onCancel} className="text-xs text-muted underline">
          취소
        </button>
      </div>

      <input
        value={nameKo}
        onChange={(e) => setNameKo(e.target.value)}
        placeholder="운동 이름 (예: 케이블 크로스오버)"
        className="rounded-[10px] border border-input-border bg-white px-3 py-2 text-[13px] text-ink focus:border-brand focus:outline-none"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="영문 이름 (선택)"
        className="rounded-[10px] border border-input-border bg-white px-3 py-2 text-[13px] text-ink focus:border-brand focus:outline-none"
      />

      <div>
        <div className="mb-1.5 text-xs font-semibold text-muted-dark">기구</div>
        <div className="flex flex-wrap gap-1.5">
          {EQUIPMENT_OPTIONS.map((eq) => (
            <button
              key={eq}
              onClick={() => setEquipment(eq)}
              className="rounded-full px-3 py-1.5 text-xs font-bold"
              style={{
                border: `1px solid ${equipment === eq ? "var(--color-brand)" : "var(--color-input-border)"}`,
                background: equipment === eq ? "var(--color-brand)" : "#fff",
                color: equipment === eq ? "#fff" : "var(--color-ink)",
              }}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold text-muted-dark">근육 부위 (여러 개 선택 가능)</div>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_OPTIONS.map(([key, label]) => {
            const active = muscleGroups.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleMuscle(key)}
                className="rounded-full px-3 py-1.5 text-xs font-bold"
                style={{
                  border: `1px solid ${active ? "var(--color-brand)" : "var(--color-input-border)"}`,
                  background: active ? "var(--color-brand)" : "#fff",
                  color: active ? "#fff" : "var(--color-ink)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-[10px] bg-brand py-2.5 text-center text-[13px] font-bold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "공통 DB에 저장하고 선택"}
      </button>
    </div>
  );
}
