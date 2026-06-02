export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

/**
 * Resolve the current meal slot from the client's local hour.
 * Buckets: 5–10 breakfast, 11–15 lunch, 17–21 dinner, everything else snack.
 * Falls back to UTC if the timezone is invalid.
 */
export function resolveMealSlot(timeZone: string, now: Date = new Date()): MealSlot {
  const hour = localHour(timeZone, now);
  if (hour >= 5 && hour <= 10) return "breakfast";
  if (hour >= 11 && hour <= 15) return "lunch";
  if (hour >= 17 && hour <= 21) return "dinner";
  return "snack";
}

function localHour(timeZone: string, now: Date): number {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone,
    }).format(now);
    const hour = Number.parseInt(formatted, 10);
    // "24" can appear in some locales for midnight; normalize to 0.
    return Number.isFinite(hour) ? hour % 24 : now.getUTCHours();
  } catch {
    return now.getUTCHours();
  }
}

/**
 * The UTC instant corresponding to the most recent local midnight in `timeZone`.
 * Computed by measuring how long ago local midnight was and subtracting from now,
 * which avoids brittle offset parsing. Falls back to UTC midnight if invalid.
 */
export function startOfDayInTimeZone(timeZone: string, now: Date = new Date()): Date {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
        .formatToParts(now)
        .map((p) => [p.type, p.value]),
    );
    const hour = Number(parts.hour) % 24;
    const minute = Number(parts.minute);
    const second = Number(parts.second);
    const sinceMidnightMs =
      ((hour * 60 + minute) * 60 + second) * 1000 + now.getMilliseconds();
    return new Date(now.getTime() - sinceMidnightMs);
  } catch {
    const utc = new Date(now);
    utc.setUTCHours(0, 0, 0, 0);
    return utc;
  }
}

/** True if the IANA timezone string is recognized by the runtime. */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
