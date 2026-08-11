export const SYSTEM_PROMPT = [
  "You are a registered dietitian reviewing a meal a user has just photographed but has NOT eaten yet.",
  "Decide whether this specific user should eat it, based on their profile, dietary restrictions, past-feedback insights, and what they have already eaten today.",
  "Rules:",
  "- Judge only the ingredients actually detected in the meal. Never invent ingredients, and never warn about something that isn't listed.",
  "- Anything on the avoid-list, forbidden by the diet type, or previously linked to symptoms is a 'blocking' warning and makes the verdict 'avoid'.",
  "- Check EVERY detected item against EVERY constraint, and emit a separate warning for each problem you find. Finding one blocking ingredient does not excuse you from checking the rest — a meal can break the avoid-list and the diet type at the same time.",
  "- The diet type is listed with the foods it rules out. Treat every one of those as forbidden, exactly like an avoid-list entry.",
  "- Match ingredients sensibly: 'turkey' on the avoid-list covers turkey breast and ground turkey.",
  "- Going meaningfully over the remaining calorie budget, or containing something on the ease-off list, is a 'caution' — not an 'avoid'.",
  "- If nothing is wrong, return verdict 'ok' with an empty warnings array. Do not manufacture concerns to seem thorough.",
  "- Be direct and specific. The user is deciding right now whether to eat this.",
].join("\n");

/**
 * What each diet type forbids, spelled out for the prompt.
 *
 * Naming the foods beats naming the diet: models reliably miss that "gluten-free"
 * excludes the white bread sitting in the item list, but not when the exclusion is
 * stated as an explicit list next to the meal.
 */
const DIET_TYPE_EXCLUSIONS: Record<string, string> = {
  gluten_free:
    "wheat bread, pasta, couscous, barley, rye, breadcrumbs, regular flour, beer, most soy sauce",
  vegan: "all meat, poultry, fish, seafood, dairy, cheese, eggs, honey, gelatin",
  vegetarian: "all meat, poultry, fish, seafood, gelatin",
  keto:
    "bread, pasta, rice, potato, corn, most fruit, sugar and other high-carb staples",
  low_fodmap:
    "onion, garlic, wheat, most legumes, apple, pear, honey, high-lactose dairy",
  balanced: "",
};

export interface MealReviewContext {
  language: string;
  mealName: string;
  items: { name: string; estimatedWeightGrams: number; calories: number }[];
  totals: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  profile: {
    goal: string | null;
    dietType: string | null;
    avoid: string;
    notes: string;
    targetCaloriesDaily: number | null;
  };
  consumedCaloriesToday: number;
  feedbackInsights: {
    avoid: string[];
    reduce: string[];
    enjoyed: string[];
    notes: string;
  };
}

export function buildUserText(ctx: MealReviewContext): string {
  const { profile, totals } = ctx;
  const target = profile.targetCaloriesDaily;
  const remaining =
    target != null
      ? Math.round(target - ctx.consumedCaloriesToday)
      : null;

  const lines = [
    `Respond in language (ISO 639-1): ${ctx.language}.`,
    "",
    `MEAL BEING CONSIDERED: ${ctx.mealName}`,
    "Detected items:",
    ...ctx.items.map(
      (i) =>
        `- ${i.name} (~${Math.round(i.estimatedWeightGrams)} g, ${Math.round(i.calories)} kcal)`,
    ),
    `Meal totals: ${Math.round(totals.calories)} kcal, P ${Math.round(totals.proteinGrams)}g, C ${Math.round(totals.carbsGrams)}g, F ${Math.round(totals.fatGrams)}g.`,
    "",
    "USER PROFILE:",
    `- Goal: ${profile.goal ?? "not specified"}.`,
    `- Diet type: ${profile.dietType ?? "no restriction"}.`,
    `- Must avoid: ${profile.avoid?.trim() || "nothing specified"}.`,
  ];

  const exclusions = profile.dietType
    ? DIET_TYPE_EXCLUSIONS[profile.dietType]
    : undefined;
  if (exclusions) {
    lines.push(
      `- Because the diet type is ${profile.dietType}, these are FORBIDDEN and must be flagged if present: ${exclusions}.`,
    );
  }

  if (profile.notes?.trim()) {
    lines.push(`- Notes / symptoms: ${profile.notes.trim()}`);
  }

  if (target != null) {
    lines.push(
      `- Daily target ${target} kcal; ${Math.round(ctx.consumedCaloriesToday)} kcal eaten so far, ${remaining} kcal remaining before this meal.`,
    );
  } else {
    lines.push(
      `- No daily calorie target set. ${Math.round(ctx.consumedCaloriesToday)} kcal eaten so far today.`,
    );
  }

  const fi = ctx.feedbackInsights;
  if (fi.avoid.length > 0) {
    lines.push(
      `- Past feedback says AVOID (caused bad reactions): ${fi.avoid.join(", ")}.`,
    );
  }
  if (fi.reduce.length > 0) {
    lines.push(`- Past feedback says ease off: ${fi.reduce.join(", ")}.`);
  }
  if (fi.enjoyed.length > 0) {
    lines.push(`- Past feedback says these went well: ${fi.enjoyed.join(", ")}.`);
  }
  if (fi.notes.trim()) {
    lines.push(`- Feedback notes: ${fi.notes.trim()}`);
  }

  lines.push("", "Should this user eat this meal? Review it now.");
  return lines.join("\n");
}
