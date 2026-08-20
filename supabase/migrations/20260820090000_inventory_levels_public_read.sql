-- Storefront catalog embeds inventory_levels(on_hand_quantity).
-- RLS had no public-read policy and anon had no SELECT grant, which 500'd `/`.

drop policy if exists public_read_inventory_levels on public.inventory_levels;
create policy public_read_inventory_levels
on public.inventory_levels for select to anon, authenticated
using (
  exists (
    select 1
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = inventory_levels.variant_id
      and pv.status = 'active'
      and p.status in ('active'::public.catalog_status, 'scheduled'::public.catalog_status)
      and p.published_at is not null
      and p.published_at <= now()
  )
);

grant select (
  id,
  variant_id,
  location_id,
  on_hand_quantity,
  available_quantity
) on table public.inventory_levels to anon;
