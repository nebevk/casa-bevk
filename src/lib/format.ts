/** Shared, dependency-free formatting helpers (safe in client and server). */

// The household is EUR-only by design; expenses/budgets carry a `currency`
// column for future-proofing but the UI formats everything as euros.
export function formatMoney(
  amount: number | null | undefined,
  currency = "EUR",
): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Parse a user-typed money string into a number, tolerating Slovenian locale
 * input. Handles "12,50" (comma decimal), "1.234,56" (dot grouping + comma
 * decimal) and plain "12.50"/"1234". Returns null when there is no finite
 * number, so callers can surface a validation error instead of writing NaN.
 */
export function parseMoney(input: string | number | null | undefined): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;
  s = s.replace(/[\s €]/g, "");
  if (s.includes(",")) {
    // Comma is the decimal separator (sl-SI); dots are grouping separators.
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Whole days from now until `date` (negative = in the past), or null. */
export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

/** Today's date as a local `YYYY-MM-DD` string, for <input type="date"> defaults. */
export function todayDateInput(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
