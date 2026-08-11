import { z } from "zod";

export const VERDICTS = ["ok", "caution", "avoid"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const reviewSchema = z.object({
  verdict: z
    .enum(VERDICTS)
    .describe(
      "'ok' — fine to eat as-is. 'caution' — edible but conflicts with a goal or calorie budget, or contains something to ease off. 'avoid' — contains an ingredient the user must not eat (avoid-list, diet type, or a food that previously caused symptoms).",
    ),
  headline: z
    .string()
    .describe(
      "One short sentence (max ~15 words) giving the verdict in plain language, addressed to the user.",
    ),
  warnings: z
    .array(
      z.object({
        ingredient: z
          .string()
          .describe("The specific food or ingredient in this meal that triggered the warning."),
        reason: z
          .string()
          .describe(
            "One sentence on why it is a problem for THIS user, citing their profile, diet, or past feedback.",
          ),
        severity: z
          .enum(["blocking", "caution"])
          .describe(
            "'blocking' if the user must not eat it (avoid-list, diet conflict, symptom trigger). 'caution' for milder concerns.",
          ),
      }),
    )
    .describe(
      "One entry per problem ingredient. Empty when nothing in the meal is a concern. Never invent an ingredient that is not in the meal.",
    ),
  notes: z
    .string()
    .describe(
      "Optional short advice — portion size, timing, what to pair it with. Empty string if there is nothing useful to add.",
    ),
});

export type MealReview = z.infer<typeof reviewSchema>;
