-- Reinforce cost_price_minor column isolation for anon/authenticated roles.
-- Additive corrective migration.

revoke select (cost_price_minor) on table public.products from anon, authenticated;

grant select (
  id, slug, sku, name, status, product_type, short_description, description,
  base_price_minor, compare_at_price_minor, currency, tax_rate_bps,
  requires_shipping, default_material_id, metadata, seo_title, seo_description,
  published_at, created_at, updated_at
) on table public.products to anon, authenticated;
