"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { addInbodyRecord } from "@/lib/data";
import { todayStr } from "@/lib/date-utils";
import { InbodyPhotoUpload, type InbodyAnalysis } from "@/components/inbody/InbodyPhotoUpload";
import type { InbodyRecord } from "@/types";

type FieldKey = Exclude<keyof InbodyRecord, "id" | "date" | "imageUrl" | "source" | "createdAt">;

const FIELDS: { key: FieldKey; label: string; unit?: string; fromOcr: boolean }[] = [
  { key: "heightCm", label: "키", unit: "cm", fromOcr: false },
  { key: "weightKg", label: "체중", unit: "kg", fromOcr: true },
  { key: "skeletalMuscleMassKg", label: "골격근량", unit: "kg", fromOcr: true },
  { key: "bodyFatMassKg", label: "체지방량", unit: "kg", fromOcr: true },
  { key: "bodyFatPercent", label: "체지방률", unit: "%", fromOcr: true },
  { key: "bmi", label: "BMI", fromOcr: true },
  { key: "bmrKcal", label: "기초대사량", unit: "kcal", fromOcr: true },
  { key: "waistHipRatio", label: "복부지방률(WHR)", fromOcr: true },
  { key: "visceralFatLevel", label: "내장지방레벨", fromOcr: true },
];

export function InbodyRegisterForm({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const [usedOcr, setUsedOcr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleAnalyzed(data: InbodyAnalysis) {
    const ocrValues = data as unknown as Record<string, number | null>;
    setValues((prev) => {
      const next = { ...prev };
      for (const field of FIELDS) {
        if (!field.fromOcr) continue;
        const value = ocrValues[field.key];
        if (value !== null && value !== undefined) next[field.key] = String(value);
      }
      return next;
    });
    setUsedOcr(true);
  }

  function setField(key: FieldKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!user) return;
    const hasAny = FIELDS.some((f) => values[f.key]?.trim());
    if (!hasAny) {
      setError("최소 하나 이상의 값을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const record: Omit<InbodyRecord, "id" | "createdAt"> = {
        date: todayStr(),
        source: usedOcr ? "ocr" : "manual",
      };
      for (const field of FIELDS) {
        const raw = values[field.key];
        if (raw && raw.trim()) {
          (record as Record<FieldKey, number>)[field.key] = Number(raw);
        }
      }
      await addInbodyRecord(user.uid, record);
      setValues({});
      setUsedOcr(false);
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <InbodyPhotoUpload onAnalyzed={handleAnalyzed} />

      <div className="rounded-2xl border border-card-border bg-white p-4">
        <div className="mb-3 text-[13px] font-bold text-ink">결과값 입력 (전부 선택 입력이에요)</div>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <div className="mb-1 text-[11px] font-semibold text-muted-dark">
                {field.label}
                {field.unit ? ` (${field.unit})` : ""}
              </div>
              <input
                value={values[field.key] ?? ""}
                onChange={(e) => setField(field.key, e.target.value)}
                inputMode="decimal"
                placeholder="-"
                className="w-full rounded-[10px] border border-input-border bg-ivory px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              />
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-brand py-3 text-center text-[13px] font-bold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "등록하기"}
        </button>
        {saved && <p className="mt-2 text-center text-xs font-semibold text-brand">등록했어요!</p>}
      </div>
    </div>
  );
}
