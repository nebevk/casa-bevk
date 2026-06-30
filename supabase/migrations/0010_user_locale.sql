-- =============================================================================
-- 0010_user_locale.sql
--
-- Per-user UI language. Lives on user_settings (strictly self-scoped, so Nejc
-- and Eva each pick their own). 'sl' (Slovenian) is the default for this
-- household; 'en' is the fallback the dictionaries merge over. Idempotent.
-- =============================================================================

alter table public.user_settings
  add column if not exists locale text not null default 'sl'
  check (locale in ('en', 'sl'));
