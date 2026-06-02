import type { MealSlot } from "./meal-slot.util";

export const SYSTEM_PROMPT = [
  "You are a registered dietitian helping a user decide what to eat next.",
  "Given the user's profile, dietary constraints, and what they've already eaten today,",
  "suggest exactly THREE distinct, realistic meal options for the requested meal slot.",
  "Rules:",
  "- Respect the diet type and the avoid-list strictly. Never include avoided ingredients.",
  "- Tailor portion sizes and macros toward the user's goal and remaining daily calorie budget.",
  "- Keep meals practical and commonly available; vary them (don't suggest three near-identical dishes).",
  "- Give nutrition values for ONE serving as you describe it, using realistic food-composition values.",
  "- Write every name, description, and reason in the requested language. Echo the language and meal slot codes exactly.",
].join("\n");

export interface SuggestionUserContext {
  mealSlot: MealSlot;
  language: string;
  profile: {
    goal: string | null;
    dietType: string | null;
    avoid: string;
    notes: string;
    targetCaloriesDaily: number | null;
    heightCm: number | null;
    weightKg: number | null;
  };
  consumedCaloriesToday: number;
  recentFeedback: string[];
}

export function buildUserText(ctx: SuggestionUserContext): string {
  const { profile } = ctx;
  const target = profile.targetCaloriesDaily;
  const remaining =
    target != null ? Math.max(0, Math.round(target - ctx.consumedCaloriesToday)) : null;

  const lines = [
    `Target language (ISO 639-1): ${ctx.language}. Meal slot: ${ctx.mealSlot}.`,
    `Goal: ${profile.goal ?? "not specified"}.`,
    `Diet type: ${profile.dietType ?? "no restriction"}.`,
    `Avoid (never include): ${profile.avoid?.trim() || "none"}.`,
    `Height: ${profile.heightCm ?? "?"} cm, Weight: ${profile.weightKg ?? "?"} kg.`,
    target != null
      ? `Daily calorie target: ${target} kcal. Consumed so far today: ${Math.round(ctx.consumedCaloriesToday)} kcal. Remaining: ${remaining} kcal.`
      : `Consumed so far today: ${Math.round(ctx.consumedCaloriesToday)} kcal (no daily target set).`,
  ];

  if (profile.notes?.trim()) lines.push(`User notes: ${profile.notes.trim()}`);
  if (ctx.recentFeedback.length > 0) {
    lines.push(`Recent meal feedback (consider when suggesting): ${ctx.recentFeedback.join("; ")}.`);
  }

  lines.push(`Suggest 3 ${ctx.mealSlot} options now.`);
  return lines.join("\n");
}
