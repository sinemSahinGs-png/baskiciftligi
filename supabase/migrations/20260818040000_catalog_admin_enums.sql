-- Baskı Çiftliği catalog admin: roles, product columns, media metadata,
-- public catalog-media bucket, and catalog-staff RLS helpers.
-- Does not replace the existing products / product_images / categories schema.

alter type public.app_role add value if not exists 'owner';
alter type public.app_role add value if not exists 'catalog_manager';
alter type public.app_role add value if not exists 'viewer';
alter type public.app_role add value if not exists 'editor';

alter type public.catalog_status add value if not exists 'scheduled';
