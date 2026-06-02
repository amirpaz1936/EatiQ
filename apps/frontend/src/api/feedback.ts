import { apiRequest } from "./client";
import type { Sentiment } from "../types/feedback";

export type MealFeedbackRecord = {
  _id: string;
  mealId: string;
  feeling: string;
  sentiment: Sentiment | null;
  symptoms: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateFeedbackInput = {
  mealId: string;
  feeling?: string;
  sentiment?: Sentiment | null;
  symptoms?: string;
};

export function saveFeedback(input: CreateFeedbackInput): Promise<MealFeedbackRecord> {
  return apiRequest<MealFeedbackRecord>("/api/feedback", {
    method: "POST",
    body: input,
  });
}
