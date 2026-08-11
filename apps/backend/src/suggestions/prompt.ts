import type { MealSlot } from "./meal-slot.util";

export const SYSTEM_PROMPT = [
  "You are a registered dietitian helping a user decide what to eat next.",
  "Given the user's profile, dietary constraints, and what they've already eaten today,",
  "suggest exactly THREE distinct, realistic meal options for the requested meal slot.",
  "Rules:",
  "- The avoid-list is an absolute constraint, not a preference. A suggestion must not contain an avoided ingredient in any form — not as a main component, a garnish, a substitute, or a mention in the name, description, or reason.",
  "- This includes obvious variants of an avoided term: avoiding 'turkey' also rules out turkey breast, ground turkey, smoked turkey and turkey bacon.",
  "- If avoiding an ingredient makes an otherwise good dish impossible, pick a different dish. Never suggest one and note that the ingredient can be swapped out.",
  "- Respect the diet type strictly as well.",
  "- Treat ingredients flagged to avoid from past feedback as equally off-limits, and favor ingredients the user has enjoyed.",
  "- Tailor portion sizes and macros toward the user's goal and remaining daily calorie budget.",
  "- Keep meals practical and commonly available; vary them (don't suggest three near-identical dishes).",
  "- Give nutrition values for ONE serving as you describe it, using realistic food-composition values.",
  "- Write every name, description, and reason in the requested language. Echo the language and meal slot codes exactly.",
].join("\n");

export interface FeedbackInsightsContext {
  avoid: string[];
  reduce: string[];
  enjoyed: string[];
  notes: string;
}

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
  feedbackInsights: FeedbackInsightsContext;
  retryViolations?: string[];
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

  const fi = ctx.feedbackInsights;
  if (fi.avoid.length > 0) {
    lines.push(
      `From past feedback, AVOID these (caused bad reactions): ${fi.avoid.join(", ")}.`,
    );
  }
  if (fi.reduce.length > 0) {
    lines.push(`Use sparingly (mild discomfort in the past): ${fi.reduce.join(", ")}.`);
  }
  if (fi.enjoyed.length > 0) {
    lines.push(`The user has enjoyed these before — favor them: ${fi.enjoyed.join(", ")}.`);
  }
  if (fi.notes.trim()) {
    lines.push(`Feedback notes: ${fi.notes.trim()}`);
  }

  if (ctx.retryViolations?.length) {
    lines.push(
      "",
      "IMPORTANT — your previous attempt broke the avoid-list:",
      ...ctx.retryViolations.map((v) => `- ${v}`),
      "Produce three completely different meals that contain none of the avoided ingredients.",
    );
  }

  lines.push(`Suggest 3 ${ctx.mealSlot} options now.`);
  return lines.join("\n");
}
