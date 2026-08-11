import { apiRequest } from "./client";
import type {
  DietTypeValue,
  FeedbackInsights,
  GoalValue,
} from "../types/profile";

export type ProfileResponse = {
  _id?: string;
  userId: string;
  goal: GoalValue | null;
  heightCm: number | null;
  weightKg: number | null;
  targetCaloriesDaily: number | null;
  dietType: DietTypeValue | null;
  avoid: string;
  notes: string;
  feedbackInsights?: FeedbackInsights;
};

export type ProfilePatch = Partial<{
  goal: GoalValue;
  heightCm: number;
  weightKg: number;
  targetCaloriesDaily: number;
  dietType: DietTypeValue;
  avoid: string;
  notes: string;
}>;

export function fetchProfile(): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/api/profile");
}

export function updateProfile(patch: ProfilePatch): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/api/profile", {
    method: "PATCH",
    body: patch,
  });
}

export type InsightsPatch = {
  avoid: string[];
  reduce: string[];
  enjoyed: string[];
  notes: string;
};

export function updateFeedbackInsights(
  patch: InsightsPatch,
): Promise<FeedbackInsights> {
  return apiRequest<FeedbackInsights>("/api/profile/insights", {
    method: "PATCH",
    body: patch,
  });
}
