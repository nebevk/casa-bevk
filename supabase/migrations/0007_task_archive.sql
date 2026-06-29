-- =============================================================================
-- 0007_task_archive.sql
--
-- Tasks can be ARCHIVED: hidden from the board but kept (distinct from delete,
-- which is the soft-delete `deleted_at`). Adds `archived_at`; the app filters
-- archived tasks off the board and offers restore/delete in an archive view.
-- RLS (0005) and triggers are unaffected. Idempotent / safe to re-run.
-- =============================================================================

alter table public.tasks add column if not exists archived_at timestamptz;

create index if not exists tasks_archived_idx
  on public.tasks(household_id, archived_at);
