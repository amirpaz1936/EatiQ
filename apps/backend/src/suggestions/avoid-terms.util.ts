/**
 * Helpers for honouring the user's avoid-list.
 *
 * The profile's `avoid` field is free text ("turkey, peanuts"), so terms are parsed
 * leniently and matched on word boundaries — substring matching would flag "turkey"
 * inside unrelated words, and exact-equality would miss "turkey breast".
 */

const SEPARATORS = /[,;\n/]+/;

/** Splits free-text and list inputs into a deduplicated set of lowercase terms. */
export function parseAvoidTerms(...sources: (string | string[])[]): string[] {
  const terms = new Set<string>();
  for (const source of sources) {
    const parts = Array.isArray(source) ? source : source.split(SEPARATORS);
    for (const part of parts) {
      const term = part.trim().toLowerCase();
      // One-character terms match far too much to be useful signal.
      if (term.length > 1) terms.add(term);
    }
  }
  return [...terms];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True when `text` mentions `term` as a whole word (or whole phrase). */
export function mentionsTerm(text: string, term: string): boolean {
  const pattern = new RegExp(`(^|[^\\p{L}])${escapeRegExp(term)}`, "iu");
  return pattern.test(text);
}

/** Every avoid-term that appears anywhere in the given texts. */
export function findViolations(texts: string[], terms: string[]): string[] {
  const haystack = texts.join(" \n ");
  return terms.filter((term) => mentionsTerm(haystack, term));
}

/**
 * Removes anything the user avoids from a "favor these" list.
 *
 * Feedback insights are inferred and the profile is explicit, so when the two
 * disagree the profile wins. Without this the prompt would say both
 * "never include turkey" and "the user enjoys turkey — favor it".
 */
export function withoutAvoided(list: string[], avoidTerms: string[]): string[] {
  if (avoidTerms.length === 0) return list;
  return list.filter(
    (entry) => !avoidTerms.some((term) => mentionsTerm(entry, term)),
  );
}
