import { CameraIcon, FlameIcon, SparklesIcon, UtensilsIcon } from "../components/icons";
import { StatCard } from "../components/dashboard/StatCard";
import { DashboardLayout } from "../layouts/DashboardLayout";
import type { User } from "../types/user";

const DAILY_CALORIE_TARGET = 1600;

type DashboardPageProps = {
  user: User;
  onLogout: () => void;
};

export function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const calories = 0;
  const mealsLogged = 0;
  const progress = Math.min(100, (calories / DAILY_CALORIE_TARGET) * 100);

  return (
    <DashboardLayout user={user} onLogout={onLogout}>
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
            hint={`of ${DAILY_CALORIE_TARGET} target daily`}
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
              className="mt-5 inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <CameraIcon className="size-4" />
              Scan your first meal
            </button>
          </div>
        </article>
      </section>
    </DashboardLayout>
  );
}
