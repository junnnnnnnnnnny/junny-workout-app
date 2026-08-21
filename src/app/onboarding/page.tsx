"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addInbodyRecord, saveGoal } from "@/lib/data";
import { todayStr } from "@/lib/date-utils";
import { InbodyPhotoUpload } from "@/components/inbody/InbodyPhotoUpload";
import type { GoalMode } from "@/types";

const PURPOSES = ["체중 감량", "근육 증가", "체력 향상", "건강 유지"] as const;
type Purpose = (typeof PURPOSES)[number];

const PURPOSE_MULTIPLIERS: Record<Purpose, { cal: number; prot: number }> = {
  "체중 감량": { cal: 26, prot: 2.0 },
  "근육 증가": { cal: 32, prot: 2.2 },
  "체력 향상": { cal: 30, prot: 1.8 },
  "건강 유지": { cal: 28, prot: 1.6 },
};

const GOAL_MODE_OPTIONS: { value: GoalMode; label: string; hint: string }[] = [
  { value: "calorie", label: "칼로리만", hint: "하루 목표 칼로리만 관리" },
  { value: "protein", label: "단백질만", hint: "하루 목표 단백질량만 관리" },
  { value: "both", label: "칼로리 + 단백질", hint: "둘 다 목표로 관리 (추천)" },
];

