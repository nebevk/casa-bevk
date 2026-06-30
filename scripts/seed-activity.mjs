// Seeds Strava profile links + a starter workout library into the Activity
// tables. Idempotent — re-running updates existing rows (matched by name /
// member) instead of creating duplicates.
//
//   pnpm seed:activity     (run AFTER applying supabase/migrations/0009_activity.sql)
//
// Uses SUPABASE_SERVICE_ROLE_KEY (admin). Edit freely in-app afterwards.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

function loadEnvLocal() {
  const candidates = [
    join(process.cwd(), ".env.local"),
    join(dirname(fileURLToPath(import.meta.url)), "..", ".env.local"),
  ];
  for (const file of candidates) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
    return;
  }
}

loadEnvLocal();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE_KEY) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class StubWebSocket {};
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Strava links (mapped to each member by their account email) ─────────────
const STRAVA = [
  { email: "ne.bevk@gmail.com", url: "https://www.strava.com/athletes/70154120", label: "Nejc on Strava" },
  { email: "eva.demsar1@gmail.com", url: "https://www.strava.com/athletes/70154171", label: "Eva on Strava" },
];

// ── Starter workouts (timed circuits) for: 8 kg kettlebell, 2×1 kg dumbbells,
//    resistance bands, and bodyweight. work = move, rest = recovery. ──────────
const work = (name, s) => ({ name, duration_seconds: s, is_rest: false });
const rest = (s = 20) => ({ name: "Rest", duration_seconds: s, is_rest: true });

const WORKOUTS = [
  {
    name: "Kettlebell Strength (8 kg)",
    rounds: 3,
    steps: [
      work("Kettlebell swings", 40),
      work("Goblet squats", 40),
      rest(20),
      work("KB row — right", 30),
      work("KB row — left", 30),
      rest(20),
      work("KB shoulder press — right", 30),
      work("KB shoulder press — left", 30),
      rest(30),
    ],
  },
  {
    name: "Resistance Band Full-Body",
    rounds: 3,
    steps: [
      work("Band squats", 40),
      work("Band rows", 40),
      rest(20),
      work("Band chest press", 40),
      work("Band pull-aparts", 30),
      rest(20),
      work("Band glute bridge", 40),
      work("Band biceps curls", 30),
      rest(30),
    ],
  },
  {
    name: "Dumbbell Arm Burner (1 kg)",
    rounds: 2,
    steps: [
      work("Shoulder press", 30),
      work("Lateral raises", 30),
      work("Front raises", 30),
      rest(20),
      work("Biceps curls", 30),
      work("Hammer curls", 30),
      work("Triceps kickbacks", 30),
      rest(20),
      work("Fast punches", 40),
      rest(30),
    ],
  },
  {
    name: "7-Minute HIIT",
    rounds: 1,
    steps: [
      work("Jumping jacks", 30),
      rest(10),
      work("Wall sit", 30),
      rest(10),
      work("Push-ups", 30),
      rest(10),
      work("Crunches", 30),
      rest(10),
      work("Step-ups", 30),
      rest(10),
      work("Squats", 30),
      rest(10),
      work("Triceps dips", 30),
      rest(10),
      work("Plank", 30),
      rest(10),
      work("High knees", 30),
      rest(10),
      work("Alternating lunges", 30),
      rest(10),
      work("Push-up + rotation", 30),
      rest(10),
      work("Side plank", 30),
    ],
  },
  {
    name: "Mobility Flow",
    rounds: 1,
    steps: [
      work("Neck rolls", 30),
      work("Cat–cow", 40),
      work("Child's pose", 40),
      work("Cobra", 30),
      work("World's greatest stretch — right", 30),
      work("World's greatest stretch — left", 30),
      work("Standing forward fold", 40),
      work("Hip flexor stretch — right", 30),
      work("Hip flexor stretch — left", 30),
      work("Shoulder stretch — right", 20),
      work("Shoulder stretch — left", 20),
      work("Deep breathing", 60),
    ],
  },
];

async function main() {
  console.log(`Seeding Activity on ${URL}\n`);

  const { data: owner, error: oErr } = await admin
    .from("household_members")
    .select("household_id, user_id")
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (oErr) throw new Error(`household_members: ${oErr.message}`);
  if (!owner) throw new Error("No household owner — run `pnpm setup:household` first.");

  const householdId = owner.household_id;
  const createdBy = owner.user_id;

  // email -> auth user id (for sport_profiles.member_id)
  const emailToId = new Map();
  const { data: users, error: uErr } = await admin.auth.admin.listUsers();
  if (uErr) throw new Error(`listUsers: ${uErr.message}`);
  for (const u of users.users) {
    if (u.email) emailToId.set(u.email.toLowerCase(), u.id);
  }

  // ── Strava profiles ──
  for (const s of STRAVA) {
    const memberId = emailToId.get(s.email.toLowerCase()) ?? null;
    const { data: existing } = await admin
      .from("sport_profiles")
      .select("id")
      .eq("household_id", householdId)
      .eq("platform", "strava")
      .eq("member_id", memberId)
      .maybeSingle();
    const row = {
      url: s.url,
      label: s.label,
      member_id: memberId,
      platform: "strava",
    };
    if (existing) {
      const { error } = await admin
        .from("sport_profiles")
        .update(row)
        .eq("id", existing.id);
      if (error) throw new Error(`strava ${s.email}: ${error.message}`);
      console.log(`  • Strava ${s.email.padEnd(22)} updated`);
    } else {
      const { error } = await admin
        .from("sport_profiles")
        .insert({ household_id: householdId, created_by: createdBy, ...row });
      if (error) throw new Error(`strava ${s.email}: ${error.message}`);
      console.log(`  • Strava ${s.email.padEnd(22)} created`);
    }
  }

  // ── Workouts (+ steps) ──
  for (const w of WORKOUTS) {
    const { data: existing } = await admin
      .from("workouts")
      .select("id")
      .eq("household_id", householdId)
      .eq("name", w.name)
      .maybeSingle();

    let workoutId;
    if (existing) {
      workoutId = existing.id;
      const { error } = await admin
        .from("workouts")
        .update({ rounds: w.rounds })
        .eq("id", workoutId);
      if (error) throw new Error(`workout ${w.name}: ${error.message}`);
      await admin.from("workout_steps").delete().eq("workout_id", workoutId);
    } else {
      const { data: created, error } = await admin
        .from("workouts")
        .insert({
          household_id: householdId,
          created_by: createdBy,
          name: w.name,
          rounds: w.rounds,
        })
        .select("id")
        .single();
      if (error) throw new Error(`workout ${w.name}: ${error.message}`);
      workoutId = created.id;
    }

    const stepRows = w.steps.map((s, i) => ({
      household_id: householdId,
      workout_id: workoutId,
      position: i,
      name: s.name,
      duration_seconds: s.duration_seconds,
      is_rest: s.is_rest,
    }));
    const { error: sErr } = await admin.from("workout_steps").insert(stepRows);
    if (sErr) throw new Error(`steps ${w.name}: ${sErr.message}`);
    console.log(
      `  • ${w.name.padEnd(30)} ${existing ? "updated" : "created"} (${w.steps.length} steps)`,
    );
  }

  console.log("\n✓ Done.");
}

main().catch((e) => {
  console.error("\n✗ Seed failed:", e.message);
  process.exit(1);
});
