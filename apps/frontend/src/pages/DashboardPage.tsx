import { useState } from "react";
import { AddFeedbackModal } from "../components/feedback/AddFeedbackModal";
import { CameraIcon, FlameIcon, SparklesIcon, UtensilsIcon } from "../components/icons";
import { ScanMealModal } from "../components/scan/ScanMealModal";
import { StatCard } from "../components/dashboard/StatCard";
import { MOCK_MEALS } from "../data/mock-meals";
import { loadProfile } from "../lib/profile-storage";

export function DashboardPage() {
  const meals = MOCK_MEALS;
  const dailyTarget = loadProfile().targetCaloriesDaily;
  const calories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const mealsLogged = meals.length;
  const progress = Math.min(100, (calories / dailyTarget) * 100);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  return (
    <>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Daily summary based on logged meals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center gap-2 self-start rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md sm:self-auto"
          >
            <CameraIcon className="size-5" />
            Scan Meal
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Calories"
            value={calories}
            hint={`of ${dailyTarget} target daily`}
            icon={<FlameIcon />}
            accent="blue"
          />
          <StatCard
            label="Meals logged"
            value={mealsLogged}
            hint="today"
            icon={<UtensilsIcon />}
            accent="slate"
          />
          <StatCard
            label="Recommendation"
            value="—"
            hint="Based on profile & history"
            icon={<SparklesIcon />}
            accent="violet"
          />
        </div>

        <div className="mt-4 hidden sm:block">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <article className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
            <div className="flex items-center gap-4 text-sm">
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="font-medium text-blue-600 transition hover:text-blue-700"
              >
                Add feedback
              </button>
              <button
                type="button"
                className="font-medium text-slate-500 transition hover:text-slate-700"
              >
                View all
              </button>
            </div>
          </div>

          {meals.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <UtensilsIcon className="size-7" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-700">No meals logged yet</p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Scan your first meal to start tracking calories and building your history.
              </p>
              <button
                type="button"
                onClick={() => setScanOpen(true)}
                className="mt-5 inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <CameraIcon className="size-4" />
                Scan your first meal
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl">
                    {meal.imageUrl}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-900">{meal.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{meal.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{meal.calories}</p>
                    <p className="text-xs text-slate-500">cal</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <AddFeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        meals={meals}
        defaultMealId={meals[0]?.id}
      />
      <ScanMealModal open={scanOpen} onClose={() => setScanOpen(false)} />
    </>
  );
}
