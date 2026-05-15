export type Sentiment = "good" | "neutral" | "bad";

export type MealFeedback = {
  id: string;
  mealId: string;
  feeling: string;
  sentiment: Sentiment | null;
  symptoms: string;
  createdAt: string;
};
