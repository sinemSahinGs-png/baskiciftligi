-- Catalog managers may write catalog rows. Scheduled products become
-- publicly readable only after published_at. Cost stays off public selects.

drop policy if exists public_read_active_products on public.products;
create policy public_read_active_products
on public.products for select to anon, authenticated
using (
  status in ('active'::public.catalog_status, 'scheduled'::public.catalog_status)
  and published_at is not null
  and published_at <= now()
);

drop policy if exists public_read_active_variants on public.product_variants;
create policy public_read_active_variants
on public.product_variants for select to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1 from public.products p
    where p.id = product_variants.product_id
      and p.status in ('active'::public.catalog_status, 'scheduled'::public.catalog_status)
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists catalog_editors_write_products on public.products;
create policy catalog_editors_write_products
on public.products for all to authenticated
using ((select public.is_catalog_editor()))
with check ((select public.is_catalog_editor()));

drop policy if exists catalog_editors_write_variants on public.product_variants;
create policy catalog_editors_write_variants
on public.product_variants for all to authenticated
using ((select public.is_catalog_editor()))
with check ((select public.is_catalog_editor()));

drop policy if exists catalog_editors_write_images on public.product_images;
create policy catalog_editors_write_images
on public.product_images for all to authenticated
using ((select public.is_catalog_editor()))
with check ((select public.is_catalog_editor()));

drop policy if exists catalog_editors_write_product_categories on public.product_categories;
create policy catalog_editors_write_product_categories
on public.product_categories for all to authenticated
using ((select public.is_catalog_editor()))
with check ((select public.is_catalog_editor()));

drop policy if exists catalog_editors_write_collection_products on public.collection_products;
create policy catalog_editors_write_collection_products
on public.collection_products for all to authenticated
using ((select public.is_catalog_editor()))
with check ((select public.is_catalog_editor()));

drop policy if exists catalog_editors_write_inventory_levels on public.inventory_levels;
create policy catalog_editors_write_inventory_levels
on public.inventory_levels for all to authenticated
using ((select public.is_catalog_editor()))
with check ((select public.is_catalog_editor()));

comment on policy catalog_editors_write_products on public.products is
  'Owner, admin, catalog_manager and editor may mutate products. Viewers remain read-only.';
