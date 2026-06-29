-- =============================================================================
-- 0008_storage_rls.sql
--
-- Activates the Supabase Storage isolation that was left as a commented
-- template in 0001. Files live under <household_id>/<entity>/<file>; the FIRST
-- path segment is the household_id, and every operation is gated on membership
-- of it (writes additionally require the row owner = the uploader).
--
-- Apply this BEFORE shipping any file-upload feature (documents/attachments).
-- The casa-bevk bucket is forced private. Idempotent / safe to re-run.
-- =============================================================================

-- Private bucket (id == name == 'casa-bevk', public = false).
insert into storage.buckets (id, name, public)
values ('casa-bevk', 'casa-bevk', false)
on conflict (id) do update set public = false;

alter table storage.objects enable row level security;

drop policy if exists casa_bevk_storage_select on storage.objects;
create policy casa_bevk_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'casa-bevk'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists casa_bevk_storage_insert on storage.objects;
create policy casa_bevk_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'casa-bevk'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
    and owner = (select auth.uid())
  );

drop policy if exists casa_bevk_storage_update on storage.objects;
create policy casa_bevk_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'casa-bevk'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'casa-bevk'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists casa_bevk_storage_delete on storage.objects;
create policy casa_bevk_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'casa-bevk'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  );
