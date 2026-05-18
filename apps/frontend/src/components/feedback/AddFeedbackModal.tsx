import { useEffect, useState } from "react";
import { saveFeedbackEntry } from "../../lib/feedback-storage";
import type { MealRecord } from "../../api/meals";
import type { Sentiment } from "../../types/feedback";
import { Modal } from "../Modal";
import { SelectField } from "../SelectField";
import { TextField } from "../TextField";

type AddFeedbackModalProps = {
  open: boolean;
  onClose: () => void;
  meals: MealRecord[];
  defaultMealId?: string;
};

const timeFormatter = new Intl.DateTimeFormat([], {
  hour: "numeric",
  minute: "2-digit",
});

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
  const initialMealId = defaultMealId ?? meals[0]?._id ?? "";
  const [selectedMealId, setSelectedMealId] = useState(initialMealId);
  const [feelingDescription, setFeelingDescription] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment | null>(null);
  const [symptomsText, setSymptomsText] = useState("");

  const selectedMeal = meals.find((meal) => meal._id === selectedMealId) ?? meals[0];

  useEffect(() => {
    if (!open) return;
    setSelectedMealId(defaultMealId ?? meals[0]?._id ?? "");
    setFeelingDescription("");
    setSelectedSentiment(null);
    setSymptomsText("");
  }, [open, defaultMealId, meals]);

  const mealSelectOptions = meals.map((meal) => ({
    value: meal._id,
    label: `${meal.name} • ${timeFormatter.format(new Date(meal.eatenAt))}`,
  }));

  function handleSaveFeedback() {
    if (!selectedMeal) return;

    saveFeedbackEntry({
      id: crypto.randomUUID(),
      mealId: selectedMeal._id,
      feeling: feelingDescription,
      sentiment: selectedSentiment,
      symptoms: symptomsText,
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
            onClick={handleSaveFeedback}
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

        {mealSelectOptions.length > 0 && (
          <SelectField
            id="feedback-meal"
            label="Select a meal"
            options={mealSelectOptions}
            value={selectedMealId}
            onChange={setSelectedMealId}
          />
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="feedback-feeling" className="text-sm font-medium text-slate-700">
            How did you feel after this meal?
          </label>
          <textarea
            id="feedback-feeling"
            rows={4}
            value={feelingDescription}
            onChange={(e) => setFeelingDescription(e.target.value)}
            placeholder="e.g., felt great / bloated / stomach pain / low energy"
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
            {SENTIMENTS.map((sentimentOption) => {
              const isActive = selectedSentiment === sentimentOption.value;
              return (
                <button
                  key={sentimentOption.value}
                  type="button"
                  onClick={() => setSelectedSentiment(sentimentOption.value)}
                  className={`min-h-11 touch-manipulation rounded-xl border px-2 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-1" aria-hidden>
                    {sentimentOption.emoji}
                  </span>
                  {sentimentOption.label}
                </button>
              );
            })}
        </div>

        <TextField
          id="feedback-symptoms"
          label="Symptoms (optional)"
          type="text"
          placeholder="e.g., bloating, cramps, nausea"
          value={symptomsText}
          onChange={(e) => setSymptomsText(e.target.value)}
        />
      </div>
    </Modal>
  );
}
