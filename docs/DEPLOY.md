# Deploying Casa Bevk to Vercel

Next.js 16 deploys to Vercel with zero config (pnpm + `next build` auto-detected;
the `proxy.ts` runs on Vercel's Node runtime). The two things that actually need
attention are **env vars** and the **Supabase auth redirect URLs**.

## 1. Get the code to Vercel

Pick one:

**A. GitHub → Vercel (recommended — gives you CI/CD on every push)**
```bash
# create an empty repo on GitHub first, then:
git remote add origin https://github.com/<you>/casa-bevk.git
git push -u origin main
```
Then in Vercel: **Add New → Project → Import** the repo. Framework = Next.js
(auto), package manager = pnpm (auto).

**B. Vercel CLI (deploy straight from this folder)**
```bash
pnpm deploy:vercel   # reads .env.local, sets prod env vars, deploys
# or manually:
npx vercel link --yes --scope kvebens-projects
npx vercel deploy --prod --yes
```

(You can also drive this from Cursor with the Vercel MCP you added to
`.cursor/mcp.json`.)

**Live production:** https://casa-bevk.vercel.app

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

Set these for **Production** (and Preview if you want preview deploys to work).
`NEXT_PUBLIC_*` are **inlined at build time**, so set them *before* the build.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bqahklmyziowboicwwjj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon / publishable key |
| `NEXT_PUBLIC_SITE_URL` | your production URL, e.g. `https://casa-bevk.vercel.app` |

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` — it's only used by the local
`setup:household` script, never at runtime.

## 3. Supabase auth redirect URLs (required for login to work in prod)

Supabase → **Authentication → URL Configuration**:
- **Site URL:** your production URL (e.g. `https://casa-bevk.vercel.app`)
- **Redirect URLs:** add
  - `https://casa-bevk.vercel.app/auth/callback`
  - (optional, for preview deploys) `https://*-<your-team>.vercel.app/auth/callback`

Without this, password login may work but magic links / the OAuth callback will
fail. Keep public sign-up **disabled** (it already is) — the two accounts exist.

## 4. First deploy → fix the site URL

The production URL isn't known until the first deploy. After it's assigned:
1. set `NEXT_PUBLIC_SITE_URL` to that URL (and add a custom domain if you have one),
2. update the Supabase Site URL + redirect URLs to match,
3. redeploy (Vercel → Deployments → Redeploy, or push a commit).

## 5. Install it on your phone

Once live over HTTPS:
- **Android/Chrome:** open the site → menu → **Install app** / "Add to Home screen".
- **iOS/Safari:** Share → **Add to Home Screen**.

It installs standalone (no browser chrome) with the Casa Bevk icon, thanks to
`app/manifest.ts` + the generated icons.
