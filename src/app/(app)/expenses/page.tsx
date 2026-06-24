import type { Metadata } from "next";
import { getHouseholdMembers, getUser } from "@/lib/auth/dal";
import {
  getExpenseCategories,
  getExpensesForMonth,
} from "@/lib/expenses/queries";
import { getMonthInfo } from "@/lib/expenses/month";
import { ExpensesView } from "@/components/expenses/expenses-view";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const info = getMonthInfo(month);
  const [expenses, categories, members, user] = await Promise.all([
    getExpensesForMonth(info.startDate, info.nextDate),
    getExpenseCategories(),
    getHouseholdMembers(),
    getUser(),
  ]);

  const categoryName = Object.fromEntries(
    categories.map((c) => [c.id, c.name] as const),
  );
  const memberName = Object.fromEntries(
    members.map((m) => [m.id, m.name] as const),
  );

  return (
    <ExpensesView
      expenses={expenses}
      categoryName={categoryName}
      categoryNames={categories.map((c) => c.name)}
      memberName={memberName}
      members={members}
      currentUserId={user?.id ?? null}
      month={info}
    />
  );
}
