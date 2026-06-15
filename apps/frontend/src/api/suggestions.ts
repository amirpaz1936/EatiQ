import { apiRequest } from "./client";
import type { NutritionTotals } from "./scan";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type MealSuggestion = {
  name: string;
  description: string;
  reason: string;
  nutrition: NutritionTotals;
};

export type SuggestionsResponse = {
  language: string;
  mealSlot: MealSlot;
  suggestions: MealSuggestion[];
};

export function fetchMealSuggestions(
  options: { refresh?: boolean } = {},
): Promise<SuggestionsResponse> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const params = new URLSearchParams({ timeZone });
  if (options.refresh) params.set("refresh", "true");
  return apiRequest<SuggestionsResponse>(`/api/suggestions?${params.toString()}`);
}
