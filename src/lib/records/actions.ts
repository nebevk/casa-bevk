"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdId, getUser } from "@/lib/auth/dal";

const ASSET_TYPES = ["vehicle", "property", "other"] as const;
const PROVIDER_TYPES = [
  "internet",
  "mobile",
  "tv",
  "utility",
  "insurance",
  "other",
] as const;
const CADENCES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
] as const;

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
function num(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function pick<T extends readonly string[]>(
  options: T,
  value: FormDataEntryValue | null,
  fallback: T[number],
): T[number] {
  const v = String(value ?? "");
  return (options as readonly string[]).includes(v)
    ? (v as T[number])
    : fallback;
}

// ---- Assets -----------------------------------------------------------------

export async function addAsset(formData: FormData) {
  const type = pick(ASSET_TYPES, formData.get("type"), "other");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const attributes: Record<string, string | number> = {};
  if (type === "vehicle") {
    const make = str(formData.get("make"));
    const model = str(formData.get("model"));
    const plate = str(formData.get("plate"));
    const year = num(formData.get("year"));
    if (make) attributes.make = make;
    if (model) attributes.model = model;
    if (plate) attributes.plate = plate;
    if (year) attributes.year = year;
  } else if (type === "property") {
    const address = str(formData.get("address"));
    const size = num(formData.get("size_m2"));
    if (address) attributes.address = address;
    if (size) attributes.size_m2 = size;
  }

  const { user, household, supabase } = await authedContext();
  await supabase.from("assets").insert({
    household_id: household.id,
    type,
    name,
    attributes,
    created_by: user.id,
  });
  revalidatePath("/records");
}

export async function deleteAsset(id: string) {
  const { supabase } = await authedContext();
  await supabase.from("assets").delete().eq("id", id);
  revalidatePath("/records");
}

// ---- Maintenance log --------------------------------------------------------

export async function addMaintenanceEntry(formData: FormData) {
  const asset_id = String(formData.get("asset_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!asset_id || !title) return;

  const { user, household, supabase } = await authedContext();
  await supabase.from("maintenance_log").insert({
    household_id: household.id,
    asset_id,
    title,
    performed_on:
      str(formData.get("performed_on")) ??
      new Date().toISOString().slice(0, 10),
    cost: num(formData.get("cost")),
    vendor: str(formData.get("vendor")),
    odometer: num(formData.get("odometer")),
    next_service_on: str(formData.get("next_service_on")),
    created_by: user.id,
  });
  revalidatePath("/records");
}

export async function deleteMaintenanceEntry(id: string) {
  const { supabase } = await authedContext();
  await supabase.from("maintenance_log").delete().eq("id", id);
  revalidatePath("/records");
}

// ---- Providers --------------------------------------------------------------

function providerFields(formData: FormData) {
  return {
    type: pick(PROVIDER_TYPES, formData.get("type"), "other"),
    name: String(formData.get("name") ?? "").trim(),
    plan: str(formData.get("plan")),
    monthly_cost: num(formData.get("monthly_cost")),
    billing_cadence: pick(CADENCES, formData.get("billing_cadence"), "monthly"),
    renewal_date: str(formData.get("renewal_date")),
    account_number: str(formData.get("account_number")),
    contact: str(formData.get("contact")),
    notes: str(formData.get("notes")),
  };
}

export async function addProvider(formData: FormData) {
  const fields = providerFields(formData);
  if (!fields.name) return;
  const { user, household, supabase } = await authedContext();
  await supabase
    .from("providers")
    .insert({ household_id: household.id, created_by: user.id, ...fields });
  revalidatePath("/records");
}

export async function updateProvider(id: string, formData: FormData) {
  const fields = providerFields(formData);
  if (!fields.name) return;
  const { supabase } = await authedContext();
  await supabase.from("providers").update(fields).eq("id", id);
  revalidatePath("/records");
}

export async function deleteProvider(id: string) {
  const { supabase } = await authedContext();
  await supabase.from("providers").delete().eq("id", id);
  revalidatePath("/records");
}
