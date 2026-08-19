"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { addInbodyRecord, getGoal, getInbodyRecords } from "@/lib/data";
import { todayStr } from "@/lib/date-utils";
import type { Goal, InbodyRecord } from "@/types";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function InbodyPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<InbodyRecord[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setNotice(null);
    try {
      const base64 = await fileToBase64(file);
      const token = await user.getIdToken();
      const res = await fetch("/api/inbody/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "분석에 실패했어요.");
      if (!data.weightKg) {
        setNotice("사진에서 수치를 읽지 못했어요. 더 선명한 사진으로 다시 시도해주세요.");
        return;
      }
      await addInbodyRecord(user.uid, {
        date: todayStr(),
        weightKg: data.weightKg,
        skeletalMuscleMassKg: data.skeletalMuscleMassKg ?? undefined,
        bodyFatPercent: data.bodyFatPercent ?? undefined,
        bodyFatMassKg: data.bodyFatMassKg ?? undefined,
        source: "ocr",
      });
      setNotice("인바디 결과를 등록했어요.");
      refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "분석에 실패했어요.");
    } finally {
      setUploading(false);
    }
  }

  const latest = records[0];
  const chronological = [...records].reverse();
  const targetWeight = goal?.targetWeightKg;
  const weightToGo = latest && targetWeight ? Math.abs(latest.weightKg - targetWeight) : null;

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="text-xl font-bold text-ink">인바디 관리</div>
        <p className="mt-0.5 text-[13px] text-muted">결과지를 촬영해 올리면 자동으로 기록해드려요.</p>
      </div>

      <label
        className="cursor-pointer rounded-2xl border border-dashed bg-white p-7 text-center"
        style={{ borderColor: "var(--color-dashed)" }}
      >
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <div className="text-[13px] font-bold text-muted-dark">인바디 결과지 사진 올리기</div>
        <div className="mt-1 text-[11px] text-muted">
          {uploading ? "분석 중..." : "탭하여 업로드 (자동 수치 인식)"}
        </div>
        {notice && <div className="mt-2 text-xs font-semibold text-brand">{notice}</div>}
      </label>

      {latest && (
        <div className="rounded-2xl border border-card-border bg-white p-4">
          <div className="mb-2.5 text-xs font-bold text-muted">
            최근 기록 · {latest.date.slice(5).replace("-", "/")}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat value={latest.weightKg} label="체중(kg)" />
            <Stat value={latest.skeletalMuscleMassKg} label="골격근량(kg)" />
            <Stat value={latest.bodyFatPercent} label="체지방률(%)" />
          </div>
        </div>
      )}

      {chronological.length >= 2 && (
        <div>
          <div className="mb-2 text-[13px] font-bold text-muted-dark">체중 추이</div>
          <WeightTrendChart records={chronological} />
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

function Stat({ value, label }: { value: number | undefined; label: string }) {
  return (
    <div>
      <div className="text-[17px] font-bold text-ink">{value ?? "-"}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function WeightTrendChart({ records }: { records: InbodyRecord[] }) {
  const weights = records.map((r) => r.weightKg);
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
