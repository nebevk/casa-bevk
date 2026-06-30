/**
 * Recurring-payment projection helpers (pure, dependency-free).
 *
 * For the spending trend we want fixed costs to show up in EVERY month, not
 * just the month a yearly/quarterly bill happens to fall in. So we amortize each
 * active recurring payment into a monthly-equivalent amount. This smooths the
 * trend (an annual insurance bill reads as a steady monthly floor rather than a
 * one-off spike) which is what makes month-over-month comparison meaningful.
 */

export type Cadence =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export type RecurringInput = {
  amount: number;
  cadence: Cadence;
  interval: number;
  category_id: string | null;
};

// Average number of occurrences per month for one unit of each cadence.
const PER_MONTH: Record<Cadence, number> = {
  daily: 365.25 / 12,
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
  custom: 1, // no defined unit; treat the interval as months
};

/** Monthly-equivalent cost of a single recurring payment. */
export function monthlyEquivalent(r: RecurringInput): number {
  const interval = r.interval > 0 ? r.interval : 1;
  const perMonth = PER_MONTH[r.cadence] ?? 1;
  return (r.amount * perMonth) / interval;
}

/** Total monthly-equivalent fixed cost across all active recurring payments. */
export function recurringMonthlyTotal(rows: RecurringInput[]): number {
  return rows.reduce((sum, r) => sum + monthlyEquivalent(r), 0);
}

/** Monthly-equivalent fixed cost grouped by category id (null = uncategorized). */
export function recurringByCategory(rows: RecurringInput[]): Map<string | null, number> {
  const map = new Map<string | null, number>();
  for (const r of rows) {
    const v = monthlyEquivalent(r);
    map.set(r.category_id, (map.get(r.category_id) ?? 0) + v);
  }
  return map;
}
