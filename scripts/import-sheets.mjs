// Import the household Google-Sheets budget (CSV exports in ./data) into the
// expenses table. Aggregates one row per category per month.
//
//   node scripts/import-sheets.mjs            # DRY RUN — parses + prints, writes nothing
//   node scripts/import-sheets.mjs --commit   # upsert into Supabase (idempotent)
//
// Model (per the household owner):
//   - Nejc's columns are the WHOLE household bill for each shared category.
//   - Eva's "Fiksni stroški" and "Vrtec" are only her CONTRIBUTION to those same
//     bills, so they are dropped to avoid double-counting.
//   - Eva's "Prihranki/Varčevanje" rows are savings transfers (partly external
//     money), so they are dropped too.
//   - paid_by = Nejc for Nejc's sheet, Eva for Eva's sheet. Budgets are NOT
//     imported (expenses only).
//
// Idempotent: each expense carries metadata.source.key = "who|month|rawCategory"
// so a re-run updates in place instead of duplicating. Uses SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DATA = join(ROOT, "data");
const COMMIT = process.argv.includes("--commit");

const SHEETS = [
  { file: "Nejc Budget", who: "Nejc" },
  { file: "Eva Budget", who: "Eva" },
];

// Eva categories that are contributions to Nejc's whole-household bills, or
// savings transfers — dropped so they are not double-counted / mistaken for spend.
const EVA_DROP = new Set(["Fiksni stroški", "Vrtec", "Varčevanje"]);

// Manual amounts for cells whose freehand arithmetic could not be parsed safely.
// Keyed by "who|YYYY-MM|appCategory".
const OVERRIDES = {
  "Eva|2026-04|Hrana": 212.6,
  "Eva|2026-06|Osebno": 190.0,
};

const MONTHS = [
  ["januar", 1], ["februar", 2], ["marec", 3], ["april", 4], ["maj", 5],
  ["junij", 6], ["julij", 7], ["avgust", 8], ["september", 9],
  ["oktober", 10], ["november", 11], ["december", 12],
];
const ABBR = { jan: 1, feb: 2, mar: 3, apr: 4, maj: 5, jun: 6, jul: 7, avg: 8, sep: 9, okt: 10, nov: 11, dec: 12 };
const START_MONTH = 3;
const YEAR = 2026;

function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const lc = (s) => (s ?? "").toString().toLowerCase().trim();
const round2 = (n) => Math.round(n * 100) / 100;

function detectMonth(label) {
  const s = lc(label);
  for (const [name, n] of MONTHS) if (s.includes(name)) return n;
  for (const [a, n] of Object.entries(ABBR)) if (new RegExp("\\b" + a).test(s)) return n;
  return null;
}

function isExcluded(cat) {
  const c = lc(cat);
  if (!c) return true;
  return (
    c.startsWith("skupaj") || c.startsWith("skupno") || c.startsWith("dodatni") ||
    c.startsWith("dejanski") || c === "plan" || c.startsWith("prihranki za peč") ||
    c.startsWith("prihranki za pec") || c === "eva" || c === "kategorija" || c === "mesec"
  );
}

function mapCategory(cat) {
  const c = lc(cat);
  if (c.startsWith("varčevanje") || c.startsWith("varcevanje") || c.startsWith("prihranki")) return { name: "Varčevanje" };
  if (c.startsWith("vrtec")) return { name: "Vrtec" };
  if (c.startsWith("fiksni")) return { name: "Fiksni stroški" };
  if (c.startsWith("hrana")) return { name: "Hrana" };
  if (c.startsWith("avto")) return { name: "Avto" };
  if (c.startsWith("kolo")) return { name: "Osebno", flag: "Kolo→Osebno" };
  if (c.startsWith("osebni") || c.startsWith("osebno")) return { name: "Osebno" };
  if (c.startsWith("psiholog")) return { name: "Psiholog" };
  if (c.startsWith("dopust")) return { name: "Dopust" };
  if (c.startsWith("darežljivost") || c.startsWith("darezljivost")) return { name: "Darežljivost" };
  if (c.startsWith("razno")) return { name: "Drugo" };
  return { name: cat.trim(), flag: "UNMAPPED" };
}

