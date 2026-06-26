// Seeds the two household cars (Renault Captur, Škoda Octavia) + the Octavia's
// known service history into assets + maintenance_log. Idempotent — re-running
// updates the car spec and skips service entries that already exist.
//
//   pnpm seed:cars
//
// Uses SUPABASE_SERVICE_ROLE_KEY (admin). Edit/extend the data freely in-app.

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

const OCTAVIA_NOTES = `Prva registracija: 20. 3. 2015 (modelno leto 2015).

DSG (DQ200): prestavlja normalno, brez cukanja, opozorilnih lučk in tresenja; pri speljevanju včasih nekoliko "len" (za DQ200 lahko normalno).

Vonj v kabini: poleti / po vročem ponovnem zagonu; kemičen (plastika/guma), ne po bencinu ali olju, ne sladek. Pozimi ga ni. Še nepreverjeno, ali se pojavi brez vključene klime.

Motor deluje normalno; nivo hladilne tekočine stabilen, po menjavi vodne črpalke in termostata brez opaznega puščanja.

Zobati jermen: v servisni zgodovini še ni bilo zaslediti menjave.`;

const CARS = [
  {
    name: "Renault Captur",
    attributes: {
      make: "Renault",
      model: "Captur",
      year: 2014,
      engine: "0.9 TCe",
      gearbox: "ročni",
      fuel: "bencin",
      current_km: 100000,
      notes: "En sam lastnik.",
    },
    log: [],
  },
  {
    name: "Škoda Octavia",
    attributes: {
      make: "Škoda",
      model: "Octavia III (5E)",
      year: 2015,
      engine: "1.4 TSI",
      power: "103 kW (140 KM)",
      engine_code: "CHPA",
      gearbox: "7-stopenjski DSG (DQ200)",
      fuel: "bencin",
      vin: "TMBAC7NEXF0202524",
      current_km: 190000,
      notes: OCTAVIA_NOTES,
    },
    log: [
      {
        performed_on: "2023-01-01",
        title: "Redni letni servisi na pooblaščenem servisu Škoda (do 2023)",
      },
      {
        performed_on: "2024-08-13",
        title: "Zadnje zavorne ploščice + zadnja zavorna koluta (1,20 h dela)",
      },
      {
        performed_on: "2024-08-22",
        title: "Vodna črpalka, jermen, ohišje termostata, antifriz (1,90 h dela)",
      },
      {
        performed_on: "2025-07-02",
        title:
          "Mali servis: motorno olje Castrol 5W-40, oljni + zračni + kabinski filter, 2× svečke TSI, 1× vžigalna tuljava, drobni material (1,50 h dela)",
      },
    ],
  },
];

async function main() {
  console.log(`Seeding cars on ${URL}\n`);

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

  for (const car of CARS) {
    const { data: existing, error: eErr } = await admin
      .from("assets")
      .select("id")
      .eq("household_id", householdId)
      .eq("type", "vehicle")
      .eq("name", car.name)
      .maybeSingle();
    if (eErr) throw new Error(`find ${car.name}: ${eErr.message}`);

    let assetId;
    if (existing) {
      assetId = existing.id;
      const { error } = await admin
        .from("assets")
        .update({ attributes: car.attributes })
        .eq("id", assetId);
      if (error) throw new Error(`update ${car.name}: ${error.message}`);
      console.log(`  • ${car.name.padEnd(18)} updated`);
    } else {
      const { data: created, error } = await admin
        .from("assets")
        .insert({
          household_id: householdId,
          type: "vehicle",
          name: car.name,
          attributes: car.attributes,
          created_by: createdBy,
        })
        .select("id")
        .single();
      if (error) throw new Error(`create ${car.name}: ${error.message}`);
      assetId = created.id;
      console.log(`  • ${car.name.padEnd(18)} created`);
    }

    let added = 0;
    for (const entry of car.log) {
      const { data: ex } = await admin
        .from("maintenance_log")
        .select("id")
        .eq("asset_id", assetId)
        .eq("title", entry.title)
        .eq("performed_on", entry.performed_on)
        .maybeSingle();
      if (ex) continue;
      const { error } = await admin.from("maintenance_log").insert({
        household_id: householdId,
        asset_id: assetId,
        title: entry.title,
        performed_on: entry.performed_on,
        created_by: createdBy,
      });
      if (error) throw new Error(`log ${car.name}: ${error.message}`);
      added++;
    }
    if (car.log.length) console.log(`      service log: +${added} (${car.log.length} total)`);
  }

  console.log("\n✓ Done.");
}

main().catch((e) => {
  console.error("\n✗ Seed failed:", e.message);
  process.exit(1);
});
