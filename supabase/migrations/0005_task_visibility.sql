-- =============================================================================
-- 0005_task_visibility.sql
--
-- Tasks become personal or shared, mirroring notes (see 0001): a PERSONAL task
-- is visible only to its owner, enforced by RLS (not just the UI). Adds
-- owner_id + visibility to tasks, backfills existing rows, replaces the generic
-- household RLS with owner-aware policies, and guards owner_id / privatization
-- (mirrors guard_notes_update). Idempotent / safe to re-run.
-- =============================================================================

-- ---- columns ----------------------------------------------------------------
alter table public.tasks
  add column if not exists owner_id uuid
    references public.profiles(id) on delete set null;
alter table public.tasks
  add column if not exists visibility public.item_visibility not null default 'shared';

-- Backfill: give existing tasks an owner (their creator) so the creator can
-- later make them personal. Runs BEFORE the guard trigger is created.
update public.tasks
  set owner_id = created_by
  where owner_id is null and created_by is not null;

-- A personal task must have an owner (a shared task may be orphaned).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_personal_has_owner_chk'
  ) then
    alter table public.tasks
      add constraint tasks_personal_has_owner_chk
      check (visibility = 'shared' or owner_id is not null);
  end if;
end $$;

create index if not exists tasks_owner_idx on public.tasks(owner_id);
create index if not exists tasks_visibility_idx
  on public.tasks(household_id, visibility);

-- ---- RLS: shared rows to all members; personal rows only to the owner -------
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
with check (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
)
with check (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated
using (
  public.is_household_member(household_id)
  and (visibility = 'shared' or owner_id = (select auth.uid()))
);

-- ---- guard: owner_id immutable; only the owner may privatize ----------------
create or replace function public.guard_tasks_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'task owner_id is immutable';
  end if;
  if new.visibility = 'personal'
     and new.visibility is distinct from old.visibility
     and old.owner_id is distinct from (select auth.uid()) then
    raise exception 'only the task owner may make a task personal';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_tasks_update on public.tasks;
create trigger guard_tasks_update
  before update on public.tasks
  for each row execute function public.guard_tasks_update();
