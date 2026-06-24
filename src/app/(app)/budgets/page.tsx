import type { Metadata } from "next";
import { getHouseholdMembers } from "@/lib/auth/dal";
import {
  getBudgetsForMonth,
  getExpenseCategories,
  getExpensesForMonth,
} from "@/lib/expenses/queries";
import { getMonthInfo } from "@/lib/expenses/month";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/expenses/constants";
import { BudgetView } from "@/components/budget/budget-view";

export const metadata: Metadata = { title: "Budget" };

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; member?: string }>;
}) {
  const { month, member } = await searchParams;
  const info = getMonthInfo(month);
  const [categories, budgets, expenses, members] = await Promise.all([
    getExpenseCategories(),
    getBudgetsForMonth(info.periodMonth),
    getExpensesForMonth(info.startDate, info.nextDate),
    getHouseholdMembers(),
  ]);

  const selectedMember =
    member && members.some((m) => m.id === member) ? member : null;

  const nameToId = new Map(categories.map((c) => [c.name, c.id]));

  // Budgets in the selected scope (shared = member_id null, else this member).
  const idToBudget = new Map<string, number>();
  for (const b of budgets) {
    if (b.category_id && (b.member_id ?? null) === selectedMember) {
      idToBudget.set(b.category_id, b.amount);
    }
  }

  // Spent in scope (shared = everyone; member = only what they paid).
  const idToSpent = new Map<string, number>();
  for (const e of expenses) {
    if (!e.category_id) continue;
    if (selectedMember && e.paid_by !== selectedMember) continue;
    idToSpent.set(e.category_id, (idToSpent.get(e.category_id) ?? 0) + e.amount);
  }

  const names = Array.from(
    new Set([...DEFAULT_EXPENSE_CATEGORIES, ...categories.map((c) => c.name)]),
  );
  const rows = names.map((name) => {
    const id = nameToId.get(name);
    return {
      name,
      budget: id ? (idToBudget.get(id) ?? 0) : 0,
      spent: id ? (idToSpent.get(id) ?? 0) : 0,
    };
  });

  return (
    <BudgetView
      rows={rows}
      month={info}
      members={members}
      selectedMember={selectedMember}
    />
  );
}
