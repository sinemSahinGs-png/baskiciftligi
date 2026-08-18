-- Octo Studio Phase 1: private Supabase Storage bucket for customer models.
-- Object names must use: <auth.uid()>/<generated object name>.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'model-uploads',
  'model-uploads',
  false,
  1073741824,
  array[
    'application/octet-stream',
    'application/sla',
    'model/stl',
    'model/obj',
    'model/3mf',
    'model/step'
  ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists octo_models_select_own on storage.objects;
create policy octo_models_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'model-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists octo_models_insert_own on storage.objects;
create policy octo_models_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'model-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists octo_models_update_own on storage.objects;
create policy octo_models_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'model-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'model-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists octo_models_delete_own on storage.objects;
create policy octo_models_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'model-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists octo_models_admin_manage on storage.objects;
create policy octo_models_admin_manage
on storage.objects for all to authenticated
using (
  bucket_id = 'model-uploads'
  and (select public.is_admin())
)
with check (
  bucket_id = 'model-uploads'
  and (select public.is_admin())
);

drop policy if exists octo_models_service_manage on storage.objects;
create policy octo_models_service_manage
on storage.objects for all to service_role
using (bucket_id = 'model-uploads')
with check (bucket_id = 'model-uploads');

comment on table public.uploaded_models is
  'Private metadata paired with the non-public model-uploads Storage bucket.';
