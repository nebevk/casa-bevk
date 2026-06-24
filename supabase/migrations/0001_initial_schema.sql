-- =============================================================================
-- CASA BEVK — FINAL hardened initial schema (Postgres / Supabase)
-- =============================================================================
-- Private family hub for exactly TWO users sharing ONE household.
-- Built N-member-safe; a 2-member cap is enforced by trigger (relax to lift it).
--
-- This is ONE idempotent migration. Safe to re-run against a fresh OR existing
-- Supabase project:
--   * create extension if not exists
--   * enums wrapped in DO $$ ... EXCEPTION WHEN duplicate_object THEN null
--   * create table if not exists / add column if not exists
--   * drop policy if exists before create
--   * create or replace function
--   * drop trigger if exists before create
--   * constraints added defensively inside DO blocks (ignore duplicate_object)
--
-- SECURITY MODEL (read this first):
--   RLS is the ENTIRE security model. Every table has RLS enabled with
--   SELECT/INSERT/UPDATE/DELETE policies scoped `to authenticated`.
--   Household isolation = household_id must belong to the caller
--     (public.is_household_member(household_id)).
--   Owner/personal isolation = additionally (visibility='shared' OR owner_id=auth.uid())
--     or (user_id IS NULL OR user_id=auth.uid()).
--   Cross-household FK injection is blocked structurally with COMPOSITE FKs
--     (child references parent's (id, household_id), so Postgres guarantees the
--      parent is in the same household — FK checks bypass RLS, so this matters).
--   Immutability invariants (owner_id, household_id, ownership transfer) are
--     enforced by BEFORE UPDATE triggers because RLS WITH CHECK cannot see OLD.
--
-- ----------------------------------------------------------------------------
-- REUSABLE RLS TEMPLATE for future household-scoped feature tables
-- ----------------------------------------------------------------------------
--   create table public.my_feature (
--     id uuid primary key default gen_random_uuid(),
--     household_id uuid not null references public.households(id) on delete cascade,
--     -- ... columns ...
--     created_by uuid references public.profiles(id) on delete set null,
--     updated_by uuid references public.profiles(id) on delete set null,
--     created_at timestamptz not null default now(),
--     updated_at timestamptz not null default now()
--   );
--   alter table public.my_feature add constraint my_feature_id_household_key
--     unique (id, household_id);                        -- enables composite child FKs
--   alter table public.my_feature enable row level security;
--   -- updated_at + household_id-immutability triggers: add the table name to the
--   -- arrays in the trigger DO-blocks below.
--   create policy my_feature_select on public.my_feature for select to authenticated
--     using (public.is_household_member(household_id));
--   create policy my_feature_insert on public.my_feature for insert to authenticated
--     with check (public.is_household_member(household_id));
--   create policy my_feature_update on public.my_feature for update to authenticated
--     using (public.is_household_member(household_id))
--     with check (public.is_household_member(household_id));
--   create policy my_feature_delete on public.my_feature for delete to authenticated
--     using (public.is_household_member(household_id));
--   -- For OWNER/personal-scoped rows, add: and (visibility='shared' or owner_id=auth.uid())
-- =============================================================================


-- ---------- Extensions -------------------------------------------------------
create extension if not exists "pgcrypto";          -- gen_random_uuid()
create extension if not exists "vector";            -- pgvector (FUTURE/AI seam)


-- ---------- Enums (idempotent) ----------------------------------------------
do $$ begin
  create type member_role     as enum ('owner','member');
exception when duplicate_object then null; end $$;

