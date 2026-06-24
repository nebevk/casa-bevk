"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHousehold, getUser } from "@/lib/auth/dal";
import { ensureCategoryId } from "./categories";

async function authedContext() {
  const [user, household] = await Promise.all([getUser(), getHousehold()]);
  if (!user || !household) throw new Error("Not authorized");
  const supabase = await createClient();
  return { user, household, supabase };
}

function str(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s || null;
}

export async function addExpense(formData: FormData) {
  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) return;

  const categoryName = String(formData.get("category") ?? "").trim();
  const paidByRaw = String(formData.get("paid_by") ?? "");
  const paid_by = paidByRaw && paidByRaw !== "none" ? paidByRaw : null;
  const occurred_on =
    str(formData.get("occurred_on")) ?? new Date().toISOString().slice(0, 10);
  const description = str(formData.get("description"));

  const { user, household, supabase } = await authedContext();
  const category_id = categoryName
    ? await ensureCategoryId(supabase, household.id, categoryName)
    : null;

  await supabase.from("expenses").insert({
    household_id: household.id,
    category_id,
    paid_by,
    amount,
    occurred_on,
    description,
    created_by: user.id,
  });
  revalidatePath("/expenses");
  revalidatePath("/budgets");
}

export async function deleteExpense(id: string) {
  const { supabase } = await authedContext();
  await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/expenses");
  revalidatePath("/budgets");
}

export async function setBudget(
  categoryName: string,
  periodMonth: string,
  amount: number,
) {
  if (!Number.isFinite(amount) || amount < 0) return;
  const { household, supabase } = await authedContext();
  const category_id = await ensureCategoryId(supabase, household.id, categoryName);

  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("household_id", household.id)
    .eq("category_id", category_id)
    .eq("period_month", periodMonth)
    .maybeSingle();

  if (existing) {
    await supabase.from("budgets").update({ amount }).eq("id", existing.id);
  } else {
    await supabase.from("budgets").insert({
      household_id: household.id,
      category_id,
      period_month: periodMonth,
      amount,
    });
  }
  revalidatePath("/budgets");
}
