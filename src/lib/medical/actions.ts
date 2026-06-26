"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdId, getUser } from "@/lib/auth/dal";

const MEDICAL_KINDS = [
  "gp",
  "dentist",
  "pediatrician",
  "gynecologist",
  "specialist",
  "other",
] as const;
const REMINDER_KINDS = [
  "checkup",
  "vaccination",
  "screening",
  "other",
] as const;

// Untyped client: medical_contacts / health_reminders land in migration 0004 and
// aren't in Database until types are regenerated.
async function ctx() {
  const [user, householdId] = await Promise.all([getUser(), getHouseholdId()]);
  if (!user || !householdId) throw new Error("Not authorized");
  const db = (await createClient()) as unknown as SupabaseClient;
  return { user, householdId, db };
}

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}
function pick<T extends readonly string[]>(
  opts: T,
  v: FormDataEntryValue | null,
  fallback: T[number],
): T[number] {
  const s = String(v ?? "");
  return (opts as readonly string[]).includes(s) ? (s as T[number]) : fallback;
}
function memberId(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "");
  return s && s !== "both" ? s : null;
}
function posInt(v: FormDataEntryValue | null): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

// ---- Doctors & dentists -----------------------------------------------------

export async function addMedicalContact(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const { user, householdId, db } = await ctx();
  const { error } = await db.from("medical_contacts").insert({
    household_id: householdId,
    member_id: memberId(formData.get("member_id")),
    kind: pick(MEDICAL_KINDS, formData.get("kind"), "gp"),
    name,
    clinic: str(formData.get("clinic")),
    phone: str(formData.get("phone")),
    email: str(formData.get("email")),
    address: str(formData.get("address")),
    notes: str(formData.get("notes")),
    created_by: user.id,
  });
  if (error) throw error;
  revalidatePath("/records");
}

export async function updateMedicalContact(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const { db } = await ctx();
  const { error } = await db
    .from("medical_contacts")
    .update({
      member_id: memberId(formData.get("member_id")),
      kind: pick(MEDICAL_KINDS, formData.get("kind"), "gp"),
      name,
      clinic: str(formData.get("clinic")),
      phone: str(formData.get("phone")),
      email: str(formData.get("email")),
      address: str(formData.get("address")),
      notes: str(formData.get("notes")),
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/records");
}

export async function deleteMedicalContact(id: string) {
  const { db } = await ctx();
  const { error } = await db.from("medical_contacts").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/records");
}

// ---- Health reminders -------------------------------------------------------

export async function addHealthReminder(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const due_on = str(formData.get("due_on"));
  if (!title || !due_on) return;
  const { user, householdId, db } = await ctx();
  const { error } = await db.from("health_reminders").insert({
    household_id: householdId,
    member_id: memberId(formData.get("member_id")),
    kind: pick(REMINDER_KINDS, formData.get("kind"), "checkup"),
    title,
    due_on,
    interval_months: posInt(formData.get("interval_months")),
    notes: str(formData.get("notes")),
    created_by: user.id,
  });
  if (error) throw error;
  revalidatePath("/records");
  revalidatePath("/dashboard");
}

export async function updateHealthReminder(id: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const due_on = str(formData.get("due_on"));
  if (!title || !due_on) return;
  const { db } = await ctx();
  const { error } = await db
    .from("health_reminders")
    .update({
      member_id: memberId(formData.get("member_id")),
      kind: pick(REMINDER_KINDS, formData.get("kind"), "checkup"),
      title,
      due_on,
      interval_months: posInt(formData.get("interval_months")),
      notes: str(formData.get("notes")),
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/records");
  revalidatePath("/dashboard");
}

export async function deleteHealthReminder(id: string) {
  const { db } = await ctx();
  const { error } = await db.from("health_reminders").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/records");
  revalidatePath("/dashboard");
}

/**
 * Mark a reminder done. If it recurs (interval_months), roll due_on forward by
 * that many months instead of completing it.
 */
export async function completeHealthReminder(
  id: string,
  dueOn: string,
  intervalMonths: number | null,
) {
  const { db } = await ctx();
  if (intervalMonths && intervalMonths > 0) {
    const d = new Date(`${dueOn}T00:00:00`);
    d.setMonth(d.getMonth() + intervalMonths);
    const p = (n: number) => String(n).padStart(2, "0");
    const next = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const { error } = await db
      .from("health_reminders")
      .update({ due_on: next })
      .eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await db
      .from("health_reminders")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }
  revalidatePath("/records");
  revalidatePath("/dashboard");
}
