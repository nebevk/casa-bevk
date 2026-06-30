/**
 * Pure aggregation for the Finances "Overview" tab: turns a window of expense
 * rows (+ projected recurring costs) into a month trend, KPI deltas, a
 * category breakdown for the focus month, and the top movers vs the prior
 * month. No I/O and no React, so it is trivially testable and runs on the
 * server before serializing plain data to the chart client component.
 */

import type { MonthBucket } from "./month";
import type { ActiveRecurring, ExpensePoint } from "./queries";
import { recurringByCategory, recurringMonthlyTotal } from "./recurring";

export type TrendPoint = {
  key: string;
  label: string;
  logged: number;
  fixed: number;
  total: number;
};

export type CategorySlice = {
  id: string | null;
  name: string;
  amount: number;
  share: number; // 0..1 of the focus month total
};

export type Mover = {
  id: string | null;
  name: string;
  current: number;
  previous: number;
  delta: number;
  pct: number | null; // null when previous was 0
};

export type OverviewData = {
  trend: TrendPoint[];
  currentLabel: string;
  kpis: {
    currentTotal: number;
    prevTotal: number;
    delta: number;
    pctChange: number | null;
    avg3: number;
    vsAvg3: number;
    monthsWithData: number;
  };
  breakdown: CategorySlice[];
  movers: Mover[];
  includesRecurring: boolean;
  fixedMonthly: number;
};

type BuildParams = {
  months: MonthBucket[]; // oldest first; last entry is the focus month
  expenses: ExpensePoint[]; // already scoped to the active member
  recurring: ActiveRecurring[]; // empty when a single member is selected
  includeRecurring: boolean;
  categoryName: Record<string, string>;
  uncategorizedLabel: string;
  otherLabel: string;
  moversLimit?: number;
};

function loggedByCategory(
  expenses: ExpensePoint[],
  startDate: string,
  nextDate: string,
): Map<string | null, number> {
  const map = new Map<string | null, number>();
  for (const e of expenses) {
    if (e.occurred_on < startDate || e.occurred_on >= nextDate) continue;
    map.set(e.category_id, (map.get(e.category_id) ?? 0) + e.amount);
  }
  return map;
}

export function buildOverview({
  months,
  expenses,
  recurring,
  includeRecurring,
  categoryName,
  uncategorizedLabel,
  otherLabel,
  moversLimit = 5,
}: BuildParams): OverviewData {
  const fixedMonthly = includeRecurring ? recurringMonthlyTotal(recurring) : 0;
  const fixedByCat = includeRecurring
    ? recurringByCategory(recurring)
    : new Map<string | null, number>();

  const nameOf = (id: string | null): string =>
    id == null ? uncategorizedLabel : (categoryName[id] ?? otherLabel);

  // Per-month logged totals (fixed cost is a constant monthly-equivalent floor).
  const loggedPerMonth = months.map((m) => {
    let logged = 0;
    for (const e of expenses) {
      if (e.occurred_on >= m.startDate && e.occurred_on < m.nextDate) logged += e.amount;
    }
    return logged;
  });

  const trend: TrendPoint[] = months.map((m, i) => ({
    key: m.key,
    label: m.label,
    logged: loggedPerMonth[i],
    fixed: fixedMonthly,
    total: loggedPerMonth[i] + fixedMonthly,
  }));

  const lastIdx = months.length - 1;
  const currentTotal = trend[lastIdx]?.total ?? 0;
  const prevTotal = lastIdx >= 1 ? trend[lastIdx - 1].total : 0;
  const delta = currentTotal - prevTotal;
  const pctChange = prevTotal > 0 ? (delta / prevTotal) * 100 : null;

  const priorThree = trend.slice(Math.max(0, lastIdx - 3), lastIdx);
  const avg3 = priorThree.length
    ? priorThree.reduce((s, p) => s + p.total, 0) / priorThree.length
    : 0;
  const vsAvg3 = currentTotal - avg3;
  const monthsWithData = trend.filter((p) => p.total > 0).length;

  // Focus-month category breakdown: logged + projected fixed, merged by category.
  const focus = months[lastIdx];
  const currentLogged = focus
    ? loggedByCategory(expenses, focus.startDate, focus.nextDate)
    : new Map<string | null, number>();
  const breakdownMap = new Map<string | null, number>(currentLogged);
  for (const [id, v] of fixedByCat) {
    breakdownMap.set(id, (breakdownMap.get(id) ?? 0) + v);
  }
  const breakdownTotal = [...breakdownMap.values()].reduce((s, v) => s + v, 0);
  const breakdown: CategorySlice[] = [...breakdownMap.entries()]
    .filter(([, amount]) => amount > 0.005)
    .map(([id, amount]) => ({
      id,
      name: nameOf(id),
      amount,
      share: breakdownTotal > 0 ? amount / breakdownTotal : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Top movers vs the previous month (fixed cost is constant, so it cancels).
  const prev = months[lastIdx - 1];
  const prevLogged = prev
    ? loggedByCategory(expenses, prev.startDate, prev.nextDate)
    : new Map<string | null, number>();
  const moverIds = new Set<string | null>([...currentLogged.keys(), ...prevLogged.keys()]);
  const movers: Mover[] = [...moverIds]
    .map((id) => {
      const current = currentLogged.get(id) ?? 0;
      const previous = prevLogged.get(id) ?? 0;
      const d = current - previous;
      return {
        id,
        name: nameOf(id),
        current,
        previous,
        delta: d,
        pct: previous > 0 ? (d / previous) * 100 : null,
      };
    })
    .filter((m) => Math.abs(m.delta) > 0.005)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, moversLimit);

  return {
    trend,
    currentLabel: focus?.label ?? "",
    kpis: { currentTotal, prevTotal, delta, pctChange, avg3, vsAvg3, monthsWithData },
    breakdown,
    movers,
    includesRecurring: includeRecurring && fixedMonthly > 0,
    fixedMonthly,
  };
}
