"use client";

import { useEffect, useState } from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { addFridgeItem, getFridgeItems, getGoal, removeFridgeItem } from "@/lib/data";
import { todayStr } from "@/lib/date-utils";
import { postJson } from "@/lib/api-client";
import type { FridgeItem, Goal } from "@/types";

interface RecommendResult {
  title: string;
  description: string;
  estimatedCalories: number;
  estimatedProteinG: number;
}

export default function DietRecommendPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [recommending, setRecommending] = useState(false);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    Promise.all([getFridgeItems(user.uid), getGoal(user.uid)]).then(([fridge, g]) => {
      if (ignore) return;
      setItems(fridge);
      setGoal(g);
    });
    return () => {
      ignore = true;
    };
  }, [user]);

  async function refreshItems() {
    if (!user) return;
    setItems(await getFridgeItems(user.uid));
  }

  async function handleAdd() {
    if (!user || !newItemName.trim()) return;
    await addFridgeItem(user.uid, {
      name: newItemName.trim(),
      quantity: "1개",
      expiryDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    });
    setNewItemName("");
    refreshItems();
  }

  async function handleRemove(id: string) {
    if (!user) return;
    await removeFridgeItem(user.uid, id);
    refreshItems();
  }

  function expiryDays(item: FridgeItem): number | null {
    if (!item.expiryDate) return null;
    return differenceInCalendarDays(new Date(item.expiryDate + "T00:00:00"), new Date(todayStr() + "T00:00:00"));
  }

  async function getRecommendation() {
    if (!user || items.length === 0) return;
    setRecommending(true);
    setError(null);
    setResult(null);
    try {
      const priorityItems = items
        .filter((i) => {
          const d = expiryDays(i);
          return d !== null && d <= 3;
        })
        .map((i) => i.name);
      const goalSummary = goal
        ? `${goal.mode === "both" ? "칼로리+단백질" : goal.mode === "calorie" ? "칼로리" : "단백질"} 목표${
            goal.calorieTarget ? ` · ${goal.calorieTarget}kcal` : ""
          }${goal.proteinTarget ? ` · ${goal.proteinTarget}g` : ""}`
        : "";
      const token = await user.getIdToken();
      const data = await postJson<RecommendResult>("/api/diet/recommend", token, {
        items: items.map((i) => ({ name: i.name, quantity: i.quantity })),
        priorityItems,
        goalSummary,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "추천에 실패했어요.");
    } finally {
      setRecommending(false);
    }
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="text-xl font-bold text-ink">식단 추천</div>
        <p className="mt-0.5 text-[13px] text-muted">냉장고 재료와 목표를 기반으로 추천해드려요.</p>
      </div>

      <div className="flex flex-col gap-2.5 rounded-2xl border border-card-border bg-white p-4">
        <div className="text-[13px] font-bold text-ink">냉장고 관리</div>
        <div className="flex flex-col gap-1.5">
          {items.map((item) => {
            const days = expiryDays(item);
            return (
              <div key={item.id} className="flex items-center justify-between border-b border-divider py-2">
                <div className="text-[13px] text-ink">
                  {item.name} <span className="text-muted">· {item.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  {days !== null && (
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: days <= 2 ? "var(--color-danger)" : "var(--color-muted)" }}
                    >
                      D-{days}
                    </span>
                  )}
                  <button onClick={() => handleRemove(item.id)} className="text-x-icon">
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          {items.length === 0 && <p className="py-2 text-center text-xs text-muted">냉장고가 비어있어요.</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="재료 이름 추가 (예: 두부)"
            className="flex-1 rounded-[10px] border border-input-border bg-ivory px-3 py-2.5 text-[13px] text-ink focus:border-brand focus:outline-none"
          />
          <button onClick={handleAdd} className="rounded-[10px] bg-ink px-4 py-2.5 text-[13px] font-bold text-white">
            추가
          </button>
        </div>
      </div>

      <button
        onClick={getRecommendation}
        disabled={recommending || items.length === 0}
        className="rounded-xl bg-brand py-3.5 text-center text-sm font-bold text-white disabled:opacity-50"
      >
        {recommending ? "추천 생성 중..." : "유통기한 임박 재료로 추천받기"}
      </button>

      {error && <p className="text-sm text-danger">{error}</p>}

      {result && (
        <div className="flex flex-col gap-2 rounded-2xl bg-brand-soft p-4">
          <div className="text-[13px] font-bold text-brand">{result.title}</div>
          <p className="text-xs leading-[1.6] text-brand-soft-ink">{result.description}</p>
          <div className="mt-1 text-[11px] font-bold text-brand">
            약 {Math.round(result.estimatedCalories)}kcal · 단백질 {Math.round(result.estimatedProteinG)}g
          </div>
        </div>
      )}
    </div>
  );
}
