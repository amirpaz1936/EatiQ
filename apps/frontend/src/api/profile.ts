import { apiRequest } from "./client";
import type { DietTypeValue, GoalValue } from "../types/profile";

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
