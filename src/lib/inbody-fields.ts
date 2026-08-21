import type { InbodyRecord } from "@/types";

export type InbodyFieldKey = Exclude<keyof InbodyRecord, "id" | "date" | "imageUrl" | "source" | "createdAt">;

// 키는 자주 바뀌지 않는 값이라 온보딩의 "기본 정보" 단계에서 프로필로 한 번만 받는다 (UserProfile.heightCm).
export const INBODY_FIELDS: { key: InbodyFieldKey; label: string; unit?: string; fromOcr: boolean }[] = [
  { key: "weightKg", label: "체중", unit: "kg", fromOcr: true },
  { key: "skeletalMuscleMassKg", label: "골격근량", unit: "kg", fromOcr: true },
  { key: "bodyFatMassKg", label: "체지방량", unit: "kg", fromOcr: true },
  { key: "bodyFatPercent", label: "체지방률", unit: "%", fromOcr: true },
  { key: "bmi", label: "BMI", fromOcr: true },
  { key: "bmrKcal", label: "기초대사량", unit: "kcal", fromOcr: true },
  { key: "waistHipRatio", label: "복부지방률(WHR)", fromOcr: true },
  { key: "visceralFatLevel", label: "내장지방레벨", fromOcr: true },
];
