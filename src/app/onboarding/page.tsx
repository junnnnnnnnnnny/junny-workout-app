"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addInbodyRecord, saveGoal, saveUserProfile } from "@/lib/data";
import { todayStr } from "@/lib/date-utils";
import { InbodyPhotoUpload, type InbodyAnalysis } from "@/components/inbody/InbodyPhotoUpload";
import { INBODY_FIELDS, type InbodyFieldKey } from "@/lib/inbody-fields";
import {
  ACTIVITY_LEVELS,
  bmrMethodLabel,
  calculateBmr,
  calculateCalorieTarget,
  calculateMacros,
  calculateTdee,
  EXERCISE_GUIDANCE,
  GOAL_PURPOSES,
  type BmrMethod,
} from "@/lib/calorie-calc";
import type { ActivityLevel, GoalPurpose, InbodyRecord, Sex } from "@/types";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const { user, loading, markOnboardingCompleted } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);

  // STEP 1: 기본 정보
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);

  // STEP 2: 체성분
  const [bodyMode, setBodyMode] = useState<"manual" | "photo">("manual");
  const [bodySource, setBodySource] = useState<"manual" | "ocr">("manual");
  const [bodyValues, setBodyValues] = useState<Partial<Record<InbodyFieldKey, string>>>({});

  // STEP 3: 목적
  const [purpose, setPurpose] = useState<GoalPurpose | null>(null);

  // STEP 4: 활동량
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);

  // STEP 5: 목표 확인 (계산 결과, 수정 가능)
  const [bmrMethod, setBmrMethod] = useState<BmrMethod | null>(null);
  const [calorieTarget, setCalorieTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [carbTarget, setCarbTarget] = useState("");
  const [fatTarget, setFatTarget] = useState("");

  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  function skip() {
    setStep((s) => s + 1);
  }

  function setBodyField(key: InbodyFieldKey, value: string) {
    setBodyValues((prev) => ({ ...prev, [key]: value }));
  }

  function handlePhotoAnalyzed(data: InbodyAnalysis) {
    const ocrValues = data as unknown as Record<string, number | null>;
    setBodyValues((prev) => {
      const next = { ...prev };
      for (const field of INBODY_FIELDS) {
        if (!field.fromOcr) continue;
        const value = ocrValues[field.key];
        if (value !== null && value !== undefined) next[field.key] = String(value);
      }
      return next;
    });
    setBodySource("ocr");
  }

  function computeGoalAndProceed() {
    const weightKg = bodyValues.weightKg ? Number(bodyValues.weightKg) : undefined;
    const bodyFatMassKg = bodyValues.bodyFatMassKg ? Number(bodyValues.bodyFatMassKg) : undefined;
    const bodyFatPercent = bodyValues.bodyFatPercent ? Number(bodyValues.bodyFatPercent) : undefined;
    const bmrKcalInput = bodyValues.bmrKcal ? Number(bodyValues.bmrKcal) : undefined;

    const bmrResult = calculateBmr({
      weightKg,
      heightCm: heightCm ? Number(heightCm) : undefined,
      age: age ? Number(age) : undefined,
      sex: sex ?? undefined,
      bodyFatMassKg,
      bodyFatPercent,
      bmrKcal: bmrKcalInput,
    });

    const goalPurpose = purpose ?? "maintain";
    const activity = activityLevel ?? "moderate";

    if (bmrResult) {
      const tdee = calculateTdee(bmrResult.bmr, activity);
      const calories = calculateCalorieTarget(tdee, goalPurpose, sex ?? undefined);
      const macros = calculateMacros({ calorieTarget: calories, weightKg, bodyFatMassKg, bodyFatPercent, purpose: goalPurpose });
      setBmrMethod(bmrResult.method);
      setCalorieTarget(String(calories));
      setProteinTarget(String(macros.proteinG));
      setCarbTarget(String(macros.carbG));
      setFatTarget(String(macros.fatG));
    } else {
      // 계산에 필요한 정보(체중 등)가 전혀 없으면 대략적인 기본값
      setBmrMethod(null);
      setCalorieTarget("2200");
      setProteinTarget("150");
      setCarbTarget("220");
      setFatTarget("60");
    }
    setStep(5);
  }

  async function finishOnboarding() {
    if (!user) return;
    setFinishing(true);
    setFinishError(null);
    try {
      await saveUserProfile(user.uid, {
        age: age ? Number(age) : undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        sex: sex ?? undefined,
      });

      await saveGoal(user.uid, {
        mode: "both",
        calorieTarget: Number(calorieTarget) || undefined,
        proteinTarget: Number(proteinTarget) || undefined,
        carbTarget: Number(carbTarget) || undefined,
        fatTarget: Number(fatTarget) || undefined,
        purpose: purpose ?? undefined,
        activityLevel: activityLevel ?? undefined,
      });

      const hasBodyValue = INBODY_FIELDS.some((f) => bodyValues[f.key]?.trim());
      if (hasBodyValue) {
        const record: Omit<InbodyRecord, "id" | "createdAt"> = { date: todayStr(), source: bodySource };
        for (const field of INBODY_FIELDS) {
          const raw = bodyValues[field.key];
          if (raw && raw.trim()) {
            (record as Record<InbodyFieldKey, number>)[field.key] = Number(raw);
          }
        }
        await addInbodyRecord(user.uid, record);
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

  const summaryBody =
    bodyValues.weightKg || bodyValues.bodyFatPercent
      ? `${bodyValues.weightKg || "-"}kg · 체지방 ${bodyValues.bodyFatPercent || "-"}%`
      : "입력 안 함";
  const purposeLabel = GOAL_PURPOSES.find((p) => p.key === purpose)?.label ?? "선택 안 함";
  const activityLabel = ACTIVITY_LEVELS.find((a) => a.key === activityLevel)?.label ?? "선택 안 함";
  const summaryGoal = `${calorieTarget || "-"}kcal · 단백질 ${proteinTarget || "-"}g · 탄수화물 ${carbTarget || "-"}g · 지방 ${fatTarget || "-"}g`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-1 flex-col bg-ivory px-6 pb-10 pt-7">
      {step >= 1 && step <= TOTAL_STEPS && (
        <div className="mb-7 flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((d) => (
              <div
                key={d}
                className="h-1 w-[16px] rounded-full"
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
            <div className="text-xs font-semibold text-muted">STEP 1 · {TOTAL_STEPS}</div>
            <div className="mt-1 text-xl font-bold text-ink">기본 정보를 알려주세요</div>
            <p className="mt-1.5 text-[13px] text-muted">칼로리 계산에 필요한 최소한의 정보예요.</p>
          </div>
          <LabeledInput label="나이" value={age} onChange={setAge} placeholder="예: 28" />
          <LabeledInput label="키 (cm)" value={heightCm} onChange={setHeightCm} placeholder="예: 172" />
          <div>
            <div className="mb-1.5 text-xs font-semibold text-muted-dark">성별</div>
            <div className="flex gap-2">
              {(["male", "female"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className="flex-1 rounded-xl border py-2.5 text-center text-[13px] font-bold"
                  style={{
                    borderColor: sex === s ? "var(--color-brand)" : "var(--color-input-border)",
                    background: sex === s ? "var(--color-brand)" : "#fff",
                    color: sex === s ? "#fff" : "var(--color-ink)",
                  }}
                >
                  {s === "male" ? "남성" : "여성"}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
            className="rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white"
          >
            다음
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-muted">STEP 2 · {TOTAL_STEPS}</div>
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

          <div className="grid grid-cols-2 gap-3">
            {INBODY_FIELDS.map((field) => (
              <LabeledInput
                key={field.key}
                label={`${field.label}${field.unit ? ` (${field.unit})` : ""}`}
                value={bodyValues[field.key] ?? ""}
                onChange={(v) => setBodyField(field.key, v)}
                placeholder="-"
              />
            ))}
          </div>

          <button
            onClick={() => setStep(3)}
            className="rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white"
          >
            다음
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-muted">STEP 3 · {TOTAL_STEPS}</div>
            <div className="mt-1 text-xl font-bold text-ink">어떤 목표를 원하세요?</div>
          </div>
          <div className="flex flex-col gap-2">
            {GOAL_PURPOSES.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPurpose(opt.key)}
                className="rounded-2xl border px-4 py-3.5 text-left"
                style={{
                  borderColor: purpose === opt.key ? "var(--color-brand)" : "var(--color-input-border)",
                  background: purpose === opt.key ? "var(--color-brand)" : "#fff",
                }}
              >
                <div className="text-sm font-bold" style={{ color: purpose === opt.key ? "#fff" : "var(--color-ink)" }}>
                  {opt.label}
                </div>
                <div
                  className="mt-0.5 text-xs"
                  style={{ color: purpose === opt.key ? "rgba(255,255,255,.75)" : "var(--color-muted)" }}
                >
                  {opt.hint}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(4)}
            className="rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white"
          >
            다음
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-muted">STEP 4 · {TOTAL_STEPS}</div>
            <div className="mt-1 text-xl font-bold text-ink">평소 활동량은 어느 정도인가요?</div>
            <p className="mt-1.5 text-[13px] text-muted">하루 소비 칼로리를 계산하는 데 필요해요.</p>
          </div>
          <div className="flex flex-col gap-2">
            {ACTIVITY_LEVELS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setActivityLevel(opt.key)}
                className="rounded-2xl border px-4 py-3.5 text-left"
                style={{
                  borderColor: activityLevel === opt.key ? "var(--color-brand)" : "var(--color-input-border)",
                  background: activityLevel === opt.key ? "var(--color-brand)" : "#fff",
                }}
              >
                <div
                  className="text-sm font-bold"
                  style={{ color: activityLevel === opt.key ? "#fff" : "var(--color-ink)" }}
                >
                  {opt.label}
                </div>
                <div
                  className="mt-0.5 text-xs"
                  style={{ color: activityLevel === opt.key ? "rgba(255,255,255,.75)" : "var(--color-muted)" }}
                >
                  {opt.hint}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={computeGoalAndProceed}
            className="rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white"
          >
            다음
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-muted">STEP 5 · {TOTAL_STEPS}</div>
            <div className="mt-1 text-xl font-bold text-ink">목표를 확인해주세요</div>
            <div className="mt-2 rounded-xl bg-brand-soft px-3 py-2.5 text-xs font-semibold leading-[1.5] text-brand">
              {bmrMethod
                ? bmrMethodLabel(bmrMethod)
                : "입력된 정보가 부족해 대략적인 기본값으로 채웠어요. 필요하면 직접 수정하세요."}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="목표 칼로리 (kcal)" value={calorieTarget} onChange={setCalorieTarget} placeholder="예: 2200" />
            <LabeledInput label="단백질 (g)" value={proteinTarget} onChange={setProteinTarget} placeholder="예: 150" />
            <LabeledInput label="탄수화물 (g)" value={carbTarget} onChange={setCarbTarget} placeholder="예: 220" />
            <LabeledInput label="지방 (g)" value={fatTarget} onChange={setFatTarget} placeholder="예: 60" />
          </div>
          {purpose && (
            <div className="rounded-xl border border-card-border bg-white p-3.5 text-xs text-muted-dark">
              <strong className="text-ink">추천 운동:</strong> {EXERCISE_GUIDANCE[purpose].frequency} ·{" "}
              {EXERCISE_GUIDANCE[purpose].split}
            </div>
          )}
          <button
            onClick={() => setStep(6)}
            className="rounded-xl bg-brand py-3.5 text-center text-[15px] font-bold text-white"
          >
            다음
          </button>
        </div>
      )}

      {step === 6 && (
        <div className="flex flex-1 flex-col justify-center gap-[22px]">
          <div className="text-center">
            <div className="text-[34px]">✓</div>
            <div className="mt-2.5 text-xl font-bold text-ink">설정이 끝났어요</div>
            <p className="mt-1.5 text-[13px] text-muted">관리 메뉴에서 언제든 다시 바꿀 수 있어요.</p>
          </div>
          <div className="flex flex-col gap-2.5 rounded-2xl border border-card-border bg-white p-4">
            <SummaryRow label="체성분" value={summaryBody} />
            <SummaryRow label="목표" value={purposeLabel} />
            <SummaryRow label="활동량" value={activityLabel} />
            <SummaryRow label="영양 목표" value={summaryGoal} />
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
