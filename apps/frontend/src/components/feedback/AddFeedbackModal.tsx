import { useEffect, useState } from "react";
import { saveFeedbackEntry } from "../../lib/feedback-storage";
import type { Meal } from "../../types/meal";
import type { Sentiment } from "../../types/feedback";
import { Modal } from "../Modal";
import { SelectField } from "../SelectField";
import { TextField } from "../TextField";

type AddFeedbackModalProps = {
  open: boolean;
  onClose: () => void;
  meals: Meal[];
  defaultMealId?: string;
};

const SENTIMENTS: { value: Sentiment; label: string; emoji: string }[] = [
  { value: "good", label: "Good", emoji: "🤩" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "bad", label: "Bad", emoji: "😫" },
];

export function AddFeedbackModal({
  open,
  onClose,
  meals,
  defaultMealId,
}: AddFeedbackModalProps) {
  const initialMealId = defaultMealId ?? meals[0]?.id ?? "";
  const [mealId, setMealId] = useState(initialMealId);
  const [feeling, setFeeling] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [symptoms, setSymptoms] = useState("");

  const selectedMeal = meals.find((m) => m.id === mealId) ?? meals[0];

  useEffect(() => {
    if (!open) return;
    setMealId(defaultMealId ?? meals[0]?.id ?? "");
    setFeeling("");
    setSentiment(null);
    setSymptoms("");
  }, [open, defaultMealId, meals]);

  const mealOptions = meals.map((meal) => ({
    value: meal.id,
    label: `${meal.name} • ${meal.loggedAt}`,
  }));

  function handleSave() {
    if (!selectedMeal) return;

    saveFeedbackEntry({
      id: crypto.randomUUID(),
      mealId: selectedMeal.id,
      feeling,
      sentiment,
      symptoms,
      createdAt: new Date().toISOString(),
    });

    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add feedback"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 touch-manipulation rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-10 touch-manipulation rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Save feedback
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {selectedMeal && (
          <p className="text-sm text-slate-600">
            Meal: <span className="font-medium text-slate-900">{selectedMeal.name}</span>
          </p>
        )}

        {mealOptions.length > 0 && (
          <SelectField
            id="feedback-meal"
            label="Select a meal"
            options={mealOptions}
            value={mealId}
            onChange={setMealId}
          />
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="feedback-feeling" className="text-sm font-medium text-slate-700">
            How did you feel after this meal?
          </label>
          <textarea
            id="feedback-feeling"
            rows={4}
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            placeholder="e.g., felt great / bloated / stomach pain / low energy"
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
            {SENTIMENTS.map((item) => {
              const active = sentiment === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSentiment(item.value)}
                  className={`min-h-11 touch-manipulation rounded-xl border px-2 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-1" aria-hidden>
                    {item.emoji}
                  </span>
                  {item.label}
                </button>
              );
            })}
        </div>

        <TextField
          id="feedback-symptoms"
          label="Symptoms (optional)"
          type="text"
          placeholder="e.g., bloating, cramps, nausea"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
        />
      </div>
    </Modal>
  );
}
