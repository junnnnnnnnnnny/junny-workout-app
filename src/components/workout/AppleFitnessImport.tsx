"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { addCardioWorkoutLogs } from "@/lib/data";

export function AppleFitnessImport({ date, onImported }: { date: string; onImported: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function analyze() {
    if (!user || !text.trim()) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/workouts/parse-apple-fitness", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "분석에 실패했어요.");
      const activities: { activityType: string; durationMin: number; caloriesBurned: number | null }[] =
        data.activities;
      if (activities.length === 0) {
        setResult("인식된 운동이 없어요.");
        return;
      }
      await addCardioWorkoutLogs(
        user.uid,
        date,
        activities.map((a) => ({
          activityType: a.activityType,
          durationMin: a.durationMin,
          caloriesBurned: a.caloriesBurned ?? undefined,
        }))
      );
      const summary = activities.map((a) => `${a.activityType} ${a.durationMin}분`).join(", ");
      setResult(`${activities.length}건의 운동을 자동으로 기록했어요 (${summary}).`);
      setText("");
      onImported();
    } catch (err) {
      setResult(err instanceof Error ? err.message : "분석에 실패했어요.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-card-border bg-white p-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <span className="text-[13px] font-bold text-ink">애플 피트니스 결과 붙여넣기</span>
        <span className="text-xs font-bold text-brand">{open ? "닫기" : "펼치기"}</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="애플 피트니스 앱에서 복사한 운동 결과를 붙여넣으세요"
            className="w-full resize-y rounded-[10px] border border-input-border bg-ivory px-3 py-2.5 text-[13px] text-ink focus:border-brand focus:outline-none"
          />
          <button
            onClick={analyze}
            disabled={analyzing || !text.trim()}
            className="rounded-[10px] bg-brand py-2.5 text-center text-[13px] font-bold text-white disabled:opacity-50"
          >
            {analyzing ? "분석 중..." : "분석해서 자동 기록하기"}
          </button>
          {result && <div className="text-xs font-semibold text-brand">{result}</div>}
        </div>
      )}
    </div>
  );
}