function evalAmount(raw) {
  let s = (raw ?? "").toString().trim();
  if (!s || s === "/") return { value: null, conf: "empty", raw: s };
  s = s.replace(/−/g, "-").replace(/ /g, " ").replace(/€/g, "");
  const noParen = s.replace(/\([^)]*\)/g, " ");
  const norm = noParen.replace(/\s*\.\s*/g, ".").replace(/\s*\+\s*/g, "+");

  const sumTokens = (str) => {
    let sum = 0, count = 0, ok = true;
    for (let p of str.split("+")) {
      p = p.trim();
      if (!p) continue;
      const m = p.match(/^-?\d+(?:[.,]\d+)?/);
      if (!m) { if (/\d/.test(p)) ok = false; continue; }
      sum += parseFloat(m[0].replace(",", "."));
      count++;
    }
    return { sum: round2(sum), count, ok };
  };

  const segs = norm.split("=");
  const lhs = sumTokens(segs[0]);
  let rhs = null;
  if (segs.length > 1) {
    const m = segs[segs.length - 1].match(/-?\d+(?:[.,]\d+)?/);
    if (m) rhs = parseFloat(m[0].replace(",", "."));
  }
  if (segs.length === 1) {
    if (lhs.count === 0) return { value: null, conf: "review", raw: s };
    return { value: lhs.sum, conf: lhs.ok ? (lhs.count > 1 ? "sum" : "ok") : "review", raw: s };
  }
  if (rhs != null && Math.abs(rhs - lhs.sum) < 0.6) return { value: round2(rhs), conf: "ok", raw: s };
  return { value: null, conf: "review", raw: s, lhs: lhs.sum, rhs };
}

// Sum a "Label amount; Label amount; ..." Opomba into a total. Used when the
// Dejansko total is blank but the items are listed (e.g. Nejc's June). Splits on
// ";" and on item-separating commas (comma followed by a non-digit), then takes
// the LAST number in each item so labels with digits ("A1 76") don't inflate it.
function sumOpomba(text) {
  if (!text) return null;
  let sum = 0, count = 0;
  for (let item of text.split(/;|,(?=\s*[^\d\s])/)) {
    item = item.trim();
    if (!item) continue;
    const nums = item.match(/\d+(?:[.,]\d+)?/g);
    if (!nums) continue;
    sum += parseFloat(nums[nums.length - 1].replace(",", "."));
    count++;
  }
  return count ? { sum: round2(sum), count } : null;
}

const monthKey = (m) => `${YEAR}-${String(m).padStart(2, "0")}`;

function parseSheet(rows, who) {
  const out = [];
  let curMonth = null, active = false;
  for (const r of rows) {
    const cat = (r[1] ?? "").trim();
    const plan = r[2] ?? "";
    const dejansko = r[3] ?? "";
    const opomba = (r[5] ?? "").trim();
    if (lc(plan).startsWith("plan") && lc(dejansko).includes("dejansko")) {
      curMonth = detectMonth(cat);
      active = curMonth != null && curMonth >= START_MONTH;
      continue;
    }
    if (!active || !cat || isExcluded(cat)) continue;
    const amt = evalAmount(dejansko);
    const mapped = mapCategory(cat);
    const month = monthKey(curMonth);
    const key = `${who}|${month}|${cat}`;
    let value = amt.value;
    let conf = amt.conf;
    let rawUsed = amt.raw;
    // Dejansko is authoritative when present. When it's blank, fall back to
    // summing the Opomba line items (recovers e.g. Nejc's un-totaled June).
    if (value == null) {
      const os = sumOpomba(opomba);
      if (os) { value = os.sum; conf = "opomba"; rawUsed = `Σ ${os.count} items`; }
    }
    const ov = OVERRIDES[`${who}|${month}|${mapped.name}`];
    if (ov != null && value == null) { value = ov; conf = "manual"; }
    // Nothing recorded at all -> skip this category/month.
    if (value == null && amt.conf === "empty") continue;

    const dropped =
      (who === "Eva" && EVA_DROP.has(mapped.name)) ? "eva-contribution/transfer" :
      (value == null) ? "needs-review" : null;

    out.push({
      who, month, rawCat: cat, cat: mapped.name, catFlag: mapped.flag ?? null,
      amount: value, conf, rawDejansko: rawUsed, lhs: amt.lhs, rhs: amt.rhs,
      plan: evalAmount(plan).value, note: opomba, key, dropped,
    });
  }
  return out;
}

const pad = (s, n) => { s = String(s); return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length); };

function report(rows) {
  const byWho = new Map();
  for (const r of rows) (byWho.get(r.who) ?? byWho.set(r.who, []).get(r.who)).push(r);
  for (const [who, rs] of byWho) {
    console.log(`\n${"=".repeat(80)}\n  ${who}\n${"=".repeat(80)}`);
    const byMonth = new Map();
    for (const r of rs) (byMonth.get(r.month) ?? byMonth.set(r.month, []).get(r.month)).push(r);
    for (const [m, mr] of byMonth) {
      console.log(`\n  ${m}`);
      let tot = 0;
      for (const r of mr) {
        if (r.dropped) {
          console.log(`  ${pad("· " + r.cat, 18)} ${pad("(dropped)", 11)} ${r.dropped}  [${r.rawCat}]`);
          continue;
        }
        tot += r.amount ?? 0;
        const flag = r.catFlag ? ` [${r.catFlag}]` : "";
        const detail = r.conf === "manual" ? `MANUAL (raw="${r.rawDejansko}")` : (r.note ? r.note.slice(0, 44) : "");
        console.log(`  ${pad(r.cat + flag, 18)} ${pad((r.amount ?? 0).toFixed(2), 10)} ${pad(r.conf, 7)} ${detail}`);
      }
      console.log(`  ${pad("SKUPAJ", 18)} ${pad(tot.toFixed(2), 10)}`);
    }
  }
}

