"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  addWorkoutLog,
  getGymSettings,
  getRecentWorkoutLogsForExercise,
  getSharedExercises,
  getWorkoutLogsForDate,
  getWorkoutLogsForDateRange,
  toggleFavoriteExercise,
  updateWorkoutLog,
} from "@/lib/data";
import { dayLabel, todayStr, weekDatesForOffset } from "@/lib/date-utils";
import { WeekCalendar } from "@/components/shared/WeekCalendar";
import { WorkoutDiaryList } from "@/components/workout/WorkoutDiaryList";
import { ExercisePicker } from "@/components/workout/ExercisePicker";
import { AppleFitnessImport } from "@/components/workout/AppleFitnessImport";
import { MuscleDiagramPlaceholder } from "@/components/workout/MuscleDiagramPlaceholder";
import { RecentSessionsComparison } from "@/components/workout/RecentSessionsComparison";
import { WorkoutLogForm } from "@/components/workout/WorkoutLogForm";
import { MUSCLE_LABELS } from "@/lib/muscle-labels";
import { getExerciseById } from "@/data/exercises";
import type { Exercise, GymSettings, WorkoutLog, WorkoutSetEntry } from "@/types";

type View = "diary" | "picking" | "logging";

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [view, setView] = useState<View>("diary");

  const [weekEntries, setWeekEntries] = useState<WorkoutLog[]>([]);
  const [dayEntries, setDayEntries] = useState<WorkoutLog[]>([]);
  const [gymSettings, setGymSettings] = useState<GymSettings>({ equipment: [], favoriteExerciseIds: [] });
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [sharedExercises, setSharedExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!user) return;
    getGymSettings(user.uid).then(setGymSettings);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getSharedExercises()
      .then(setSharedExercises)
      .catch((err) => console.error("failed to load shared exercises", err));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const dates = weekDatesForOffset(weekOffset);
    let ignore = false;
    getWorkoutLogsForDateRange(user.uid, dates[0], dates[6]).then((logs) => {
      if (!ignore) setWeekEntries(logs);
    });
    return () => {
      ignore = true;
    };
  }, [user, weekOffset]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    getWorkoutLogsForDate(user.uid, selectedDate).then((logs) => {
      if (!ignore) setDayEntries(logs);
    });
    return () => {
      ignore = true;
    };
  }, [user, selectedDate]);

  function refreshDay(date: string) {
    if (!user) return;
    getWorkoutLogsForDate(user.uid, date).then(setDayEntries);
    const dates = weekDatesForOffset(weekOffset);
    getWorkoutLogsForDateRange(user.uid, dates[0], dates[6]).then(setWeekEntries);
  }

  useEffect(() => {
    if (!user || !selectedExercise) return;
    let ignore = false;
    getRecentWorkoutLogsForExercise(user.uid, selectedExercise.id, 3).then((logs) => {
      if (!ignore) setRecentLogs(logs);
    });
    return () => {
      ignore = true;
    };
  }, [user, selectedExercise]);

  function selectDate(date: string) {
    setSelectedDate(date);
    setView("diary");
    setSelectedExercise(null);
    setEditingLog(null);
  }

  function startAddWorkout() {
    setSelectedExercise(null);
    setEditingLog(null);
    setView("picking");
  }

  function selectExercise(ex: Exercise) {
    setSelectedExercise(ex);
    setView("logging");
  }

  function editEntry(entry: WorkoutLog) {
    const ex = entry.exerciseId
      ? (getExerciseById(entry.exerciseId) ?? sharedExercises.find((e) => e.id === entry.exerciseId))
      : undefined;
    if (!ex) return;
    setSelectedExercise(ex);
    setEditingLog(entry);
    setView("logging");
  }

  async function toggleFavorite(exerciseId: string) {
    if (!user) return;
    const next = await toggleFavoriteExercise(user.uid, exerciseId);
    setGymSettings(next);
  }

  async function handleSaveSets(sets: WorkoutSetEntry[]) {
    if (!user || !selectedExercise) return;
    if (editingLog) {
      await updateWorkoutLog(user.uid, editingLog.id, { sets });
    } else {
      await addWorkoutLog(user.uid, {
        date: selectedDate,
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.nameKo,
        sets,
      });
    }
    refreshDay(selectedDate);
    setView("diary");
    setSelectedExercise(null);
    setEditingLog(null);
  }

  const hasEntry = (date: string) => weekEntries.some((e) => e.date === date);

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="text-xl font-bold text-ink">운동 기록</div>
        <p className="mt-0.5 text-[13px] text-muted">요일을 선택해 그날의 운동을 다이어리처럼 기록해요.</p>
      </div>

      <WeekCalendar
        weekOffset={weekOffset}
        selectedDate={selectedDate}
        hasEntry={hasEntry}
        onSelectDate={selectDate}
        onPrevWeek={() => setWeekOffset((o) => o - 1)}
        onNextWeek={() => setWeekOffset((o) => o + 1)}
      />

      {view === "diary" && (
        <WorkoutDiaryList
          dayLabel={dayLabel(selectedDate)}
          entries={dayEntries}
          onEdit={editEntry}
          onAdd={startAddWorkout}
        />
      )}

      {view === "picking" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-bold text-muted-dark">어떤 운동을 하셨나요?</div>
            <button onClick={() => setView("diary")} className="text-xs text-muted underline">
              취소
            </button>
          </div>
          <AppleFitnessImport date={selectedDate} onImported={() => refreshDay(selectedDate)} />
          <ExercisePicker
            favoriteIds={gymSettings.favoriteExerciseIds}
            equipment={gymSettings.equipment}
            sharedExercises={sharedExercises}
            onExerciseAdded={(ex) => setSharedExercises((prev) => [ex, ...prev])}
            onToggleFavorite={toggleFavorite}
            onSelect={selectExercise}
          />
        </div>
      )}

      {view === "logging" && selectedExercise && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold text-ink">{selectedExercise.nameKo}</div>
              <div className="text-xs text-muted">{selectedExercise.equipment}</div>
            </div>
            <button
              onClick={() => {
                setSelectedExercise(null);
                setEditingLog(null);
                setView("picking");
              }}
              className="text-xs font-bold text-muted underline"
            >
              다른 운동 선택
            </button>
          </div>

          <MuscleDiagramPlaceholder
            muscleLabel={selectedExercise.muscleGroups.map((m) => MUSCLE_LABELS[m]).join(" · ")}
          />

          <RecentSessionsComparison logs={recentLogs} />

          <WorkoutLogForm
            key={editingLog?.id ?? selectedExercise.id}
            exerciseName={selectedExercise.nameKo}
            initialSets={editingLog?.sets ?? [{ weightKg: 0, reps: 0 }]}
            isEditing={!!editingLog}
            onSave={handleSaveSets}
          />
        </div>
      )}
    </div>
  );
}
