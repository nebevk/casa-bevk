import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { Cadence } from "./recurring";

export type ExpenseRow = {
  id: string;
  amount: number;
  occurred_on: string;
  description: string | null;
  category_id: string | null;
  paid_by: string | null;
};

/** Lean expense shape for multi-month aggregation (no description/id). */
export type ExpensePoint = {
  amount: number;
  occurred_on: string;
  category_id: string | null;
  paid_by: string | null;
};

export type ActiveRecurring = {
  amount: number;
  cadence: Cadence;
  interval: number;
  category_id: string | null;
};
export type CategoryRow = { id: string; name: string };
export type BudgetRow = {
  id: string;
  category_id: string | null;
  amount: number;
  member_id: string | null;
};
export type BudgetRangeRow = BudgetRow & { period_month: string };

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
  // select("*") so this stays safe before the member_id column (0003) exists.
  const { data } = await supabase
    .from("budgets")
    .select("*")
    .eq("period_month", periodMonth);
  return (data ?? []).map((b) => ({
    id: b.id,
    category_id: b.category_id,
    amount: b.amount,
    member_id: (b as { member_id?: string | null }).member_id ?? null,
  }));
}

/**
 * Fetch lean expense rows across a date window for trend aggregation. At
 * two-user scale a 6-12 month window is a few hundred rows, so we group in the
 * app layer. (A `monthly_expense_totals` SQL RPC is the future optimization if
 * volume ever grows.)
 */
export async function getExpensesInRange(
  startDate: string,
  nextDate: string,
): Promise<ExpensePoint[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("amount, occurred_on, category_id, paid_by")
    .is("deleted_at", null)
    .gte("occurred_on", startDate)
    .lt("occurred_on", nextDate);
  return data ?? [];
}

/** Budgets across a month range (inclusive), for plan-vs-actual coloring. */
export async function getBudgetsForRange(
  startMonth: string,
  endMonth: string,
): Promise<BudgetRangeRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("budgets")
    .select("*")
    .gte("period_month", startMonth)
    .lte("period_month", endMonth);
  return (data ?? []).map((b) => ({
    id: b.id,
    category_id: b.category_id,
    amount: b.amount,
    member_id: (b as { member_id?: string | null }).member_id ?? null,
    period_month: (b as { period_month?: string }).period_month ?? "",
  }));
}

/** Active recurring payments, for projecting fixed costs into the trend. */
export async function getActiveRecurring(): Promise<ActiveRecurring[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("recurring_payments")
    .select("amount, cadence, interval, category_id")
    .eq("is_active", true);
  return (data ?? []) as ActiveRecurring[];
}
