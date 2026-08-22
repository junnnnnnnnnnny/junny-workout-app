"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { EXERCISES } from "@/data/exercises";
import { MUSCLE_LABELS } from "@/lib/muscle-labels";
import { ManualExerciseAdd } from "@/components/workout/ManualExerciseAdd";
import { isAdmin } from "@/lib/admin";
import type { Exercise } from "@/types";

type Filter = "all" | "favorites" | "mygym";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "favorites", label: "즐겨찾기" },
  { key: "mygym", label: "내 헬스장 기구" },
];

interface ExercisePickerProps {
  favoriteIds: string[];
  equipment: string[];
  sharedExercises: Exercise[];
  onExerciseAdded: (exercise: Exercise) => void;
  onToggleFavorite: (exerciseId: string) => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePicker({
  favoriteIds,
  equipment,
  sharedExercises,
  onExerciseAdded,
  onToggleFavorite,
  onSelect,
}: ExercisePickerProps) {
  const { user } = useAuth();
  const canAddExercise = isAdmin(user?.uid);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [addingExercise, setAddingExercise] = useState(false);

  const allExercises = useMemo(() => [...EXERCISES, ...sharedExercises], [sharedExercises]);

  const filtered = useMemo(() => {
    let list = allExercises;
    if (filter === "favorites") list = list.filter((e) => favoriteIds.includes(e.id));
    if (filter === "mygym" && equipment.length) list = list.filter((e) => equipment.includes(e.equipment));
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((e) => e.nameKo.toLowerCase().includes(q) || e.name.toLowerCase().includes(q));
    return list;
  }, [allExercises, query, filter, favoriteIds, equipment]);

  function handleExerciseSaved(exercise: Exercise) {
    onExerciseAdded(exercise);
    setAddingExercise(false);
    onSelect(exercise);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="rounded-full px-3.5 py-2 text-xs font-bold"
              style={{
                background: active ? "var(--color-brand)" : "var(--color-brand-soft)",
                color: active ? "#fff" : "var(--color-brand)",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="운동 검색 (예: 벤치프레스)"
        className="w-full rounded-[10px] border border-input-border bg-white px-3.5 py-3 text-sm text-ink focus:border-brand focus:outline-none"
      />
      <div className="flex flex-col gap-2">
        {filtered.map((ex) => {
          const isFav = favoriteIds.includes(ex.id);
          return (
            <div
              key={ex.id}
              className="flex items-center justify-between rounded-2xl border border-card-border bg-white px-3.5 py-3"
            >
              <button onClick={() => onSelect(ex)} className="flex-1 text-left">
                <div className="text-sm font-bold text-ink">{ex.nameKo}</div>
                <div className="mt-0.5 text-[11px] text-muted">
                  {ex.equipment} · {ex.muscleGroups.map((m) => MUSCLE_LABELS[m]).join("·")}
                </div>
              </button>
              <button
                onClick={() => onToggleFavorite(ex.id)}
                className="pl-3 text-base"
                style={{ color: isFav ? "var(--color-brand)" : "var(--color-input-border)" }}
                aria-label="즐겨찾기"
              >
                ★
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && !addingExercise && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-input-border py-4 text-center">
            <p className="text-xs text-muted">
              {query.trim() ? `'${query.trim()}'에 대한 검색 결과가 없어요.` : "검색 결과가 없어요."}
            </p>
            {canAddExercise ? (
              <button
                onClick={() => setAddingExercise(true)}
                className="rounded-full border border-brand px-4 py-2 text-xs font-bold text-brand"
              >
                수동으로 추가하기
              </button>
            ) : (
              <p className="text-[11px] text-muted">새 운동 등록은 관리자만 할 수 있어요.</p>
            )}
          </div>
        )}
        {canAddExercise && addingExercise && (
          <ManualExerciseAdd
            initialName={query.trim()}
            onCancel={() => setAddingExercise(false)}
            onSaved={handleExerciseSaved}
          />
        )}
      </div>
    </div>
  );
}
