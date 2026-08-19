import type { MealType } from "@/types";

export const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "아침" },
  { key: "lunch", label: "점심" },
  { key: "dinner", label: "저녁" },
  { key: "snack", label: "간식" },
];

export const MEAL_COLORS: Record<MealType, string> = {
  breakfast: "var(--color-meal-breakfast)",
  lunch: "var(--color-meal-lunch)",
  dinner: "var(--color-meal-dinner)",
  snack: "var(--color-meal-snack)",
};

export function mealLabel(key: MealType): string {
  return MEAL_TYPES.find((m) => m.key === key)?.label ?? key;
}
