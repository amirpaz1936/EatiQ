import type { Insights } from "./insights-schema";

export const INSIGHT_LISTS = ["avoid", "reduce", "enjoyed"] as const;
export type InsightList = (typeof INSIGHT_LISTS)[number];

export interface ManualOverrides {
  avoid: string[];
  reduce: string[];
  enjoyed: string[];
  removed: string[];
  notes: string | null;
}

export const EMPTY_OVERRIDES: ManualOverrides = {
  avoid: [],
  reduce: [],
  enjoyed: [],
  removed: [],
  notes: null,
};

const MAX_LIST = 20;

function clean(values: readonly string[] | undefined): string[] {
  const seen = new Set<string>();
  for (const value of values ?? []) {
    const term = value.trim().toLowerCase();
    if (term) seen.add(term);
  }
  return [...seen].slice(0, MAX_LIST);
}

export function normalizeInsights(raw: Partial<Insights>): Insights {
  return {
    avoid: clean(raw.avoid),
    reduce: clean(raw.reduce),
    enjoyed: clean(raw.enjoyed),
    notes: (raw.notes ?? "").trim(),
  };
}

export function normalizeOverrides(
  raw: Partial<ManualOverrides> | undefined,
): ManualOverrides {
  return {
    avoid: clean(raw?.avoid),
    reduce: clean(raw?.reduce),
    enjoyed: clean(raw?.enjoyed),
    removed: clean(raw?.removed),
    notes: raw?.notes == null ? null : raw.notes.trim(),
  };
}

export function applyManualOverrides(
  ai: Insights,
  manual: ManualOverrides,
): Insights {
  const removed = new Set(manual.removed);

  const merged: Record<InsightList, string[]> = {
    avoid: [],
    reduce: [],
    enjoyed: [],
  };

  for (const list of INSIGHT_LISTS) {
    const fromAi = ai[list].filter((term) => !removed.has(term));
    merged[list] = clean([...manual[list], ...fromAi]);
  }

  const pinnedAvoid = new Set(merged.avoid);
  merged.reduce = merged.reduce.filter((term) => !pinnedAvoid.has(term));
  const higherPriority = new Set([...merged.avoid, ...merged.reduce]);
  merged.enjoyed = merged.enjoyed.filter((term) => !higherPriority.has(term));

  return {
    avoid: merged.avoid,
    reduce: merged.reduce,
    enjoyed: merged.enjoyed,
    notes: manual.notes ?? ai.notes,
  };
}

export function deriveOverrides(
  current: Insights,
  desired: Insights,
  existing: ManualOverrides,
): ManualOverrides {
  const desiredEverywhere = new Set(
    INSIGHT_LISTS.flatMap((list) => desired[list]),
  );

  const next: ManualOverrides = {
    avoid: [],
    reduce: [],
    enjoyed: [],
    removed: [],
    notes: desired.notes.trim() ? desired.notes.trim() : null,
  };

  const droppedTerms = new Set<string>();

  for (const list of INSIGHT_LISTS) {
    const desiredSet = new Set(desired[list]);
    const added = desired[list].filter((term) => !current[list].includes(term));
    const keptPins = existing[list].filter((term) => desiredSet.has(term));

    next[list] = clean([...keptPins, ...added]);

    for (const term of current[list]) {
      if (!desiredSet.has(term)) droppedTerms.add(term);
    }
  }

  next.removed = clean(
    [...existing.removed, ...droppedTerms].filter(
      (term) => !desiredEverywhere.has(term),
    ),
  );

  return next;
}
