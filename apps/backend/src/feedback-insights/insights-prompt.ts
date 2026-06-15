import type { Insights } from "./insights-schema";

export const SYSTEM_PROMPT = [
  "You are a nutrition analyst maintaining a compact, evolving summary of one user's meal-feedback history.",
  "You receive the CURRENT summary plus the user's most recent meal feedbacks (each with the meal's ingredients, the user's sentiment, free-text feeling, and any symptoms).",
  "Produce an UPDATED summary that folds the recent feedbacks into the current one.",
  "Rules:",
  "- Generalize across ingredients: if several disliked or symptom-causing meals share an ingredient, capture the shared ingredient (e.g. 'dairy', 'fried food', 'shellfish') rather than each dish.",
  "- An ingredient tied to bad sentiment or symptoms goes in `avoid`. Mild/occasional discomfort goes in `reduce`. Ingredients in good-sentiment meals go in `enjoyed`.",
  "- Carry forward still-relevant entries from the current summary; drop ones the recent feedback contradicts (e.g. a previously-avoided food now repeatedly enjoyed without symptoms).",
  "- If an ingredient appears in both good and bad meals, prefer caution: keep it out of `enjoyed` and consider `reduce`.",
  "- Keep each list deduplicated, lowercase, and concise (at most 20 entries). Use `notes` only for patterns that aren't about a specific ingredient.",
  "- Base conclusions on real signal; do not invent foods or symptoms that were never mentioned.",
].join("\n");

export interface FeedbackEntry {
  mealName: string;
  ingredients: string[];
  sentiment: string | null;
  feeling: string;
  symptoms: string;
}

export interface InsightsContext {
  current: Insights;
  recent: FeedbackEntry[];
}

export function buildUserText(ctx: InsightsContext): string {
  const cur = ctx.current;
  const lines: string[] = [
    "CURRENT SUMMARY:",
    `- avoid: ${cur.avoid.length ? cur.avoid.join(", ") : "(none)"}`,
    `- reduce: ${cur.reduce.length ? cur.reduce.join(", ") : "(none)"}`,
    `- enjoyed: ${cur.enjoyed.length ? cur.enjoyed.join(", ") : "(none)"}`,
    `- notes: ${cur.notes.trim() || "(none)"}`,
    "",
    "RECENT FEEDBACK (newest first):",
  ];

  ctx.recent.forEach((f, i) => {
    const ingredients = f.ingredients.length
      ? f.ingredients.join(", ")
      : "(unknown)";
    const parts = [
      `meal="${f.mealName}"`,
      `ingredients=[${ingredients}]`,
      `sentiment=${f.sentiment ?? "unspecified"}`,
    ];
    if (f.feeling.trim()) parts.push(`feeling="${f.feeling.trim()}"`);
    if (f.symptoms.trim()) parts.push(`symptoms="${f.symptoms.trim()}"`);
    lines.push(`${i + 1}. ${parts.join(" | ")}`);
  });

  lines.push("", "Return the updated summary.");
  return lines.join("\n");
}
