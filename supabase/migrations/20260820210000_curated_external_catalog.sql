-- Curated external model catalog fields on external_models (additive / idempotent).

alter table public.external_models
  add column if not exists title_tr text;

alter table public.external_models
  add column if not exists original_title text;

alter table public.external_models
  add column if not exists search_terms text[] not null default '{}'::text[];

alter table public.external_models
  add column if not exists category_id uuid references public.categories (id) on delete set null;

alter table public.external_models
  add column if not exists platform_type text;

alter table public.external_models
  add column if not exists license_verified boolean not null default false;

alter table public.external_models
  add column if not exists image_alt text;

alter table public.external_models
  add column if not exists created_by uuid references auth.users (id) on delete set null;

alter table public.external_models
  add column if not exists listing_kind text;

update public.external_models
set listing_kind = coalesce(listing_kind, 'studio')
where listing_kind is null;

alter table public.external_models
  alter column listing_kind set default 'curated_external';

update public.external_models
set title_tr = coalesce(nullif(btrim(title_tr), ''), title)
where title_tr is null or btrim(coalesce(title_tr, '')) = '';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'external_models_platform_type_check'
  ) then
    alter table public.external_models
      add constraint external_models_platform_type_check
      check (
        platform_type is null
        or platform_type in (
          'printables',
          'thingiverse',
          'myminifactory',
          'other',
          'studio'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'external_models_listing_kind_check'
  ) then
    alter table public.external_models
      add constraint external_models_listing_kind_check
      check (listing_kind in ('studio', 'curated_external'));
  end if;
end $$;

create index if not exists external_models_listing_kind_idx
  on public.external_models (listing_kind);

create index if not exists external_models_search_terms_gin
  on public.external_models using gin (search_terms);

create index if not exists external_models_category_id_idx
  on public.external_models (category_id);

insert into public.external_model_sources (
  name,
  slug,
  source_type,
  base_url,
  terms_url,
  is_active
)
values (
  'Baskı Çiftliği Küratörlü Katalog',
  'baski-ciftligi',
  'repository',
  'https://baskiciftligi.com/hazir-modeller',
  'https://baskiciftligi.com/yasal/mesafeli-satis',
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  base_url = excluded.base_url,
  terms_url = excluded.terms_url,
  is_active = true,
  updated_at = now();

drop policy if exists catalog_media_staff_insert_curated on storage.objects;
create policy catalog_media_staff_insert_curated
on storage.objects for insert to authenticated
with check (
  bucket_id = 'catalog-media'
  and (select public.is_catalog_editor())
  and name like 'curated/%'
);

drop policy if exists catalog_media_staff_update_curated on storage.objects;
create policy catalog_media_staff_update_curated
on storage.objects for update to authenticated
using (
  bucket_id = 'catalog-media'
  and (select public.is_catalog_editor())
  and name like 'curated/%'
)
with check (
  bucket_id = 'catalog-media'
  and (select public.is_catalog_editor())
  and name like 'curated/%'
);
