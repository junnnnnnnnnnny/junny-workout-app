import type { Exercise } from "@/types";

// MVP: 정적 운동 카탈로그. 추후 관리자 메뉴에서 헬스장 보유 기구 기반 추천/즐겨찾기로 확장 예정.
export const EXERCISES: Exercise[] = [
  { id: "bench-press", name: "Barbell Bench Press", nameKo: "벤치프레스", muscleGroups: ["chest", "triceps"], equipment: "바벨" },
  { id: "incline-db-press", name: "Incline Dumbbell Press", nameKo: "인클라인 덤벨 프레스", muscleGroups: ["chest", "shoulders"], equipment: "덤벨" },
  { id: "chest-fly", name: "Cable Chest Fly", nameKo: "케이블 체스트 플라이", muscleGroups: ["chest"], equipment: "케이블" },
  { id: "push-up", name: "Push Up", nameKo: "푸시업", muscleGroups: ["chest", "triceps"], equipment: "맨몸" },
  { id: "deadlift", name: "Deadlift", nameKo: "데드리프트", muscleGroups: ["back", "glutes", "legs"], equipment: "바벨" },
  { id: "barbell-row", name: "Barbell Row", nameKo: "바벨 로우", muscleGroups: ["back", "biceps"], equipment: "바벨" },
  { id: "lat-pulldown", name: "Lat Pulldown", nameKo: "랫풀다운", muscleGroups: ["back", "biceps"], equipment: "머신" },
  { id: "pull-up", name: "Pull Up", nameKo: "풀업", muscleGroups: ["back", "biceps"], equipment: "맨몸" },
  { id: "seated-row", name: "Seated Cable Row", nameKo: "시티드 로우", muscleGroups: ["back"], equipment: "케이블" },
  { id: "overhead-press", name: "Overhead Press", nameKo: "오버헤드 프레스", muscleGroups: ["shoulders", "triceps"], equipment: "바벨" },
  { id: "lateral-raise", name: "Lateral Raise", nameKo: "사이드 레터럴 레이즈", muscleGroups: ["shoulders"], equipment: "덤벨" },
  { id: "face-pull", name: "Face Pull", nameKo: "페이스 풀", muscleGroups: ["shoulders", "back"], equipment: "케이블" },
  { id: "barbell-curl", name: "Barbell Curl", nameKo: "바벨 컬", muscleGroups: ["biceps"], equipment: "바벨" },
  { id: "dumbbell-curl", name: "Dumbbell Curl", nameKo: "덤벨 컬", muscleGroups: ["biceps"], equipment: "덤벨" },
  { id: "tricep-pushdown", name: "Tricep Pushdown", nameKo: "트라이셉스 푸시다운", muscleGroups: ["triceps"], equipment: "케이블" },
  { id: "skull-crusher", name: "Skull Crusher", nameKo: "스컬크러셔", muscleGroups: ["triceps"], equipment: "바벨" },
  { id: "squat", name: "Barbell Squat", nameKo: "스쿼트", muscleGroups: ["legs", "glutes"], equipment: "바벨" },
  { id: "leg-press", name: "Leg Press", nameKo: "레그프레스", muscleGroups: ["legs", "glutes"], equipment: "머신" },
  { id: "leg-extension", name: "Leg Extension", nameKo: "레그 익스텐션", muscleGroups: ["legs"], equipment: "머신" },
  { id: "leg-curl", name: "Leg Curl", nameKo: "레그 컬", muscleGroups: ["legs"], equipment: "머신" },
  { id: "hip-thrust", name: "Hip Thrust", nameKo: "힙 쓰러스트", muscleGroups: ["glutes"], equipment: "바벨" },
  { id: "calf-raise", name: "Standing Calf Raise", nameKo: "카프 레이즈", muscleGroups: ["legs"], equipment: "머신" },
  { id: "plank", name: "Plank", nameKo: "플랭크", muscleGroups: ["abs"], equipment: "맨몸" },
  { id: "hanging-leg-raise", name: "Hanging Leg Raise", nameKo: "행잉 레그레이즈", muscleGroups: ["abs"], equipment: "맨몸" },
  { id: "cable-crunch", name: "Cable Crunch", nameKo: "케이블 크런치", muscleGroups: ["abs"], equipment: "케이블" },
];

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
