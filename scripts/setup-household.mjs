// One-off admin setup for Casa Bevk.
// Creates the two household users (auto-confirmed) and bootstraps the household,
// memberships, and settings. Idempotent — safe to re-run.
//
//   pnpm setup:household
//
// Uses SUPABASE_SERVICE_ROLE_KEY (admin, bypasses RLS) — local/owner use only.
// Passwords: read from SETUP_NEJC_PASSWORD / SETUP_EVA_PASSWORD if present in
// .env.local, otherwise strong ones are generated and printed once.

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error(
    "✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MEMBERS = [
  { name: "Nejc", email: "ne.bevk@gmail.com", role: "owner", passwordEnv: "SETUP_NEJC_PASSWORD" },
  { name: "Eva", email: "eva.demsar1@gmail.com", role: "member", passwordEnv: "SETUP_EVA_PASSWORD" },
];

const generated = [];

async function ensureUser(m, existingUsers) {
  let user = existingUsers.find(
    (u) => (u.email ?? "").toLowerCase() === m.email.toLowerCase(),
  );
  let status;

  if (user) {
    status = "exists";
    const pw = process.env[m.passwordEnv];
    if (pw) {
      const { error } = await admin.auth.admin.updateUserById(user.id, { password: pw });
      if (error) throw new Error(`update ${m.email}: ${error.message}`);
      status = "exists (password updated)";
    }
  } else {
    let pw = process.env[m.passwordEnv];
    if (!pw) {
      pw = randomBytes(12).toString("base64url");
      generated.push({ email: m.email, password: pw });
    }
    const { data, error } = await admin.auth.admin.createUser({
      email: m.email,
      password: pw,
      email_confirm: true,
      user_metadata: { display_name: m.name },
    });
    if (error) throw new Error(`create ${m.email}: ${error.message}`);
    user = data.user;
    status = "created";
  }

  // Make sure the profile row exists (FK target for household_members).
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: user.id, display_name: m.name }, { onConflict: "id", ignoreDuplicates: true });
  if (pErr) throw new Error(`profile ${m.email}: ${pErr.message}`);

  return { ...m, id: user.id, status };
}

async function main() {
  console.log(`Setting up Casa Bevk household on ${URL}\n`);

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw new Error(`listUsers: ${listErr.message}`);

  const resolved = [];
  for (const m of MEMBERS) resolved.push(await ensureUser(m, list.users));
  for (const r of resolved) {
    console.log(`  • ${r.name.padEnd(5)} ${r.email.padEnd(26)} ${r.status}`);
  }

  const owner = resolved.find((r) => r.role === "owner");

  // Reuse the owner's household if one already exists.
  let householdId;
  const { data: existing } = await admin
    .from("household_members")
    .select("household_id")
    .eq("user_id", owner.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    householdId = existing.household_id;
    console.log(`\n  household already exists: ${householdId}`);
  } else {
    const { data: h, error } = await admin
      .from("households")
      .insert({ name: "Our Home", owner_id: owner.id })
      .select("id")
      .single();
    if (error) throw new Error(`create household: ${error.message}`);
    householdId = h.id;
    console.log(`\n  household created: ${householdId}`);
  }

  const memberships = resolved.map((r) => ({
    household_id: householdId,
    user_id: r.id,
    role: r.role,
  }));
  const { error: mErr } = await admin
    .from("household_members")
    .upsert(memberships, { onConflict: "household_id,user_id", ignoreDuplicates: true });
  if (mErr) throw new Error(`memberships: ${mErr.message}`);

  const { error: sErr } = await admin
    .from("household_settings")
    .upsert({ household_id: householdId, name: "Our Home" }, { onConflict: "household_id", ignoreDuplicates: true });
  if (sErr) throw new Error(`settings: ${sErr.message}`);

  console.log("  memberships + settings ensured.");

  if (generated.length) {
    console.log("\n⚠ Generated passwords — save these now (change them in-app later):");
    for (const g of generated) console.log(`    ${g.email.padEnd(26)} ${g.password}`);
  }

  console.log("\n✓ Done. Sign in at http://localhost:3000/login");
}

main().catch((e) => {
  console.error("\n✗ Setup failed:", e.message);
  process.exit(1);
});
