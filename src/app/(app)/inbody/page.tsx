"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getGoal, getInbodyRecords } from "@/lib/data";
import { InbodyRegisterForm } from "@/components/inbody/InbodyRegisterForm";
import type { Goal, InbodyRecord } from "@/types";

const STAT_FIELDS: { key: keyof InbodyRecord; label: string; unit?: string }[] = [
  { key: "weightKg", label: "체중", unit: "kg" },
  { key: "skeletalMuscleMassKg", label: "골격근량", unit: "kg" },
  { key: "bodyFatMassKg", label: "체지방량", unit: "kg" },
  { key: "bodyFatPercent", label: "체지방률", unit: "%" },
  { key: "bmi", label: "BMI" },
  { key: "bmrKcal", label: "기초대사량", unit: "kcal" },
  { key: "waistHipRatio", label: "복부지방률" },
  { key: "visceralFatLevel", label: "내장지방레벨" },
  { key: "heightCm", label: "키", unit: "cm" },
];

export default function InbodyPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<InbodyRecord[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    Promise.all([getInbodyRecords(user.uid), getGoal(user.uid)]).then(([r, g]) => {
      if (ignore) return;
      setRecords(r);
      setGoal(g);
    });
    return () => {
      ignore = true;
    };
  }, [user]);

  async function refresh() {
    if (!user) return;
    setRecords(await getInbodyRecords(user.uid));
  }

  const latest = records[0];
  const latestStats = STAT_FIELDS.filter((f) => latest?.[f.key] !== undefined);
  const weightRecords = [...records].reverse().filter((r) => r.weightKg !== undefined);
  const targetWeight = goal?.targetWeightKg;
  const weightToGo =
    latest?.weightKg !== undefined && targetWeight ? Math.abs(latest.weightKg - targetWeight) : null;

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="text-xl font-bold text-ink">인바디 관리</div>
        <p className="mt-0.5 text-[13px] text-muted">
          결과지를 촬영해 올리거나 직접 입력하면 기록해드려요.
        </p>
      </div>

      <InbodyRegisterForm onSaved={refresh} />

      {latestStats.length > 0 && (
        <div className="rounded-2xl border border-card-border bg-white p-4">
          <div className="mb-2.5 text-xs font-bold text-muted">
            최근 기록 · {latest.date.slice(5).replace("-", "/")}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {latestStats.map((f) => (
              <div key={f.key}>
                <div className="text-[17px] font-bold text-ink">
                  {latest[f.key]}
                  {f.unit ? <span className="ml-0.5 text-[11px] font-normal text-muted">{f.unit}</span> : null}
                </div>
                <div className="text-[11px] text-muted">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {weightRecords.length >= 2 && (
        <div>
          <div className="mb-2 text-[13px] font-bold text-muted-dark">체중 추이</div>
          <WeightTrendChart records={weightRecords} />
        </div>
      )}

      {targetWeight && weightToGo !== null && (
        <div className="rounded-2xl bg-brand-soft p-4 text-xs text-brand-soft-ink">
          <strong className="text-brand">목표 체중 {targetWeight}kg</strong>까지 {weightToGo.toFixed(1)}kg 남았어요.
        </div>
      )}
    </div>
  );
}

function WeightTrendChart({ records }: { records: InbodyRecord[] }) {
  const weights = records.map((r) => r.weightKg!);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const width = 300;
  const height = 80;
  const points = weights
    .map((w, i) => {
      const x = (i / (weights.length - 1)) * width;
      const y = height - 10 - ((w - min) / range) * (height - 20);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
