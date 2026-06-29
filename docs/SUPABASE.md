# Supabase setup — Casa Bevk

How to stand up the backend. Casa Bevk is private and **invite-only**: public
sign-up is disabled and exactly two accounts are pre-provisioned.

## 1. Project

**Remote project (scaffolded):** `casa-bevk` — ref `bqahklmyziowboicwwjj`, region `eu-central-1`.

- Dashboard: https://supabase.com/dashboard/project/bqahklmyziowboicwwjj
- Copy the **Project URL** and **anon / publishable key** into `.env.local` (see `.env.example`). Keep the **service_role** key server-only — never expose it to the client or commit it.

## 2. Apply the schema

The schema + RLS are the source of truth in `supabase/migrations/`. Applied on
the remote project through `0006_task_status.sql` (personal/shared tasks in
`0005`, kanban todo/in_progress/done in `0006`). **`0007_task_archive.sql`
(archive done tasks via `archived_at`) is pending; apply it via the Supabase
MCP.** Regenerate types after new migrations: `pnpm db:types` (or Supabase MCP
`generate_typescript_types` if the CLI is not linked).

Two ways to apply **new** migrations:

### A. Cursor + Supabase MCP (preferred)

1. Copy `.cursor/mcp.example.json` → `.cursor/mcp.json`, fill in your
   `--project-ref` and a Supabase **personal access token** (`SUPABASE_ACCESS_TOKEN`).
   `.cursor/mcp.json` is gitignored — never commit the token.
2. Ask the Cursor agent to apply `supabase/migrations/0001_initial_schema.sql`,
   then `supabase/seed.sql`, via the Supabase MCP. The DB conventions and the
   apply checklist it needs are in `.cursor/rules/database.mdc`.

### B. Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push        # applies supabase/migrations
```

## 3. Create the two users

Public sign-up is OFF. Dashboard → Authentication → Providers → Email → turn
**off** "Allow new users to sign up". Then Authentication → Users → **Add user**
twice (email + password), or use the admin API with the service_role key.

The `handle_new_user` trigger creates each `profiles` row automatically. Create
the household with the `create_household(name)` RPC (atomic: it also adds the
caller as the owner member), then add the second user as a member. The schema
caps a household at **two** members.

## 4. Generate types

After the schema is applied:

```bash
pnpm db:types     # supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

Then type the clients with `<Database>` for end-to-end typed queries.

## 5. Realtime

The migration adds the household data tables to the `supabase_realtime`
publication so both devices sync live. RLS still applies to realtime, so the
helper-based policies are what make it safe.

---

Schema details, the household/owner RLS template every new table must follow, and
the rule to keep these docs in sync with schema changes live in
[`.cursor/rules/database.mdc`](../.cursor/rules/database.mdc).
