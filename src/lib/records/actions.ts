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

/** Build the per-asset `attributes` jsonb from the form (typed per asset kind). */
function assetAttributes(
  type: (typeof ASSET_TYPES)[number],
  formData: FormData,
): Record<string, string | number> {
  const attributes: Record<string, string | number> = {};
  const put = (key: string, value: string | number | null) => {
    if (value !== null && value !== "") attributes[key] = value;
  };
  if (type === "vehicle") {
    put("make", str(formData.get("make")));
    put("model", str(formData.get("model")));
    put("year", num(formData.get("year")));
    put("plate", str(formData.get("plate")));
    put("engine", str(formData.get("engine")));
    put("power", str(formData.get("power")));
    put("engine_code", str(formData.get("engine_code")));
    put("gearbox", str(formData.get("gearbox")));
    put("fuel", str(formData.get("fuel")));
    put("vin", str(formData.get("vin")));
    put("current_km", num(formData.get("current_km")));
    // Slovenia: registracija (registration) + zavarovanje (yearly insurance).
    put("registration_due", str(formData.get("registration_due")));
    put("insurance_company", str(formData.get("insurance_company")));
    put("insurance_amount", num(formData.get("insurance_amount")));
    put("insurance_due", str(formData.get("insurance_due")));
    put("notes", str(formData.get("notes")));
  } else if (type === "property") {
    put("address", str(formData.get("address")));
    put("size_m2", num(formData.get("size_m2")));
    put("notes", str(formData.get("notes")));
  }
  return attributes;
}

export async function addAsset(formData: FormData) {
  const type = pick(ASSET_TYPES, formData.get("type"), "other");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { user, household, supabase } = await authedContext();
  const { error } = await supabase.from("assets").insert({
    household_id: household.id,
    type,
    name,
    attributes: assetAttributes(type, formData),
    created_by: user.id,
  });
  if (error) throw error;
  revalidatePath("/records");
}

export async function updateAsset(id: string, formData: FormData) {
  const type = pick(ASSET_TYPES, formData.get("type"), "other");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { supabase } = await authedContext();
  const { error } = await supabase
    .from("assets")
    .update({ name, attributes: assetAttributes(type, formData) })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/records");
}

export async function deleteAsset(id: string) {
  const { supabase } = await authedContext();
  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/records");
}

// ---- Maintenance log --------------------------------------------------------

export async function addMaintenanceEntry(formData: FormData) {
  const asset_id = String(formData.get("asset_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!asset_id || !title) return;

  const { user, household, supabase } = await authedContext();
  const { error } = await supabase.from("maintenance_log").insert({
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
  if (error) throw error;
  revalidatePath("/records");
  revalidatePath("/dashboard");
}

export async function deleteMaintenanceEntry(id: string) {
  const { supabase } = await authedContext();
  const { error } = await supabase
    .from("maintenance_log")
    .delete()
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/records");
  revalidatePath("/dashboard");
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
  const { error } = await supabase
    .from("providers")
    .insert({ household_id: household.id, created_by: user.id, ...fields });
  if (error) throw error;
  revalidatePath("/records");
}

export async function updateProvider(id: string, formData: FormData) {
  const fields = providerFields(formData);
  if (!fields.name) return;
  const { supabase } = await authedContext();
  const { error } = await supabase
    .from("providers")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/records");
}

export async function deleteProvider(id: string) {
  const { supabase } = await authedContext();
  const { error } = await supabase.from("providers").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/records");
}
