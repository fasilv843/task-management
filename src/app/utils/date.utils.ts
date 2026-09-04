/**
 * Local-date helpers for the `YYYY-MM-DD` values the app stores deadlines in.
 *
 * Plain functions rather than a service: none of this holds state, so injecting
 * it only forced every consumer — including validator factories, which have no
 * injector of their own — to pass an instance around.
 */

/** Today at local midnight — the boundary every "is it overdue" test compares against. */
export function startOfToday(): Date {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Parses a `YYYY-MM-DD` value as a *local* date.
 *
 * `new Date(value)` reads that format as UTC midnight and so lands on the
 * previous day for anyone west of Greenwich — the reason this helper exists.
 * Returns an invalid `Date` for anything that isn't a real calendar date, so
 * callers can test it with `Number.isNaN(date.getTime())`.
 */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date(NaN);
  }

  const date = new Date(year, month - 1, day);

  // `new Date(2025, 1, 31)` silently rolls into March, so a round-trip check is
  // the only way to reject a date that doesn't exist.
  const isRoundTrip =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return isRoundTrip ? date : new Date(NaN);
}

/** The inverse: a local `Date` back to `YYYY-MM-DD`, for `<input type="date">` and its `min`/`max`. */
export function formatDateOnly(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

/** Today as `YYYY-MM-DD`, the form the date input and its `min` attribute speak. */
export function todayDateOnly(): string {
  return formatDateOnly(startOfToday());
}

/** Current time as an ISO 8601 string, for stamping records on creation. */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Whether a `YYYY-MM-DD` value falls before today.
 *
 * The single home for the overdue rule — the task list, the details page and the
 * deadline validator all decide it here so they can never disagree.
 */
export function isBeforeToday(value: string): boolean {
  const date = parseDateOnly(value);

  return !Number.isNaN(date.getTime()) && date < startOfToday();
}

/** A `YYYY-MM-DD` value as readable prose, e.g. "Sep 5, 2026". Falls back to the raw value. */
export function formatDateLabel(value: string): string {
  const date = parseDateOnly(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