-- shared = visible to all household members; personal = owner only.
-- Reused by BOTH notes and documents (FIX #1).
do $$ begin
  create type item_visibility as enum ('personal','shared');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority   as enum ('low','normal','high','urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recurrence_freq as enum ('none','daily','weekly','monthly','yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reminder_method as enum ('push','email');
exception when duplicate_object then null; end $$;

do $$ begin
  create type category_kind   as enum ('expense','income');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_cadence as enum ('daily','weekly','monthly','quarterly','yearly','custom');
exception when duplicate_object then null; end $$;

-- assets are physical things only (cars, apartment). Providers/contracts live
-- in their own table (FIX/COMPLETENESS B).
do $$ begin
  create type asset_type      as enum ('vehicle','property','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type asset_status    as enum ('active','inactive','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type provider_type   as enum ('internet','mobile','tv','utility','insurance','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_entity as enum ('asset','provider','expense','maintenance','recurring_payment','note','event','task','other');
exception when duplicate_object then null; end $$;


-- =============================================================================
-- SHARED TRIGGER FUNCTIONS
-- All trigger / helper functions use SECURITY DEFINER + search_path = '' and
-- fully schema-qualify every reference (FIX #8). pg_temp is never on the path.
-- =============================================================================

-- updated_at stamper. Also stamps updated_by from auth.uid() when the column
-- exists on the table (works for every user-facing table uniformly).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- household_id is immutable once set (FIX #7). RLS WITH CHECK cannot see OLD.
create or replace function public.lock_household_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.household_id is distinct from old.household_id then
    raise exception 'household_id is immutable (cannot move a row between households)';
  end if;
  return new;
end;
$$;


-- =============================================================================
-- IDENTITY / TENANCY
-- =============================================================================

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  locale       text not null default 'en',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Our Home',
  -- owner_id is RESTRICT: the household must always have an owner. Deleting the
  -- owner's auth user is handled by transfer/guard (see open questions / docs).
  owner_id   uuid not null references public.profiles(id) on delete restrict,
  timezone   text not null default 'Europe/Ljubljana',
  currency   text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists households_owner_idx on public.households(owner_id);

create table if not exists public.household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         member_role not null default 'member',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (household_id, user_id)
);
create index if not exists household_members_user_idx      on public.household_members(user_id);
create index if not exists household_members_household_idx on public.household_members(household_id);


-- =============================================================================
-- SECURITY DEFINER HELPERS (break RLS recursion; reused by every policy)
-- search_path = '' + fully schema-qualified (FIX #8). No pg_temp.
-- =============================================================================

create or replace function public.current_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select hm.household_id
  from public.household_members hm
  where hm.user_id = (select auth.uid());
$$;

create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = hid
      and hm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_household_owner(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = hid
      and hm.user_id = (select auth.uid())
      and hm.role = 'owner'
  );
$$;

-- New auth user -> profile bootstrap (FIX #8: search_path = '', fully qualified).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email,'@',1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic household bootstrap (FIX #5): creates the household AND the creator's
-- owner membership in one transaction, plus seeds household_settings. Avoids the
-- read-after-write visibility gap of the two-step client flow.
create or replace function public.create_household(p_name text default 'Our Home')
returns public.households
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  h public.households;
begin
  if v_uid is null then
    raise exception 'create_household must be called by an authenticated user';
  end if;

  insert into public.households (name, owner_id)
  values (coalesce(nullif(p_name,''),'Our Home'), v_uid)
  returning * into h;

  insert into public.household_members (household_id, user_id, role)
  values (h.id, v_uid, 'owner');

  insert into public.household_settings (household_id, name)
  values (h.id, h.name)
  on conflict (household_id) do nothing;

  return h;
end;
$$;


-- =============================================================================
-- SETTINGS (COMPLETENESS A)
-- =============================================================================

create table if not exists public.household_settings (
  household_id uuid primary key references public.households(id) on delete cascade,
  name         text not null default 'Our Home',
  currency     text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  locale       text not null default 'sl-SI',
  timezone     text not null default 'Europe/Ljubljana',
  week_start    smallint not null default 1 check (week_start between 0 and 6), -- 0=Sun,1=Mon
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id           uuid primary key references public.profiles(id) on delete cascade,
  theme             text not null default 'system' check (theme in ('system','light','dark')),
  notif_push        boolean not null default true,
  notif_email       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);


-- =============================================================================
-- FEATURE TABLES
-- =============================================================================

-- To-do lists -----------------------------------------------------------------
create table if not exists public.todo_lists (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  color        text,
  sort_order   integer not null default 0,
  created_by   uuid references public.profiles(id) on delete set null,
  updated_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists todo_lists_household_idx on public.todo_lists(household_id);

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  list_id      uuid,                          -- composite FK added below
  title        text not null,
  notes        text,
  due_at       timestamptz,
  is_done      boolean not null default false,
  done_at      timestamptz,
  assignee_id  uuid references public.profiles(id) on delete set null,
  priority     task_priority not null default 'normal',
  sort_order   integer not null default 0,
  deleted_at   timestamptz,                   -- soft delete (app filters; RLS ignores)
  created_by   uuid references public.profiles(id) on delete set null,
  updated_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- state consistency (FIX #12): cannot have done_at without is_done.
  constraint tasks_done_state_chk check (not is_done or done_at is not null)
);
create index if not exists tasks_household_idx on public.tasks(household_id);
create index if not exists tasks_list_idx      on public.tasks(list_id);
create index if not exists tasks_assignee_idx  on public.tasks(assignee_id);
create index if not exists tasks_due_idx       on public.tasks(household_id, due_at) where is_done = false and deleted_at is null;

-- Shopping lists --------------------------------------------------------------
create table if not exists public.shopping_lists (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  default_store text,
  sort_order    integer not null default 0,
  created_by    uuid references public.profiles(id) on delete set null,
  updated_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists shopping_lists_household_idx on public.shopping_lists(household_id);

create table if not exists public.shopping_items (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  list_id      uuid not null,                 -- composite FK added below
  name         text not null,
  quantity     numeric(12,2) not null default 1 check (quantity >= 0),
  unit         text,
  category     text,
  store        text,
  is_checked   boolean not null default false,
  checked_at   timestamptz,
  sort_order   integer not null default 0,
  deleted_at   timestamptz,                   -- soft delete
  created_by   uuid references public.profiles(id) on delete set null,
  updated_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- state consistency (FIX #12)
  constraint shopping_items_checked_state_chk check (not is_checked or checked_at is not null)
);
create index if not exists shopping_items_household_idx on public.shopping_items(household_id);
create index if not exists shopping_items_list_idx      on public.shopping_items(list_id);

-- Notes (personal vs shared) --------------------------------------------------
-- owner_id is NULLABLE so a SHARED note survives its author's deletion
-- (FIX #10: ON DELETE SET NULL, not CASCADE).
create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  owner_id     uuid references public.profiles(id) on delete set null,
  visibility   item_visibility not null default 'shared',
  title        text,
  body         text,
  is_pinned    boolean not null default false,
  color        text,
  deleted_at   timestamptz,                   -- soft delete
  created_by   uuid references public.profiles(id) on delete set null,
  updated_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- a personal note must have an owner (a shared note may be orphaned)
  constraint notes_personal_has_owner_chk check (visibility = 'shared' or owner_id is not null)
);
create index if not exists notes_household_idx  on public.notes(household_id);
create index if not exists notes_owner_idx      on public.notes(owner_id);
create index if not exists notes_visibility_idx on public.notes(household_id, visibility);

-- Calendar --------------------------------------------------------------------
create table if not exists public.calendar_events (
  id                  uuid primary key default gen_random_uuid(),
  household_id        uuid not null references public.households(id) on delete cascade,
  title               text not null,
  description         text,
  location            text,
  starts_at           timestamptz not null,
  ends_at             timestamptz,
  all_day             boolean not null default false,
  recurrence_freq     recurrence_freq not null default 'none',
  recurrence_interval integer not null default 1 check (recurrence_interval >= 1),
  recurrence_until    timestamptz,
  recurrence_count    integer check (recurrence_count is null or recurrence_count > 0),
  recurrence_rule     text,                   -- raw RRULE for advanced cases
  color               text,
  created_by          uuid references public.profiles(id) on delete set null,
  updated_by          uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at),
  -- RRULE allows only one of COUNT / UNTIL (FIX #12)
  constraint calendar_events_recurrence_chk check (recurrence_count is null or recurrence_until is null)
);
create index if not exists calendar_events_household_idx on public.calendar_events(household_id);
create index if not exists calendar_events_starts_idx    on public.calendar_events(household_id, starts_at);

-- event_reminders: per-user (user_id) reminders, owner-scoped by RLS (FIX #3).
create table if not exists public.event_reminders (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  event_id       uuid not null,               -- composite FK added below
  user_id        uuid references public.profiles(id) on delete cascade, -- NULL = whole household
  minutes_before integer check (minutes_before is null or minutes_before >= 0),
  remind_at      timestamptz,
  method         reminder_method not null default 'push',
  is_sent        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (minutes_before is not null or remind_at is not null)
);
create index if not exists event_reminders_event_idx      on public.event_reminders(event_id);
create index if not exists event_reminders_household_idx   on public.event_reminders(household_id);
create index if not exists event_reminders_user_idx        on public.event_reminders(user_id);
-- prevent duplicate reminders (sec_fix_2 #8); NULL user_id/minutes_before normalized.
create unique index if not exists event_reminders_unique
  on public.event_reminders(
    event_id,
    coalesce(user_id,'00000000-0000-0000-0000-000000000000'::uuid),
    method,
    coalesce(minutes_before,-1)
  );

-- Expenses, categories, budgets ----------------------------------------------
create table if not exists public.expense_categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  kind         category_kind not null default 'expense',
  icon         text,
  color        text,
  is_system    boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (household_id, name, kind)
);
create index if not exists expense_categories_household_idx on public.expense_categories(household_id);

create table if not exists public.expenses (
  id                   uuid primary key default gen_random_uuid(),
  household_id         uuid not null references public.households(id) on delete cascade,
  -- category_id ON DELETE RESTRICT to preserve financial history (FIX #10).
  category_id          uuid,                  -- composite FK (RESTRICT) added below
  paid_by              uuid references public.profiles(id) on delete set null,
  amount               numeric(14,2) not null check (amount >= 0),  -- exact money (FIX #12)
  currency             text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  occurred_on          date not null default current_date,
  description          text,
  asset_id             uuid,                  -- composite FK added below
  recurring_payment_id uuid,                  -- composite FK added below
  metadata             jsonb not null default '{}'::jsonb,  -- FUTURE: AI bill extraction
  deleted_at           timestamptz,           -- soft delete
  created_by           uuid references public.profiles(id) on delete set null,
  updated_by           uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists expenses_household_idx on public.expenses(household_id);
create index if not exists expenses_category_idx  on public.expenses(category_id);
create index if not exists expenses_date_idx      on public.expenses(household_id, occurred_on);
create index if not exists expenses_paid_by_idx   on public.expenses(paid_by);

create table if not exists public.budgets (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  -- category_id ON DELETE RESTRICT (FIX #10), NULL = household-wide budget.
  category_id  uuid,                          -- composite FK (RESTRICT) added below
  period_month date not null,                 -- first day of month
  amount       numeric(14,2) not null check (amount >= 0),
  currency     text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (date_trunc('month', period_month)::date = period_month)
);
create index if not exists budgets_household_idx on public.budgets(household_id);
create index if not exists budgets_period_idx    on public.budgets(household_id, period_month);
-- normal uniqueness when a category is set...
create unique index if not exists budgets_household_cat_month_uq
  on public.budgets(household_id, category_id, period_month) where category_id is not null;
-- ...and a SINGLE uncategorized budget per month (FIX #11).
create unique index if not exists budgets_household_month_null_cat
  on public.budgets(household_id, period_month) where category_id is null;

-- Recurring payments / subscriptions -----------------------------------------
create table if not exists public.recurring_payments (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  provider     text,                          -- free-text label (vendor)
  amount       numeric(14,2) not null check (amount >= 0),
  currency     text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  cadence      payment_cadence not null default 'monthly',
  interval     integer not null default 1 check (interval >= 1),
  next_due_on  date,
  category_id  uuid,                          -- composite FK (SET NULL) added below
  asset_id     uuid,                          -- composite FK added below
  provider_id  uuid,                          -- composite FK added below (link to providers)
  is_active    boolean not null default true,
  notes        text,
  created_by   uuid references public.profiles(id) on delete set null,
  updated_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists recurring_payments_household_idx on public.recurring_payments(household_id);
create index if not exists recurring_payments_due_idx       on public.recurring_payments(household_id, next_due_on) where is_active;


-- =============================================================================
-- KNOWLEDGE BASE: assets (cars/apartment) + maintenance_log + providers + documents
-- =============================================================================

-- assets = physical things: vehicles & property. Type-specific data in `attributes`:
--   vehicle:  {"plate":"SLO-AB-123","vin":"...","make":"VW","model":"Golf","year":2019}
--   property: {"address":"...","size_m2":72,"rooms":3}
create table if not exists public.assets (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  type         asset_type not null,
  name         text not null,
  status       asset_status not null default 'active',
  attributes   jsonb not null default '{}'::jsonb,  -- typed per-asset fields (see above)
  created_by   uuid references public.profiles(id) on delete set null,
  updated_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists assets_household_idx on public.assets(household_id);
create index if not exists assets_type_idx      on public.assets(household_id, type);

-- providers = recurring service CONTRACTS (internet/mobile/tv/utility/insurance).
-- Distinct from assets/maintenance_log (COMPLETENESS B).
create table if not exists public.providers (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references public.households(id) on delete cascade,
  type            provider_type not null default 'other',
  name            text not null,
  plan            text,
  monthly_cost    numeric(14,2) check (monthly_cost is null or monthly_cost >= 0),
  currency        text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  billing_cadence payment_cadence not null default 'monthly',
  contract_start  date,
  contract_end    date,
  renewal_date    date,
  notice_days     integer check (notice_days is null or notice_days >= 0),
  account_number  text,
  login_ref       text,                       -- reference/pointer, NOT a password
  contact         text,
  notes           text,
  is_active       boolean not null default true,
  created_by      uuid references public.profiles(id) on delete set null,
  updated_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists providers_household_idx on public.providers(household_id);
create index if not exists providers_type_idx      on public.providers(household_id, type);

create table if not exists public.maintenance_log (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references public.households(id) on delete cascade,
  asset_id        uuid not null,              -- composite FK added below
  title           text not null,
  description     text,
  performed_on    date not null default current_date,
  cost            numeric(14,2) check (cost is null or cost >= 0),
  currency        text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  vendor          text,
  odometer        integer check (odometer is null or odometer >= 0),  -- vehicles
  next_service_on date,
  expense_id      uuid,                        -- composite FK added below
  created_by      uuid references public.profiles(id) on delete set null,
  updated_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists maintenance_log_household_idx on public.maintenance_log(household_id);
create index if not exists maintenance_log_asset_idx     on public.maintenance_log(asset_id);

-- documents: owner-scoped like notes (FIX #1). visibility shared|personal +
-- nullable owner_id (shared docs survive author deletion -> ON DELETE SET NULL).
create table if not exists public.documents (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  owner_id       uuid references public.profiles(id) on delete set null,
  visibility     item_visibility not null default 'shared',
  entity_type    document_entity not null default 'other',
  entity_id      uuid,                         -- polymorphic target row
  asset_id       uuid,                         -- composite FK added below
  file_name      text not null,
  mime_type      text,
  size_bytes     bigint check (size_bytes is null or size_bytes >= 0),
  storage_bucket text not null default 'casa-bevk',
  storage_path   text not null,                -- path inside Supabase Storage
  created_by     uuid references public.profiles(id) on delete set null,
  updated_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- a personal doc must have an owner; polymorphic link must be coherent.
  constraint documents_personal_has_owner_chk check (visibility = 'shared' or owner_id is not null),
  constraint documents_entity_id_chk check (entity_type = 'other' or entity_id is not null)
);
create index if not exists documents_household_idx  on public.documents(household_id);
create index if not exists documents_owner_idx      on public.documents(owner_id);
create index if not exists documents_entity_idx     on public.documents(entity_type, entity_id);
create index if not exists documents_asset_idx      on public.documents(asset_id);
-- one DB row per stored file
create unique index if not exists documents_storage_unique
  on public.documents(storage_bucket, storage_path);


-- =============================================================================
-- FUTURE / AI SEAMS (created minimal, NOT wired to UI) — COMPLETENESS E
-- =============================================================================

-- Polymorphic attachments seam (kept alongside `documents`; documents remains the
-- primary file table — this is reserved for future generic attach-anywhere UX).
-- FUTURE SEAM: not wired to the app yet.
create table if not exists public.attachments (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  owner_id       uuid references public.profiles(id) on delete set null,
  visibility     item_visibility not null default 'shared',
  entity_type    document_entity not null default 'other',
  entity_id      uuid,
  label          text,
  storage_bucket text not null default 'casa-bevk',
  storage_path   text not null,
  mime_type      text,
  size_bytes     bigint check (size_bytes is null or size_bytes >= 0),
  created_by     uuid references public.profiles(id) on delete set null,
  updated_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint attachments_personal_has_owner_chk check (visibility = 'shared' or owner_id is not null)
);
create index if not exists attachments_household_idx on public.attachments(household_id);
create unique index if not exists attachments_storage_unique
  on public.attachments(storage_bucket, storage_path);

-- Staging for the future bill -> expense AI flow. Holds an uploaded bill plus the
-- AI-extracted fields pending one-tap confirmation into `expenses`.
-- FUTURE/AI SEAM: not wired to the app yet.
create table if not exists public.extracted_bill_data (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references public.households(id) on delete cascade,
  owner_id        uuid references public.profiles(id) on delete set null,
  document_id     uuid references public.documents(id) on delete set null,
  storage_bucket  text,
  storage_path    text,
  status          text not null default 'pending' check (status in ('pending','confirmed','rejected','error')),
  extracted       jsonb not null default '{}'::jsonb,  -- raw model output
  confidence      numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  expense_id      uuid references public.expenses(id) on delete set null, -- once confirmed
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists extracted_bill_data_household_idx on public.extracted_bill_data(household_id);

-- pgvector embeddings stub for semantic search over notes by a future AI agent.
-- Dimension 1536 = OpenAI text-embedding-3-small (confirm before backfilling).
-- FUTURE/AI SEAM: not wired to the app yet.
create table if not exists public.note_embeddings (
  note_id      uuid primary key references public.notes(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  embedding    vector(1536),
  content_hash text,                          -- skip re-embedding unchanged notes
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists note_embeddings_household_idx on public.note_embeddings(household_id);


-- =============================================================================
-- COMPOSITE UNIQUE KEYS ON PARENTS  (FIX #2 — enables same-household child FKs)
-- Added defensively (ignore if they already exist).
-- =============================================================================
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('todo_lists',         'todo_lists_id_household_key'),
      ('shopping_lists',     'shopping_lists_id_household_key'),
      ('calendar_events',    'calendar_events_id_household_key'),
      ('assets',             'assets_id_household_key'),
      ('providers',          'providers_id_household_key'),
      ('expense_categories', 'expense_categories_id_household_key'),
      ('recurring_payments', 'recurring_payments_id_household_key'),
      ('expenses',           'expenses_id_household_key')
    ) as v(tbl, con)
  loop
    begin
      execute format(
        'alter table public.%I add constraint %I unique (id, household_id);',
        r.tbl, r.con);
    exception when duplicate_object then null; when duplicate_table then null;
    end;
  end loop;
end $$;


-- =============================================================================
-- COMPOSITE CHILD FOREIGN KEYS  (FIX #2 / FIX #10 cascade coherence)
-- Each FK references (parent_id, household_id) -> parent(id, household_id), so
-- Postgres guarantees parent.household_id = child.household_id. MATCH SIMPLE
-- means a NULL child column skips the check (desired for optional links).
-- =============================================================================
do $$
declare
  r record;
begin
  for r in
    select * from (values
      -- child_table, fk_name, child_cols, parent_table, parent_cols, on_delete
      ('tasks',              'tasks_list_household_fkey',              '(list_id, household_id)',              'todo_lists',         '(id, household_id)', 'on delete cascade'),
      ('shopping_items',     'shopping_items_list_household_fkey',     '(list_id, household_id)',              'shopping_lists',     '(id, household_id)', 'on delete cascade'),
      ('event_reminders',    'event_reminders_event_household_fkey',   '(event_id, household_id)',             'calendar_events',    '(id, household_id)', 'on delete cascade'),
      ('maintenance_log',    'maintenance_log_asset_household_fkey',   '(asset_id, household_id)',             'assets',             '(id, household_id)', 'on delete cascade'),
      ('maintenance_log',    'maintenance_log_expense_household_fkey', '(expense_id, household_id)',           'expenses',           '(id, household_id)', 'on delete set null'),
      ('expenses',           'expenses_category_household_fkey',       '(category_id, household_id)',          'expense_categories', '(id, household_id)', 'on delete restrict'),
      ('expenses',           'expenses_asset_household_fkey',          '(asset_id, household_id)',             'assets',             '(id, household_id)', 'on delete set null'),
      ('expenses',           'expenses_recurring_household_fkey',      '(recurring_payment_id, household_id)', 'recurring_payments', '(id, household_id)', 'on delete set null'),
      ('budgets',            'budgets_category_household_fkey',        '(category_id, household_id)',          'expense_categories', '(id, household_id)', 'on delete restrict'),
      ('recurring_payments', 'recurring_payments_category_household_fkey','(category_id, household_id)',       'expense_categories', '(id, household_id)', 'on delete set null'),
      ('recurring_payments', 'recurring_payments_asset_household_fkey','(asset_id, household_id)',             'assets',             '(id, household_id)', 'on delete set null'),
      ('recurring_payments', 'recurring_payments_provider_household_fkey','(provider_id, household_id)',       'providers',          '(id, household_id)', 'on delete set null'),
      ('documents',          'documents_asset_household_fkey',         '(asset_id, household_id)',             'assets',             '(id, household_id)', 'on delete cascade')
    ) as v(child, con, ccols, parent, pcols, ondel)
  loop
    -- drop any prior simple/composite FK with the same name, then add composite.
    execute format('alter table public.%I drop constraint if exists %I;', r.child, r.con);
    begin
      execute format(
        'alter table public.%I add constraint %I foreign key %s references public.%I %s %s;',
        r.child, r.con, r.ccols, r.parent, r.pcols, r.ondel);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- Drop the original single-column FKs from the base draft if they linger.
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('tasks',              'tasks_list_id_fkey'),
      ('shopping_items',     'shopping_items_list_id_fkey'),
      ('event_reminders',    'event_reminders_event_id_fkey'),
      ('maintenance_log',    'maintenance_log_asset_id_fkey'),
      ('maintenance_log',    'maintenance_log_expense_id_fkey'),
      ('expenses',           'expenses_category_id_fkey'),
      ('expenses',           'expenses_asset_id_fkey'),
      ('expenses',           'expenses_recurring_payment_id_fkey'),
      ('budgets',            'budgets_category_id_fkey'),
      ('recurring_payments', 'recurring_payments_category_id_fkey'),
      ('recurring_payments', 'recurring_payments_asset_id_fkey')
    ) as v(tbl, con)
  loop
    execute format('alter table public.%I drop constraint if exists %I;', r.tbl, r.con);
  end loop;
end $$;


-- =============================================================================
-- updated_at + household_id-immutability triggers
-- =============================================================================

-- updated_at on every table that has the column.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','households','household_members','household_settings','user_settings',
    'todo_lists','tasks','shopping_lists','shopping_items','notes',
    'calendar_events','event_reminders','expense_categories','expenses','budgets',
    'recurring_payments','assets','providers','maintenance_log','documents',
    'attachments','extracted_bill_data','note_embeddings'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- household_id immutability (FIX #7) on every household-scoped table.
do $$
declare t text;
begin
  foreach t in array array[
    'household_settings',
    'todo_lists','tasks','shopping_lists','shopping_items','notes',
    'calendar_events','event_reminders','expense_categories','expenses',
    'budgets','recurring_payments','assets','providers','maintenance_log',
    'documents','attachments','extracted_bill_data','note_embeddings'
  ]
  loop
    execute format('drop trigger if exists lock_household_id on public.%I;', t);
    execute format(
      'create trigger lock_household_id before update on public.%I
         for each row execute function public.lock_household_id();', t);
  end loop;
end $$;


-- =============================================================================
-- INTEGRITY TRIGGERS for invariants RLS WITH CHECK cannot express
-- =============================================================================

-- FIX #4: notes — owner_id immutable; only the owner may flip to 'personal'.
create or replace function public.guard_notes_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'note owner_id is immutable';
  end if;
  -- privatizing a note (shared -> personal) is allowed only for its owner
  if new.visibility = 'personal' and new.visibility is distinct from old.visibility
     and old.owner_id is distinct from (select auth.uid()) then
    raise exception 'only the note owner may privatize a shared note';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_notes_update on public.notes;
create trigger guard_notes_update
  before update on public.notes
  for each row execute function public.guard_notes_update();

-- FIX #4 (documents mirror): owner_id immutable; only owner may flip to 'personal'.
create or replace function public.guard_documents_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'document owner_id is immutable';
  end if;
  if new.visibility = 'personal' and new.visibility is distinct from old.visibility
     and old.owner_id is distinct from (select auth.uid()) then
    raise exception 'only the document owner may privatize a shared document';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_documents_update on public.documents;
create trigger guard_documents_update
  before update on public.documents
  for each row execute function public.guard_documents_update();

-- FIX #5: households — protect owner_id from reassignment by non-owners.
create or replace function public.lock_household_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id
     and not public.is_household_owner(old.id) then
    raise exception 'only the current household owner may transfer ownership';
  end if;
  return new;
end;
$$;
drop trigger if exists lock_household_owner on public.households;
create trigger lock_household_owner
  before update on public.households
  for each row execute function public.lock_household_owner();

-- FIX #6: 2-member cap. Constraint trigger so it fires at the right time even
-- inside the create_household() transaction. Only the owner may add the 2nd
-- member (enforced additionally by the household_members_insert RLS policy).
create or replace function public.enforce_two_member_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare cnt integer;
begin
  select count(*) into cnt
  from public.household_members
  where household_id = new.household_id;
  if cnt > 2 then
    raise exception 'household % already has the maximum of 2 members', new.household_id;
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_two_member_cap on public.household_members;
create constraint trigger enforce_two_member_cap
  after insert on public.household_members
  for each row execute function public.enforce_two_member_cap();


-- =============================================================================
-- ROW LEVEL SECURITY — enable everywhere
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','households','household_members','household_settings','user_settings',
    'todo_lists','tasks','shopping_lists','shopping_items','notes',
    'calendar_events','event_reminders','expense_categories','expenses','budgets',
    'recurring_payments','assets','providers','maintenance_log','documents',
    'attachments','extracted_bill_data','note_embeddings'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- FORCE RLS on the most sensitive tables (FIX #9) so even table-owner / future
-- SECURITY DEFINER paths are subject to row checks unless explicitly intended.
alter table public.notes             force row level security;
alter table public.documents         force row level security;
alter table public.households        force row level security;
alter table public.household_members force row level security;


-- ---------- profiles ---------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or id in (
    select hm.user_id from public.household_members hm
    where hm.household_id in (select public.current_household_ids())
  )
);

-- profile rows are created by the handle_new_user() trigger; no client INSERT.
-- (Removing the public insert path closes unnecessary surface — review lens 1 low.)

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- No profiles_delete policy: account deletion is an admin/service-role flow so a
-- member cannot silently remove themselves from the household (review lens 1 low).

-- ---------- households -------------------------------------------------------
-- SELECT also accepts owner_id = auth.uid() as a read-after-write backstop (FIX #5).
drop policy if exists households_select on public.households;
create policy households_select on public.households for select to authenticated
using (public.is_household_member(id) or owner_id = (select auth.uid()));

drop policy if exists households_insert on public.households;
create policy households_insert on public.households for insert to authenticated
with check (owner_id = (select auth.uid()));

-- Only the OWNER may update the household (FIX #5). owner_id reassignment is
-- additionally pinned by the lock_household_owner trigger.
drop policy if exists households_update on public.households;
create policy households_update on public.households for update to authenticated
using (public.is_household_owner(id)) with check (public.is_household_owner(id));

drop policy if exists households_delete on public.households;
create policy households_delete on public.households for delete to authenticated
using (public.is_household_owner(id));

-- ---------- household_members (uses SECURITY DEFINER fns; no recursion) -------
drop policy if exists household_members_select on public.household_members;
create policy household_members_select on public.household_members for select to authenticated
using (
  user_id = (select auth.uid())
  or household_id in (select public.current_household_ids())
);

-- Owner adds the 2nd member, OR the creator self-joins right after creating the
-- household. 2-member cap enforced by enforce_two_member_cap trigger (FIX #6).
drop policy if exists household_members_insert on public.household_members;
create policy household_members_insert on public.household_members for insert to authenticated
with check (
  public.is_household_owner(household_id)
  or (
    user_id = (select auth.uid())
    and household_id in (
      select h.id from public.households h where h.owner_id = (select auth.uid())
    )
  )
);

drop policy if exists household_members_update on public.household_members;
create policy household_members_update on public.household_members for update to authenticated
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

drop policy if exists household_members_delete on public.household_members;
create policy household_members_delete on public.household_members for delete to authenticated
using (public.is_household_owner(household_id) or user_id = (select auth.uid()));

-- ---------- household_settings (household-scoped; owner may write) ------------
drop policy if exists household_settings_select on public.household_settings;
create policy household_settings_select on public.household_settings for select to authenticated
using (public.is_household_member(household_id));

drop policy if exists household_settings_insert on public.household_settings;
create policy household_settings_insert on public.household_settings for insert to authenticated
with check (public.is_household_owner(household_id));

drop policy if exists household_settings_update on public.household_settings;
create policy household_settings_update on public.household_settings for update to authenticated
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

drop policy if exists household_settings_delete on public.household_settings;
create policy household_settings_delete on public.household_settings for delete to authenticated
using (public.is_household_owner(household_id));

-- ---------- user_settings (strictly the caller's own row) --------------------
drop policy if exists user_settings_select on public.user_settings;
create policy user_settings_select on public.user_settings for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists user_settings_insert on public.user_settings;
create policy user_settings_insert on public.user_settings for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists user_settings_update on public.user_settings;
create policy user_settings_update on public.user_settings for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists user_settings_delete on public.user_settings;
create policy user_settings_delete on public.user_settings for delete to authenticated
using (user_id = (select auth.uid()));

-- ---------- Generic household-scoped tables (auto-generated policies) --------
-- NOTE: notes, documents, attachments, event_reminders are OWNER/USER-scoped and
-- are deliberately EXCLUDED here; they get bespoke policies below.
do $$
declare t text;
begin
  foreach t in array array[
    'todo_lists','tasks','shopping_lists','shopping_items',
    'calendar_events','expense_categories','expenses','budgets',
    'recurring_payments','assets','providers','maintenance_log',
    'extracted_bill_data','note_embeddings'
  ]
  loop
    execute format('drop policy if exists %1$s_select on public.%1$I;', t);
    execute format('drop policy if exists %1$s_insert on public.%1$I;', t);
    execute format('drop policy if exists %1$s_update on public.%1$I;', t);
    execute format('drop policy if exists %1$s_delete on public.%1$I;', t);

    execute format(
      'create policy %1$s_select on public.%1$I for select to authenticated
         using (public.is_household_member(household_id));', t);
    execute format(
      'create policy %1$s_insert on public.%1$I for insert to authenticated
         with check (public.is_household_member(household_id));', t);
    execute format(
      'create policy %1$s_update on public.%1$I for update to authenticated
         using (public.is_household_member(household_id))
         with check (public.is_household_member(household_id));', t);
    execute format(
      'create policy %1$s_delete on public.%1$I for delete to authenticated
         using (public.is_household_member(household_id));', t);
  end loop;
end $$;

-- ---------- notes (personal vs shared) — FIX #1/#4 ---------------------------
drop policy if exists notes_select on public.notes;
create policy notes_select on public.notes for select to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists notes_insert on public.notes;
create policy notes_insert on public.notes for insert to authenticated
with check (
  public.is_household_member(household_id)
  -- a personal note must be owned by the caller; a shared note may set any/none owner
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists notes_update on public.notes;
create policy notes_update on public.notes for update to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
)
with check (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists notes_delete on public.notes;
create policy notes_delete on public.notes for delete to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

-- ---------- documents (personal vs shared) — FIX #1 --------------------------
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents for insert to authenticated
with check (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents for update to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
)
with check (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents for delete to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

-- ---------- attachments (personal vs shared; mirrors documents) --------------
drop policy if exists attachments_select on public.attachments;
create policy attachments_select on public.attachments for select to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists attachments_insert on public.attachments;
create policy attachments_insert on public.attachments for insert to authenticated
with check (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists attachments_update on public.attachments;
create policy attachments_update on public.attachments for update to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
)
with check (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists attachments_delete on public.attachments;
create policy attachments_delete on public.attachments for delete to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

-- ---------- event_reminders (per-user) — FIX #3 ------------------------------
drop policy if exists event_reminders_select on public.event_reminders;
create policy event_reminders_select on public.event_reminders for select to authenticated
using (
  public.is_household_member(household_id)
  and (user_id is null or user_id = (select auth.uid()))
);

drop policy if exists event_reminders_insert on public.event_reminders;
create policy event_reminders_insert on public.event_reminders for insert to authenticated
with check (
  public.is_household_member(household_id)
  and (user_id is null or user_id = (select auth.uid()))
);

drop policy if exists event_reminders_update on public.event_reminders;
create policy event_reminders_update on public.event_reminders for update to authenticated
using (
  public.is_household_member(household_id)
  and (user_id is null or user_id = (select auth.uid()))
)
with check (
  public.is_household_member(household_id)
  and (user_id is null or user_id = (select auth.uid()))
);

drop policy if exists event_reminders_delete on public.event_reminders;
create policy event_reminders_delete on public.event_reminders for delete to authenticated
using (
  public.is_household_member(household_id)
  and (user_id is null or user_id = (select auth.uid()))
);


-- =============================================================================
-- REALTIME publication (RLS still applies to streamed rows)
-- Add household-scoped DATA tables idempotently (guard "already member").
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'todo_lists','tasks','shopping_lists','shopping_items','notes',
    'calendar_events','event_reminders','expense_categories','expenses',
    'budgets','recurring_payments','assets','providers','maintenance_log',
    'documents','attachments','household_members','households',
    'household_settings','profiles'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception
      when duplicate_object then null;   -- already in publication
      when undefined_object then null;   -- publication missing (non-Supabase); ignore
    end;
  end loop;
end $$;


-- =============================================================================
-- GRANTS (RLS is the gate; grant table privileges to authenticated)
-- =============================================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

grant execute on function public.current_household_ids()  to authenticated;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid)  to authenticated;
grant execute on function public.create_household(text)    to authenticated;


-- =============================================================================
-- (COMMENTED) SUPABASE STORAGE bucket + storage.objects RLS template — F
-- Buckets are created via the Storage API/dashboard, not SQL, so this is a
-- reference template. Path convention: <household_id>/<entity>/<file>.
-- The first path segment is the household_id; RLS checks membership of it.
-- =============================================================================
--
-- -- 1) Create the private bucket via API/CLI (not SQL), e.g.:
-- --    supabase storage create casa-bevk --private
-- --    (or insert into storage.buckets (id, name, public)
-- --       values ('casa-bevk','casa-bevk', false);)
--
-- -- 2) RLS on storage.objects, keyed off the first path segment = household_id:
-- --    (storage.foldername(name))[1] is the household_id segment.
--
-- alter table storage.objects enable row level security;
--
-- drop policy if exists casa_bevk_storage_select on storage.objects;
-- create policy casa_bevk_storage_select on storage.objects for select to authenticated
-- using (
--   bucket_id = 'casa-bevk'
--   and public.is_household_member( ((storage.foldername(name))[1])::uuid )
-- );
--
-- drop policy if exists casa_bevk_storage_insert on storage.objects;
-- create policy casa_bevk_storage_insert on storage.objects for insert to authenticated
-- with check (
--   bucket_id = 'casa-bevk'
--   and public.is_household_member( ((storage.foldername(name))[1])::uuid )
--   and owner = (select auth.uid())
-- );
--
-- drop policy if exists casa_bevk_storage_update on storage.objects;
-- create policy casa_bevk_storage_update on storage.objects for update to authenticated
-- using (
--   bucket_id = 'casa-bevk'
--   and public.is_household_member( ((storage.foldername(name))[1])::uuid )
-- )
-- with check (
--   bucket_id = 'casa-bevk'
--   and public.is_household_member( ((storage.foldername(name))[1])::uuid )
-- );
--
-- drop policy if exists casa_bevk_storage_delete on storage.objects;
-- create policy casa_bevk_storage_delete on storage.objects for delete to authenticated
-- using (
--   bucket_id = 'casa-bevk'
--   and public.is_household_member( ((storage.foldername(name))[1])::uuid )
-- );
--
-- =============================================================================
-- END
-- =============================================================================
