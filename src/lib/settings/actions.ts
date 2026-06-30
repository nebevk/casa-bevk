"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdId, getUser } from "@/lib/auth/dal";

/** Per-user UI language. Upserts user_settings (the row may not exist yet). */
export async function setLocale(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const raw = String(formData.get("locale") ?? "");
  const locale = raw === "en" || raw === "sl" ? raw : "sl";
  // Untyped: `locale` arrives in migration 0010.
  const supabase = (await createClient()) as unknown as SupabaseClient;
  await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, locale } as never, { onConflict: "user_id" });
  // Re-render every route under the root layout in the new language.
  revalidatePath("/", "layout");
}

export async function updateProfile(formData: FormData) {
  const user = await getUser();
  if (!user) return;
  const displayName = String(formData.get("display_name") ?? "").trim() || null;
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateHouseholdSettings(formData: FormData) {
  const [user, householdId] = await Promise.all([getUser(), getHouseholdId()]);
  if (!user || !householdId) return;
  const name = String(formData.get("name") ?? "").trim() || "Our Home";
  const raw = String(formData.get("currency") ?? "EUR")
    .trim()
    .toUpperCase();
  const currency = /^[A-Z]{3}$/.test(raw) ? raw : "EUR";

  const supabase = await createClient();
  // RLS allows only the household owner to update these (members no-op silently).
  await supabase
    .from("household_settings")
    .update({ name, currency })
    .eq("household_id", householdId);
  await supabase.from("households").update({ name }).eq("id", householdId);
  revalidatePath("/settings");
}
