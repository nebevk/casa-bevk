import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import type { CalendarEvent } from "./recurrence";

/** All household events (recurrence is expanded client-side per visible range). */
export async function getEvents(): Promise<CalendarEvent[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_events")
    .select(
      "id, title, description, location, starts_at, ends_at, all_day, recurrence_freq, recurrence_interval, recurrence_until, color",
    )
    .order("starts_at", { ascending: true });
  return data ?? [];
}
