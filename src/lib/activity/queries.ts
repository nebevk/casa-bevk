import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";

export type WorkoutStep = {
  id: string;
  name: string;
  duration_seconds: number;
  is_rest: boolean;
  position: number;
};

export type Workout = {
  id: string;
  name: string;
  description: string | null;
  rounds: number;
  steps: WorkoutStep[];
};

export type SportProfile = {
  id: string;
  member_id: string | null;
  platform: string;
  label: string | null;
  url: string;
};

type Row = Record<string, unknown>;

/** Shared household workout library, with each workout's ordered steps. */
export async function getWorkouts(): Promise<Workout[]> {
  const user = await getUser();
  if (!user) return [];
  // Untyped client: these tables arrive in migration 0009 (types not regen'd yet).
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .order("created_at", { ascending: true });
  if (!workouts || workouts.length === 0) return [];

  const { data: steps } = await supabase
    .from("workout_steps")
    .select("*")
    .order("position", { ascending: true });

  const byWorkout = new Map<string, WorkoutStep[]>();
  for (const s of (steps ?? []) as Row[]) {
    const wid = String(s.workout_id);
    const arr = byWorkout.get(wid) ?? [];
    arr.push({
      id: String(s.id),
      name: String(s.name ?? ""),
      duration_seconds: Number(s.duration_seconds ?? 30),
      is_rest: Boolean(s.is_rest),
      position: Number(s.position ?? 0),
    });
    byWorkout.set(wid, arr);
  }

  return (workouts as Row[]).map((w) => ({
    id: String(w.id),
    name: String(w.name ?? ""),
    description: (w.description as string | null) ?? null,
    rounds: Number(w.rounds ?? 1),
    steps: byWorkout.get(String(w.id)) ?? [],
  }));
}

/** Per-member sport links (Strava). Shared across the household. */
export async function getSportProfiles(): Promise<SportProfile[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase.from("sport_profiles").select("*");
  return ((data ?? []) as Row[]).map((p) => ({
    id: String(p.id),
    member_id: (p.member_id as string | null) ?? null,
    platform: String(p.platform ?? "strava"),
    label: (p.label as string | null) ?? null,
    url: String(p.url ?? ""),
  }));
}
