import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";

// medical_contacts + health_reminders ship in migration 0004. Until it's applied
// and types are regenerated they aren't in Database, so we talk to them through
// an untyped client and fail soft (empty list) if the tables don't exist yet.

export type MedicalContactRow = {
  id: string;
  member_id: string | null;
  kind: string;
  name: string;
  clinic: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export type HealthReminderRow = {
  id: string;
  member_id: string | null;
  kind: string;
  title: string;
  due_on: string;
  interval_months: number | null;
  notes: string | null;
  completed_at: string | null;
};

export async function getMedicalContacts(): Promise<MedicalContactRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = (await createClient()) as unknown as SupabaseClient;
  try {
    const { data, error } = await supabase
      .from("medical_contacts")
      .select("id, member_id, kind, name, clinic, phone, email, address, notes")
      .order("kind", { ascending: true })
      .order("name", { ascending: true });
    if (error) return [];
    return (data ?? []) as MedicalContactRow[];
  } catch {
    return [];
  }
}

export async function getHealthReminders(): Promise<HealthReminderRow[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = (await createClient()) as unknown as SupabaseClient;
  try {
    const { data, error } = await supabase
      .from("health_reminders")
      .select(
        "id, member_id, kind, title, due_on, interval_months, notes, completed_at",
      )
      .is("completed_at", null)
      .order("due_on", { ascending: true });
    if (error) return [];
    return (data ?? []) as HealthReminderRow[];
  } catch {
    return [];
  }
}
