-- Baskı Çiftliği owned/licensed curated model source (additive).
insert into public.external_model_sources (
  name,
  slug,
  source_type,
  base_url,
  terms_url,
  is_active
)
values (
  'Baskı Çiftliği Koleksiyonu',
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

drop policy if exists external_models_staff_write on public.external_models;
create policy external_models_staff_write
on public.external_models for all to authenticated
using ((select public.is_catalog_editor()))
with check ((select public.is_catalog_editor()));

grant insert, update, delete on table public.external_models to authenticated;
