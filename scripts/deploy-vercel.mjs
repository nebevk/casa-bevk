// Deploy Casa Bevk to Vercel (production).
//   pnpm deploy:vercel
//
// Requires: `vercel login` once, and .env.local with Supabase public keys.

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function loadEnvLocal() {
  const file = join(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
  let text = readFileSync(file, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const env = {};
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
    if (key) env[key] = val;
  }
  return env;
}

function run(cmd, args, { input, inherit = false } = {}) {
  const r = spawnSync(cmd, args, {
    input,
    stdio: inherit ? "inherit" : ["pipe", "inherit", "inherit"],
    shell: process.platform === "win32",
    encoding: "utf8",
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
  return r.stdout ?? "";
}

// Ensure linked (idempotent when .vercel/project.json exists).
if (!process.env.SKIP_VERCEL_LINK) {
  console.log("→ vercel link (if needed)");
  run("npx", ["vercel", "link", "--yes", "--scope", "kvebens-projects"]);
}

const local = loadEnvLocal();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://casa-bevk.vercel.app";

const vars = {
  NEXT_PUBLIC_SUPABASE_URL: local.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: local.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: siteUrl,
};

for (const [key, value] of Object.entries(vars)) {
  if (!value) {
    console.error(`✗ Missing ${key} in .env.local`);
    process.exit(1);
  }
  console.log(`→ vercel env add ${key} production`);
  run("npx", ["vercel", "env", "add", key, "production", "--force"], { input: value });
}

console.log("\n→ vercel deploy --prod");
run("npx", ["vercel", "deploy", "--prod", "--yes"], { inherit: true });

console.log("\n✓ Deploy finished. Update Supabase Auth URLs if the production domain differs.");
console.log("  Site URL + redirect: " + siteUrl + "/auth/callback");