function loadEnvLocal() {
  for (const file of [join(process.cwd(), ".env.local"), join(ROOT, ".env.local")]) {
    let text;
    try { text = readFileSync(file, "utf8"); } catch { continue; }
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (k && process.env[k] === undefined) process.env[k] = v;
    }
    return;
  }
}

async function commit(rows) {
  loadEnvLocal();
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !SERVICE_KEY) { console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  if (typeof globalThis.WebSocket === "undefined") globalThis.WebSocket = class {};
  const admin = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: owner, error: oErr } = await admin
    .from("household_members").select("household_id, user_id").eq("role", "owner").limit(1).maybeSingle();
  if (oErr) throw new Error(`household_members: ${oErr.message}`);
  if (!owner) throw new Error("No household owner — run `pnpm setup:household` first.");
  const householdId = owner.household_id;
  const createdBy = owner.user_id;

  const { data: mem } = await admin
    .from("household_members").select("user_id, profile:profiles(display_name)").eq("household_id", householdId);
  const nameToId = {};
  for (const m of mem ?? []) nameToId[lc(m.profile?.display_name)] = m.user_id;
  const memberId = (who) => {
    const k = Object.keys(nameToId).find((n) => n && n.includes(who.toLowerCase()));
    return k ? nameToId[k] : null;
  };
  for (const s of SHEETS) if (!memberId(s.who)) console.warn(`! No profile match for "${s.who}" — paid_by will be null`);

  const catCache = new Map();
  async function ensureCategoryId(name) {
    if (catCache.has(name)) return catCache.get(name);
    const { data: ex } = await admin.from("expense_categories")
      .select("id").eq("household_id", householdId).eq("name", name).eq("kind", "expense").maybeSingle();
    let id = ex?.id;
    if (!id) {
      const { data: cr, error } = await admin.from("expense_categories")
        .insert({ household_id: householdId, name, kind: "expense" }).select("id").single();
      if (error) throw new Error(`category ${name}: ${error.message}`);
      id = cr.id;
    }
    catCache.set(name, id);
    return id;
  }

  const { data: existing } = await admin.from("expenses")
    .select("id, metadata").filter("metadata->source->>provider", "eq", "gsheets-csv");
  const existingByKey = new Map();
  for (const e of existing ?? []) { const k = e.metadata?.source?.key; if (k) existingByKey.set(k, e.id); }

  let inserted = 0, updated = 0, skipped = 0;
  for (const r of rows) {
    if (r.dropped || r.amount == null) { skipped++; continue; }
    const category_id = await ensureCategoryId(r.cat);
    const payload = {
      household_id: householdId,
      category_id,
      paid_by: memberId(r.who),
      amount: r.amount,
      currency: "EUR",
      occurred_on: `${r.month}-01`,
      description: r.note || null,
      created_by: createdBy,
      metadata: { source: { provider: "gsheets-csv", who: r.who, month: r.month, category: r.cat, rawCat: r.rawCat, raw: r.rawDejansko, key: r.key } },
    };
    const id = existingByKey.get(r.key);
    if (id) {
      const { error } = await admin.from("expenses").update(payload).eq("id", id);
      if (error) throw new Error(`update ${r.key}: ${error.message}`);
      updated++;
    } else {
      const { error } = await admin.from("expenses").insert(payload);
      if (error) throw new Error(`insert ${r.key}: ${error.message}`);
      inserted++;
    }
  }
  console.log(`\n✓ Done. inserted ${inserted}, updated ${updated}, skipped ${skipped} (dropped/blank).`);
}

async function main() {
  const files = readdirSync(DATA).filter((f) => f.toLowerCase().endsWith(".csv"));
  const all = [];
  for (const sheet of SHEETS) {
    const match = files.find((f) => f.includes(sheet.file));
    if (!match) { console.error(`! No CSV matching "${sheet.file}" in data/`); continue; }
    all.push(...parseSheet(parseCSV(readFileSync(join(DATA, match), "utf8")), sheet.who));
  }
  report(all);

  const keep = all.filter((r) => !r.dropped && r.amount != null);
  const dropped = all.filter((r) => r.dropped);
  console.log(`\n${"=".repeat(80)}`);
  console.log(`  Will import: ${keep.length} expenses   |   dropped: ${dropped.length}`);
  const unmapped = all.filter((r) => r.catFlag === "UNMAPPED");
  if (unmapped.length) console.log(`  ! UNMAPPED categories: ${[...new Set(unmapped.map((r) => r.rawCat))].join(", ")}`);

  if (COMMIT) {
    console.log("\n  COMMIT mode — writing to Supabase...");
    await commit(all);
  } else {
    console.log("\n  DRY RUN — nothing written. Re-run with --commit to import.");
  }
}

main().catch((e) => { console.error("\n✗ Failed:", e.message); process.exit(1); });
