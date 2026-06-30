export type MonthInfo = {
  key: string; // YYYY-MM
  label: string; // e.g. "June 2026"
  startDate: string; // YYYY-MM-01
  nextDate: string; // first day of the next month (exclusive end)
  periodMonth: string; // = startDate (budgets.period_month)
  prevKey: string;
  nextKey: string;
};

/** Resolve a `YYYY-MM` (or current month) into the boundaries used for queries. */
export function getMonthInfo(month?: string): MonthInfo {
  const now = new Date();
  let year: number;
  let monthIndex: number; // 0-11
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    year = y;
    monthIndex = m - 1;
  } else {
    year = now.getFullYear();
    monthIndex = now.getMonth();
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const next = new Date(Date.UTC(year, monthIndex + 1, 1));
  const prev = new Date(Date.UTC(year, monthIndex - 1, 1));

  return {
    key: `${year}-${pad(monthIndex + 1)}`,
    label: start.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    startDate: `${year}-${pad(monthIndex + 1)}-01`,
    nextDate: `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-01`,
    periodMonth: `${year}-${pad(monthIndex + 1)}-01`,
    prevKey: `${prev.getUTCFullYear()}-${pad(prev.getUTCMonth() + 1)}`,
    nextKey: `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}`,
  };
}

export type MonthBucket = {
  key: string; // YYYY-MM
  label: string; // short, e.g. "Jun"
  startDate: string; // YYYY-MM-01 (inclusive)
  nextDate: string; // first day of next month (exclusive)
  periodMonth: string; // = startDate (budgets.period_month)
};

/**
 * Build the rolling window of `count` months ending at (and including) the
 * month identified by `endKey` (a `YYYY-MM`, or the current month). Oldest
 * first, so it feeds a left-to-right trend chart directly.
 */
export function getMonthRange(endKey: string | undefined, count: number): MonthBucket[] {
  const end = getMonthInfo(endKey);
  const [ey, em] = end.key.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const buckets: MonthBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(ey, em - 1 - i, 1));
    const next = new Date(Date.UTC(ey, em - i, 1));
    const y = start.getUTCFullYear();
    const m = start.getUTCMonth() + 1;
    buckets.push({
      key: `${y}-${pad(m)}`,
      label: start.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }),
      startDate: `${y}-${pad(m)}-01`,
      nextDate: `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-01`,
      periodMonth: `${y}-${pad(m)}-01`,
    });
  }
  return buckets;
}
