import type { MealFeedback } from "../types/feedback";

export const MOCK_FEEDBACK: MealFeedback[] = [
  {
    id: "feedback-1",
    mealId: "pasta-1",
    feeling: "Felt really full and a bit bloated after this meal. Energy was good initially but dropped after about 2 hours.",
    sentiment: "neutral",
    symptoms: "bloating, mild discomfort",
    createdAt: "2025-12-31T23:59:00.000Z",
  },
  {
    id: "feedback-2",
    mealId: "1",
    feeling: "Great energy throughout the morning! Felt satisfied and light.",
    sentiment: "good",
    symptoms: "",
    createdAt: "2026-05-15T09:00:00.000Z",
  },
  {
    id: "feedback-3",
    mealId: "2",
    feeling: "Perfect lunch, felt energized and not too heavy. Could focus well on work after.",
    sentiment: "good",
    symptoms: "",
    createdAt: "2026-05-15T14:00:00.000Z",
  },
  {
    id: "feedback-4",
    mealId: "3",
    feeling: "Light snack, kept me going until dinner without feeling sluggish.",
    sentiment: "good",
    symptoms: "",
    createdAt: "2026-05-15T16:00:00.000Z",
  },
  {
    id: "feedback-5",
    mealId: "4",
    feeling: "Delicious but felt a bit too full. Should have had a smaller portion.",
    sentiment: "neutral",
    symptoms: "fullness",
    createdAt: "2026-05-15T20:30:00.000Z",
  },
];
