import { useEffect, useState } from "react";
import type { NutritionTotals, ScannedMeal } from "../../api/scan";
import {
  deriveMealName,
  saveMeal,
  type MealRecord,
} from "../../api/meals";
import { reviewMeal, type MealReview } from "../../api/meal-review";

type ScanResultsCardProps = {
  result: ScannedMeal;
  onClear: () => void;
  onSaved?: (record: MealRecord) => void;
};

const round = (n: number) => Math.round(n);

function NutritionRow({ nutrition }: { nutrition: NutritionTotals }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600 sm:grid-cols-4">
      <span>
        <strong className="text-slate-900">{round(nutrition.calories)}</strong> kcal
      </span>
      <span>
        P <strong className="text-slate-900">{round(nutrition.proteinGrams)}</strong>g
      </span>
      <span>
        C <strong className="text-slate-900">{round(nutrition.carbsGrams)}</strong>g
      </span>
      <span>
        F <strong className="text-slate-900">{round(nutrition.fatGrams)}</strong>g
      </span>
    </div>
  );
}

export function ScanResultsCard({ result, onClear, onSaved }: ScanResultsCardProps) {
  const hasItems = result.items.length > 0;

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [review, setReview] = useState<MealReview | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewRequested, setReviewRequested] = useState(false);

  useEffect(() => {
    if (!hasItems) return;

    let cancelled = false;
    setReview(null);
    setReviewError(null);
    setReviewRequested(false);

    reviewMeal({
      name: deriveMealName(result.items),
      totals: result.totals,
      items: result.items,
      language: result.language,
    })
      .then((next) => {
        if (!cancelled) setReview(next);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReviewError(
          err instanceof Error ? err.message : "Couldn't check this meal",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [result, hasItems]);

  async function handleSave() {
    if (saving || saved) return;
    setSaving(true);
    setSaveError(null);
    try {
      const record = await saveMeal({
        name: deriveMealName(result.items),
        totals: result.totals,
        items: result.items,
        imageObjectKey: result.objectKey,
        language: result.language,
        notes: result.notes,
      });
      setSaved(true);
      onSaved?.(record);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save meal");
    } finally {
      setSaving(false);
    }
  }

  const saveLabel = saved ? "Saved ✓" : saving ? "Saving…" : "Save to log";

  return (
    <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Scanned meal
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Estimated nutrition from the image. Treat values as approximate.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Scan another
        </button>
      </div>

      {hasItems ? (
        <ul className="mt-5 space-y-3">
          {result.items.map((item, idx) => (
            <li
              key={`${item.name}-${idx}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
                  {round(item.confidence * 100)}% confident
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                ≈ {round(item.estimatedWeightGrams)} g · {round(item.relativeAreaPercent)}% of frame
              </p>
              <div className="mt-2">
                <NutritionRow nutrition={item.nutrition} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-slate-500">No food items detected.</p>
      )}

      <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-300">Meal totals</p>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm sm:grid-cols-4">
          <span>
            <strong>{round(result.totals.calories)}</strong> kcal
          </span>
          <span>
            P <strong>{round(result.totals.proteinGrams)}</strong>g
          </span>
          <span>
            C <strong>{round(result.totals.carbsGrams)}</strong>g
          </span>
          <span>
            F <strong>{round(result.totals.fatGrams)}</strong>g
          </span>
        </div>
      </div>

      {result.notes && (
        <p className="mt-4 text-xs text-slate-500">{result.notes}</p>
      )}

      {hasItems && (
        <div className="mt-5">
          {reviewRequested ? (
            <ReviewPanel review={review} error={reviewError} />
          ) : (
            <button
              type="button"
              onClick={() => setReviewRequested(true)}
              className="w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
            >
              Check this meal — should you eat it?
            </button>
          )}
        </div>
      )}

      {saveError && (
        <p className="mt-4 text-sm text-rose-700">{saveError}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || saved || !hasItems}
        className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {saveLabel}
      </button>

      <p className="mt-2 text-center text-xs text-slate-400">
        Saving logs this as a meal you ate.
      </p>
    </section>
  );
}

const VERDICT_STYLES = {
  ok: {
    container: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-600 text-white",
    heading: "text-emerald-900",
    label: "Good to eat",
    icon: "✓",
  },
  caution: {
    container: "border-amber-200 bg-amber-50",
    badge: "bg-amber-500 text-white",
    heading: "text-amber-900",
    label: "Eat with care",
    icon: "!",
  },
  avoid: {
    container: "border-rose-300 bg-rose-50",
    badge: "bg-rose-600 text-white",
    heading: "text-rose-900",
    label: "Better to avoid",
    icon: "✕",
  },
} as const;

function ReviewPanel({
  review,
  error,
}: {
  review: MealReview | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {error}
      </div>
    );
  }

  if (!review) {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700"
        role="status"
        aria-live="polite"
      >
        <span className="size-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-700" />
        Checking this meal against your profile…
      </div>
    );
  }

  const style = VERDICT_STYLES[review.verdict];

  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 ${style.container}`}
      role={review.verdict === "avoid" ? "alert" : "status"}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style.badge}`}
          aria-hidden
        >
          {style.icon}
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${style.heading}`}>
            {style.label}
          </p>
          <p className="mt-0.5 text-sm text-slate-700">{review.headline}</p>
        </div>
      </div>

      {review.warnings.length > 0 && (
        <ul className="mt-3 space-y-2">
          {review.warnings.map((warning, idx) => (
            <li
              key={`${warning.ingredient}-${idx}`}
              className="rounded-xl border border-white/80 bg-white/70 px-3 py-2 text-xs"
            >
              <span
                className={`font-semibold ${
                  warning.severity === "blocking"
                    ? "text-rose-700"
                    : "text-amber-700"
                }`}
              >
                {warning.ingredient}
              </span>
              <span className="text-slate-700"> — {warning.reason}</span>
            </li>
          ))}
        </ul>
      )}

      {review.notes.trim() && (
        <p className="mt-3 text-xs italic text-slate-600">{review.notes}</p>
      )}
    </div>
  );
}
