import { z } from "zod";

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
      "A short plain-language summary (1-3 sentences) of what this user's feedback shows so far, written for the user to read. Cover the clearest pattern, how consistent the evidence is, and any factor the lists cannot express such as meal timing, portion size or preparation. Do not just restate the lists. Write something whenever there is any feedback at all; return an empty string only when there is genuinely nothing to say.",
    ),
});

export type Insights = z.infer<typeof insightsSchema>;
