-- =============================================================================
-- 0004_records_medical.sql
--
-- Records → Medical: doctors/dentists (medical_contacts) and checkup /
-- vaccination reminders (health_reminders). Also extends provider_type with the
-- Slovenia-specific Home utilities (electricity / gas / upravnik / komunala).
--
-- Follows the household/owner template (see the header of 0001_initial_schema):
--   * household_id NOT NULL → references households(id) on delete cascade
--   * RLS via public.is_household_member(household_id)
--   * set_updated_at + lock_household_id triggers
--   * added to the supabase_realtime publication
--   * user references → public.profiles(id) on delete set null
-- Idempotent / safe to re-run.
-- =============================================================================

-- ---- provider_type: add the Home utilities ----------------------------------
-- ADD VALUE IF NOT EXISTS is idempotent. provider_type was created in 0001 (a
-- prior transaction), so adding values here is allowed; we don't use the new
-- values within this migration. If your runner rejects ADD VALUE inside a
-- transaction, apply these four lines on their own.
alter type public.provider_type add value if not exists 'electricity';
alter type public.provider_type add value if not exists 'gas';
alter type public.provider_type add value if not exists 'upravnik';
alter type public.provider_type add value if not exists 'komunala';

-- ---- Enums for Medical -------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'medical_kind') then
    create type public.medical_kind as enum
      ('gp', 'dentist', 'pediatrician', 'gynecologist', 'specialist', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'health_reminder_kind') then
    create type public.health_reminder_kind as enum
      ('checkup', 'vaccination', 'screening', 'other');
  end if;
end $$;

-- ---- medical_contacts: doctors & dentists -----------------------------------
create table if not exists public.medical_contacts (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  member_id    uuid references public.profiles(id) on delete set null,  -- null = both
  kind         public.medical_kind not null default 'gp',
  name         text not null,
  clinic       text,
  phone        text,
  email        text,
  address      text,
  notes        text,
  created_by   uuid references public.profiles(id) on delete set null,
  updated_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists medical_contacts_household_idx
  on public.medical_contacts(household_id);

-- ---- health_reminders: checkups & vaccinations ------------------------------
create table if not exists public.health_reminders (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references public.households(id) on delete cascade,
  member_id       uuid references public.profiles(id) on delete set null,  -- null = both
  kind            public.health_reminder_kind not null default 'checkup',
  title           text not null,
  due_on          date not null,
  interval_months integer check (interval_months is null or interval_months > 0),
  notes           text,
  completed_at    timestamptz,
  created_by      uuid references public.profiles(id) on delete set null,
  updated_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists health_reminders_household_idx
  on public.health_reminders(household_id);
create index if not exists health_reminders_due_idx
  on public.health_reminders(household_id, due_on);

-- ---- updated_at + household_id-immutability triggers -------------------------
do $$
declare t text;
begin
  foreach t in array array['medical_contacts', 'health_reminders']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
    execute format('drop trigger if exists lock_household_id on public.%I;', t);
    execute format(
      'create trigger lock_household_id before update on public.%I
         for each row execute function public.lock_household_id();', t);
  end loop;
end $$;

-- ---- RLS: household members only --------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['medical_contacts', 'health_reminders']
  loop
    execute format('alter table public.%I enable row level security;', t);

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

-- ---- Realtime ---------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['medical_contacts', 'health_reminders']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', t);
    end if;
  end loop;
end $$;
