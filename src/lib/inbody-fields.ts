import type { InbodyRecord } from "@/types";

export type InbodyFieldKey = Exclude<keyof InbodyRecord, "id" | "date" | "imageUrl" | "source" | "createdAt">;

/** 키는 인바디 결과지 OCR로는 거의 인식이 안 되어 항상 수동 입력, 나머지는 사진에서 자동 인식을 시도한다. */
export const INBODY_FIELDS: { key: InbodyFieldKey; label: string; unit?: string; fromOcr: boolean }[] = [
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
