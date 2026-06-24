import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";

export type ExpenseRow = {
  id: string;
  amount: number;
  occurred_on: string;
  description: string | null;
  category_id: string | null;
  paid_by: string | null;
};
export type CategoryRow = { id: string; name: string };
export type BudgetRow = { id: string; category_id: string | null; amount: number };

export async function getExpenseCategories(): Promise<CategoryRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("expense_categories")
    .select("id, name")
    .eq("kind", "expense")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getExpensesForMonth(
  startDate: string,
  nextDate: string,
): Promise<ExpenseRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("id, amount, occurred_on, description, category_id, paid_by")
    .is("deleted_at", null)
    .gte("occurred_on", startDate)
    .lt("occurred_on", nextDate)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getBudgetsForMonth(
  periodMonth: string,
): Promise<BudgetRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("budgets")
    .select("id, category_id, amount")
    .eq("period_month", periodMonth);
  return data ?? [];
}
