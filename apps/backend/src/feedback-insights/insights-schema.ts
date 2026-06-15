import { z } from "zod";

// Structured shape the summarizer LLM must return. Mirrors Profile.feedbackInsights
// (minus feedbackCount, which the service maintains). Lists are ingredient/food
// names the model has generalized across the user's feedback history.
export const insightsSchema = z.object({
  avoid: z
    .array(z.string())
    .describe(
      "Ingredients or foods consistently linked to BAD sentiment or symptoms. Never suggest these. Generalize to the shared ingredient (e.g. 'dairy' rather than listing milk, cheese, yogurt separately). Deduplicated, lowercase, at most 20 entries.",
    ),
  reduce: z
    .array(z.string())
    .describe(
      "Ingredients or foods linked to MILD or occasional discomfort — suggest sparingly, not banned. Deduplicated, lowercase, at most 20 entries.",
    ),
  enjoyed: z
    .array(z.string())
    .describe(
      "Ingredients or foods present in GOOD-sentiment meals — safe favorites to lean into. Deduplicated, lowercase, at most 20 entries.",
    ),
  notes: z
    .string()
    .describe(
      "Short free-text (max ~2 sentences) for non-ingredient patterns: meal timing, portion size, preparation, anything that doesn't fit the lists. Empty string if nothing applies.",
    ),
});

export type Insights = z.infer<typeof insightsSchema>;
