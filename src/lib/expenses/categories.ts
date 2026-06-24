import "server-only";

import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Get-or-create an expense category by name for the household. */
export async function ensureCategoryId(
  supabase: Supabase,
  householdId: string,
  name: string,
): Promise<string> {
  const { data: existing } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("household_id", householdId)
    .eq("name", name)
    .eq("kind", "expense")
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("expense_categories")
    .insert({ household_id: householdId, name, kind: "expense" })
    .select("id")
    .single();
  if (error || !created)
    throw new Error(error?.message ?? "Could not create category");
  return created.id;
}
