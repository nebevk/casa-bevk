<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Casa Bevk — project conventions

Private family hub for **exactly two users** sharing one household. Calm, warm,
"Sage & Linen" theme. Not a social app.

**Stack (fixed):** Next.js 16 (App Router, `src/`, `@/*`) · React 19 · Supabase
(Postgres + Auth + Realtime + RLS) · Tailwind v4 (CSS-first `@theme`, no
`tailwind.config.js`) · shadcn/ui · Vercel · **pnpm only**.

**Next 16 gotchas (verify in `node_modules/next/dist/docs/` before coding):**
- `middleware.ts` is gone → use `src/proxy.ts` (named export `proxy`, Node runtime).
- `cookies()` / `headers()` are **async** — always `await` them.

**Supabase:**
- Use the current `@supabase/ssr` `getAll`/`setAll` cookie API only. Never the
  deprecated `@supabase/auth-helpers-nextjs` or `get/set/remove`.
- Clients: `lib/supabase/client.ts` (browser), `server.ts` (async, server),
  `session.ts` (proxy refresh). Authz lives in `lib/auth/dal.ts` (`getUser()`,
  never `getSession()`); **RLS is the real backstop**.
- This is **invite-only** — public sign-up is disabled; only two pre-provisioned
  users exist. Do not add a `/signup` route.

**Database = source of truth in `supabase/migrations/`.** Every new table MUST:
- carry `household_id` (NOT NULL) and enable RLS;
- copy the household/owner RLS template (household-scoped: `is_household_member(household_id)`;
  personal/private rows additionally require `owner_id = auth.uid()`);
- use the `set_updated_at` trigger, the household-id-immutability trigger, and be
  added to the `supabase_realtime` publication if it needs live sync;
- store money as `numeric(14,2)` with a 3-letter `currency` (never float).

**When you change the database schema, you MUST also update the DB docs** so
Cursor agents (which apply migrations via the Supabase MCP) stay in sync:
`.cursor/rules/database.mdc`, `docs/SUPABASE.md`, and regenerate
`src/lib/supabase/database.types.ts` (`pnpm db:types`).

Roadmap: `TODO.md`. Design/setup docs: `docs/`.

