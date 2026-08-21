// Firestore layout (per user, under users/{uid}):
//   (root doc)               -> profile fields: displayName, email, photoURL, onboardingCompleted, birthYear, heightCm, sex
//   goals/current            -> Goal
//   settings/gym             -> GymSettings (보유 기구, 즐겨찾기 운동)
//   workoutLogs/{id}         -> WorkoutLog (근력 + 유산소/애플피트니스 통합)
//   dietLogs/{id}            -> DietLog
//   fridgeItems/{id}         -> FridgeItem
//   inbodyRecords/{id}       -> InbodyRecord
// foods/{id}                 -> FoodDbItem (top-level, 전체 사용자 공유 음식 DB; src/data/foods.ts 참고)

export type GoalMode = "calorie" | "protein" | "both";
export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalPurpose = "lose_weight" | "build_muscle" | "recomp" | "maintain";

export interface UserProfile {
  birthYear?: number; // 만나이 계산용 (한국나이 혼동 방지를 위해 나이 대신 출생년도로 받음)
  heightCm?: number;
  sex?: Sex;
}

export interface Goal {
  mode: GoalMode;
  calorieTarget?: number; // kcal/day
  proteinTarget?: number; // g/day
  carbTarget?: number; // g/day
  fatTarget?: number; // g/day
  targetWeightKg?: number;
  purpose?: GoalPurpose;
  activityLevel?: ActivityLevel;
  updatedAt: string; // ISO
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "glutes"
  | "abs"
  | "cardio"
  | "full-body";

export interface Exercise {
  id: string;
  name: string;
  nameKo: string;
  muscleGroups: MuscleGroup[];
  equipment: string;
}

export interface WorkoutSetEntry {
  weightKg: number;
  reps: number;
}

export type WorkoutSource = "manual" | "apple-fitness";

export interface WorkoutLog {
  id: string;
  date: string; // yyyy-MM-dd
  kind: "strength" | "cardio";
  // strength
  exerciseId?: string;
  exerciseName?: string;
  sets?: WorkoutSetEntry[];
  // cardio (애플 피트니스 파싱 결과 등)
  activityType?: string;
  durationMin?: number;
  caloriesBurned?: number;
  distanceKm?: number;
  avgHeartRate?: number;
  source: WorkoutSource;
  notes?: string;
  createdAt: string; // ISO
}

export interface MealItem {
  name: string;
  quantity: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface DietLog {
  id: string;
  date: string; // yyyy-MM-dd
  mealType: MealType;
  rawInput: string;
  meals: MealItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  createdAt: string;
}

export interface FridgeItem {
  id: string;
  name: string;
  quantity: string;
  expiryDate?: string; // yyyy-MM-dd
  addedAt: string;
}

export interface InbodyRecord {
  id: string;
  date: string;
  weightKg?: number;
  skeletalMuscleMassKg?: number;
  bodyFatMassKg?: number;
  bodyFatPercent?: number;
  bmi?: number;
  bmrKcal?: number; // 기초대사량
  waistHipRatio?: number; // 복부지방률 (WHR)
  visceralFatLevel?: number; // 내장지방레벨
  imageUrl?: string;
  source: "manual" | "ocr";
  createdAt: string;
}

export interface GymSettings {
  equipment: string[];
  favoriteExerciseIds: string[];
}
