const SEPARATORS = /[,;\n/]+/;

export function parseAvoidTerms(...sources: (string | string[])[]): string[] {
  const terms = new Set<string>();
  for (const source of sources) {
    const parts = Array.isArray(source) ? source : source.split(SEPARATORS);
    for (const part of parts) {
      const term = part.trim().toLowerCase();
      if (term.length > 1) terms.add(term);
    }
  }
  return [...terms];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function mentionsTerm(text: string, term: string): boolean {
  const pattern = new RegExp(`(^|[^\\p{L}])${escapeRegExp(term)}`, "iu");
  return pattern.test(text);
}

export function findViolations(texts: string[], terms: string[]): string[] {
  const haystack = texts.join(" \n ");
  return terms.filter((term) => mentionsTerm(haystack, term));
}

export function withoutAvoided(list: string[], avoidTerms: string[]): string[] {
  if (avoidTerms.length === 0) return list;
  return list.filter(
    (entry) => !avoidTerms.some((term) => mentionsTerm(entry, term)),
  );
}
