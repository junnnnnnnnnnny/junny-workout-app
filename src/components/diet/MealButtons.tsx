import { MEAL_TYPES } from "@/lib/meal-types";
import type { MealType } from "@/types";

export function MealButtons({
  activeMeal,
  onSelect,
}: {
  activeMeal: MealType | null;
  onSelect: (meal: MealType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MEAL_TYPES.map((mt) => {
        const active = activeMeal === mt.key;
        return (
          <button
            key={mt.key}
            onClick={() => onSelect(mt.key)}
            className="rounded-xl border py-3 text-center text-[13px] font-bold"
            style={{
              borderColor: active ? "var(--color-brand)" : "var(--color-card-border)",
              background: active ? "var(--color-brand)" : "#fff",
              color: active ? "#fff" : "var(--color-ink)",
            }}
          >
            {mt.label} 기록하기
          </button>
        );
      })}
    </div>
  );
}
