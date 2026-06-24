"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHousehold, getUser } from "@/lib/auth/dal";

async function authedContext() {
  const [user, household] = await Promise.all([getUser(), getHousehold()]);
  if (!user || !household) throw new Error("Not authorized");
  const supabase = await createClient();
  return { user, household, supabase };
}

export async function addShoppingItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const qty = Number(formData.get("quantity"));
  const quantity = Number.isFinite(qty) && qty > 0 ? qty : 1;
  const category = String(formData.get("category") ?? "").trim() || null;

  const { user, household, supabase } = await authedContext();

  // Shopping items require a list — lazily create a default one for the household.
  let listId: string;
  const { data: existing } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("household_id", household.id)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) {
    listId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from("shopping_lists")
      .insert({ household_id: household.id, name: "Shopping" })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Could not create list");
    listId = created.id;
  }

  await supabase.from("shopping_items").insert({
    household_id: household.id,
    list_id: listId,
    name,
    quantity,
    category,
    created_by: user.id,
  });
  revalidatePath("/shopping");
}

export async function toggleShoppingItem(id: string, checked: boolean) {
  const { supabase } = await authedContext();
  await supabase
    .from("shopping_items")
    .update({
      is_checked: checked,
      checked_at: checked ? new Date().toISOString() : null,
    })
    .eq("id", id);
  revalidatePath("/shopping");
}

export async function deleteShoppingItem(id: string) {
  const { supabase } = await authedContext();
  await supabase
    .from("shopping_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/shopping");
}

export async function clearCheckedItems() {
  const { household, supabase } = await authedContext();
  await supabase
    .from("shopping_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("household_id", household.id)
    .eq("is_checked", true)
    .is("deleted_at", null);
  revalidatePath("/shopping");
}
