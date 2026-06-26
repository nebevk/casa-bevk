// Sets each member's `app_metadata.household_id` JWT claim so server actions can
// read the household id straight from the verified token — removing one DB
// round-trip from every write. Idempotent; safe to re-run.
//
//   pnpm set:household-claim
//
// Uses SUPABASE_SERVICE_ROLE_KEY (admin, bypasses RLS) — local/owner use only.
// The claim is reflected immediately by auth.getUser() (which reads the live
// user record), so no re-login is required; new tokens carry it going forward.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Tolerant .env.local loader (Node's --env-file is picky about some values).
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
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
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
  console.error(
    "✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

// supabase-js eagerly initializes a Realtime client that needs a WebSocket
// global. Node 20 has none; we never use realtime here, so a stub satisfies it.
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class StubWebSocket {};
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Setting household_id JWT claim on ${URL}\n`);

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw new Error(`listUsers: ${listErr.message}`);

  let updated = 0;
  let unchanged = 0;
  for (const user of list.users) {
    const label = (user.email ?? user.id).padEnd(28);

    const { data: membership, error: mErr } = await admin
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (mErr) throw new Error(`membership ${user.email}: ${mErr.message}`);

    if (!membership) {
      console.log(`  • ${label} no household — skipped`);
      unchanged++;
      continue;
    }

    if (user.app_metadata?.household_id === membership.household_id) {
      console.log(`  • ${label} already set`);
      unchanged++;
      continue;
    }

    // updateUserById merges into existing app_metadata (other keys preserved).
    const { error: uErr } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { household_id: membership.household_id },
    });
    if (uErr) throw new Error(`update ${user.email}: ${uErr.message}`);
    console.log(`  • ${label} → ${membership.household_id}`);
    updated++;
  }

  console.log(`\n✓ Done. ${updated} updated, ${unchanged} unchanged.`);
}

main().catch((e) => {
  console.error("\n✗ Failed:", e.message);
  process.exit(1);
});
