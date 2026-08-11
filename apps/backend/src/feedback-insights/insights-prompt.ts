import type { Insights } from "./insights-schema";

export const SYSTEM_PROMPT = [
  "You are a nutrition analyst maintaining a compact, evolving summary of one user's meal-feedback history.",
  "You receive the CURRENT summary plus the user's most recent meal feedbacks (each with the meal's ingredients, the user's sentiment, free-text feeling, and any symptoms).",
  "Produce an UPDATED summary that folds the recent feedbacks into the current one.",
  "Rules:",
  "- Generalize across ingredients: if several disliked or symptom-causing meals share an ingredient, capture the shared ingredient (e.g. 'dairy', 'fried food', 'shellfish') rather than each dish.",
  "- An ingredient tied to bad sentiment or symptoms goes in `avoid`. Mild/occasional discomfort goes in `reduce`. Ingredients in good-sentiment meals go in `enjoyed`.",
  "- Carry forward still-relevant entries from the current summary; drop ones the recent feedback contradicts (e.g. a previously-avoided food now repeatedly enjoyed without symptoms).",
  "- RECENT FEEDBACK is authoritative: it lists each meal's latest feedback, already replacing any earlier feedback the user edited or corrected. Where it disagrees with the current summary, the recent feedback wins.",
  "- If an entry in the current summary rests only on a meal that now appears in RECENT FEEDBACK without that problem, remove the entry. Corrections must be able to shrink the lists, not only grow them.",
  "- If an ingredient appears in both good and bad meals, prefer caution: keep it out of `enjoyed` and consider `reduce`.",
  "- Keep each list deduplicated, lowercase, and concise (at most 20 entries).",
  "- Always fill in `notes` when there is any feedback: 1-3 sentences summarizing the overall picture for the user — the clearest pattern so far, how strong the evidence is, and anything the lists cannot capture (meal timing, portion size, preparation, how often a food was eaten). Do not simply repeat the list entries back.",
  "- If the evidence is still thin, say so in `notes` rather than leaving it blank (e.g. 'Only one meal logged so far, so this is an early signal').",
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
