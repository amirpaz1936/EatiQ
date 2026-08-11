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

/**
 * Layers the user's corrections over a freshly generated summary.
 *
 * Precedence is avoid > reduce > enjoyed: a term the user pinned as "avoid" must not
 * also appear as something to favour, whatever the model decided.
 */
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

  // Enforce precedence once every list is assembled.
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

/**
 * Turns a user-submitted desired state into updated overrides, by diffing it against
 * what is currently shown.
 *
 * The client edits chips, not override bookkeeping — so an entry that disappeared is
 * recorded as a removal, and one that appeared is recorded as a pin. A term moved
 * between lists counts as a pin in its new list, not a removal.
 */
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

  // A term only counts as removed if it's gone from every list — otherwise it just
  // moved. Previously-removed terms stay removed unless the user re-added one.
  next.removed = clean(
    [...existing.removed, ...droppedTerms].filter(
      (term) => !desiredEverywhere.has(term),
    ),
  );

  return next;
}
