"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { FOOD_DB } from "@/data/foods";
import { mealLabel } from "@/lib/meal-types";
import { postJson } from "@/lib/api-client";
import type { MealItem, MealType } from "@/types";

interface CartItem extends MealItem {
  qty: number;
}

interface DietRecordingPanelProps {
  mealType: MealType;
  initialText: string;
  isEditing: boolean;
  onClose: () => void;
  onSave: (meals: MealItem[], rawInput: string) => Promise<void>;
}

export function DietRecordingPanel({ mealType, initialText, isEditing, onClose, onSave }: DietRecordingPanelProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"chat" | "foodlist">("chat");

  const [text, setText] = useState(initialText);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState<MealItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [foodQuery, setFoodQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  async function analyzeChat() {
    if (!user || !text.trim()) return;
    setAnalyzing(true);
    setAnalyzed(null);
    setError(null);
    try {
      const token = await user.getIdToken();
      const data = await postJson<{ meals: MealItem[] }>("/api/diet/analyze", token, { text });
      setAnalyzed(data.meals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석에 실패했어요.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveChat() {
    if (!analyzed) return;
    setSaving(true);
    try {
      await onSave(analyzed, text);
    } finally {
      setSaving(false);
    }
  }

  function addToCart(food: (typeof FOOD_DB)[number]) {
    setCart((prev) => {
      const existing = prev.find((c) => c.name === food.name);
      if (existing) return prev.map((c) => (c.name === food.name ? { ...c, qty: c.qty + 1 } : c));
      return [
        ...prev,
        { name: food.name, quantity: food.unit, calories: food.calories, proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG, qty: 1 },
      ];
    });
  }
  function decFromCart(name: string) {
    setCart((prev) => prev.map((c) => (c.name === name ? { ...c, qty: c.qty - 1 } : c)).filter((c) => c.qty > 0));
  }
  function incInCart(name: string) {
    setCart((prev) => prev.map((c) => (c.name === name ? { ...c, qty: c.qty + 1 } : c)));
  }

  const cartTotalCalories = cart.reduce((sum, c) => sum + c.calories * c.qty, 0);
  const cartTotalProtein = cart.reduce((sum, c) => sum + c.proteinG * c.qty, 0);

  async function saveCart() {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      const meals: MealItem[] = cart.map((c) => ({
        name: c.name,
        quantity: `${c.qty}${c.quantity}`,
        calories: c.calories * c.qty,
        proteinG: c.proteinG * c.qty,
        carbsG: c.carbsG * c.qty,
        fatG: c.fatG * c.qty,
      }));
      const rawInput = cart.map((c) => `${c.name} ${c.qty}${c.quantity}`).join(", ");
      await onSave(meals, rawInput);
    } finally {
      setSaving(false);
    }
  }

  const filteredFoods = FOOD_DB.filter((f) => f.name.toLowerCase().includes(foodQuery.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-card-border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-bold text-ink">{mealLabel(mealType)} 기록</div>
        <button onClick={onClose} className="text-xs text-muted underline">
          취소
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode("chat")}
          className="flex-1 rounded-full py-2.5 text-center text-xs font-bold"
          style={{
            border: `1px solid ${mode === "chat" ? "var(--color-brand)" : "var(--color-input-border)"}`,
            background: mode === "chat" ? "var(--color-brand)" : "#fff",
            color: mode === "chat" ? "#fff" : "var(--color-ink)",
          }}
        >
          채팅으로 분석
        </button>
        <button
          onClick={() => setMode("foodlist")}
          className="flex-1 rounded-full py-2.5 text-center text-xs font-bold"
          style={{
            border: `1px solid ${mode === "foodlist" ? "var(--color-brand)" : "var(--color-input-border)"}`,
            background: mode === "foodlist" ? "var(--color-brand)" : "#fff",
            color: mode === "foodlist" ? "#fff" : "var(--color-ink)",
          }}
        >
          음식 목록에서 선택
        </button>
      </div>

      {mode === "chat" && (
        <div className="flex flex-col gap-2.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="예) 계란 2개랑 현미밥 한공기"
            className="w-full resize-y rounded-[10px] border border-input-border bg-ivory px-3 py-2.5 text-[13px] text-ink focus:border-brand focus:outline-none"
          />
          <button
            onClick={analyzeChat}
            disabled={analyzing || !text.trim()}
            className="rounded-[10px] bg-brand py-2.5 text-center text-[13px] font-bold text-white disabled:opacity-50"
          >
            {analyzing ? "분석 중..." : "분석하기"}
          </button>
          {error && <p className="text-xs text-danger">{error}</p>}
          {analyzed && (
            <div className="flex flex-col gap-1.5 border-t border-divider pt-2.5">
              <div className="text-[11px] font-bold text-muted">분석 결과 ({analyzed.length}개 항목)</div>
              {analyzed.map((m, i) => (
                <div key={i} className="flex justify-between text-[13px]">
                  <span className="text-ink">{m.name}</span>
                  <span className="text-muted">
                    {Math.round(m.calories)}kcal · 단백질 {Math.round(m.proteinG)}g
                  </span>
                </div>
              ))}
              <button
                onClick={saveChat}
                disabled={saving}
                className="mt-1.5 rounded-[10px] border border-brand py-2.5 text-center text-[13px] font-bold text-brand disabled:opacity-50"
              >
                {saving ? "저장 중..." : isEditing ? "수정 저장" : "기록에 저장"}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "foodlist" && (
        <div className="flex flex-col gap-2.5">
          <input
            value={foodQuery}
            onChange={(e) => setFoodQuery(e.target.value)}
            placeholder="음식 검색 (예: 닭가슴살)"
            className="w-full rounded-[10px] border border-input-border bg-ivory px-3 py-2.5 text-[13px] text-ink focus:border-brand focus:outline-none"
          />
          <div className="flex max-h-[180px] flex-col gap-1.5 overflow-y-auto">
            {filteredFoods.map((food) => (
              <button
                key={food.name}
                onClick={() => addToCart(food)}
                className="flex items-center justify-between border-b border-divider py-2 text-left"
              >
                <div className="text-[13px] font-semibold text-ink">
                  {food.name} <span className="font-normal text-muted">· {food.unit}</span>
                </div>
                <div className="text-[11px] text-muted">{food.calories}kcal</div>
              </button>
            ))}
          </div>
          {cart.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-divider pt-2.5">
              <div className="text-[11px] font-bold text-muted">선택한 항목</div>
              {cart.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink">
                    {c.name} × {c.qty}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted">{c.calories * c.qty}kcal</span>
                    <button onClick={() => decFromCart(c.name)} className="px-1 text-muted">
                      −
                    </button>
                    <button onClick={() => incInCart(c.name)} className="px-1 text-brand">
                      +
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-1 text-xs font-bold text-brand">
                합계 {Math.round(cartTotalCalories)}kcal · 단백질 {Math.round(cartTotalProtein)}g
              </div>
              <button
                onClick={saveCart}
                disabled={saving}
                className="rounded-[10px] bg-brand py-2.5 text-center text-[13px] font-bold text-white disabled:opacity-50"
              >
                {saving ? "저장 중..." : "기록에 저장"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
