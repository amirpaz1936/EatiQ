export const GOALS = [
  { value: "weight_loss", label: "Weight loss" },
  { value: "pregnancy", label: "Pregnancy" },
  { value: "maintenance", label: "Maintenance" },
  { value: "muscle_gain", label: "Muscle gain" },
  { value: "crohns", label: "Crohn's management" },
] as const;

export const DIET_TYPES = [
  { value: "balanced", label: "Balanced" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Keto" },
  { value: "gluten_free", label: "Gluten-free" },
  { value: "low_fodmap", label: "Low FODMAP" },
] as const;

export type GoalValue = (typeof GOALS)[number]["value"];
export type DietTypeValue = (typeof DIET_TYPES)[number]["value"];

export type UserProfile = {
  goal: GoalValue;
  heightCm: number;
  weightKg: number;
  targetCaloriesDaily: number;
  dietType: DietTypeValue;
  avoid: string;
  notes: string;
};

export type FeedbackInsights = {
  avoid: string[];
  reduce: string[];
  enjoyed: string[];
  notes: string;
  feedbackCount: number;
};

export const INSIGHT_LISTS = ["avoid", "reduce", "enjoyed"] as const;
export type InsightList = (typeof INSIGHT_LISTS)[number];

export const defaultProfile: UserProfile = {
  goal: "muscle_gain",
  heightCm: 160,
  weightKg: 50,
  targetCaloriesDaily: 1600,
  dietType: "vegetarian",
  avoid: "",
  notes: "",
};
