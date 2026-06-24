import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";

export type SubscriptionRow = {
  id: string;
  name: string;
  provider: string | null;
  amount: number;
  cadence: string;
  interval: number;
  next_due_on: string | null;
  provider_id: string | null;
  category_id: string | null;
  is_active: boolean;
  notes: string | null;
};

export async function getSubscriptions(): Promise<SubscriptionRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("recurring_payments")
    .select(
      "id, name, provider, amount, cadence, interval, next_due_on, provider_id, category_id, is_active, notes",
    )
    .order("is_active", { ascending: false })
    .order("next_due_on", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });
  return data ?? [];
}
