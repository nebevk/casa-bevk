import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";

export async function getHouseholdSettings(): Promise<{
  name: string;
  currency: string;
} | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("household_settings")
    .select("name, currency")
    .limit(1)
    .maybeSingle();
  return data ?? null;
}
