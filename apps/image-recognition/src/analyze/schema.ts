import { z } from "zod";

const nutritionSchema = z.object({
  calories: z
    .number()
    .describe(
      "Kilocalories for the estimated portion (not per 100g). Scaled linearly from standard food-composition values.",
    ),
  proteinGrams: z.number().describe("Protein in grams for the estimated portion."),
  carbsGrams: z.number().describe("Total carbohydrates in grams for the estimated portion."),
  fatGrams: z.number().describe("Total fat in grams for the estimated portion."),
  fiberGrams: z.number().describe("Dietary fiber in grams for the estimated portion."),
  sugarGrams: z.number().describe("Total sugars in grams for the estimated portion."),
});

export const buildAnalysisSchema = (language: string) =>
  z.object({
    language: z
      .literal(language)
      .describe(
        `Echo of the requested ISO 639-1 language code. MUST equal "${language}" exactly.`,
      ),
    imageUrl: z.string().describe("Echo of the input image URL."),
    items: z
      .array(
        z.object({
          name: z
            .string()
            .describe(
              `Food name, written in language "${language}". Translate common food names natively into this language; do NOT transliterate English. Numeric values stay numeric.`,
            ),
          estimatedWeightGrams: z
            .number()
            .describe(
              "Estimated weight in grams of the visible portion of this item, derived from reference cues (plate, fork, hand) AND typical food density/thickness.",
            ),
          relativeAreaPercent: z
            .number()
            .describe(
              "Approximate percent (0-100) of total image area this item occupies. Helps verify weight estimate.",
            ),
          confidence: z
            .number()
            .describe(
              "Self-assessed confidence in [0,1]. 0.8+ clear food with scale reference; 0.5-0.8 rough portion; <0.5 ambiguous food or no scale reference.",
            ),
          nutrition: nutritionSchema,
        }),
      )
      .describe(
        "One entry per distinct food item visible. Empty array if no food is present.",
      ),
    totals: nutritionSchema.describe(
      "Sum of each nutritional field across all items. All zeros if items is empty.",
    ),
    notes: z
      .string()
      .describe(
        `Caveats, warnings, or messages to the end user, written in language "${language}". Empty string if no caveats. Use this when the image is blurry, contains no food, lacks scale references, etc.`,
      ),
  });

export type AnalysisResult = z.infer<ReturnType<typeof buildAnalysisSchema>>;
