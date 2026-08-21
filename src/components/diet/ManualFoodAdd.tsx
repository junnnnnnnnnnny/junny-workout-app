"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { addSharedFood } from "@/lib/data";
import { fileToResizedBase64 } from "@/lib/image-utils";
import { postJson } from "@/lib/api-client";
import type { FoodDbItem } from "@/data/foods";

interface FoodLabelAnalysis {
  name: string | null;
  unit: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

interface ManualFoodAddProps {
  initialName: string;
  onCancel: () => void;
  onSaved: (food: FoodDbItem) => void;
}

export function ManualFoodAdd({ initialName, onCancel, onSaved }: ManualFoodAddProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"photo" | "manual">("photo");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [name, setName] = useState(initialName);
  const [unit, setUnit] = useState("100g");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");

  async function handleFile(file: File) {
    if (!user) return;
    setPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const { base64, mediaType } = await fileToResizedBase64(file);
      const data = await postJson<FoodLabelAnalysis>("/api/food/analyze-label", token, {
        image: { base64, mediaType },
      });
      if (data.name) setName(data.name);
      if (data.unit) setUnit(data.unit);
      if (data.calories !== null) setCalories(String(data.calories));
      if (data.proteinG !== null) setProteinG(String(data.proteinG));
      if (data.carbsG !== null) setCarbsG(String(data.carbsG));
      if (data.fatG !== null) setFatG(String(data.fatG));
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 분석에 실패했어요.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    if (!name.trim() || !calories.trim()) {
      setError("이름과 칼로리는 꼭 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const food: FoodDbItem = {
        name: name.trim(),
        unit: unit.trim() || "1인분",
        calories: Number(calories) || 0,
        proteinG: Number(proteinG) || 0,
        carbsG: Number(carbsG) || 0,
        fatG: Number(fatG) || 0,
      };
      await addSharedFood(user.uid, food);
      onSaved(food);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-dashed border-input-border bg-ivory p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-ink">음식 수동으로 추가하기</div>
        <button onClick={onCancel} className="text-xs text-muted underline">
          취소
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("photo")}
          className="flex-1 rounded-full py-2 text-center text-[11px] font-bold"
          style={{
            border: `1px solid ${tab === "photo" ? "var(--color-brand)" : "var(--color-input-border)"}`,
            background: tab === "photo" ? "var(--color-brand)" : "#fff",
            color: tab === "photo" ? "#fff" : "var(--color-ink)",
          }}
        >
          성분표 사진으로
        </button>
        <button
          onClick={() => setTab("manual")}
          className="flex-1 rounded-full py-2 text-center text-[11px] font-bold"
          style={{
            border: `1px solid ${tab === "manual" ? "var(--color-brand)" : "var(--color-input-border)"}`,
            background: tab === "manual" ? "var(--color-brand)" : "#fff",
            color: tab === "manual" ? "#fff" : "var(--color-ink)",
          }}
        >
          직접 입력
        </button>
      </div>

      {tab === "photo" && (
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[10px] border border-input-border bg-white px-3 py-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview && <img src={preview} alt="" className="h-20 w-20 rounded-lg object-cover" />}
            <span className="text-xs font-semibold text-muted-dark">
              {analyzing ? "분석 중..." : preview ? "다른 사진 선택" : "영양성분표 사진 선택"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={analyzing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          className="col-span-2 rounded-[10px] border border-input-border bg-white px-3 py-2 text-[13px] text-ink focus:border-brand focus:outline-none"
        />
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="단위 (예: 100g)"
          className="rounded-[10px] border border-input-border bg-white px-3 py-2 text-[13px] text-ink focus:border-brand focus:outline-none"
        />
        <input
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          inputMode="decimal"
          placeholder="칼로리 (kcal)"
          className="rounded-[10px] border border-input-border bg-white px-3 py-2 text-[13px] text-ink focus:border-brand focus:outline-none"
        />
        <input
          value={proteinG}
          onChange={(e) => setProteinG(e.target.value)}
          inputMode="decimal"
          placeholder="단백질 (g)"
          className="rounded-[10px] border border-input-border bg-white px-3 py-2 text-[13px] text-ink focus:border-brand focus:outline-none"
        />
        <input
          value={carbsG}
          onChange={(e) => setCarbsG(e.target.value)}
          inputMode="decimal"
          placeholder="탄수화물 (g)"
          className="rounded-[10px] border border-input-border bg-white px-3 py-2 text-[13px] text-ink focus:border-brand focus:outline-none"
        />
        <input
          value={fatG}
          onChange={(e) => setFatG(e.target.value)}
          inputMode="decimal"
          placeholder="지방 (g)"
          className="rounded-[10px] border border-input-border bg-white px-3 py-2 text-[13px] text-ink focus:border-brand focus:outline-none"
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || analyzing}
        className="rounded-[10px] bg-brand py-2.5 text-center text-[13px] font-bold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "공통 DB에 저장하고 담기"}
      </button>
    </div>
  );
}
