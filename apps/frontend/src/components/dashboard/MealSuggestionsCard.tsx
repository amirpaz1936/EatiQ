import { useCallback, useEffect, useState } from "react";
import {
  fetchMealSuggestions,
  type MealSlot,
  type MealSuggestion,
  type SuggestionsResponse,
} from "../../api/suggestions";
import { saveMeal, type MealRecord } from "../../api/meals";
import type { NutritionTotals } from "../../api/scan";
import { SparklesIcon } from "../icons";

const round = (n: number) => Math.round(n);

const slotLabels: Record<MealSlot, string> = {
  breakfast: "breakfast",
  lunch: "lunch",
  dinner: "dinner",
  snack: "a snack",
};

type Props = {
  onSaved?: (record: MealRecord) => void;
};

export function MealSuggestionsCard({ onSaved }: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((refresh = false) => {
    setStatus("loading");
    setError(null);
    fetchMealSuggestions({ refresh })
      .then((res) => {
        setData(res);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load suggestions");
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <article className="mt-8 rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/80 to-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <SparklesIcon className={`size-5 ${status === "loading" ? "animate-pulse" : ""}`} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">AI meal suggestions</h2>
            <p className="text-xs text-slate-500">
              {status === "ready" && data
                ? `Picked for ${slotLabels[data.mealSlot]}, based on your profile & today's intake`
                : "Personalized to your profile & goals"}
            </p>
          </div>
        </div>
        {status === "ready" && (
          <button
            type="button"
            onClick={() => load(true)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        )}
      </div>

      {status === "loading" && <LoadingState />}

      {status === "error" && (
        <div className="mt-6 rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-6 text-center">
          <p className="text-sm font-medium text-rose-700">Couldn't generate suggestions</p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => load(true)}
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      )}

      {status === "ready" && data && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.suggestions.map((s, idx) => (
            <SuggestionTile
              key={`${s.name}-${idx}`}
              suggestion={s}
              language={data.language}
              onSaved={onSaved}
            />
          ))}
        </ul>
      )}
    </article>
  );
}

function NutritionRow({ nutrition }: { nutrition: NutritionTotals }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
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

function SuggestionTile({
  suggestion,
  language,
  onSaved,
}: {
  suggestion: MealSuggestion;
  language: string;
  onSaved?: (record: MealRecord) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    if (saving || saved) return;
    setSaving(true);
    setSaveError(null);
    try {
      const record = await saveMeal({
        name: suggestion.name,
        totals: suggestion.nutrition,
        items: [
          {
            name: suggestion.name,
            estimatedWeightGrams: 0,
            relativeAreaPercent: 0,
            confidence: 1,
            nutrition: suggestion.nutrition,
          },
        ],
        language,
        notes: suggestion.reason,
      });
      setSaved(true);
      onSaved?.(record);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{suggestion.name}</h3>
      <p className="mt-1 text-xs text-slate-500">{suggestion.description}</p>
      <div className="mt-3">
        <NutritionRow nutrition={suggestion.nutrition} />
      </div>
      <p className="mt-3 text-xs italic text-violet-700">{suggestion.reason}</p>
      {saveError && <p className="mt-2 text-xs text-rose-700">{saveError}</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || saved}
        className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {saved ? "Added ✓" : saving ? "Adding…" : "Add to log"}
      </button>
    </li>
  );
}

function LoadingState() {
  return (
    <div className="mt-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-full rounded bg-slate-100" />
            <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
            <div className="mt-4 h-8 w-full rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-violet-700">
        <span>Generating ideas</span>
        <span className="flex gap-1">
          <span className="size-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-violet-500" />
        </span>
      </div>
    </div>
  );
}
