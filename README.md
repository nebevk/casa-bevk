# Casa Bevk

A private family hub for two — shared to-do & shopping lists, personal and shared
notes, a family calendar, and household finances (expenses, budgets, recurring
payments), plus a knowledge base for the cars, the apartment, and service
providers. Calm, warm, and fast. **Not** another social app — a private digital
home.

> Status: **Foundation** — scaffold, theme, auth, app shell, and the full
> hardened database schema are in place. Feature screens are stubs on the
> roadmap (see [`TODO.md`](./TODO.md)).

## Stack

- **Next.js 16** (App Router, React 19, TypeScript, Turbopack) — note: Next 16
  renames `middleware` → [`proxy.ts`](./src/proxy.ts); `cookies()`/`headers()`
  are async.
- **Supabase** — Postgres + Auth + Realtime + Row Level Security (`@supabase/ssr`)
- **Tailwind CSS v4** (CSS-first `@theme`) + **shadcn/ui**
- **Vercel** for hosting
- **pnpm** (do not mix in npm/yarn — it would create a conflicting lockfile)

Theme: **Sage & Linen** — light, warm, calm (linen backgrounds, white cards,
sage accents). Tokens live in [`src/app/globals.css`](./src/app/globals.css).

## Getting started

```bash
pnpm install
cp .env.example .env.local      # then fill in your Supabase keys
pnpm dev                        # http://localhost:3000
```

Without Supabase keys the app still boots (themed login shows a "connect
Supabase" notice). To make auth/data work you need a Supabase project:

1. Create the project and apply the schema — see [`docs/SUPABASE.md`](./docs/SUPABASE.md).
   You can drive this with Cursor's Supabase MCP (the schema and a task list
   live in [`.cursor/rules/`](./.cursor/rules/)) or the Supabase CLI.
2. Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
   `.env.local`. **NEXT_PUBLIC_ vars are inlined at build time** — set them
   before `pnpm build`.
3. Create exactly **two** users (public sign-up is disabled) and regenerate
   types: `pnpm db:types`.

## Scripts

| Script | What |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint |
| `pnpm db:types` | Regenerate Supabase TS types (see `docs/SUPABASE.md`) |

## Project structure

```
src/
├─ app/
│  ├─ (auth)/login        # public login (no sign-up)
│  ├─ (app)/              # protected shell: dashboard + feature stubs
│  ├─ auth/callback       # magic-link / PKCE exchange
│  ├─ layout.tsx          # fonts + Toaster
│  └─ globals.css         # Sage & Linen theme tokens
├─ proxy.ts               # Next 16 session refresh + optimistic redirect
├─ components/{ui,app-shell,auth,providers}
└─ lib/
   ├─ supabase/{client,server,session,env}.ts
   ├─ auth/{dal,actions}.ts
   └─ constants.ts
supabase/migrations        # SQL schema + RLS (source of truth)
.cursor/rules              # conventions + DB instructions for Cursor agents
docs/                      # SUPABASE.md and friends
```

## Conventions

Agent/contributor conventions (Next 16 gotchas, the `@supabase/ssr`
getAll/setAll rule, and the household/owner RLS template every new table must
follow) are in [`AGENTS.md`](./AGENTS.md) and [`.cursor/rules/`](./.cursor/rules/).
The roadmap is in [`TODO.md`](./TODO.md).