export default function OnboardingPage() {
  const { user, loading, markOnboardingCompleted } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [bodyMode, setBodyMode] = useState<"manual" | "photo">("manual");
  const [bodySource, setBodySource] = useState<"manual" | "ocr">("manual");
  const [weightKg, setWeightKg] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [goalMode, setGoalMode] = useState<GoalMode>("both");
  const [calorieTarget, setCalorieTarget] = useState("2200");
  const [proteinTarget, setProteinTarget] = useState("150");
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const needsCalorie = goalMode === "calorie" || goalMode === "both";
  const needsProtein = goalMode === "protein" || goalMode === "both";

  function skip() {
    setStep((s) => s + 1);
  }

  function proceedToGoal() {
    const w = Number(weightKg) || 74;
    const mult = purpose ? PURPOSE_MULTIPLIERS[purpose] : { cal: 29, prot: 1.8 };
    setCalorieTarget(String(Math.round(w * mult.cal)));
    setProteinTarget(String(Math.round(w * mult.prot)));
    setStep(3);
  }

  function handlePhotoAnalyzed(data: {
    weightKg: number | null;
    skeletalMuscleMassKg: number | null;
    bodyFatPercent: number | null;
  }) {
    if (data.weightKg) setWeightKg(String(data.weightKg));
    if (data.skeletalMuscleMassKg) setMuscleMass(String(data.skeletalMuscleMassKg));
    if (data.bodyFatPercent) setBodyFat(String(data.bodyFatPercent));
    setBodySource("ocr");
  }

  async function finishOnboarding() {
    if (!user) return;
    setFinishing(true);
    setFinishError(null);
    try {
      await saveGoal(user.uid, {
        mode: goalMode,
        calorieTarget: needsCalorie ? Number(calorieTarget) : undefined,
        proteinTarget: needsProtein ? Number(proteinTarget) : undefined,
      });
      if (weightKg || bodyFat) {
        await addInbodyRecord(user.uid, {
          date: todayStr(),
          weightKg: Number(weightKg) || 0,
          skeletalMuscleMassKg: muscleMass ? Number(muscleMass) : undefined,
          bodyFatPercent: bodyFat ? Number(bodyFat) : undefined,
          source: bodySource,
        });
      }
      markOnboardingCompleted();
      router.replace("/dashboard");
    } catch (err) {
      console.error("온보딩 저장 실패:", err);
      setFinishError(
        err instanceof Error ? err.message : "저장에 실패했어요. Firestore 보안 규칙을 확인해주세요."
      );
    } finally {
      setFinishing(false);
    }
  }

  if (loading || !user) return null;

  const summaryGoalMode = GOAL_MODE_OPTIONS.find((o) => o.value === goalMode)!;
  const summaryGoal = `${summaryGoalMode.label}${needsCalorie ? ` · ${calorieTarget}kcal` : ""}${needsProtein ? ` · ${proteinTarget}g` : ""}`;
  const summaryBody = weightKg || bodyFat ? `${weightKg || "-"}kg · 체지방 ${bodyFat || "-"}%` : "입력 안 함";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-1 flex-col bg-ivory px-6 pb-10 pt-7">
      {step >= 1 && step <= 3 && (
        <div className="mb-7 flex items-center justify-between">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((d) => (
              <div
                key={d}
                className="h-1 w-[22px] rounded-full"
                style={{ background: step >= d ? "var(--color-brand)" : "var(--color-input-border)" }}
              />
            ))}
          </div>
          <button onClick={skip} className="text-xs font-semibold text-muted underline">
            건너뛰기
          </button>
        </div>
      )}

      {step === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-[18px] text-center">
          <div className="text-[13px] font-semibold text-muted">Junny Workout</div>
          <h1 className="mx-auto max-w-[280px] text-[22px] font-bold leading-[1.5] text-ink">
            운동, 식단, 인바디를 한 곳에서 관리해요
          </h1>
          <p className="text-[13px] leading-[1.6] text-muted">
            몇 가지만 설정하면 목표에 맞는
            <br />
            운동과 식단을 추천해드려요.
            <br />
            각 항목은 나중에 건너뛰어도 괜찮아요.
          </p>
          <button
            onClick={() => setStep(1)}
            className="mt-3.5 rounded-full bg-brand px-8 py-3.5 text-[15px] font-bold text-white"
          >
            시작하기
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-muted">STEP 1 · 3</div>
            <div className="mt-1 text-xl font-bold text-ink">현재 체성분을 입력해주세요</div>
            <p className="mt-1.5 text-[13px] text-muted">
              인바디 결과가 있다면 사진으로 올리거나 직접 입력해주세요.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setBodyMode("photo")}
              className="flex-1 rounded-xl border py-2.5 text-center text-[13px] font-bold"
              style={{
                borderColor: bodyMode === "photo" ? "var(--color-brand)" : "var(--color-input-border)",
                background: bodyMode === "photo" ? "var(--color-brand)" : "#fff",
                color: bodyMode === "photo" ? "#fff" : "var(--color-ink)",
              }}
            >
              사진으로 입력
            </button>
            <button
              onClick={() => setBodyMode("manual")}
              className="flex-1 rounded-xl border py-2.5 text-center text-[13px] font-bold"
              style={{
                borderColor: bodyMode === "manual" ? "var(--color-brand)" : "var(--color-input-border)",
                background: bodyMode === "manual" ? "var(--color-brand)" : "#fff",
                color: bodyMode === "manual" ? "#fff" : "var(--color-ink)",
              }}
            >
              직접 입력
            </button>
          </div>

          {bodyMode === "photo" && <InbodyPhotoUpload onAnalyzed={handlePhotoAnalyzed} />}

          <LabeledInput label="체중 (kg)" value={weightKg} onChange={setWeightKg} placeholder="예: 74.5" />
          <LabeledInput label="골격근량 (kg)" value={muscleMass} onChange={setMuscleMass} placeholder="예: 33.2" />
          <LabeledInput label="체지방률 (%)" value={bodyFat} onChange={setBodyFat} placeholder="예: 18.2" />

          <button onClick={() => setStep(2)} className="rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white">
            다음
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-muted">STEP 2 · 3</div>
            <div className="mt-1 text-xl font-bold text-ink">운동의 목적이 무엇인가요?</div>
          </div>
          <div className="flex flex-col gap-2">
            {PURPOSES.map((p) => (
              <button
                key={p}
                onClick={() => setPurpose(p)}
                className="rounded-2xl border px-4 py-3.5 text-left text-sm font-bold"
                style={{
                  borderColor: purpose === p ? "var(--color-brand)" : "var(--color-input-border)",
                  background: purpose === p ? "var(--color-brand)" : "#fff",
                  color: purpose === p ? "#fff" : "var(--color-ink)",
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button onClick={proceedToGoal} className="rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white">
            다음
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-muted">STEP 3 · 3</div>
            <div className="mt-1 text-xl font-bold text-ink">목표를 확인해주세요</div>
            <div className="mt-2 rounded-xl bg-brand-soft px-3 py-2.5 text-xs font-semibold leading-[1.5] text-brand">
              체성분과 운동 목적을 기준으로 자동 계산했어요. 필요하면 직접 수정하세요.
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {GOAL_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGoalMode(opt.value)}
                className="rounded-2xl border px-4 py-3.5 text-left"
                style={{
                  borderColor: goalMode === opt.value ? "var(--color-brand)" : "var(--color-input-border)",
                  background: goalMode === opt.value ? "var(--color-brand)" : "#fff",
                }}
              >
                <div className="text-sm font-bold" style={{ color: goalMode === opt.value ? "#fff" : "var(--color-ink)" }}>
                  {opt.label}
                </div>
                <div
                  className="mt-0.5 text-xs"
                  style={{ color: goalMode === opt.value ? "rgba(255,255,255,.75)" : "var(--color-muted)" }}
                >
                  {opt.hint}
                </div>
              </button>
            ))}
          </div>
          {needsCalorie && (
            <LabeledInput label="목표 칼로리 (kcal/일)" value={calorieTarget} onChange={setCalorieTarget} placeholder="예: 2200" />
          )}
          {needsProtein && (
            <LabeledInput label="목표 단백질 (g/일)" value={proteinTarget} onChange={setProteinTarget} placeholder="예: 150" />
          )}
          <button onClick={() => setStep(4)} className="rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white">
            다음
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-1 flex-col justify-center gap-[22px]">
          <div className="text-center">
            <div className="text-[34px]">✓</div>
            <div className="mt-2.5 text-xl font-bold text-ink">설정이 끝났어요</div>
            <p className="mt-1.5 text-[13px] text-muted">관리 메뉴에서 언제든 다시 바꿀 수 있어요.</p>
          </div>
          <div className="flex flex-col gap-2.5 rounded-2xl border border-card-border bg-white p-4">
            <SummaryRow label="체성분" value={summaryBody} />
            <SummaryRow label="운동 목적" value={purpose || "선택 안 함"} />
            <SummaryRow label="목표" value={summaryGoal} />
          </div>
          {finishError && <p className="text-center text-xs text-danger">{finishError}</p>}
          <button
            onClick={finishOnboarding}
            disabled={finishing}
            className="rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white disabled:opacity-50"
          >
            {finishing ? "저장 중..." : "앱 시작하기"}
          </button>
        </div>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-muted-dark">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="decimal"
        className="w-full rounded-[10px] border border-input-border bg-white px-3.5 py-3 text-sm text-ink focus:border-brand focus:outline-none"
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}
