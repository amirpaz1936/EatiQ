import { useEffect, useState, type ReactNode } from "react";
import { fetchProfile, updateProfile, type ProfileResponse } from "../api/profile";
import { SelectField } from "../components/SelectField";
import { TextAreaField } from "../components/TextAreaField";
import { TextField } from "../components/TextField";
import {
  DIET_TYPES,
  GOALS,
  defaultProfile,
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((p) => {
        if (!cancelled) setProfile(toFormState(p));
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
