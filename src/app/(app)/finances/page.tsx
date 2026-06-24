import type { Metadata } from "next";
import { getHouseholdMembers, getUser } from "@/lib/auth/dal";
import {
  getBudgetsForMonth,
  getExpenseCategories,
  getExpensesForMonth,
} from "@/lib/expenses/queries";
import { getMonthInfo } from "@/lib/expenses/month";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/expenses/constants";
import { FinancesView } from "@/components/finances/finances-view";

export const metadata: Metadata = { title: "Finances" };

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; member?: string }>;
}) {
  const { month, member } = await searchParams;
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

  return (
    <FinancesView
      month={info}
      members={members}
      selectedMember={selectedMember}
      budgetRows={budgetRows}
      expenses={scopedExpenses}
      categoryName={categoryName}
      categoryNames={categories.map((c) => c.name)}
      memberName={memberName}
      currentUserId={user?.id ?? null}
    />
  );
}
