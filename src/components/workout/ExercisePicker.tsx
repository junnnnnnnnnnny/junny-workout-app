"use client";

import { useMemo, useState } from "react";
import { EXERCISES } from "@/data/exercises";
import type { Exercise } from "@/types";

const MUSCLE_LABELS: Record<string, string> = {
  chest: "가슴",
  back: "등",
  shoulders: "어깨",
  biceps: "이두",
  triceps: "삼두",
  legs: "하체",
  glutes: "둔근",
  abs: "복근",
  cardio: "유산소",
  "full-body": "전신",
};

export function ExercisePicker({ onSelect }: { onSelect: (exercise: Exercise) => void }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EXERCISES;
    return EXERCISES.filter(
      (e) => e.nameKo.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="운동 검색 (예: 벤치프레스)"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
      />
      <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onSelect(ex)}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-left text-sm transition hover:border-neutral-400"
          >
            <div>
              <div className="font-medium">{ex.nameKo}</div>
              <div className="text-xs text-neutral-400">{ex.name}</div>
            </div>
            <div className="flex gap-1">
              {ex.muscleGroups.map((mg) => (
                <span
                  key={mg}
                  className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500"
                >
                  {MUSCLE_LABELS[mg] ?? mg}
                </span>
              ))}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-neutral-400">검색 결과가 없어요.</p>
        )}
      </div>
    </div>
  );
}
