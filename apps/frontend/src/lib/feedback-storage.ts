import type { MealFeedback } from "../types/feedback";

const STORAGE_KEY = "eatiq.feedback";

export function loadFeedback(): MealFeedback[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MealFeedback[];
  } catch {
    return [];
  }
}

export function saveFeedbackEntry(entry: MealFeedback): void {
  const existing = loadFeedback();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...existing]));
}
