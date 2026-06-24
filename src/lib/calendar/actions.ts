"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHousehold, getUser } from "@/lib/auth/dal";

const FREQS = ["none", "daily", "weekly", "monthly", "yearly"] as const;

async function authedContext() {
  const [user, household] = await Promise.all([getUser(), getHousehold()]);
  if (!user || !household) throw new Error("Not authorized");
  const supabase = await createClient();
  return { user, household, supabase };
}

function str(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s || null;
}
function pickFreq(value: FormDataEntryValue | null): (typeof FREQS)[number] {
  const v = String(value ?? "");
  return (FREQS as readonly string[]).includes(v)
    ? (v as (typeof FREQS)[number])
    : "none";
}

function eventFields(formData: FormData) {
  const recurrence_freq = pickFreq(formData.get("recurrence_freq"));
  return {
    title: String(formData.get("title") ?? "").trim(),
    starts_at: str(formData.get("starts_at")),
    ends_at: str(formData.get("ends_at")),
    all_day: formData.get("all_day") === "true",
    recurrence_freq,
    recurrence_until:
      recurrence_freq !== "none" ? str(formData.get("recurrence_until")) : null,
    location: str(formData.get("location")),
    description: str(formData.get("description")),
  };
}

export async function addEvent(formData: FormData) {
  const f = eventFields(formData);
  if (!f.title || !f.starts_at) return;
  const { user, household, supabase } = await authedContext();
  await supabase.from("calendar_events").insert({
    household_id: household.id,
    created_by: user.id,
    title: f.title,
    starts_at: f.starts_at,
    ends_at: f.ends_at,
    all_day: f.all_day,
    recurrence_freq: f.recurrence_freq,
    recurrence_until: f.recurrence_until,
    location: f.location,
    description: f.description,
  });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function updateEvent(id: string, formData: FormData) {
  const f = eventFields(formData);
  if (!f.title || !f.starts_at) return;
  const { supabase } = await authedContext();
  await supabase
    .from("calendar_events")
    .update({
      title: f.title,
      starts_at: f.starts_at,
      ends_at: f.ends_at,
      all_day: f.all_day,
      recurrence_freq: f.recurrence_freq,
      recurrence_until: f.recurrence_until,
      location: f.location,
      description: f.description,
    })
    .eq("id", id);
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function deleteEvent(id: string) {
  const { supabase } = await authedContext();
  await supabase.from("calendar_events").delete().eq("id", id);
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
