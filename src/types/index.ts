// Firestore layout (per user, under users/{uid}):
//   goals/current            -> Goal
//   workoutLogs/{id}         -> WorkoutLog
//   dietLogs/{id}            -> DietLog
//   fridgeItems/{id}         -> FridgeItem      (식단추천 - 준비중)
//   inbodyRecords/{id}       -> InbodyRecord    (인바디 관리 - 준비중)
//   favoriteExercises/{id}   -> FavoriteExercise (관리자 메뉴 - 준비중)

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
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSetEntry[];
  source: WorkoutSource;
  notes?: string;
  createdAt: string; // ISO
}

// Cardio / Apple Fitness style entries (파싱된 결과), 같은 workoutLogs 컬렉션에 별도 문서로 저장 가능
export interface CardioLog {
  id: string;
  date: string;
  activityType: string;
  durationMin: number;
  caloriesBurned?: number;
  distanceKm?: number;
  avgHeartRate?: number;
  source: WorkoutSource;
  createdAt: string;
}

export interface MealItem {
  name: string;
  quantity: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DietLog {
  id: string;
  date: string; // yyyy-MM-dd
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
  expiryDate?: string;
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
