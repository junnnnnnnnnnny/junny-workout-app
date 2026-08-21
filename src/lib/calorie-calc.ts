import type { ActivityLevel, GoalPurpose, Sex } from "@/types";

// ---------- 활동량 (TDEE 계수) ----------

export const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; hint: string; multiplier: number }[] = [
  { key: "sedentary", label: "거의 안 움직여요", hint: "주로 앉아서 생활, 운동은 거의 안 해요", multiplier: 1.2 },
  { key: "light", label: "가볍게 움직여요", hint: "주 1~3회 가벼운 운동", multiplier: 1.375 },
  { key: "moderate", label: "보통이에요", hint: "주 3~5회 운동", multiplier: 1.55 },
  { key: "active", label: "활발해요", hint: "주 6~7회 운동", multiplier: 1.725 },
  { key: "very_active", label: "매우 활발해요", hint: "매일 2회 운동 또는 육체노동", multiplier: 1.9 },
];

export function activityMultiplier(level: ActivityLevel): number {
  return ACTIVITY_LEVELS.find((a) => a.key === level)!.multiplier;
}

// ---------- 목표 (칼로리 조정 폭 + 운동 가이드) ----------

export const GOAL_PURPOSES: { key: GoalPurpose; label: string; hint: string }[] = [
  { key: "lose_weight", label: "살 빼고 싶어요", hint: "체중계 숫자를 낮추는게 목표!" },
  { key: "build_muscle", label: "근육 키우고 싶어요", hint: "먹는 양이 조금 늘고 체중도 늘 수 있어요" },
  { key: "recomp", label: "체지방 줄이고 탄탄하게", hint: "체중 변화는 작지만 몸 라인이 정리돼요" },
  { key: "maintain", label: "지금 몸 유지", hint: "현재 상태를 유지해요" },
];

// TDEE 대비 조정 비율 (각 구간의 중간값)
const GOAL_CALORIE_ADJUSTMENT: Record<GoalPurpose, number> = {
  lose_weight: -0.175, // -15~20%
  build_muscle: 0.125, // +10~15%
  recomp: -0.075, // -5~10% 결손
  maintain: 0,
};

export const EXERCISE_GUIDANCE: Record<GoalPurpose, { frequency: string; split: string }> = {
  lose_weight: { frequency: "주 4~5회", split: "근력:유산소 약 5:5 (유산소 비중을 조금 더)" },
  build_muscle: { frequency: "주 3~5회", split: "근력:유산소 약 8:2 (근력 위주)" },
  recomp: { frequency: "주 4~5회", split: "근력:유산소 약 7:3" },
  maintain: { frequency: "주 3~4회", split: "근력:유산소 자유롭게 5:5" },
};

/** 다이어트 시 성별에 따른 최소 칼로리 하한선. 성별 모름이면 더 안전한(높은) 쪽을 기본값으로 둔다. */
export function calorieFloor(sex?: Sex): number {
  return sex === "female" ? 1200 : 1500;
}

// ---------- BMR ----------

export type BmrMethod = "measured" | "katch-mcardle" | "mifflin";

export interface BmrInputs {
  weightKg?: number;
  heightCm?: number;
  age?: number;
  sex?: Sex;
  bodyFatMassKg?: number;
  bodyFatPercent?: number;
  bmrKcal?: number; // 이미 측정/기록된 기초대사량이 있으면 그 값을 그대로 사용
}

export interface BmrResult {
  bmr: number;
  method: BmrMethod;
}

function estimateFatMassKg(inputs: BmrInputs): number | undefined {
  if (inputs.bodyFatMassKg !== undefined) return inputs.bodyFatMassKg;
  if (inputs.weightKg !== undefined && inputs.bodyFatPercent !== undefined) {
    return inputs.weightKg * (inputs.bodyFatPercent / 100);
  }
  return undefined;
}

/**
 * 우선순위: 측정된 기초대사량 → 제지방량 기반(Katch-McArdle) → 체중/키/나이/성별 기반(Mifflin-St Jeor)
 * 계산에 필요한 값이 부족하면 null.
 */
export function calculateBmr(inputs: BmrInputs): BmrResult | null {
  if (inputs.bmrKcal) return { bmr: inputs.bmrKcal, method: "measured" };

  const fatMassKg = estimateFatMassKg(inputs);
  if (inputs.weightKg !== undefined && fatMassKg !== undefined) {
    const leanMassKg = inputs.weightKg - fatMassKg;
    return { bmr: 370 + 21.6 * leanMassKg, method: "katch-mcardle" };
  }

  if (
    inputs.weightKg !== undefined &&
    inputs.heightCm !== undefined &&
    inputs.age !== undefined &&
    inputs.sex !== undefined
  ) {
    const base = 10 * inputs.weightKg + 6.25 * inputs.heightCm - 5 * inputs.age;
    return { bmr: inputs.sex === "male" ? base + 5 : base - 5, method: "mifflin" };
  }

  return null;
}

export function bmrMethodLabel(method: BmrMethod): string {
  switch (method) {
    case "measured":
      return "입력하신 기초대사량 값을 그대로 사용했어요.";
    case "katch-mcardle":
      return "체지방량(제지방량) 기반으로 계산했어요 (Katch-McArdle 공식).";
    case "mifflin":
      return "체중·키·나이·성별 기반으로 계산했어요 (Mifflin-St Jeor 공식).";
  }
}

// ---------- TDEE & 목표 칼로리 ----------

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * activityMultiplier(activityLevel);
}

export function calculateCalorieTarget(tdee: number, purpose: GoalPurpose, sex?: Sex): number {
  const adjusted = tdee * (1 + GOAL_CALORIE_ADJUSTMENT[purpose]);
  return Math.max(Math.round(adjusted), calorieFloor(sex));
}

// ---------- 매크로(탄단지) 분배 ----------

export interface MacroInputs {
  calorieTarget: number;
  weightKg?: number;
  bodyFatMassKg?: number;
  bodyFatPercent?: number;
  purpose: GoalPurpose;
}

export interface MacroResult {
  proteinG: number;
  fatG: number;
  carbG: number;
}

/** 단백질 → 지방 → 나머지 탄수화물 순으로 분배한다. */
export function calculateMacros(inputs: MacroInputs): MacroResult {
  const fatMassKg = estimateFatMassKg(inputs);
  const leanMassKg =
    inputs.weightKg !== undefined && fatMassKg !== undefined ? inputs.weightKg - fatMassKg : undefined;

  let proteinG: number;
  if (leanMassKg !== undefined) {
    proteinG = Math.round(leanMassKg * 2.2); // 제지방량 기준 2.0~2.5g/kg 중간값
  } else if (inputs.weightKg !== undefined) {
    const perKg = inputs.purpose === "maintain" ? 1.4 : 1.9; // 총체중 기준 1.2~1.6 / 1.6~2.2g/kg
    proteinG = Math.round(inputs.weightKg * perKg);
  } else {
    proteinG = Math.round((inputs.calorieTarget * 0.3) / 4); // 체중 정보가 전혀 없을 때의 대략치
  }

  let fatG = Math.round((inputs.calorieTarget * 0.25) / 9); // 총 칼로리의 20~30% 중간값
  if (inputs.weightKg !== undefined) {
    fatG = Math.max(fatG, Math.round(inputs.weightKg * 0.5)); // 호르몬 유지를 위한 최소 지방량
  }

  const carbKcal = Math.max(0, inputs.calorieTarget - proteinG * 4 - fatG * 9);
  const carbG = Math.round(carbKcal / 4);

  return { proteinG, fatG, carbG };
}
