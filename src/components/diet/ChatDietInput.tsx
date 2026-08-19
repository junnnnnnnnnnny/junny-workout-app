"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { MealItem } from "@/types";

interface ChatDietInputProps {
  onConfirm: (meals: MealItem[], rawInput: string) => Promise<void>;
}

export function ChatDietInput({ onConfirm }: ChatDietInputProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealItem[] | null>(null);

  async function handleAnalyze() {
    if (!user || !text.trim()) return;
    setAnalyzing(true);
    setError(null);
    setMeals(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/diet/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "분석에 실패했어요.");
      setMeals(data.meals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석에 실패했어요.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!meals) return;
    setSaving(true);
    try {
      await onConfirm(meals, text);
      setText("");
      setMeals(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="오늘 뭐 먹었나요? 예) 아침에 계란 2개랑 현미밥 한공기, 점심엔 닭가슴살 샐러드 먹었어"
        rows={3}
        className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
      />
      <button
        onClick={handleAnalyze}
        disabled={analyzing || !text.trim()}
        className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {analyzing ? "분석 중..." : "분석하기"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {meals && (
        <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
          <p className="text-xs font-semibold text-neutral-500">분석 결과 ({meals.length}개 항목)</p>
          {meals.map((m, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>
                {m.name} <span className="text-neutral-400">· {m.quantity}</span>
              </span>
              <span className="text-neutral-500">
                {Math.round(m.calories)}kcal · 단백질 {Math.round(m.proteinG)}g
              </span>
            </div>
          ))}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2 rounded-lg border border-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "기록에 저장"}
          </button>
        </div>
      )}
    </div>
  );
}
