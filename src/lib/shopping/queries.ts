import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";

export type ShoppingItemRow = {
  id: string;
  name: string;
  quantity: number;
  category: string | null;
  is_checked: boolean;
};

/** Active shopping items for the household — unchecked first, grouped by category. */
export async function getShoppingItems(): Promise<ShoppingItemRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("shopping_items")
    .select("id, name, quantity, category, is_checked")
    .is("deleted_at", null)
    .order("is_checked", { ascending: true })
    .order("category", { ascending: true, nullsFirst: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return data ?? [];
}
