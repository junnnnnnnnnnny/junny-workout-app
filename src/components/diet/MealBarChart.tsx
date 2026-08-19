import type { DietLog } from "@/types";
import { MEAL_COLORS, MEAL_TYPES } from "@/lib/meal-types";

export function MealBarChart({ entries }: { entries: DietLog[] }) {
  const totals = MEAL_TYPES.map((mt) => ({
    ...mt,
    calories: entries.filter((e) => e.mealType === mt.key).reduce((sum, e) => sum + e.totalCalories, 0),
  })).filter((m) => m.calories > 0);

  const totalCalories = totals.reduce((sum, m) => sum + m.calories, 0);
  if (totalCalories === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-card-border bg-white p-4">
      <div className="text-xs font-bold text-muted-dark">오늘 먹은 것</div>
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {totals.map((m) => (
          <div
            key={m.key}
            style={{ width: `${Math.round((m.calories / totalCalories) * 100)}%`, background: MEAL_COLORS[m.key] }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {totals.map((m) => (
          <div key={m.key} className="flex items-center gap-1.5 text-[11px] text-muted-dark">
            <span className="h-2 w-2 rounded-full" style={{ background: MEAL_COLORS[m.key] }} />
            {m.label} {m.calories}kcal
          </div>
        ))}
      </div>
    </div>
  );
}
