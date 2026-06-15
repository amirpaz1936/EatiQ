import { useEffect, useState, type ReactNode } from "react";
import { fetchProfile, updateProfile, type ProfileResponse } from "../api/profile";
import { InfoIcon } from "../components/icons";
import { SelectField } from "../components/SelectField";
import { TextAreaField } from "../components/TextAreaField";
import { TextField } from "../components/TextField";
import {
  DIET_TYPES,
  GOALS,
  defaultProfile,
  type FeedbackInsights,
  type UserProfile,
} from "../types/profile";

function toFormState(p: ProfileResponse | null): UserProfile {
  if (!p) return { ...defaultProfile };
  return {
    goal: p.goal ?? defaultProfile.goal,
    heightCm: p.heightCm ?? defaultProfile.heightCm,
    weightKg: p.weightKg ?? defaultProfile.weightKg,
    targetCaloriesDaily:
      p.targetCaloriesDaily ?? defaultProfile.targetCaloriesDaily,
    dietType: p.dietType ?? defaultProfile.dietType,
    avoid: p.avoid ?? "",
    notes: p.notes ?? "",
  };
}

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...defaultProfile,
  }));
  const [insights, setInsights] = useState<FeedbackInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((p) => {
        if (!cancelled) {
          setProfile(toFormState(p));
          setInsights(p.feedbackInsights ?? null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const updated = await updateProfile(profile);
      setProfile(toFormState(updated));
      setInsights(updated.feedbackInsights ?? null);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          These details are used to personalize your recommendations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <ProfileSection title="Basics">
            <SelectField
              id="profile-goal"
              label="Goal"
              options={GOALS}
              value={profile.goal}
              onChange={(v) => update("goal", v as UserProfile["goal"])}
            />
            <TextField
              id="profile-height"
              label="Height (cm)"
              type="number"
              min={1}
              max={300}
              inputMode="numeric"
              value={profile.heightCm}
              onChange={(e) => update("heightCm", Number(e.target.value) || 0)}
            />
            <TextField
              id="profile-weight"
              label="Weight (kg)"
              type="number"
              min={1}
              max={500}
              inputMode="decimal"
              step="0.1"
              value={profile.weightKg}
              onChange={(e) => update("weightKg", Number(e.target.value) || 0)}
            />
            <TextField
              id="profile-calories"
              label="Target Calories daily"
              type="number"
              min={500}
              max={10000}
              inputMode="numeric"
              value={profile.targetCaloriesDaily}
              onChange={(e) =>
                update("targetCaloriesDaily", Number(e.target.value) || 0)
              }
            />
          </ProfileSection>

          <ProfileSection title="Preferences">
            <SelectField
              id="profile-diet"
              label="Diet type"
              options={DIET_TYPES}
              value={profile.dietType}
              onChange={(v) => update("dietType", v as UserProfile["dietType"])}
            />
            <TextField
              id="profile-avoid"
              label="Avoid"
              type="text"
              placeholder="Example: spicy food, peanuts"
              value={profile.avoid}
              onChange={(e) => update("avoid", e.target.value)}
            />
            <TextAreaField
              id="profile-notes"
              label="Notes / symptoms (optional)"
              placeholder="Example: fatty food causes discomfort"
              value={profile.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </ProfileSection>
        </div>

        <FeedbackInsightsSection insights={insights} />

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
          {error && (
            <p className="text-sm font-medium text-rose-600" role="alert">
              {error}
            </p>
          )}
          {saved && !error && (
            <p className="text-sm font-medium text-emerald-600" role="status">
              Changes saved
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || loading}
            className="min-h-11 touch-manipulation rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="mb-5 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </article>
  );
}

const INSIGHTS_TOOLTIP =
  "Patterns EatiQ learns from your meal feedback. After each feedback, we summarize which foods to avoid, ease off, or favor, and use it to tailor your suggestions. It updates automatically and isn't editable here.";

function FeedbackInsightsSection({
  insights,
}: {
  insights: FeedbackInsights | null;
}) {
  const isEmpty =
    !insights ||
    (insights.avoid.length === 0 &&
      insights.reduce.length === 0 &&
      insights.enjoyed.length === 0 &&
      !insights.notes.trim());

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 opacity-90 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Feedback insights
        </h2>
        <InfoTooltip text={INSIGHTS_TOOLTIP} />
        <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
          Auto-generated
        </span>
      </div>
      <p className="mb-5 text-sm text-slate-500">
        Learned from your meal feedback. Read-only.
      </p>

      {isEmpty ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3.5 py-6 text-center text-sm text-slate-400">
          No insights yet — they'll appear here as you give feedback on meals.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <ReadOnlyChips label="Avoid" items={insights.avoid} tone="rose" />
          <ReadOnlyChips label="Ease off" items={insights.reduce} tone="amber" />
          <ReadOnlyChips
            label="Enjoyed"
            items={insights.enjoyed}
            tone="emerald"
          />
          {insights.notes.trim() && (
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <p className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">
                {insights.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

const CHIP_TONES = {
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
} as const;

function ReadOnlyChips({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: keyof typeof CHIP_TONES;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex min-h-11 flex-wrap content-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        {items.length === 0 ? (
          <span className="text-sm text-slate-400">None</span>
        ) : (
          items.map((item) => (
            <span
              key={item}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${CHIP_TONES[tone]}`}
            >
              {item}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="About feedback insights"
        className="flex size-5 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600 focus:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        <InfoIcon className="size-4" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-64 rounded-lg bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
