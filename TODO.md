# Casa Bevk — Roadmap & TODO

Living plan. Vertical slices: get one feature fully working (schema → RLS → UI →
realtime) and reuse that pattern, rather than building all UIs at once.

## M0 — Foundation ✅ (this session)

- [x] Next.js 16 + Tailwind v4 + shadcn/ui scaffold (pnpm, Turbopack)
- [x] Sage & Linen design tokens + fonts (Plus Jakarta Sans / Fraunces)
- [x] `@supabase/ssr` clients (browser, server, proxy session refresh)
- [x] Two-user auth: login (password + magic link), callback, sign-out, route gating
- [x] App shell: sidebar + mobile nav + user menu + realtime provider
- [x] Dashboard daily-overview cards + stub pages for every section
- [x] Hardened DB schema + RLS (households, members, profiles, all feature tables)
- [x] Cursor/Supabase instruction docs + `.env.example` + repo hygiene
- [ ] **You:** create the Supabase project, apply `supabase/migrations`, create the
      two users, set `.env.local`, run `pnpm db:types` (see `docs/SUPABASE.md`)
- [ ] Smoke-test realtime across two browser tabs

## M1 — Tasks & Shopping
The two structurally-similar list features that prove the full CRUD + realtime pattern.
- [ ] To-Do: multiple lists, add/edit/complete, due dates, assignees, reorder
- [ ] Shopping: items with qty/unit, check-off, optional category/store, clear-checked
- [ ] Realtime sync + optimistic UI with Sonner; reusable list/empty-state components

## M2 — Notes (personal + shared)
- [ ] Notes list + editor, toggle shared/personal, pin, search
- [ ] Verify RLS: partner sees shared notes but never personal ones

## M3 — Calendar & Reminders
- [ ] Events (start/end, all-day), recurrence (RRULE), reminders
- [ ] Month/week/agenda views; feed "upcoming events" to the dashboard

## M4 — Money: Expenses, Budgets, Subscriptions
- [ ] Expenses: log who-paid, categories, filters, simple split/settle-up
- [ ] Budgets: monthly per-category, spent-vs-budget progress
- [ ] Subscriptions/recurring payments: next-due, mark-paid advances the date
- [ ] Dashboard: real Budget Snapshot + Due Payments cards

## M5 — Records (Cars, Apartment, Providers)
- [ ] Assets (vehicle/property) + maintenance/service log + costs
- [ ] Providers (internet/mobile/tv) as contracts: plan, cost, renewal, account
- [ ] Link service costs to expenses; renewals to reminders

## M6 — Attachments & Storage
- [ ] Supabase Storage buckets + storage RLS; upload/view bill scans & docs

## M7 — AI Assistant (build last)
- [ ] pgvector embeddings; RLS-respecting agent over tasks/notes/expenses
- [ ] Bill extraction (uploaded bills → draft expenses); monthly forecast
- [ ] Confirm provider/SDK + model with the owner before building

## M8 — Polish, PWA, Deploy
- [ ] A11y, empty/loading/error states, mobile passes
- [ ] PWA (manifest, icons, offline shell), perf
- [ ] Production Supabase + Vercel env, backups, observability

---

## Open questions for the owner
(surfaced by the schema design/review — decide as features land)

- **Second-user invite:** how does partner #2 join — owner adds them by id after
  they sign up, or an invite-code table? (Schema caps a household at 2 members.)
- **Recurrence:** expand RRULE on the client, or materialize occurrences server-side?
- **Reminders delivery:** in-app only for now, or email/push via a scheduled job?
- **Recurring payment → expense:** should "mark paid" auto-create an expense row
  (so budgets reflect it)? (Recommended: yes.)
- **Currency:** single household currency (EUR) or per-row multi-currency?
- **Soft-delete:** keep a trash/undo for tasks/notes/expenses? (Schema has `deleted_at`.)
- **AI embeddings dimension:** confirm before enabling pgvector in earnest (e.g. 1536).
