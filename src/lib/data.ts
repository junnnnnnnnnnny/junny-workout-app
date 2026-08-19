import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { DietLog, Goal, MealItem, WorkoutLog, WorkoutSetEntry } from "@/types";

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

// ---------- Workout logs ----------

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
    source: "manual",
    createdAt: serverTimestamp(),
  });
}

/** 같은 운동의 가장 최근 N회차 기록 (오늘 것 제외 여부는 호출부에서 처리) */
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

export async function getAllWorkoutLogs(uid: string, count = 30): Promise<WorkoutLog[]> {
  const q = query(
    collection(db, "users", uid, "workoutLogs"),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkoutLog);
}

// ---------- Diet logs ----------

export async function addDietLog(
  uid: string,
  entry: { date: string; rawInput: string; meals: MealItem[] }
): Promise<void> {
  const totals = entry.meals.reduce(
    (acc, m) => ({
      totalCalories: acc.totalCalories + m.calories,
      totalProteinG: acc.totalProteinG + m.proteinG,
      totalCarbsG: acc.totalCarbsG + m.carbsG,
      totalFatG: acc.totalFatG + m.fatG,
    }),
    { totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0 }
  );

  await addDoc(collection(db, "users", uid, "dietLogs"), {
    ...entry,
    ...totals,
    createdAt: serverTimestamp(),
  });
}

export async function getDietLogsForDate(uid: string, date: string): Promise<DietLog[]> {
  const q = query(
    collection(db, "users", uid, "dietLogs"),
    where("date", "==", date),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DietLog);
}
