import { useEffect, useState, type ReactNode } from "react";
import {
  fetchProfile,
  updateFeedbackInsights,
  updateProfile,
  type ProfileResponse,
} from "../api/profile";
import { InfoIcon, SparklesIcon } from "../components/icons";
import { SelectField } from "../components/SelectField";
import { TextAreaField } from "../components/TextAreaField";
import { TextField } from "../components/TextField";
import {
  DIET_TYPES,
  GOALS,
  INSIGHT_LISTS,
  defaultProfile,
  type FeedbackInsights,
  type InsightList,
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          These details are used to personalize your recommendations.
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <ProfileSummaryCard icon="🎯" label="Goal" value={profile.goal.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} />
        <ProfileSummaryCard
          icon="🔥"
          label="Daily target"
          value={`${profile.targetCaloriesDaily} kcal`}
        />
        <ProfileSummaryCard icon="🥗" label="Diet type" value={profile.dietType.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <ProfileSection title="Basics" icon="🧍">
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

          <ProfileSection title="Preferences" icon="🥗">
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

      <div className="mt-6">
        <FeedbackInsightsSection insights={insights} onSaved={setInsights} />
      </div>
    </section>
  );
}

function ProfileSummaryCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
          {icon}
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-slate-50 text-lg">
          {icon}
        </span>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </article>
  );
}

const INSIGHTS_TOOLTIP =
  "Patterns EatiQ learns from your meal feedback. After each feedback, we summarize which foods to avoid, ease off, or favor, and use it to tailor your suggestions. If the AI got something wrong, edit it here — your changes are kept and re-applied every time the summary regenerates.";

const LIST_META: {
  key: InsightList;
  label: string;
  tone: keyof typeof CHIP_TONES;
  placeholder: string;
}[] = [
  { key: "avoid", label: "Avoid", tone: "rose", placeholder: "e.g. dairy" },
  { key: "reduce", label: "Ease off", tone: "amber", placeholder: "e.g. fried food" },
  { key: "enjoyed", label: "Enjoyed", tone: "emerald", placeholder: "e.g. salmon" },
];

type InsightsDraft = { avoid: string[]; reduce: string[]; enjoyed: string[]; notes: string };

function toDraft(insights: FeedbackInsights | null): InsightsDraft {
  return {
    avoid: insights?.avoid ?? [],
    reduce: insights?.reduce ?? [],
    enjoyed: insights?.enjoyed ?? [],
    notes: insights?.notes ?? "",
  };
}

function sameDraft(a: InsightsDraft, b: InsightsDraft): boolean {
  return (
    a.notes.trim() === b.notes.trim() &&
    INSIGHT_LISTS.every(
      (key) =>
        a[key].length === b[key].length &&
        a[key].every((item, i) => item === b[key][i]),
    )
  );
}

function FeedbackInsightsSection({
  insights,
  onSaved,
}: {
  insights: FeedbackInsights | null;
  onSaved: (next: FeedbackInsights) => void;
}) {
  const [draft, setDraft] = useState<InsightsDraft>(() => toDraft(insights));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const serverDraft = toDraft(insights);
  const [baseline, setBaseline] = useState<InsightsDraft>(serverDraft);
  if (!sameDraft(serverDraft, baseline) && sameDraft(draft, baseline)) {
    setBaseline(serverDraft);
    setDraft(serverDraft);
  }

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const dirty = !sameDraft(draft, baseline);

  const isEmpty =
    draft.avoid.length === 0 &&
    draft.reduce.length === 0 &&
    draft.enjoyed.length === 0 &&
    !draft.notes.trim();

  function setList(key: InsightList, items: string[]) {
    setDraft((prev) => ({ ...prev, [key]: items }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const next = await updateFeedbackInsights({
        avoid: draft.avoid,
        reduce: draft.reduce,
        enjoyed: draft.enjoyed,
        notes: draft.notes,
      });
      const applied = toDraft(next);
      setDraft(applied);
      setBaseline(applied);
      setSaved(true);
      onSaved(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save insights");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-slate-50 text-lg">
          💡
        </span>
        <h2 className="text-lg font-semibold text-slate-900">
          Feedback insights
        </h2>
        <InfoTooltip text={INSIGHTS_TOOLTIP} />
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
          <SparklesIcon className="size-3.5" />
          AI-generated · editable
        </span>
      </div>
      <p className="mb-5 pl-11 text-sm text-slate-500">
        Learned from your meal feedback. Got it wrong? Fix it here — your edits
        stick and are re-applied whenever the summary updates.
      </p>

      {isEmpty && (
        <p className="mb-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3.5 py-4 text-center text-sm text-slate-400">
          No insights yet — they'll appear as you give feedback on meals. You can
          also add your own below.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {LIST_META.map(({ key, label, tone, placeholder }) => (
          <EditableChips
            key={key}
            label={label}
            tone={tone}
            placeholder={placeholder}
            items={draft[key]}
            onChange={(items) => setList(key, items)}
          />
        ))}

        <div className="flex flex-col gap-1.5 sm:col-span-3">
          <label
            htmlFor="insights-notes"
            className="text-sm font-medium text-slate-700"
          >
            Notes
          </label>
          <textarea
            id="insights-notes"
            rows={3}
            value={draft.notes}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Patterns that aren't about a single ingredient — meal timing, portion size…"
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        {error && (
          <p className="text-sm font-medium text-rose-600" role="alert">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="text-sm font-medium text-emerald-600" role="status">
            Insights saved
          </p>
        )}
        {dirty && !saving && (
          <button
            type="button"
            onClick={() => setDraft(baseline)}
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Discard
          </button>
        )}
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!dirty || saving}
          className="min-h-10 touch-manipulation rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save insights"}
        </button>
      </div>
    </article>
  );
}

const CHIP_TONES = {
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
} as const;

function EditableChips({
  label,
  items,
  tone,
  placeholder,
  onChange,
}: {
  label: string;
  items: string[];
  tone: keyof typeof CHIP_TONES;
  placeholder: string;
  onChange: (items: string[]) => void;
}) {
  const [entry, setEntry] = useState("");

  function commit() {
    const term = entry.trim().toLowerCase();
    setEntry("");
    if (!term || items.includes(term)) return;
    onChange([...items, term]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex min-h-11 flex-1 flex-wrap content-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        {items.length === 0 ? (
          <span className="text-sm text-slate-400">None</span>
        ) : (
          items.map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-1 rounded-full py-0.5 pl-2 pr-1 text-xs font-medium ring-1 ring-inset ${CHIP_TONES[tone]}`}
            >
              {item}
              <button
                type="button"
                aria-label={`Remove ${item} from ${label}`}
                onClick={() => onChange(items.filter((i) => i !== item))}
                className="flex size-4 items-center justify-center rounded-full transition hover:bg-black/10"
              >
                <span aria-hidden>×</span>
              </button>
            </span>
          ))
        )}
      </div>
      <input
        type="text"
        value={entry}
        placeholder={placeholder}
        aria-label={`Add to ${label}`}
        onChange={(e) => setEntry(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          }
        }}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25"
      />
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