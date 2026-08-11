import { useEffect, useState } from "react";
import {
  fetchFeedbackForMeals,
  saveFeedback,
  type MealFeedbackRecord,
} from "../../api/feedback";
import { ApiError } from "../../api/client";
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
  onSaved?: () => void;
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const stampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
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
  onSaved,
}: AddFeedbackModalProps) {
  const initialMealId = defaultMealId ?? meals[0]?._id ?? "";
  const [selectedMealId, setSelectedMealId] = useState(initialMealId);
  const [feelingDescription, setFeelingDescription] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment | null>(null);
  const [symptomsText, setSymptomsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<MealFeedbackRecord | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const selectedMeal = meals.find((meal) => meal._id === selectedMealId) ?? meals[0];

  useEffect(() => {
    if (!open) return;
    setSelectedMealId(defaultMealId ?? meals[0]?._id ?? "");
    setError(null);
    setSaving(false);
  }, [open, defaultMealId, meals]);

  // Feedback is one-per-meal, so opening the form for a meal that already has
  // feedback is an edit — load it and prefill rather than starting blank.
  useEffect(() => {
    if (!open || !selectedMeal) return;

    let cancelled = false;
    const mealId = selectedMeal._id;

    setLoadingExisting(true);
    setExisting(null);
    setFeelingDescription("");
    setSelectedSentiment(null);
    setSymptomsText("");

    fetchFeedbackForMeals([mealId])
      .then((rows) => {
        if (cancelled) return;
        const current = rows.find((row) => row.mealId === mealId) ?? null;
        if (current) {
          setExisting(current);
          setFeelingDescription(current.feeling);
          setSelectedSentiment(current.sentiment);
          setSymptomsText(current.symptoms);
        }
      })
      .catch(() => {
        // Treat a failed lookup as "no existing feedback" — the save is an upsert
        // either way, so the worst case is an empty form.
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, selectedMeal?._id]);

  const mealSelectOptions = meals.map((meal) => ({
    value: meal._id,
    label: `${meal.name} • ${timeFormatter.format(new Date(meal.eatenAt))}`,
  }));

  const isEditing = existing !== null;

  async function handleSaveFeedback() {
    if (!selectedMeal || saving) return;

    setSaving(true);
    setError(null);
    try {
      await saveFeedback({
        mealId: selectedMeal._id,
        feeling: feelingDescription,
        sentiment: selectedSentiment,
        symptoms: symptomsText,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save feedback",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit meal feedback" : "Add meal feedback"}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-10 touch-manipulation rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSaveFeedback()}
            disabled={!selectedMeal || saving || loadingExisting}
            className="min-h-10 touch-manipulation rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving…"
              : isEditing
                ? "Update feedback"
                : "Save feedback"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {meals.length === 0 ? (
          <p className="text-sm text-slate-600">
            Log a meal first, then you can add how you felt afterward.
          </p>
        ) : (
          <>
            {selectedMeal && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Feedback for this meal
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {selectedMeal.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {timeFormatter.format(new Date(selectedMeal.eatenAt))} ·{" "}
                  {Math.round(selectedMeal.totals.calories)} cal
                </p>
              </div>
            )}

            {mealSelectOptions.length > 1 && (
              <SelectField
                id="feedback-meal"
                label="Select a meal"
                options={mealSelectOptions}
                value={selectedMealId}
                onChange={setSelectedMealId}
              />
            )}

            {isEditing && existing && (
              <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                You already gave feedback on this meal on{" "}
                {stampFormatter.format(new Date(existing.updatedAt))}. Saving
                replaces it — it won't add a second entry.
              </p>
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
          </>
        )}

        {error && (
          <p className="text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
