-- Catalog admin columns, audit helper, storage bucket, and RLS.
-- Public users still read only published (status = active AND published_at <= now()).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('admin'::public.app_role, 'owner'::public.app_role)
      and is_active
  );
$$;

create or replace function public.is_catalog_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'catalog_manager'::public.app_role,
        'editor'::public.app_role
      )
      and is_active
  );
$$;

create or replace function public.is_catalog_viewer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in (
        'owner'::public.app_role,
        'admin'::public.app_role,
        'catalog_manager'::public.app_role,
        'editor'::public.app_role,
        'viewer'::public.app_role
      )
      and is_active
  );
$$;

revoke all on function public.is_catalog_editor() from public;
revoke all on function public.is_catalog_viewer() from public;
grant execute on function public.is_catalog_editor() to authenticated, service_role;
grant execute on function public.is_catalog_viewer() to authenticated, service_role;

alter table public.products
  add column if not exists sku text,
  add column if not exists barcode text,
  add column if not exists featured boolean not null default false,
  add column if not exists bestseller boolean not null default false,
  add column if not exists new_arrival boolean not null default false,
  add column if not exists limited boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists product_stage_preset text,
  add column if not exists stage_object_position text,
  add column if not exists stage_mobile_object_position text,
  add column if not exists made_to_order boolean not null default true,
  add column if not exists inventory_policy text not null default 'deny'
    check (inventory_policy in ('deny', 'continue')),
  add column if not exists production_lead_time_min_days integer not null default 0
    check (production_lead_time_min_days >= 0),
  add column if not exists production_lead_time_max_days integer not null default 0
    check (production_lead_time_max_days >= 0),
  add column if not exists material_summary text,
  add column if not exists weight_grams numeric(12,3)
    check (weight_grams is null or weight_grams >= 0),
  add column if not exists width_mm numeric(12,3)
    check (width_mm is null or width_mm >= 0),
  add column if not exists depth_mm numeric(12,3)
    check (depth_mm is null or depth_mm >= 0),
  add column if not exists height_mm numeric(12,3)
    check (height_mm is null or height_mm >= 0),
  add column if not exists personalization_enabled boolean not null default false,
  add column if not exists personalization_instructions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(personalization_instructions) = 'array'),
  add column if not exists canonical_url text,
  add column if not exists search_visible boolean not null default true,
  add column if not exists social_image_id uuid,
  add column if not exists archived_at timestamptz,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists cost_price_minor bigint
    check (cost_price_minor is null or cost_price_minor >= 0);

create unique index if not exists products_sku_lower_uidx
  on public.products (lower(sku))
  where sku is not null and length(btrim(sku)) > 0;

alter table public.product_variants
  add column if not exists price_adjustment_minor bigint,
  add column if not exists color_name text,
  add column if not exists color_hex text
    check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists size_label text,
  add column if not exists material text,
  add column if not exists active boolean not null default true,
  add column if not exists sort_order integer not null default 0;

alter table public.product_images
  add column if not exists media_type text not null default 'image'
    check (media_type in ('image', 'video')),
  add column if not exists mime_type text,
  add column if not exists file_size integer check (file_size is null or file_size >= 0),
  add column if not exists role text,
  add column if not exists object_fit text,
  add column if not exists object_position text,
  add column if not exists mobile_object_position text,
  add column if not exists stage_preset_override text,
  add column if not exists sort_order integer not null default 0;

alter table public.categories
  add column if not exists hero_media_id uuid,
  add column if not exists stage_preset text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists active boolean not null default true;

create table if not exists public.catalog_audit_log (
  id bigint generated by default as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  action text not null check (char_length(action) between 1 and 120),
  product_id uuid references public.products(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists catalog_audit_log_product_idx
  on public.catalog_audit_log (product_id, created_at desc);
create index if not exists catalog_audit_log_actor_idx
  on public.catalog_audit_log (actor_id, created_at desc)
  where actor_id is not null;

alter table public.catalog_audit_log enable row level security;

drop policy if exists catalog_staff_read_audit on public.catalog_audit_log;
create policy catalog_staff_read_audit
on public.catalog_audit_log for select to authenticated
using ((select public.is_catalog_viewer()));

drop policy if exists catalog_staff_insert_audit on public.catalog_audit_log;
create policy catalog_staff_insert_audit
on public.catalog_audit_log for insert to authenticated
with check ((select public.is_catalog_editor()));

drop policy if exists service_role_manage_catalog_audit on public.catalog_audit_log;
create policy service_role_manage_catalog_audit
on public.catalog_audit_log for all to service_role
using (true) with check (true);

grant select, insert on table public.catalog_audit_log to authenticated;
grant all privileges on table public.catalog_audit_log to service_role;

create or replace function public.write_catalog_audit(
  audit_action text,
  audit_product_id uuid default null,
  audit_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id bigint;
begin
  if not public.is_catalog_editor() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'catalog editor or service role required'
      using errcode = '42501';
  end if;

  insert into public.catalog_audit_log (actor_id, actor_role, action, product_id, metadata)
  values (
    auth.uid(),
    coalesce(
      (select role::text from public.profiles where id = auth.uid()),
      current_user
    ),
    audit_action,
    audit_product_id,
    coalesce(audit_metadata, '{}'::jsonb)
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.write_catalog_audit(text, uuid, jsonb) from public;
grant execute on function public.write_catalog_audit(text, uuid, jsonb)
  to authenticated, service_role;

drop policy if exists catalog_staff_read_all_products on public.products;
create policy catalog_staff_read_all_products
on public.products for select to authenticated
using ((select public.is_catalog_viewer()));

drop policy if exists catalog_staff_read_all_images on public.product_images;
create policy catalog_staff_read_all_images
on public.product_images for select to authenticated
using ((select public.is_catalog_viewer()));

drop policy if exists catalog_staff_read_all_variants on public.product_variants;
create policy catalog_staff_read_all_variants
on public.product_variants for select to authenticated
using ((select public.is_catalog_viewer()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'catalog-media',
  'catalog-media',
  true,
  20971520,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/avif',
    'video/mp4',
    'video/webm'
  ]::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists catalog_media_public_read on storage.objects;
create policy catalog_media_public_read
on storage.objects for select to anon, authenticated
using (bucket_id = 'catalog-media');

drop policy if exists catalog_media_admin_insert on storage.objects;
create policy catalog_media_admin_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'catalog-media'
  and (select public.is_catalog_editor())
  and name like 'products/%'
);

drop policy if exists catalog_media_admin_update on storage.objects;
create policy catalog_media_admin_update
on storage.objects for update to authenticated
using (
  bucket_id = 'catalog-media'
  and (select public.is_catalog_editor())
)
with check (
  bucket_id = 'catalog-media'
  and (select public.is_catalog_editor())
);

drop policy if exists catalog_media_admin_delete on storage.objects;
create policy catalog_media_admin_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'catalog-media'
  and (select public.is_catalog_editor())
);

drop policy if exists catalog_media_service_manage on storage.objects;
create policy catalog_media_service_manage
on storage.objects for all to service_role
using (bucket_id = 'catalog-media')
with check (bucket_id = 'catalog-media');

comment on table public.catalog_audit_log is
  'Safe catalog mutations: actor, action, product, timestamp. No secrets.';
comment on function public.is_catalog_editor() is
  'Owner, admin, catalog_manager and editor may write catalog rows and media.';
