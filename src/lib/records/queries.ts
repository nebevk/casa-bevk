import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";

export type AssetRow = {
  id: string;
  type: string;
  name: string;
  attributes: Record<string, unknown>;
};

export type MaintenanceRow = {
  id: string;
  asset_id: string;
  title: string;
  performed_on: string;
  cost: number | null;
  vendor: string | null;
  odometer: number | null;
  next_service_on: string | null;
};

export type ProviderRow = {
  id: string;
  type: string;
  name: string;
  plan: string | null;
  monthly_cost: number | null;
  billing_cadence: string;
  renewal_date: string | null;
  account_number: string | null;
  contact: string | null;
  notes: string | null;
};

export async function getAssets(): Promise<AssetRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("assets")
    .select("id, type, name, attributes")
    .order("type", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []).map((a) => ({
    id: a.id,
    type: a.type,
    name: a.name,
    attributes: (a.attributes ?? {}) as Record<string, unknown>,
  }));
}

export async function getMaintenanceEntries(): Promise<MaintenanceRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("maintenance_log")
    .select("id, asset_id, title, performed_on, cost, vendor, odometer, next_service_on")
    .order("performed_on", { ascending: false });
  return data ?? [];
}

export async function getProviders(): Promise<ProviderRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("providers")
    .select(
      "id, type, name, plan, monthly_cost, billing_cadence, renewal_date, account_number, contact, notes",
    )
    .order("type", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}
