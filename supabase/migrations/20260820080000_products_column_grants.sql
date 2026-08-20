-- Harden products column grants: anon/authenticated must not read cost_price_minor.
-- Additive corrective migration.

revoke select on table public.products from anon, authenticated;

grant select (
  id, slug, sku, name, status, product_type, short_description, description,
  base_price_minor, compare_at_price_minor, currency, tax_rate_bps,
  requires_shipping, default_material_id, metadata, seo_title, seo_description,
  published_at, created_at, updated_at, barcode, featured, bestseller,
  new_arrival, limited, sort_order, product_stage_preset, stage_object_position,
  stage_mobile_object_position, made_to_order, inventory_policy,
  production_lead_time_min_days, production_lead_time_max_days, material_summary,
  weight_grams, width_mm, depth_mm, height_mm, personalization_enabled,
  personalization_instructions, canonical_url, search_visible, social_image_id,
  archived_at
) on table public.products to anon, authenticated;

-- Staff policies rely on authenticated role; cost remains service-role / admin API only.
grant select (cost_price_minor) on table public.products to service_role;
