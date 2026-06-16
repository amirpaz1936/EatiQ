import { useEffect, useMemo, useState } from "react";
import { fetchMealsInRange, type MealRecord } from "../api/meals";
import { FlameIcon, HistoryIcon, UtensilsIcon } from "../components/icons";

type RangePreset = "today" | "7d" | "30d" | "90d" | "custom";

type SortOrder = "newest" | "oldest" | "calories-desc" | "calories-asc";

const presetLabels: Record<Exclude<RangePreset, "custom">, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const dateFormatter = new Intl.DateTimeFormat([], {
  weekday: "short",
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

export function HistoryPage() {
  const [preset, setPreset] = useState<RangePreset>("30d");
  const initial = rangeForPreset("30d");
  const [customFrom, setCustomFrom] = useState<string>(toLocalIsoDate(initial.from));
  const [customTo, setCustomTo] = useState<string>(toLocalIsoDate(initial.to));
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const { fromIso, toIso } = useMemo(() => {
    if (preset === "custom") {
      const from = new Date(`${customFrom}T00:00:00`);
      const to = new Date(`${customTo}T23:59:59.999`);
      return { fromIso: from.toISOString(), toIso: to.toISOString() };
    }
    const { from, to } = rangeForPreset(preset);
    return { fromIso: from.toISOString(), toIso: to.toISOString() };
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
      .then((rows) => {
        if (cancelled) return;
        setMeals(rows);
        setStatus("ready");
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
    const matches = q
      ? meals.filter((m) => {
          if (m.name.toLowerCase().includes(q)) return true;
          return m.items.some((it) => it.name.toLowerCase().includes(q));
        })
      : meals;
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
  }, [meals, search, sort]);

  const totalCalories = useMemo(
    () => Math.round(filtered.reduce((sum, m) => sum + m.totals.calories, 0)),
    [filtered],
  );
  const groups = useMemo(() => {
    const byTime = [...filtered].sort(
      (a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime(),
    );
    return groupByDay(byTime);
  }, [filtered]);

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
        <div className="flex items-center gap-3 self-start rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-sm sm:self-auto">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white text-slate-500">
            <HistoryIcon className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-wide text-slate-400">In range</p>
            <p className="font-semibold text-slate-900">
              {filtered.length} {filtered.length === 1 ? "meal" : "meals"}
              <span className="ml-1 font-normal text-slate-500">
                · {totalCalories.toLocaleString()} cal
              </span>
            </p>
          </div>
        </div>
      </div>

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
              <DayGroup key={g.day} day={g.day} meals={g.meals} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DayGroup({ day, meals }: { day: string; meals: MealRecord[] }) {
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
          <li
            key={meal._id}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl">
              🍽️
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-slate-900">{meal.name}</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {timeFormatter.format(new Date(meal.eatenAt))}
                {meal.items.length > 0 && (
                  <span> · {meal.items.length} {meal.items.length === 1 ? "item" : "items"}</span>
                )}
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
          </li>
        ))}
      </ul>
    </article>
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
