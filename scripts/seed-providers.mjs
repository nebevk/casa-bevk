// Seeds household providers/contracts into the providers table. Idempotent —
// re-running updates an existing provider (matched by name) instead of dupes.
//
//   pnpm seed:providers
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

const PROVIDERS = [
  {
    type: "internet",
    name: "T-2",
    plan: "Oranžni Optimum – Optika (internet + TV)",
    monthly_cost: 34.99, // package list price; first month 1 €, 45 % popust — confirm net on first invoice
    billing_cadence: "monthly",
    renewal_date: "2028-06-23", // konec vezave (end of 24-month binding)
    account_number: "0013872376", // številka kupca
    contact: null,
    notes:
      "Optika (fiber). Priključek 1671096 — Cankarjeva ulica 56B, 4240 Radovljica.\n" +
      "Vezava 24 mesecev: 23.06.2026 → 23.06.2028 (popust 45 %, cena 34,99 €). 1 € za 1. mesec.\n" +
      "Predvidena izguba posebne ugodnosti ob predčasni prekinitvi: 8,28 €.\n" +
      "Datum vklopa: 23.06.2026. Številka kupca: 0013872376.",
  },
];

async function main() {
  console.log(`Seeding providers on ${URL}\n`);

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

  for (const p of PROVIDERS) {
    const { data: existing, error: eErr } = await admin
      .from("providers")
      .select("id")
      .eq("household_id", householdId)
      .eq("name", p.name)
      .maybeSingle();
    if (eErr) throw new Error(`find ${p.name}: ${eErr.message}`);

    if (existing) {
      const { error } = await admin
        .from("providers")
        .update(p)
        .eq("id", existing.id);
      if (error) throw new Error(`update ${p.name}: ${error.message}`);
      console.log(`  • ${p.name.padEnd(10)} updated`);
    } else {
      const { error } = await admin
        .from("providers")
        .insert({ household_id: householdId, created_by: createdBy, ...p });
      if (error) throw new Error(`create ${p.name}: ${error.message}`);
      console.log(`  • ${p.name.padEnd(10)} created`);
    }
  }

  console.log("\n✓ Done.");
}

main().catch((e) => {
  console.error("\n✗ Seed failed:", e.message);
  process.exit(1);
});
