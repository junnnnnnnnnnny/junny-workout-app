export interface FoodDbItem {
  name: string;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const FOOD_DB: FoodDbItem[] = [
  { name: "닭가슴살", unit: "100g", calories: 165, proteinG: 31, carbsG: 0, fatG: 4 },
  { name: "현미밥", unit: "1공기", calories: 300, proteinG: 6, carbsG: 66, fatG: 2 },
  { name: "계란", unit: "1개", calories: 70, proteinG: 6, carbsG: 1, fatG: 5 },
  { name: "바나나", unit: "1개", calories: 105, proteinG: 1, carbsG: 27, fatG: 0 },
  { name: "그릭요거트", unit: "100g", calories: 90, proteinG: 10, carbsG: 6, fatG: 2 },
  { name: "고구마", unit: "1개", calories: 130, proteinG: 2, carbsG: 30, fatG: 0 },
  { name: "프로틴쉐이크", unit: "1회분", calories: 120, proteinG: 24, carbsG: 3, fatG: 1 },
];
