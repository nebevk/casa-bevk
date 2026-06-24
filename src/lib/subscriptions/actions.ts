"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHousehold, getUser } from "@/lib/auth/dal";
import { ensureCategoryId } from "@/lib/expenses/categories";

const CADENCES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
] as const;

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
function pickCadence(value: FormDataEntryValue | null): (typeof CADENCES)[number] {
  const v = String(value ?? "");
  return (CADENCES as readonly string[]).includes(v)
    ? (v as (typeof CADENCES)[number])
    : "monthly";
}

/** Advance a YYYY-MM-DD date by one cadence interval. */
function advance(dateStr: string, cadence: string, interval: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const n = Math.max(1, interval || 1);
  if (cadence === "daily") d.setDate(d.getDate() + n);
  else if (cadence === "weekly") d.setDate(d.getDate() + 7 * n);
  else if (cadence === "quarterly") d.setMonth(d.getMonth() + 3 * n);
  else if (cadence === "yearly") d.setFullYear(d.getFullYear() + n);
  else d.setMonth(d.getMonth() + n); // monthly + custom
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function subscriptionFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    provider: str(formData.get("provider")),
    amount: Number(formData.get("amount")),
    cadence: pickCadence(formData.get("cadence")),
    next_due_on: str(formData.get("next_due_on")),
    provider_id: str(formData.get("provider_id")),
    notes: str(formData.get("notes")),
  };
}

export async function addSubscription(formData: FormData) {
  const f = subscriptionFields(formData);
  if (!f.name || !Number.isFinite(f.amount) || f.amount < 0) return;
  const { user, household, supabase } = await authedContext();
  await supabase.from("recurring_payments").insert({
    household_id: household.id,
    created_by: user.id,
    name: f.name,
    provider: f.provider,
    amount: f.amount,
    cadence: f.cadence,
    interval: 1,
    next_due_on: f.next_due_on,
    provider_id: f.provider_id,
    notes: f.notes,
    is_active: true,
  });
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function updateSubscription(id: string, formData: FormData) {
  const f = subscriptionFields(formData);
  if (!f.name || !Number.isFinite(f.amount) || f.amount < 0) return;
  const { supabase } = await authedContext();
  await supabase
    .from("recurring_payments")
    .update({
      name: f.name,
      provider: f.provider,
      amount: f.amount,
      cadence: f.cadence,
      next_due_on: f.next_due_on,
      provider_id: f.provider_id,
      notes: f.notes,
    })
    .eq("id", id);
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function deleteSubscription(id: string) {
  const { supabase } = await authedContext();
  await supabase.from("recurring_payments").delete().eq("id", id);
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function toggleSubscriptionActive(id: string, isActive: boolean) {
  const { supabase } = await authedContext();
  await supabase
    .from("recurring_payments")
    .update({ is_active: isActive })
    .eq("id", id);
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

/** Log this payment as an expense (Fiksni stroški) and advance the next due date. */
export async function markSubscriptionPaid(id: string) {
  const { user, household, supabase } = await authedContext();
  const { data: sub } = await supabase
    .from("recurring_payments")
    .select("name, amount, cadence, interval, next_due_on, category_id")
    .eq("id", id)
    .maybeSingle();
  if (!sub) return;

  const categoryId =
    sub.category_id ??
    (await ensureCategoryId(supabase, household.id, "Fiksni stroški"));
  const occurredOn = sub.next_due_on ?? new Date().toISOString().slice(0, 10);

  await supabase.from("expenses").insert({
    household_id: household.id,
    created_by: user.id,
    category_id: categoryId,
    amount: sub.amount,
    occurred_on: occurredOn,
    description: `${sub.name} (naročnina)`,
  });

  if (sub.next_due_on) {
    await supabase
      .from("recurring_payments")
      .update({ next_due_on: advance(sub.next_due_on, sub.cadence, sub.interval) })
      .eq("id", id);
  }

  revalidatePath("/subscriptions");
  revalidatePath("/expenses");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}
