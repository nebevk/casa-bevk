"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdId, getUser } from "@/lib/auth/dal";
import { parseMoney } from "@/lib/format";
import { ensureCategoryId } from "./categories";

async function authedContext() {
  const [user, householdId] = await Promise.all([getUser(), getHouseholdId()]);
  if (!user || !householdId) throw new Error("Not authorized");
  const supabase = await createClient();
  return { user, household: { id: householdId }, supabase };
}

function str(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s || null;
}

export async function addExpense(formData: FormData) {
  const amount = parseMoney(formData.get("amount") as string | null);
  if (amount == null || amount <= 0) return;

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

  const { error } = await supabase.from("expenses").insert({
    household_id: household.id,
    category_id,
    paid_by,
    amount,
    occurred_on,
    description,
    created_by: user.id,
  });
  if (error) throw error;
  revalidatePath("/expenses");
  revalidatePath("/budgets");
  revalidatePath("/finances");
}

export async function deleteExpense(id: string) {
  const { supabase } = await authedContext();
  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/expenses");
  revalidatePath("/budgets");
  revalidatePath("/finances");
}

export async function setBudget(
  categoryName: string,
  periodMonth: string,
  amountInput: number | string,
  memberId: string | null = null,
) {
  const amount = parseMoney(amountInput);
  if (amount == null || amount < 0) throw new Error("Invalid budget amount");
  const { household, supabase } = await authedContext();
  const category_id = await ensureCategoryId(supabase, household.id, categoryName);

  // Match the exact (household, category, month, member) row DB-side. member_id
  // distinguishes shared (NULL) from personal budgets (migration 0003).
  const findExisting = () => {
    const q = supabase
      .from("budgets")
      .select("id")
      .eq("household_id", household.id)
      .eq("category_id", category_id)
      .eq("period_month", periodMonth);
    return (memberId ? q.eq("member_id", memberId) : q.is("member_id", null)).maybeSingle();
  };

  const { data: existing } = await findExisting();
  if (existing) {
    const { error } = await supabase
      .from("budgets")
      .update({ amount })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("budgets").insert({
      household_id: household.id,
      category_id,
      period_month: periodMonth,
      amount,
      member_id: memberId,
    });
    // A concurrent save can win the race and hit the unique index — fold the
    // duplicate into an update instead of surfacing a 23505.
    if (error?.code === "23505") {
      const { data: row } = await findExisting();
      if (row) await supabase.from("budgets").update({ amount }).eq("id", row.id);
    } else if (error) {
      throw error;
    }
  }
  revalidatePath("/budgets");
  revalidatePath("/finances");
}
