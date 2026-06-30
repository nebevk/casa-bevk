# Security

Casa Bevk is a **private, invite-only** household app for exactly two users (Eva
and Nejc). It holds personal, financial, and medical data. Postgres **Row Level
Security (RLS) is the real security backstop**; the app layers auth, a hardened
edge, and careful secret handling on top.

Last full audit: **2026-06-30** (multi-agent: auth, RLS, secrets, server/client
boundary, platform). Result: **21 findings, 0 critical, 0 high.** Everything
outstanding below is hardening, not an open hole.

## What is already in place (code)

- **Auth:** authorization uses `auth.getUser()` (re-verifies the JWT) everywhere,
  never `getSession()`. Three independent gates back each other up: the proxy
  redirect, the `(app)` layout's `requireUser()`, and Postgres RLS. Cookies use
  the safe `@supabase/ssr` defaults (HttpOnly, SameSite=Lax, Secure).
- **Invite-only:** no `/signup` route, signup disabled in Supabase, magic-link
  uses `shouldCreateUser: false`. Only the two pre-provisioned accounts exist.
- **RLS:** enabled on all tables; `notes`/`documents`/`households`/
  `household_members` additionally use `FORCE` RLS. Personal notes/tasks/documents
  are owner-only. Two-member cap and household-id immutability enforced by
  triggers. `SECURITY DEFINER` helpers pin `search_path`. Composite FKs make
  cross-household leakage structurally impossible.
- **Secrets:** only the public anon key reaches the browser (safe because RLS
  enforces access). The `service_role` key is used only by local admin scripts,
  never shipped to the client or set on Vercel. Nothing sensitive is committed.
- **Server actions:** every mutation re-authenticates; `household_id`/`owner_id`
  are always derived server-side; update/delete-by-id is constrained by RLS.
- **Hardening shipped (commit `4c65c8a`):**
  - HTTP security headers on every route (HSTS, `X-Frame-Options: DENY`, CSP
    `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`,
    `Referrer-Policy`, `Permissions-Policy`).
  - Login no longer ships the two real emails to the client; they resolve
    server-side in `src/lib/auth/members.ts`.
  - Generic auth error messages (real error logged server-side).
  - Auth-callback `next` redirect restricted to internal single-slash paths.
  - `postcss >= 8.5.10` override (clears the one moderate dependency advisory).

## Outstanding checklist

### Apply (database)
- [ ] Apply `supabase/migrations/0008_storage_rls.sql` via the Supabase MCP
      (forces the `casa-bevk` bucket private + `storage.objects` RLS). Latent
      until a file-upload feature ships, but land it now.
- [ ] Confirm `0007_task_archive.sql` is applied, then regenerate types
      (`pnpm db:types` or MCP `generate_typescript_types`).

### Supabase dashboard (only doable there)
- [ ] **Enable MFA/2FA (TOTP) for both accounts** - highest-value control.
- [ ] Enable **leaked-password protection** (HaveIBeenPwned) + minimum password
      strength.
- [ ] Run **Database -> Security Advisor**; confirm `rowsecurity = true` on every
      table and no `USING (true)` / anon policy.
- [ ] Confirm the **`casa-bevk` storage bucket is private** (`public = false`).
- [ ] Enable **Point-in-Time Recovery** (or verify automated backups) - the
      medical/financial history is irreplaceable.
- [ ] Confirm **email signups are disabled** and Auth rate-limiting / bot
      protection is on.
- [ ] Restrict **allowed redirect URLs** to the real production origin + localhost.

### Vercel / local
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is **not** in Vercel env (only the two
      `NEXT_PUBLIC_SUPABASE_*` values should be), and that all environments have
      the public env set (so the proxy never ships fail-open).
- [ ] Consider a **one-time rotation** of the `service_role` key (it has sat on
      disk and in `.history` snapshots) as a clean baseline.
- [ ] Delete the stale `.history/.env_*.local` snapshots (plaintext secret copies).

### Later / when relevant
- [ ] **Full content CSP** with per-request nonces + explicit Supabase REST/realtime
      (wss) allowances. The current CSP only hardens framing; a strict
      script/style/connect policy is deferred to avoid breaking data fetches.
- [ ] Before wiring the AI seams, decide owner-privacy for `extracted_bill_data`
      and `note_embeddings` (currently household-shared, not owner-private).
- [ ] Optional: a pgTAP / SQL assertion that every table has RLS + the expected
      policies, run after each manual migration (migrations are applied by hand,
      so this catches an accidental policy drop).
- [ ] Optional: a `gitleaks` pre-commit hook / GitHub push protection, since real
      secrets live adjacent in `.env.local`.

## Design notes (by intent, not bugs)

- For a married couple sharing one household, **most data is shared**: only
  personal notes/tasks/documents, per-user event reminders, and `user_settings`
  are private between the two. Medical contacts, health reminders, per-member
  budgets, expenses, and all records are mutually visible. Confirm this remains
  the intent, especially for medical/health items.

## Re-running the audit

The audit reads the live code + `supabase/migrations/`. To refresh it, re-run the
multi-agent security review over auth, RLS, secrets, the server/client boundary,
and platform, and reconcile findings against this file.
