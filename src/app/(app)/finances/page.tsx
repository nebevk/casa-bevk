import type { Metadata } from "next";
import { getHouseholdMembers, getUser } from "@/lib/auth/dal";
import {
  getActiveRecurring,
  getBudgetsForMonth,
  getBudgetsForRange,
  getExpenseCategories,
  getExpensesForMonth,
  getExpensesInRange,
} from "@/lib/expenses/queries";
import { getMonthInfo, getMonthRange } from "@/lib/expenses/month";
import { buildOverview, type OverviewData } from "@/lib/expenses/overview";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/expenses/constants";
import { getT } from "@/lib/i18n/server";
import { FinancesView } from "@/components/finances/finances-view";

export const metadata: Metadata = { title: "Finances" };

// Rolling window for the Overview trend.
const TREND_MONTHS = 6;

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; member?: string; view?: string }>;
}) {
  const { month, member, view: viewParam } = await searchParams;
  const view = viewParam === "overview" ? "overview" : "month";
  const info = getMonthInfo(month);
  const [categories, budgets, expenses, members, user] = await Promise.all([
    getExpenseCategories(),
    getBudgetsForMonth(info.periodMonth),
    getExpensesForMonth(info.startDate, info.nextDate),
    getHouseholdMembers(),
    getUser(),
  ]);

  const selectedMember =
    member && members.some((m) => m.id === member) ? member : null;

  const nameToId = new Map(categories.map((c) => [c.name, c.id]));
  const idToBudget = new Map<string, number>();
  for (const b of budgets) {
    if (b.category_id && (b.member_id ?? null) === selectedMember) {
      idToBudget.set(b.category_id, b.amount);
    }
  }
  const idToSpent = new Map<string, number>();
  for (const e of expenses) {
    if (!e.category_id) continue;
    if (selectedMember && e.paid_by !== selectedMember) continue;
    idToSpent.set(e.category_id, (idToSpent.get(e.category_id) ?? 0) + e.amount);
  }

  const names = Array.from(
    new Set([...DEFAULT_EXPENSE_CATEGORIES, ...categories.map((c) => c.name)]),
  );
  const budgetRows = names.map((name) => {
    const id = nameToId.get(name);
    return {
      name,
      budget: id ? (idToBudget.get(id) ?? 0) : 0,
      spent: id ? (idToSpent.get(id) ?? 0) : 0,
    };
  });

  const scopedExpenses = selectedMember
    ? expenses.filter((e) => e.paid_by === selectedMember)
    : expenses;

  const categoryName = Object.fromEntries(
    categories.map((c) => [c.id, c.name] as const),
  );
  const memberName = Object.fromEntries(
    members.map((m) => [m.id, m.name] as const),
  );

  // Overview tab: pull the rolling window + recurring costs and aggregate.
  let overview: OverviewData | null = null;
  if (view === "overview") {
    const monthsRange = getMonthRange(info.key, TREND_MONTHS);
    const [rangeExpenses, rangeBudgets, recurring, { t }] = await Promise.all([
      getExpensesInRange(monthsRange[0].startDate, info.nextDate),
      getBudgetsForRange(monthsRange[0].periodMonth, info.periodMonth),
      // Recurring costs are household-shared (no payer), so only fold them into
      // the unscoped (Shared) view to avoid mis-attributing them to one person.
      selectedMember ? Promise.resolve([]) : getActiveRecurring(),
      getT(),
    ]);
    const scopedRange = selectedMember
      ? rangeExpenses.filter((e) => e.paid_by === selectedMember)
      : rangeExpenses;
    // monthKey -> categoryId -> plan, scoped to the active member (shared = null).
    const budgetsByMonth: Record<string, Map<string, number>> = {};
    for (const b of rangeBudgets) {
      if (!b.category_id) continue;
      if ((b.member_id ?? null) !== selectedMember) continue;
      const key = b.period_month.slice(0, 7);
      (budgetsByMonth[key] ??= new Map()).set(b.category_id, b.amount);
    }
    overview = buildOverview({
      months: monthsRange,
      expenses: scopedRange,
      recurring,
      includeRecurring: !selectedMember,
      categoryName,
      uncategorizedLabel: t("finances.uncategorized"),
      otherLabel: t("finances.otherCategory"),
      budgetsByMonth,
    });
  }

  return (
    <FinancesView
      month={info}
      view={view}
      members={members}
      selectedMember={selectedMember}
      budgetRows={budgetRows}
      expenses={scopedExpenses}
      overview={overview}
      categoryName={categoryName}
      categoryNames={categories.map((c) => c.name)}
      memberName={memberName}
      currentUserId={user?.id ?? null}
    />
  );
}
