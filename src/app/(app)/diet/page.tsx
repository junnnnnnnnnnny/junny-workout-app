"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  addDietLog,
  deleteDietLog,
  getDietLogsForDate,
  getDietLogsForDateRange,
  getGoal,
  updateDietLog,
} from "@/lib/data";
import { dayLabel, todayStr, weekDatesForOffset } from "@/lib/date-utils";
import { WeekCalendar } from "@/components/shared/WeekCalendar";
import { MacroSummaryCard } from "@/components/diet/MacroSummaryCard";
import { MealBarChart } from "@/components/diet/MealBarChart";
import { MealButtons } from "@/components/diet/MealButtons";
import { DietRecordingPanel } from "@/components/diet/DietRecordingPanel";
import { DietDiaryEntries } from "@/components/diet/DietDiaryEntries";
import type { DietLog, Goal, MealItem, MealType } from "@/types";

export default function DietPage() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [goal, setGoal] = useState<Goal | null>(null);
  const [weekEntries, setWeekEntries] = useState<DietLog[]>([]);
  const [dayEntries, setDayEntries] = useState<DietLog[]>([]);
  const [recordingMeal, setRecordingMeal] = useState<MealType | null>(null);
  const [editingLog, setEditingLog] = useState<DietLog | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getGoal(user.uid).then(setGoal);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    const dates = weekDatesForOffset(weekOffset);
    getDietLogsForDateRange(user.uid, dates[0], dates[6])
      .then((logs) => {
        if (!ignore) setWeekEntries(logs);
      })
      .catch((err) => console.error("failed to load week entries", err));
    return () => {
      ignore = true;
    };
  }, [user, weekOffset]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    getDietLogsForDate(user.uid, selectedDate)
      .then((logs) => {
        if (!ignore) {
          setDayEntries(logs);
          setRefreshError(null);
        }
      })
      .catch((err) => {
        console.error("failed to load day entries", err);
        if (!ignore) setRefreshError(err instanceof Error ? err.message : "기록을 불러오지 못했어요.");
      });
    return () => {
      ignore = true;
    };
  }, [user, selectedDate]);

  function refreshDay(date: string) {
    if (!user) return;
    setRefreshError(null);
    getDietLogsForDate(user.uid, date)
      .then(setDayEntries)
      .catch((err) => {
        console.error("failed to refresh day entries", err);
        setRefreshError(err instanceof Error ? err.message : "기록을 불러오지 못했어요.");
      });
    const dates = weekDatesForOffset(weekOffset);
    getDietLogsForDateRange(user.uid, dates[0], dates[6])
      .then(setWeekEntries)
      .catch((err) => console.error("failed to refresh week entries", err));
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    setRecordingMeal(null);
    setEditingLog(null);
  }

  function toggleMeal(meal: MealType) {
    if (recordingMeal === meal) {
      setRecordingMeal(null);
      setEditingLog(null);
    } else {
      setRecordingMeal(meal);
      setEditingLog(null);
    }
  }

  function editEntry(entry: DietLog) {
    setRecordingMeal(entry.mealType);
    setEditingLog(entry);
  }

  async function handleSave(meals: MealItem[], rawInput: string) {
    if (!user || !recordingMeal) return;
    if (editingLog) {
      await updateDietLog(user.uid, editingLog.id, { rawInput, meals });
    } else {
      await addDietLog(user.uid, { date: selectedDate, mealType: recordingMeal, rawInput, meals });
    }
    refreshDay(selectedDate);
    setRecordingMeal(null);
    setEditingLog(null);
  }

  async function handleDelete(entry: DietLog) {
    if (!user) return;
    if (!confirm("이 기록을 삭제할까요?")) return;
    await deleteDietLog(user.uid, entry.id);
    if (editingLog?.id === entry.id) {
      setRecordingMeal(null);
      setEditingLog(null);
    }
    refreshDay(selectedDate);
  }

  const dayCalories = dayEntries.reduce((sum, l) => sum + l.totalCalories, 0);
  const dayProtein = dayEntries.reduce((sum, l) => sum + l.totalProteinG, 0);
  const dayCarbs = dayEntries.reduce((sum, l) => sum + l.totalCarbsG, 0);
  const dayFat = dayEntries.reduce((sum, l) => sum + l.totalFatG, 0);
  const calorieTarget = goal?.calorieTarget ?? 0;
  const proteinTarget = goal?.proteinTarget ?? 0;
  const carbTarget = goal?.carbTarget ?? Math.round((calorieTarget * 0.45) / 4);
  const fatTarget = goal?.fatTarget ?? Math.round((calorieTarget * 0.25) / 9);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-xl font-bold text-ink">식단 기록</div>
        <p className="mt-0.5 text-[13px] text-muted">요일별로 먹은 내용을 기록하고 탄/단/지를 확인해요.</p>
      </div>

      <WeekCalendar
        weekOffset={weekOffset}
        selectedDate={selectedDate}
        hasEntry={(date) => weekEntries.some((e) => e.date === date)}
        onSelectDate={selectDate}
        onPrevWeek={() => setWeekOffset((o) => o - 1)}
        onNextWeek={() => setWeekOffset((o) => o + 1)}
      />

      <div className="text-[13px] font-bold text-muted-dark">{dayLabel(selectedDate)}</div>

      <MacroSummaryCard
        rows={[
          { label: "칼로리", consumed: dayCalories, target: calorieTarget, unit: "kcal", color: "var(--color-brand)" },
          { label: "단백질", consumed: dayProtein, target: proteinTarget, unit: "g", color: "var(--color-brand)" },
          { label: "탄수화물", consumed: dayCarbs, target: carbTarget, unit: "g", color: "var(--color-carb)" },
          { label: "지방", consumed: dayFat, target: fatTarget, unit: "g", color: "var(--color-fat)" },
        ]}
      />

      <MealBarChart entries={dayEntries} />

      {refreshError && (
        <p className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-xs font-semibold text-danger">
          {refreshError} (Firestore 색인 설정이 필요할 수 있어요. 브라우저 개발자 콘솔에 에러 메시지와 색인 생성 링크가 함께 떠요.)
        </p>
      )}

      <MealButtons activeMeal={recordingMeal} onSelect={toggleMeal} />

      {recordingMeal && (
        <DietRecordingPanel
          mealType={recordingMeal}
          initialText={editingLog?.rawInput ?? ""}
          isEditing={!!editingLog}
          onClose={() => {
            setRecordingMeal(null);
            setEditingLog(null);
          }}
          onSave={handleSave}
        />
      )}

      <DietDiaryEntries entries={dayEntries} onEdit={editEntry} onDelete={handleDelete} />
    </div>
  );
}
