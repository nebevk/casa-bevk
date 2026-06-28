-- =============================================================================
-- 0006_task_status.sql
--
-- Kanban: tasks gain a three-state `status` (todo / in_progress / done). The
-- existing `is_done` flag stays in sync (done <=> is_done), so the dashboard and
-- other is_done-based queries keep working unchanged. Backfills from is_done.
-- RLS (personal/shared from 0005) and the existing triggers are unaffected.
-- Idempotent / safe to re-run.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum ('todo', 'in_progress', 'done');
  end if;
end $$;

alter table public.tasks
  add column if not exists status public.task_status not null default 'todo';

-- Backfill from the existing flag so done tasks land in the Done column.
update public.tasks set status = 'done' where is_done = true and status <> 'done';

create index if not exists tasks_status_idx on public.tasks(household_id, status);
