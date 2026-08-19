// Firestore layout (per user, under users/{uid}):
//   goals/current            -> Goal
//   settings/gym             -> GymSettings (보유 기구, 즐겨찾기 운동)
//   workoutLogs/{id}         -> WorkoutLog (근력 + 유산소/애플피트니스 통합)
//   dietLogs/{id}            -> DietLog
//   fridgeItems/{id}         -> FridgeItem
//   inbodyRecords/{id}       -> InbodyRecord

export type GoalMode = "calorie" | "protein" | "both";

export interface Goal {
  mode: GoalMode;
  calorieTarget?: number; // kcal/day
  proteinTarget?: number; // g/day
  targetWeightKg?: number;
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
  weightKg: number;
  skeletalMuscleMassKg?: number;
  bodyFatPercent?: number;
  bodyFatMassKg?: number;
  imageUrl?: string;
  source: "manual" | "ocr";
  createdAt: string;
}

export interface GymSettings {
  equipment: string[];
  favoriteExerciseIds: string[];
}
