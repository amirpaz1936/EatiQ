import { apiRequest } from "./client";
import type { AnalysisItem, NutritionTotals } from "./scan";

export type MealRecord = {
  _id: string;
  userId: string;
  name: string;
  imageUrl: string | null;
  eatenAt: string;
  totals: NutritionTotals;
  items: AnalysisItem[];
  language: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateMealInput = {
  name: string;
  totals: NutritionTotals;
  items: AnalysisItem[];
  language?: string | null;
  notes?: string;
};

export function saveMeal(input: CreateMealInput): Promise<MealRecord> {
  return apiRequest<MealRecord>("/api/meals", {
    method: "POST",
    body: input,
  });
}

export function fetchMealsInRange(
  fromIso: string,
  toIso: string,
): Promise<MealRecord[]> {
  const params = new URLSearchParams({ from: fromIso, to: toIso });
  return apiRequest<MealRecord[]>(`/api/meals?${params.toString()}`);
}

export function fetchTodaysMeals(): Promise<MealRecord[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return fetchMealsInRange(start.toISOString(), end.toISOString());
}

export function deriveMealName(items: { name: string }[]): string {
  if (items.length === 0) return "Meal";
  const names = items.map((i) => i.name);
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
}
