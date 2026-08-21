import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type {
  DietLog,
  FridgeItem,
  Goal,
  GymSettings,
  InbodyRecord,
  MealItem,
  MealType,
  UserProfile,
  WorkoutLog,
  WorkoutSetEntry,
} from "@/types";

// ---------- Profile (출생년도/키/성별) ----------

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return {};
  const data = snap.data();
  return { birthYear: data.birthYear, heightCm: data.heightCm, sex: data.sex };
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  await setDoc(doc(db, "users", uid), profile, { merge: true });
}

// ---------- Goals ----------

export async function getGoal(uid: string): Promise<Goal | null> {
  const snap = await getDoc(doc(db, "users", uid, "goals", "current"));
  if (!snap.exists()) return null;
  return snap.data() as Goal;
}

export async function saveGoal(uid: string, goal: Omit<Goal, "updatedAt">): Promise<void> {
  await setDoc(doc(db, "users", uid, "goals", "current"), {
    ...goal,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(doc(db, "users", uid), { onboardingCompleted: true }, { merge: true });
}

export async function restartOnboarding(uid: string): Promise<void> {
  await setDoc(doc(db, "users", uid), { onboardingCompleted: false }, { merge: true });
}

// ---------- Gym settings (기구 / 즐겨찾기 운동) ----------

const DEFAULT_GYM_SETTINGS: GymSettings = { equipment: [], favoriteExerciseIds: [] };

export async function getGymSettings(uid: string): Promise<GymSettings> {
  const snap = await getDoc(doc(db, "users", uid, "settings", "gym"));
  if (!snap.exists()) return DEFAULT_GYM_SETTINGS;
  const data = snap.data();
  return {
    equipment: data.equipment ?? [],
    favoriteExerciseIds: data.favoriteExerciseIds ?? [],
  };
}

export async function saveGymSettings(uid: string, settings: GymSettings): Promise<void> {
  await setDoc(doc(db, "users", uid, "settings", "gym"), settings);
}

export async function toggleFavoriteExercise(uid: string, exerciseId: string): Promise<GymSettings> {
  const current = await getGymSettings(uid);
  const isFav = current.favoriteExerciseIds.includes(exerciseId);
  const next: GymSettings = {
    ...current,
    favoriteExerciseIds: isFav
      ? current.favoriteExerciseIds.filter((id) => id !== exerciseId)
      : [...current.favoriteExerciseIds, exerciseId],
  };
  await saveGymSettings(uid, next);
  return next;
}

// ---------- Workout logs (근력 + 유산소 통합) ----------

export async function addWorkoutLog(
  uid: string,
  entry: {
    date: string;
    exerciseId: string;
    exerciseName: string;
    sets: WorkoutSetEntry[];
    notes?: string;
  }
): Promise<void> {
  await addDoc(collection(db, "users", uid, "workoutLogs"), {
    ...entry,
    kind: "strength",
    source: "manual",
    createdAt: serverTimestamp(),
  });
}

export async function updateWorkoutLog(
  uid: string,
  id: string,
  entry: { sets: WorkoutSetEntry[] }
): Promise<void> {
  await updateDoc(doc(db, "users", uid, "workoutLogs", id), { ...entry });
}

export async function addCardioWorkoutLogs(
  uid: string,
  date: string,
  activities: {
    activityType: string;
    durationMin: number;
    caloriesBurned?: number;
    distanceKm?: number;
    avgHeartRate?: number;
  }[]
): Promise<void> {
  await Promise.all(
    activities.map((a) =>
      addDoc(collection(db, "users", uid, "workoutLogs"), {
        date,
        kind: "cardio",
        ...a,
        source: "apple-fitness",
        createdAt: serverTimestamp(),
      })
    )
  );
}

/** 같은 운동의 가장 최근 N회차 기록 */
export async function getRecentWorkoutLogsForExercise(
  uid: string,
  exerciseId: string,
  count = 3
): Promise<WorkoutLog[]> {
  const q = query(
    collection(db, "users", uid, "workoutLogs"),
    where("exerciseId", "==", exerciseId),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkoutLog);
}

export async function getWorkoutLogsForDate(uid: string, date: string): Promise<WorkoutLog[]> {
  const q = query(
    collection(db, "users", uid, "workoutLogs"),
    where("date", "==", date),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkoutLog);
}

/** 주간 캘린더의 날짜별 점(dot) 표시를 위한 범위 조회 */
export async function getWorkoutLogsForDateRange(
  uid: string,
  startDate: string,
  endDate: string
): Promise<WorkoutLog[]> {
  const q = query(
    collection(db, "users", uid, "workoutLogs"),
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkoutLog);
}

// ---------- Diet logs ----------

function sumMealTotals(meals: MealItem[]) {
  return meals.reduce(
    (acc, m) => ({
      totalCalories: acc.totalCalories + m.calories,
      totalProteinG: acc.totalProteinG + m.proteinG,
      totalCarbsG: acc.totalCarbsG + m.carbsG,
      totalFatG: acc.totalFatG + m.fatG,
    }),
    { totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0 }
  );
}

export async function addDietLog(
  uid: string,
  entry: { date: string; mealType: MealType; rawInput: string; meals: MealItem[] }
): Promise<void> {
  await addDoc(collection(db, "users", uid, "dietLogs"), {
    ...entry,
    ...sumMealTotals(entry.meals),
    createdAt: serverTimestamp(),
  });
}

export async function updateDietLog(
  uid: string,
  id: string,
  entry: { rawInput: string; meals: MealItem[] }
): Promise<void> {
  await updateDoc(doc(db, "users", uid, "dietLogs", id), {
    ...entry,
    ...sumMealTotals(entry.meals),
  });
}

export async function getDietLogsForDate(uid: string, date: string): Promise<DietLog[]> {
  const q = query(
    collection(db, "users", uid, "dietLogs"),
    where("date", "==", date),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DietLog);
}

export async function getDietLogsForDateRange(
  uid: string,
  startDate: string,
  endDate: string
): Promise<DietLog[]> {
  const q = query(
    collection(db, "users", uid, "dietLogs"),
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DietLog);
}

// ---------- Fridge items (식단 추천) ----------

export async function getFridgeItems(uid: string): Promise<FridgeItem[]> {
  const q = query(collection(db, "users", uid, "fridgeItems"), orderBy("addedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FridgeItem);
}

export async function addFridgeItem(
  uid: string,
  item: { name: string; quantity: string; expiryDate?: string }
): Promise<void> {
  await addDoc(collection(db, "users", uid, "fridgeItems"), {
    ...item,
    addedAt: new Date().toISOString(),
  });
}

export async function removeFridgeItem(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "fridgeItems", id));
}

// ---------- Inbody records ----------

export async function getInbodyRecords(uid: string, count = 12): Promise<InbodyRecord[]> {
  const q = query(
    collection(db, "users", uid, "inbodyRecords"),
    orderBy("date", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InbodyRecord);
}

export async function addInbodyRecord(
  uid: string,
  record: Omit<InbodyRecord, "id" | "createdAt">
): Promise<void> {
  await addDoc(collection(db, "users", uid, "inbodyRecords"), {
    ...record,
    createdAt: serverTimestamp(),
  });
}
