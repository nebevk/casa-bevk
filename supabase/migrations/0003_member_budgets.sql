-- =============================================================================
-- CASA BEVK — 0003: per-person (member) budgets
-- Lets each member keep their own monthly plan per category (e.g. Nejc 1500,
-- Eva 500), alongside shared budgets (member_id IS NULL). Idempotent.
-- RLS is unchanged: both members manage the household's shared + personal
-- budgets (generic household policy still applies).
-- =============================================================================

alter table public.budgets
  add column if not exists member_id uuid
    references public.profiles(id) on delete cascade;

-- Replace the old category/month uniqueness with member-aware uniqueness.
-- NULL member/category fold to a sentinel uuid so "one row per
-- (household, member, category, month)" holds for shared and personal alike.
drop index if exists budgets_household_cat_month_uq;
drop index if exists budgets_household_month_null_cat;

create unique index if not exists budgets_unique on public.budgets (
  household_id,
  period_month,
  coalesce(member_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index if not exists budgets_member_idx
  on public.budgets (household_id, member_id, period_month);
