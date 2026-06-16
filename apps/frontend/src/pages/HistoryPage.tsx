import { useEffect, useMemo, useState } from "react";
import { fetchMealsInRange, type MealRecord } from "../api/meals";
import {
  fetchFeedbackForMeals,
  type MealFeedbackRecord,
} from "../api/feedback";
import { FlameIcon, HistoryIcon, UtensilsIcon } from "../components/icons";
import type { Sentiment } from "../types/feedback";

type RangePreset = "today" | "7d" | "30d" | "90d" | "custom";

type SortOrder = "newest" | "oldest" | "calories-desc" | "calories-asc";

type MealSlotFilter = "all" | "breakfast" | "lunch" | "dinner" | "snack";

type FeedbackFilter = "all" | "with" | "good" | "neutral" | "bad";

const presetLabels: Record<Exclude<RangePreset, "custom">, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const slotLabels: Record<Exclude<MealSlotFilter, "all">, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const dateFormatter = new Intl.DateTimeFormat([], {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat([], {
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat([], {
  hour: "numeric",
  minute: "2-digit",
});

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toLocalIsoDate(d: Date): string {
  return isoDateFormatter.format(d);
}

function rangeForPreset(preset: Exclude<RangePreset, "custom">): {
  from: Date;
  to: Date;
} {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setHours(0, 0, 0, 0);
  if (preset === "7d") from.setDate(from.getDate() - 6);
  else if (preset === "30d") from.setDate(from.getDate() - 29);
  else if (preset === "90d") from.setDate(from.getDate() - 89);
  return { from, to };
}

function mealSlotFromDate(d: Date): Exclude<MealSlotFilter, "all"> {
  const h = d.getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

function eachDay(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    days.push(toLocalIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function groupByDay(meals: MealRecord[]): { day: string; meals: MealRecord[] }[] {
  const groups = new Map<string, MealRecord[]>();
  for (const meal of meals) {
    const key = toLocalIsoDate(new Date(meal.eatenAt));
    const existing = groups.get(key);
    if (existing) existing.push(meal);
    else groups.set(key, [meal]);
  }
  return Array.from(groups.entries()).map(([day, items]) => ({
    day,
    meals: items,
  }));
}

function downloadCsv(filename: string, meals: MealRecord[]) {
  const header = [
    "date",
    "time",
    "name",
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "items",
    "notes",
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = meals.map((m) => {
    const d = new Date(m.eatenAt);
    return [
      toLocalIsoDate(d),
      timeFormatter.format(d),
      escape(m.name),
      Math.round(m.totals.calories).toString(),
      m.totals.proteinGrams.toFixed(1),
      m.totals.carbsGrams.toFixed(1),
      m.totals.fatGrams.toFixed(1),
      m.totals.fiberGrams.toFixed(1),
      m.totals.sugarGrams.toFixed(1),
      escape(m.items.map((it) => it.name).join("; ")),
      escape(m.notes ?? ""),
    ].join(",");
  });
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function HistoryPage() {
  const [preset, setPreset] = useState<RangePreset>("30d");
  const initial = rangeForPreset("30d");
  const [customFrom, setCustomFrom] = useState<string>(toLocalIsoDate(initial.from));
  const [customTo, setCustomTo] = useState<string>(toLocalIsoDate(initial.to));
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [slotFilter, setSlotFilter] = useState<MealSlotFilter>("all");
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>("all");
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [feedbackByMeal, setFeedbackByMeal] = useState<
    Record<string, MealFeedbackRecord>
  >({});
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { fromIso, toIso, fromDate, toDate } = useMemo(() => {
    if (preset === "custom") {
      const from = new Date(`${customFrom}T00:00:00`);
      const to = new Date(`${customTo}T23:59:59.999`);
      return {
        fromIso: from.toISOString(),
        toIso: to.toISOString(),
        fromDate: from,
        toDate: to,
      };
    }
    const { from, to } = rangeForPreset(preset);
    return {
      fromIso: from.toISOString(),
      toIso: to.toISOString(),
      fromDate: from,
      toDate: to,
    };
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    if (preset === "custom") {
      const from = new Date(`${customFrom}T00:00:00`);
      const to = new Date(`${customTo}T23:59:59.999`);
      if (!(from < to)) {
        setStatus("error");
        setError("Start date must be before end date");
        return;
      }
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    fetchMealsInRange(fromIso, toIso)
      .then(async (rows) => {
        if (cancelled) return;
        setMeals(rows);
        setStatus("ready");
        const ids = rows.map((m) => m._id);
        try {
          const fbs = await fetchFeedbackForMeals(ids);
          if (cancelled) return;
          const map: Record<string, MealFeedbackRecord> = {};
          for (const fb of fbs) {
            const existing = map[fb.mealId];
            if (
              !existing ||
              new Date(fb.createdAt).getTime() > new Date(existing.createdAt).getTime()
            ) {
              map[fb.mealId] = fb;
            }
          }
          setFeedbackByMeal(map);
        } catch {
          if (!cancelled) setFeedbackByMeal({});
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load history");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [fromIso, toIso, preset, customFrom, customTo]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let matches = meals;
    if (q) {
      matches = matches.filter((m) => {
        if (m.name.toLowerCase().includes(q)) return true;
        return m.items.some((it) => it.name.toLowerCase().includes(q));
      });
    }
    if (slotFilter !== "all") {
      matches = matches.filter(
        (m) => mealSlotFromDate(new Date(m.eatenAt)) === slotFilter,
      );
    }
    if (feedbackFilter !== "all") {
      matches = matches.filter((m) => {
        const fb = feedbackByMeal[m._id];
        if (feedbackFilter === "with") return Boolean(fb);
        return fb?.sentiment === feedbackFilter;
      });
    }
    const sorted = [...matches];
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime();
        case "calories-desc":
          return b.totals.calories - a.totals.calories;
        case "calories-asc":
          return a.totals.calories - b.totals.calories;
        case "newest":
        default:
          return new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime();
      }
    });
    return sorted;
  }, [meals, search, sort, slotFilter, feedbackFilter, feedbackByMeal]);

  const stats = useMemo(() => {
    const totalCalories = filtered.reduce((s, m) => s + m.totals.calories, 0);
    const totalProtein = filtered.reduce((s, m) => s + m.totals.proteinGrams, 0);
    const totalCarbs = filtered.reduce((s, m) => s + m.totals.carbsGrams, 0);
    const totalFat = filtered.reduce((s, m) => s + m.totals.fatGrams, 0);

    const daysWithMeals = new Set(
      filtered.map((m) => toLocalIsoDate(new Date(m.eatenAt))),
    );

    const nameCounts = new Map<string, number>();
    for (const m of filtered) {
      const key = m.name.trim();
      if (!key) continue;
      nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
    }
    let topMeal: { name: string; count: number } | null = null;
    for (const [name, count] of nameCounts) {
      if (!topMeal || count > topMeal.count) topMeal = { name, count };
    }

    const avgPerDay = daysWithMeals.size
      ? Math.round(totalCalories / daysWithMeals.size)
      : 0;

    return {
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat),
      daysTracked: daysWithMeals.size,
      avgPerDay,
      topMeal,
    };
  }, [filtered]);

  const dailyCalories = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const m of filtered) {
      const key = toLocalIsoDate(new Date(m.eatenAt));
      byDay.set(key, (byDay.get(key) ?? 0) + m.totals.calories);
    }
    const days = eachDay(fromDate, toDate);
    const series = days.map((d) => ({
      day: d,
      calories: Math.round(byDay.get(d) ?? 0),
    }));
    const cap = series.length > 21 ? 21 : series.length;
    return series.slice(-cap);
  }, [filtered, fromDate, toDate]);

  const groups = useMemo(() => {
    const byTime = [...filtered].sort(
      (a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime(),
    );
    return groupByDay(byTime);
  }, [filtered]);

  const handleExport = () => {
    if (filtered.length === 0) return;
    const fromLabel = toLocalIsoDate(fromDate);
    const toLabel = toLocalIsoDate(toDate);
    downloadCsv(`eatiq-history-${fromLabel}_to_${toLabel}.csv`, filtered);
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            History
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Browse every meal you've logged.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-sm">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-slate-500">
              <HistoryIcon className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="text-xs uppercase tracking-wide text-slate-400">In range</p>
              <p className="font-semibold text-slate-900">
                {filtered.length} {filtered.length === 1 ? "meal" : "meals"}
                <span className="ml-1 font-normal text-slate-500">
                  · {stats.totalCalories.toLocaleString()} cal
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <DownloadIcon className="size-4" />
            Export CSV
          </button>
        </div>
      </div>

      {status === "ready" && filtered.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Avg / day"
            value={`${stats.avgPerDay.toLocaleString()}`}
            unit="cal"
            tint="blue"
          />
          <SummaryCard
            label="Days tracked"
            value={stats.daysTracked.toString()}
            unit={stats.daysTracked === 1 ? "day" : "days"}
            tint="emerald"
          />
          <SummaryCard
            label="Total protein"
            value={stats.totalProtein.toLocaleString()}
            unit="g"
            tint="violet"
          />
          <SummaryCard
            label="Top meal"
            value={stats.topMeal?.name ?? "—"}
            unit={
              stats.topMeal
                ? `× ${stats.topMeal.count}`
                : "no repeats"
            }
            tint="amber"
            truncate
          />
        </div>
      )}

      {status === "ready" && dailyCalories.length > 1 && filtered.length > 0 && (
        <CaloriesChart data={dailyCalories} />
      )}

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["today", "7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                preset === p
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {presetLabels[p]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPreset("custom")}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              preset === "custom"
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Custom
          </button>
        </div>

        {preset === "custom" && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-medium">From</span>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-medium">To</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(["all", "breakfast", "lunch", "dinner", "snack"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlotFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                slotFilter === s
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s === "all" ? "All meals" : slotLabels[s]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Feedback
          </span>
          {(
            [
              { id: "all", label: "Any" },
              { id: "with", label: "With feedback" },
              { id: "good", label: "😊 Good" },
              { id: "neutral", label: "😐 Neutral" },
              { id: "bad", label: "😞 Bad" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFeedbackFilter(f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                feedbackFilter === f.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by meal or ingredient…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-slate-400 focus:outline-none sm:w-56"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="calories-desc">Calories: high to low</option>
            <option value="calories-asc">Calories: low to high</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        {status === "loading" && <LoadingState />}
        {status === "error" && (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-rose-700">Couldn't load history</p>
            {error && <p className="mt-1 text-xs text-slate-500">{error}</p>}
          </div>
        )}
        {status === "ready" && groups.length === 0 && <EmptyState search={search} />}
        {status === "ready" && groups.length > 0 && (
          <div className="space-y-6">
            {groups.map((g) => (
              <DayGroup
                key={g.day}
                day={g.day}
                meals={g.meals}
                feedbackByMeal={feedbackByMeal}
                expandedId={expandedId}
                onToggle={(id) =>
                  setExpandedId((current) => (current === id ? null : id))
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DayGroup({
  day,
  meals,
  feedbackByMeal,
  expandedId,
  onToggle,
}: {
  day: string;
  meals: MealRecord[];
  feedbackByMeal: Record<string, MealFeedbackRecord>;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  const dayDate = new Date(`${day}T00:00:00`);
  const totalCalories = Math.round(
    meals.reduce((sum, m) => sum + m.totals.calories, 0),
  );

  return (
    <article>
      <header className="flex items-baseline justify-between border-b border-slate-200 pb-2">
        <h2 className="text-sm font-semibold text-slate-900">
          {dateFormatter.format(dayDate)}
        </h2>
        <p className="text-xs text-slate-500">
          {meals.length} {meals.length === 1 ? "meal" : "meals"} · {totalCalories.toLocaleString()} cal
        </p>
      </header>
      <ul className="mt-3 space-y-2">
        {meals.map((meal) => (
          <MealRow
            key={meal._id}
            meal={meal}
            feedback={feedbackByMeal[meal._id]}
            expanded={expandedId === meal._id}
            onToggle={() => onToggle(meal._id)}
          />
        ))}
      </ul>
    </article>
  );
}

function MealRow({
  meal,
  feedback,
  expanded,
  onToggle,
}: {
  meal: MealRecord;
  feedback: MealFeedbackRecord | undefined;
  expanded: boolean;
  onToggle: () => void;
}) {
  const eatenAt = new Date(meal.eatenAt);
  const slot = mealSlotFromDate(eatenAt);
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300"
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl">
          {feedback ? sentimentEmoji(feedback.sentiment) : "🍽️"}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-slate-900">{meal.name}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span>{timeFormatter.format(eatenAt)}</span>
            <SlotBadge slot={slot} />
            {meal.items.length > 0 && (
              <span>· {meal.items.length} {meal.items.length === 1 ? "item" : "items"}</span>
            )}
            {feedback && <SentimentBadge sentiment={feedback.sentiment} />}
          </p>
        </div>
        <div className="flex items-center gap-1 text-right">
          <FlameIcon className="size-4 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {Math.round(meal.totals.calories)}
            </p>
            <p className="text-xs text-slate-500">cal</p>
          </div>
        </div>
        <ChevronIcon
          className={`size-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="mt-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Macro label="Protein" value={meal.totals.proteinGrams} unit="g" />
            <Macro label="Carbs" value={meal.totals.carbsGrams} unit="g" />
            <Macro label="Fat" value={meal.totals.fatGrams} unit="g" />
            <Macro label="Fiber" value={meal.totals.fiberGrams} unit="g" />
          </div>
          {meal.items.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Items
              </p>
              <ul className="space-y-1">
                {meal.items.map((item, idx) => (
                  <li
                    key={`${meal._id}-${idx}`}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="ml-3 shrink-0 text-xs text-slate-500">
                      {Math.round(item.estimatedWeightGrams)}g ·{" "}
                      {Math.round(item.nutrition.calories)} cal
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {meal.notes && (
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Notes: </span>
              {meal.notes}
            </p>
          )}
          {feedback && <FeedbackPanel feedback={feedback} />}
        </div>
      )}
    </li>
  );
}

function FeedbackPanel({ feedback }: { feedback: MealFeedbackRecord }) {
  const tints: Record<Sentiment | "none", string> = {
    good: "border-emerald-200 bg-emerald-50",
    neutral: "border-slate-200 bg-slate-50",
    bad: "border-rose-200 bg-rose-50",
    none: "border-slate-200 bg-white",
  };
  const key: Sentiment | "none" = feedback.sentiment ?? "none";
  return (
    <div className={`rounded-lg border px-3 py-2.5 text-xs ${tints[key]}`}>
      <div className="mb-1 flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-semibold text-slate-700">
          <span className="text-base leading-none">
            {sentimentEmoji(feedback.sentiment)}
          </span>
          <span>How you felt</span>
        </p>
        <p className="text-[10px] text-slate-500">
          {new Date(feedback.createdAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
      {feedback.feeling && (
        <p className="text-slate-700">{feedback.feeling}</p>
      )}
      {feedback.symptoms && (
        <p className="mt-1.5 text-slate-600">
          <span className="font-semibold text-slate-700">Symptoms: </span>
          {feedback.symptoms}
        </p>
      )}
      {!feedback.feeling && !feedback.symptoms && (
        <p className="italic text-slate-500">No notes added.</p>
      )}
    </div>
  );
}

function sentimentEmoji(sentiment: Sentiment | null): string {
  switch (sentiment) {
    case "good":
      return "😊";
    case "neutral":
      return "😐";
    case "bad":
      return "😞";
    default:
      return "💬";
  }
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment | null }) {
  const styles: Record<Sentiment | "none", string> = {
    good: "bg-emerald-100 text-emerald-700",
    neutral: "bg-slate-200 text-slate-700",
    bad: "bg-rose-100 text-rose-700",
    none: "bg-blue-100 text-blue-700",
  };
  const labels: Record<Sentiment | "none", string> = {
    good: "Felt good",
    neutral: "Neutral",
    bad: "Felt bad",
    none: "Feedback",
  };
  const key: Sentiment | "none" = sentiment ?? "none";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[key]}`}
    >
      {labels[key]}
    </span>
  );
}

function Macro({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">
        {Math.round(value)}
        <span className="ml-0.5 text-xs font-normal text-slate-500">{unit}</span>
      </p>
    </div>
  );
}

function SlotBadge({ slot }: { slot: Exclude<MealSlotFilter, "all"> }) {
  const styles: Record<Exclude<MealSlotFilter, "all">, string> = {
    breakfast: "bg-amber-100 text-amber-700",
    lunch: "bg-emerald-100 text-emerald-700",
    dinner: "bg-indigo-100 text-indigo-700",
    snack: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[slot]}`}
    >
      {slotLabels[slot]}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  tint,
  truncate = false,
}: {
  label: string;
  value: string;
  unit: string;
  tint: "blue" | "emerald" | "violet" | "amber";
  truncate?: boolean;
}) {
  const tints: Record<typeof tint, string> = {
    blue: "from-blue-50 to-white border-blue-100",
    emerald: "from-emerald-50 to-white border-emerald-100",
    violet: "from-violet-50 to-white border-violet-100",
    amber: "from-amber-50 to-white border-amber-100",
  };
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${tints[tint]} px-4 py-3.5`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-semibold text-slate-900 ${truncate ? "truncate" : ""}`}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500">{unit}</p>
    </div>
  );
}

function CaloriesChart({ data }: { data: { day: string; calories: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.calories));
  return (
    <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/40 px-4 py-4">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-semibold text-slate-900">Calories by day</p>
        <p className="text-xs text-slate-500">
          peak {max.toLocaleString()} cal
        </p>
      </div>
      <div className="flex h-32 items-end gap-1">
        {data.map((d) => {
          const heightPct = d.calories === 0 ? 0 : Math.max(4, (d.calories / max) * 100);
          const dayDate = new Date(`${d.day}T00:00:00`);
          return (
            <div
              key={d.day}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={`${shortDateFormatter.format(dayDate)} · ${d.calories.toLocaleString()} cal`}
            >
              <div
                className={`w-full rounded-t-md transition-all ${
                  d.calories === 0
                    ? "bg-slate-200"
                    : "bg-gradient-to-t from-blue-500 to-blue-400"
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span>{shortDateFormatter.format(new Date(`${data[0]?.day}T00:00:00`))}</span>
        <span>
          {shortDateFormatter.format(
            new Date(`${data[data.length - 1]?.day}T00:00:00`),
          )}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <UtensilsIcon className="size-7" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-700">
        {search.trim() ? "No meals match your search" : "No meals in this range"}
      </p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        {search.trim()
          ? "Try a different keyword or widen the date range."
          : "Pick a wider date range or scan a new meal to start your history."}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
        />
      ))}
    </div>
  );
}

function ChevronIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v12m0 0 4-4m-4 4-4-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 20h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
