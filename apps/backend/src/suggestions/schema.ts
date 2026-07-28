import { z } from "zod";
import { MEAL_SLOTS, type MealSlot } from "./meal-slot.util";

// Same nutrition shape used across the platform (image-recognition + UserMeal).
const nutritionSchema = z.object({
  calories: z.number().describe("Kilocalories for one serving of this meal."),
  proteinGrams: z.number().describe("Protein in grams for one serving."),
  carbsGrams: z.number().describe("Total carbohydrates in grams for one serving."),
  fatGrams: z.number().describe("Total fat in grams for one serving."),
  fiberGrams: z.number().describe("Dietary fiber in grams for one serving."),
  sugarGrams: z.number().describe("Total sugars in grams for one serving."),
});

export const buildSuggestionsSchema = (language: string, mealSlot: MealSlot) =>
  z.object({
    language: z
      .literal(language)
      .describe(`Echo of the requested ISO 639-1 language code. MUST equal "${language}".`),
    mealSlot: z
      .literal(mealSlot)
      .describe(`Echo of the meal slot. MUST equal "${mealSlot}". One of: ${MEAL_SLOTS.join(", ")}.`),
    suggestions: z
      .array(
        z.object({
          name: z.string().describe(`Short, appetizing meal name in language "${language}".`),
          description: z
            .string()
            .describe(`One sentence describing the dish and key ingredients, in language "${language}".`),
          reason: z
            .string()
            .describe(
              `One short sentence on why this fits the user's goal/diet/remaining budget, in language "${language}".`,
            ),
          nutrition: nutritionSchema,
        }),
      )
      .length(3)
      .describe("Exactly three distinct meal options for the given slot."),
  });

export type SuggestionsResult = z.infer<ReturnType<typeof buildSuggestionsSchema>>;
