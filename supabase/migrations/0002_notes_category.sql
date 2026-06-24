-- =============================================================================
-- CASA BEVK — 0002: note categories
-- Adds a free-text `category` to notes so they can be organized/filtered in the
-- Notes tab. No RLS change needed — covered by the existing notes policies.
-- Idempotent: safe to re-run.
-- =============================================================================

alter table public.notes
  add column if not exists category text;

create index if not exists notes_category_idx
  on public.notes (household_id, category);
