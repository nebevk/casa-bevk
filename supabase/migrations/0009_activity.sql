-- =============================================================================
-- 0009_activity.sql
--
-- Activity section: a shared household library of timed-circuit WORKOUTS that
-- can be "played" (a countdown player steps through each move), plus per-member
-- SPORT PROFILES (Strava links). All household-shared (is_household_member),
-- not owner-private. Follows the household template: household_id NOT NULL, RLS,
-- set_updated_at + lock_household_id triggers, added to supabase_realtime.
-- Idempotent / safe to re-run.
-- =============================================================================

-- ── workouts ────────────────────────────────────────────────────────────────
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  description text,
  rounds int not null default 1 check (rounds between 1 and 20),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workouts_id_household_key unique (id, household_id)
);

-- ── workout_steps (ordered moves within a workout) ──────────────────────────
create table if not exists public.workout_steps (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  workout_id uuid not null,
  position int not null default 0,
  name text not null,
  duration_seconds int not null default 30 check (duration_seconds between 1 and 3600),
  is_rest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- composite FK: a step can never reference another household's workout
  constraint workout_steps_workout_fk
    foreign key (workout_id, household_id)
    references public.workouts(id, household_id) on delete cascade
);
create index if not exists workout_steps_workout_idx
  on public.workout_steps(workout_id, position);

-- ── sport_profiles (per-member Strava / sport links) ────────────────────────
create table if not exists public.sport_profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  member_id uuid references public.profiles(id),
  platform text not null default 'strava' check (platform in ('strava', 'other')),
  label text,
  url text not null,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sport_profiles_household_idx
  on public.sport_profiles(household_id);

-- ── RLS: household-shared on all three ──────────────────────────────────────
alter table public.workouts        enable row level security;
alter table public.workout_steps   enable row level security;
alter table public.sport_profiles  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['workouts', 'workout_steps', 'sport_profiles']
  loop
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format(
      'create policy %1$s_select on public.%1$s for select to authenticated
         using (public.is_household_member(household_id))', t);

    execute format('drop policy if exists %1$s_insert on public.%1$s', t);
    execute format(
      'create policy %1$s_insert on public.%1$s for insert to authenticated
         with check (public.is_household_member(household_id))', t);

    execute format('drop policy if exists %1$s_update on public.%1$s', t);
    execute format(
      'create policy %1$s_update on public.%1$s for update to authenticated
         using (public.is_household_member(household_id))
         with check (public.is_household_member(household_id))', t);

    execute format('drop policy if exists %1$s_delete on public.%1$s', t);
    execute format(
      'create policy %1$s_delete on public.%1$s for delete to authenticated
         using (public.is_household_member(household_id))', t);
  end loop;
end $$;

-- ── triggers: updated_at + household_id immutability ────────────────────────
do $$
declare t text;
begin
  foreach t in array array['workouts', 'workout_steps', 'sport_profiles']
  loop
    execute format('drop trigger if exists set_updated_at on public.%1$s', t);
    execute format(
      'create trigger set_updated_at before update on public.%1$s
         for each row execute function public.set_updated_at()', t);

    execute format('drop trigger if exists lock_household_id on public.%1$s', t);
    execute format(
      'create trigger lock_household_id before update on public.%1$s
         for each row execute function public.lock_household_id()', t);
  end loop;
end $$;

-- ── realtime ────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['workouts', 'workout_steps', 'sport_profiles']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%1$s', t);
    end if;
  end loop;
end $$;
