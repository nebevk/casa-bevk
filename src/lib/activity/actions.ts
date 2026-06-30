"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdId, getUser } from "@/lib/auth/dal";

async function authedContext() {
  const [user, householdId] = await Promise.all([getUser(), getHouseholdId()]);
  if (!user || !householdId) throw new Error("Not authorized");
  const supabase = (await createClient()) as unknown as SupabaseClient;
  return { user, household: { id: householdId }, supabase };
}

type StepInput = { name: string; duration_seconds: number; is_rest: boolean };

function parseSteps(raw: string): StepInput[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((s) => ({
        name: String(s?.name ?? "").trim(),
        duration_seconds: Math.min(
          3600,
          Math.max(1, Math.round(Number(s?.duration_seconds) || 30)),
        ),
        is_rest: Boolean(s?.is_rest),
      }))
      .filter((s) => s.name.length > 0)
      .slice(0, 60);
  } catch {
    return [];
  }
}

function clampRounds(v: FormDataEntryValue | null): number {
  return Math.min(20, Math.max(1, Math.round(Number(v) || 1)));
}

async function insertSteps(
  supabase: SupabaseClient,
  householdId: string,
  workoutId: string,
  steps: StepInput[],
) {
  if (steps.length === 0) return;
  const rows = steps.map((s, i) => ({
    household_id: householdId,
    workout_id: workoutId,
    position: i,
    name: s.name,
    duration_seconds: s.duration_seconds,
    is_rest: s.is_rest,
  }));
  const { error } = await supabase.from("workout_steps").insert(rows as never);
  if (error) throw error;
}

export async function createWorkout(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const rounds = clampRounds(formData.get("rounds"));
  const steps = parseSteps(String(formData.get("steps") ?? "[]"));
  const { user, household, supabase } = await authedContext();

  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({
      household_id: household.id,
      name,
      rounds,
      created_by: user.id,
    } as never)
    .select("id")
    .single();
  if (error) throw error;

  await insertSteps(supabase, household.id, (workout as { id: string }).id, steps);
  revalidatePath("/activity");
}

export async function updateWorkout(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  const rounds = clampRounds(formData.get("rounds"));
  const steps = parseSteps(String(formData.get("steps") ?? "[]"));
  const { user, supabase } = await authedContext();

  const { error } = await supabase
    .from("workouts")
    .update({ name, rounds, updated_by: user.id } as never)
    .eq("id", id);
  if (error) throw error;

  // Replace the step set wholesale (simplest correct approach for a small list).
  const { error: delErr } = await supabase
    .from("workout_steps")
    .delete()
    .eq("workout_id", id);
  if (delErr) throw delErr;

  const { household } = await authedContext();
  await insertSteps(supabase, household.id, id, steps);
  revalidatePath("/activity");
}

export async function deleteWorkout(id: string) {
  const { supabase } = await authedContext();
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/activity");
}

function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  // Only allow http(s) (blocks javascript:, data:, etc. since we link to it).
  return /^https?:\/\//i.test(withProto) ? withProto : null;
}

export async function saveSportProfile(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const memberId = String(formData.get("member_id") ?? "") || null;
  const label = String(formData.get("label") ?? "").trim() || null;
  const url = normalizeUrl(String(formData.get("url") ?? ""));
  if (!url) return;
  const { user, household, supabase } = await authedContext();

  if (id) {
    const { error } = await supabase
      .from("sport_profiles")
      .update({ url, label, member_id: memberId, updated_by: user.id } as never)
      .eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("sport_profiles").insert({
      household_id: household.id,
      member_id: memberId,
      platform: "strava",
      url,
      label,
      created_by: user.id,
    } as never);
    if (error) throw error;
  }
  revalidatePath("/activity");
}

export async function deleteSportProfile(id: string) {
  const { supabase } = await authedContext();
  const { error } = await supabase.from("sport_profiles").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/activity");
}
