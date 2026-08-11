import { apiRequest } from "./client";
import type { AnalysisItem, NutritionTotals } from "./scan";

export type Verdict = "ok" | "caution" | "avoid";

export type ReviewWarning = {
  ingredient: string;
  reason: string;
  severity: "blocking" | "caution";
};

export type MealReview = {
  verdict: Verdict;
  headline: string;
  warnings: ReviewWarning[];
  notes: string;
};

export type ReviewMealInput = {
  name: string;
  totals: NutritionTotals;
  items: AnalysisItem[];
  language?: string;
};

export function reviewMeal(input: ReviewMealInput): Promise<MealReview> {
  return apiRequest<MealReview>("/api/meal-review", {
    method: "POST",
    body: input,
  });
}
