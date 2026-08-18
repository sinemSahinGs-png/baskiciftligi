-- Octo Studio Phase 1: grants and Row Level Security.
-- SECURITY DEFINER functions in earlier migrations use an empty search_path.

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles', 'addresses',
    'materials', 'colors', 'material_colors', 'categories', 'products',
    'product_options', 'product_option_values', 'product_variants',
    'variant_option_values', 'variant_materials', 'variant_colors',
    'product_images', 'product_categories', 'collections', 'collection_products',
    'inventory_locations', 'inventory_levels', 'inventory_movements',
    'pricing_rules', 'volume_discounts',
    'favorites', 'coupons', 'coupon_products', 'coupon_categories',
    'carts', 'cart_items', 'orders', 'order_items', 'coupon_redemptions',
    'payments', 'payment_events', 'shipments', 'shipment_items',
    'reviews', 'review_moderation', 'review_media',
    'external_model_sources', 'external_models', 'external_model_permissions',
    'uploaded_models', 'model_analyses', 'printer_profiles',
    'printer_profile_materials', 'print_profiles', 'print_quotes', 'quote_items',
    'media_assets', 'blog_posts', 'pages', 'homepage_sections',
    'navigation_menus', 'navigation_items', 'leads', 'messages',
    'notifications', 'site_settings', 'audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);

    execute format('drop policy if exists admins_manage_all on public.%I', target_table);
    execute format(
      'create policy admins_manage_all on public.%I for all to authenticated ' ||
      'using ((select public.is_admin())) with check ((select public.is_admin()))',
      target_table
    );

    -- service_role already has BYPASSRLS in hosted Supabase. This explicit policy
    -- also documents and supports worker access in local environments.
    execute format('drop policy if exists service_role_manage_all on public.%I', target_table);
    execute format(
      'create policy service_role_manage_all on public.%I for all to service_role ' ||
      'using (true) with check (true)',
      target_table
    );

    execute format(
      'revoke all privileges on table public.%I from anon, authenticated',
      target_table
    );
    execute format(
      'grant select, insert, update, delete on table public.%I to authenticated',
      target_table
    );
    execute format(
      'grant all privileges on table public.%I to service_role',
      target_table
    );
  end loop;
end
$$;

-- Public catalog -------------------------------------------------------------

drop policy if exists public_read_active_materials on public.materials;
create policy public_read_active_materials
on public.materials for select to anon, authenticated
using (status = 'active');

drop policy if exists public_read_active_colors on public.colors;
create policy public_read_active_colors
on public.colors for select to anon, authenticated
using (is_active);

drop policy if exists public_read_active_material_colors on public.material_colors;
create policy public_read_active_material_colors
on public.material_colors for select to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.materials m
    where m.id = material_colors.material_id and m.status = 'active'
  )
  and exists (
    select 1 from public.colors c
    where c.id = material_colors.color_id and c.is_active
  )
);

drop policy if exists public_read_published_categories on public.categories;
create policy public_read_published_categories
on public.categories for select to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
);

drop policy if exists public_read_active_products on public.products;
create policy public_read_active_products
on public.products for select to anon, authenticated
using (
  status = 'active'
  and published_at is not null
  and published_at <= now()
);

drop policy if exists public_read_product_options on public.product_options;
create policy public_read_product_options
on public.product_options for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_options.product_id
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists public_read_product_option_values on public.product_option_values;
create policy public_read_product_option_values
on public.product_option_values for select to anon, authenticated
using (
  exists (
    select 1
    from public.product_options po
    join public.products p on p.id = po.product_id
    where po.id = product_option_values.option_id
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists public_read_active_variants on public.product_variants;
create policy public_read_active_variants
on public.product_variants for select to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1 from public.products p
    where p.id = product_variants.product_id
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists public_read_variant_option_values on public.variant_option_values;
create policy public_read_variant_option_values
on public.variant_option_values for select to anon, authenticated
using (
  exists (
    select 1
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = variant_option_values.variant_id
      and pv.status = 'active'
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists public_read_variant_materials on public.variant_materials;
create policy public_read_variant_materials
on public.variant_materials for select to anon, authenticated
using (
  exists (
    select 1
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    join public.materials m on m.id = variant_materials.material_id
    where pv.id = variant_materials.variant_id
      and pv.status = 'active'
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
      and m.status = 'active'
  )
);

drop policy if exists public_read_variant_colors on public.variant_colors;
create policy public_read_variant_colors
on public.variant_colors for select to anon, authenticated
using (
  exists (
    select 1
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    join public.colors c on c.id = variant_colors.color_id
    where pv.id = variant_colors.variant_id
      and pv.status = 'active'
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
      and c.is_active
  )
);

drop policy if exists public_read_product_images on public.product_images;
create policy public_read_product_images
on public.product_images for select to anon, authenticated
using (
  is_public
  and exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists public_read_product_categories on public.product_categories;
create policy public_read_product_categories
on public.product_categories for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_categories.product_id
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
  )
  and exists (
    select 1 from public.categories c
    where c.id = product_categories.category_id
      and c.status = 'published'
      and c.published_at is not null
      and c.published_at <= now()
  )
);

drop policy if exists public_read_published_collections on public.collections;
create policy public_read_published_collections
on public.collections for select to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

drop policy if exists public_read_collection_products on public.collection_products;
create policy public_read_collection_products
on public.collection_products for select to anon, authenticated
using (
  exists (
    select 1 from public.collections c
    where c.id = collection_products.collection_id
      and c.status = 'published'
      and c.published_at is not null
      and c.published_at <= now()
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at > now())
  )
  and exists (
    select 1 from public.products p
    where p.id = collection_products.product_id
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists public_read_volume_discounts on public.volume_discounts;
create policy public_read_volume_discounts
on public.volume_discounts for select to anon, authenticated
using (
  is_active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
  and (
    (
      product_id is not null
      and exists (
        select 1 from public.products p
        where p.id = volume_discounts.product_id
          and p.status = 'active'
          and p.published_at is not null
          and p.published_at <= now()
      )
    )
    or
    (
      variant_id is not null
      and exists (
        select 1
        from public.product_variants pv
        join public.products p on p.id = pv.product_id
        where pv.id = volume_discounts.variant_id
          and pv.status = 'active'
          and p.status = 'active'
          and p.published_at is not null
          and p.published_at <= now()
      )
    )
    or
    (
      material_id is not null
      and exists (
        select 1 from public.materials m
        where m.id = volume_discounts.material_id and m.status = 'active'
      )
    )
  )
);

-- Public reviews and content -------------------------------------------------

drop policy if exists public_read_approved_reviews on public.reviews;
create policy public_read_approved_reviews
on public.reviews for select to anon, authenticated
using (
  status = 'approved'
  and published_at is not null
  and published_at <= now()
  and exists (
    select 1 from public.products p
    where p.id = reviews.product_id
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists public_read_approved_review_media on public.review_media;
create policy public_read_approved_review_media
on public.review_media for select to anon, authenticated
using (
  exists (
    select 1
    from public.reviews r
    join public.products p on p.id = r.product_id
    where r.id = review_media.review_id
      and r.status = 'approved'
      and r.published_at is not null
      and r.published_at <= now()
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists public_read_published_media on public.media_assets;
create policy public_read_published_media
on public.media_assets for select to anon, authenticated
using (
  is_public
  and status = 'published'
  and published_at is not null
  and published_at <= now()
);

drop policy if exists public_read_published_blog_posts on public.blog_posts;
create policy public_read_published_blog_posts
on public.blog_posts for select to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
);

drop policy if exists public_read_published_pages on public.pages;
create policy public_read_published_pages
on public.pages for select to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
);

drop policy if exists public_read_published_homepage_sections on public.homepage_sections;
create policy public_read_published_homepage_sections
on public.homepage_sections for select to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

drop policy if exists public_read_active_navigation_menus on public.navigation_menus;
create policy public_read_active_navigation_menus
on public.navigation_menus for select to anon, authenticated
using (is_active);

drop policy if exists public_read_active_navigation_items on public.navigation_items;
create policy public_read_active_navigation_items
on public.navigation_items for select to anon, authenticated
using (
  is_active
  and visibility = 'public'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
  and exists (
    select 1 from public.navigation_menus nm
    where nm.id = navigation_items.menu_id and nm.is_active
  )
  and (
    target_type = 'url'
    or (
      target_type = 'page'
      and exists (
        select 1 from public.pages p
        where p.id = navigation_items.target_id
          and p.status = 'published'
          and p.published_at is not null
          and p.published_at <= now()
      )
    )
    or (
      target_type = 'category'
      and exists (
        select 1 from public.categories c
        where c.id = navigation_items.target_id
          and c.status = 'published'
          and c.published_at is not null
          and c.published_at <= now()
      )
    )
    or (
      target_type = 'product'
      and exists (
        select 1 from public.products p
        where p.id = navigation_items.target_id
          and p.status = 'active'
          and p.published_at is not null
          and p.published_at <= now()
      )
    )
    or (
      target_type = 'collection'
      and exists (
        select 1 from public.collections c
        where c.id = navigation_items.target_id
          and c.status = 'published'
          and c.published_at is not null
          and c.published_at <= now()
          and (c.starts_at is null or c.starts_at <= now())
          and (c.ends_at is null or c.ends_at > now())
      )
    )
  )
);

drop policy if exists public_read_active_external_sources on public.external_model_sources;
create policy public_read_active_external_sources
on public.external_model_sources for select to anon, authenticated
using (is_active);

drop policy if exists public_read_published_external_models on public.external_models;
create policy public_read_published_external_models
on public.external_models for select to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
  and exists (
    select 1 from public.external_model_sources s
    where s.id = external_models.source_id and s.is_active
  )
);

drop policy if exists public_read_site_settings on public.site_settings;
create policy public_read_site_settings
on public.site_settings for select to anon, authenticated
using (is_public);

-- Customer-owned identity and commerce --------------------------------------

drop policy if exists users_read_own_profile on public.profiles;
create policy users_read_own_profile
on public.profiles for select to authenticated
using (id = (select auth.uid()));

drop policy if exists users_update_own_profile on public.profiles;
create policy users_update_own_profile
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists users_manage_own_addresses on public.addresses;
create policy users_manage_own_addresses
on public.addresses for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists users_read_own_favorites on public.favorites;
create policy users_read_own_favorites
on public.favorites for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists users_add_own_favorites on public.favorites;
create policy users_add_own_favorites
on public.favorites for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.products p
    where p.id = favorites.product_id
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists users_delete_own_favorites on public.favorites;
create policy users_delete_own_favorites
on public.favorites for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists users_read_own_carts on public.carts;
create policy users_read_own_carts
on public.carts for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists users_create_own_carts on public.carts;
create policy users_create_own_carts
on public.carts for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'active'
  and subtotal_minor = 0
  and discount_minor = 0
  and shipping_minor = 0
  and tax_minor = 0
  and total_minor = 0
  and converted_order_id is null
);

drop policy if exists users_update_own_active_carts on public.carts;
create policy users_update_own_active_carts
on public.carts for update to authenticated
using (user_id = (select auth.uid()) and status = 'active')
with check (user_id = (select auth.uid()));

drop policy if exists users_delete_own_active_carts on public.carts;
create policy users_delete_own_active_carts
on public.carts for delete to authenticated
using (user_id = (select auth.uid()) and status = 'active');

drop policy if exists users_read_own_cart_items on public.cart_items;
create policy users_read_own_cart_items
on public.cart_items for select to authenticated
using (
  exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = (select auth.uid())
  )
);

drop policy if exists users_add_own_cart_items on public.cart_items;
create policy users_add_own_cart_items
on public.cart_items for insert to authenticated
with check (
  unit_price_minor = 0
  and line_subtotal_minor = 0
  and line_discount_minor = 0
  and line_tax_minor = 0
  and line_total_minor = 0
  and pricing_snapshot = '{}'::jsonb
  and exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = (select auth.uid())
      and c.status = 'active'
  )
  and exists (
    select 1
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = cart_items.variant_id
      and pv.status = 'active'
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists users_update_own_cart_items on public.cart_items;
create policy users_update_own_cart_items
on public.cart_items for update to authenticated
using (
  exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = (select auth.uid())
      and c.status = 'active'
  )
)
with check (
  exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = (select auth.uid())
      and c.status = 'active'
  )
);

drop policy if exists users_delete_own_cart_items on public.cart_items;
create policy users_delete_own_cart_items
on public.cart_items for delete to authenticated
using (
  exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = (select auth.uid())
      and c.status = 'active'
  )
);

drop policy if exists users_read_own_orders on public.orders;
create policy users_read_own_orders
on public.orders for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists users_read_own_order_items on public.order_items;
create policy users_read_own_order_items
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  )
);

drop policy if exists users_read_own_coupon_redemptions on public.coupon_redemptions;
create policy users_read_own_coupon_redemptions
on public.coupon_redemptions for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists users_read_own_payments on public.payments;
create policy users_read_own_payments
on public.payments for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = payments.order_id and o.user_id = (select auth.uid())
  )
);

drop policy if exists users_read_own_shipments on public.shipments;
create policy users_read_own_shipments
on public.shipments for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = shipments.order_id and o.user_id = (select auth.uid())
  )
);

drop policy if exists users_read_own_shipment_items on public.shipment_items;
create policy users_read_own_shipment_items
on public.shipment_items for select to authenticated
using (
  exists (
    select 1
    from public.shipments s
    join public.orders o on o.id = s.order_id
    where s.id = shipment_items.shipment_id
      and o.user_id = (select auth.uid())
  )
);

-- Customer reviews -----------------------------------------------------------

drop policy if exists users_read_own_reviews on public.reviews;
create policy users_read_own_reviews
on public.reviews for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists users_create_own_reviews on public.reviews;
create policy users_create_own_reviews
on public.reviews for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and not verified_purchase
  and published_at is null
);

drop policy if exists users_update_own_pending_reviews on public.reviews;
create policy users_update_own_pending_reviews
on public.reviews for update to authenticated
using (user_id = (select auth.uid()) and status = 'pending')
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and not verified_purchase
  and published_at is null
);

drop policy if exists users_delete_own_pending_reviews on public.reviews;
create policy users_delete_own_pending_reviews
on public.reviews for delete to authenticated
using (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists users_read_own_review_media on public.review_media;
create policy users_read_own_review_media
on public.review_media for select to authenticated
using (
  exists (
    select 1 from public.reviews r
    where r.id = review_media.review_id and r.user_id = (select auth.uid())
  )
);

drop policy if exists users_add_own_pending_review_media on public.review_media;
create policy users_add_own_pending_review_media
on public.review_media for insert to authenticated
with check (
  exists (
    select 1 from public.reviews r
    where r.id = review_media.review_id
      and r.user_id = (select auth.uid())
      and r.status = 'pending'
  )
);

drop policy if exists users_delete_own_pending_review_media on public.review_media;
create policy users_delete_own_pending_review_media
on public.review_media for delete to authenticated
using (
  exists (
    select 1 from public.reviews r
    where r.id = review_media.review_id
      and r.user_id = (select auth.uid())
      and r.status = 'pending'
  )
);

-- Uploaded models and print quoting -----------------------------------------

drop policy if exists users_manage_own_uploaded_models on public.uploaded_models;
create policy users_manage_own_uploaded_models
on public.uploaded_models for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists users_create_own_uploaded_models on public.uploaded_models;
create policy users_create_own_uploaded_models
on public.uploaded_models for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'uploaded'
  and deleted_at is null
  and storage_bucket = 'model-uploads'
  and storage_path like (select auth.uid())::text || '/%'
);

drop policy if exists users_update_own_uploaded_models on public.uploaded_models;
create policy users_update_own_uploaded_models
on public.uploaded_models for update to authenticated
using (
  user_id = (select auth.uid())
  and status in ('uploaded', 'ready', 'failed')
)
with check (user_id = (select auth.uid()));

drop policy if exists users_delete_own_unprocessed_models on public.uploaded_models;
create policy users_delete_own_unprocessed_models
on public.uploaded_models for delete to authenticated
using (
  user_id = (select auth.uid())
  and status in ('uploaded', 'failed')
);

drop policy if exists users_read_own_model_analyses on public.model_analyses;
create policy users_read_own_model_analyses
on public.model_analyses for select to authenticated
using (
  exists (
    select 1 from public.uploaded_models um
    where um.id = model_analyses.uploaded_model_id
      and um.user_id = (select auth.uid())
  )
);

drop policy if exists users_manage_own_print_profiles on public.print_profiles;
create policy users_manage_own_print_profiles
on public.print_profiles for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists users_read_own_print_quotes on public.print_quotes;
create policy users_read_own_print_quotes
on public.print_quotes for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists users_request_own_print_quotes on public.print_quotes;
create policy users_request_own_print_quotes
on public.print_quotes for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'draft'
  and subtotal_minor = 0
  and discount_minor = 0
  and shipping_minor = 0
  and tax_minor = 0
  and total_minor = 0
  and customer_snapshot = '{}'::jsonb
  and model_snapshot = '{}'::jsonb
  and print_profile_snapshot = '{}'::jsonb
  and pricing_snapshot = '{}'::jsonb
  and model_analysis_id is null
  and order_id is null
  and expires_at is null
  and accepted_at is null
  and exists (
    select 1 from public.uploaded_models um
    where um.id = print_quotes.uploaded_model_id
      and um.user_id = (select auth.uid())
      and um.status = 'ready'
  )
);

drop policy if exists users_delete_own_draft_quotes on public.print_quotes;
create policy users_delete_own_draft_quotes
on public.print_quotes for delete to authenticated
using (user_id = (select auth.uid()) and status = 'draft');

drop policy if exists users_read_own_quote_items on public.quote_items;
create policy users_read_own_quote_items
on public.quote_items for select to authenticated
using (
  exists (
    select 1 from public.print_quotes pq
    where pq.id = quote_items.print_quote_id
      and pq.user_id = (select auth.uid())
  )
);

drop policy if exists users_read_own_external_permissions on public.external_model_permissions;
create policy users_read_own_external_permissions
on public.external_model_permissions for select to authenticated
using (user_id = (select auth.uid()));

-- CRM intake and user notifications -----------------------------------------

drop policy if exists anonymous_submit_leads on public.leads;
create policy anonymous_submit_leads
on public.leads for insert to anon
with check (
  user_id is null
  and status = 'new'
  and assigned_to is null
  and converted_user_id is null
  and internal_notes is null
  and contacted_at is null
  and converted_at is null
);

drop policy if exists users_submit_own_leads on public.leads;
create policy users_submit_own_leads
on public.leads for insert to authenticated
with check (
  (user_id is null or user_id = (select auth.uid()))
  and status = 'new'
  and assigned_to is null
  and converted_user_id is null
  and internal_notes is null
  and contacted_at is null
  and converted_at is null
);

drop policy if exists users_read_own_leads on public.leads;
create policy users_read_own_leads
on public.leads for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists anonymous_submit_messages on public.messages;
create policy anonymous_submit_messages
on public.messages for insert to anon
with check (
  user_id is null
  and lead_id is null
  and parent_message_id is null
  and direction = 'inbound'
  and channel = 'contact_form'
  and status = 'new'
  and assigned_to is null
  and read_at is null
);

drop policy if exists users_submit_own_messages on public.messages;
create policy users_submit_own_messages
on public.messages for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    lead_id is null
    or exists (
      select 1 from public.leads l
      where l.id = messages.lead_id
        and l.user_id = (select auth.uid())
    )
  )
  and parent_message_id is null
  and direction = 'inbound'
  and channel in ('contact_form', 'support')
  and status = 'new'
  and assigned_to is null
  and read_at is null
);

drop policy if exists users_read_own_messages on public.messages;
create policy users_read_own_messages
on public.messages for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists users_read_own_notifications on public.notifications;
create policy users_read_own_notifications
on public.notifications for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists users_update_own_notifications on public.notifications;
create policy users_update_own_notifications
on public.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- Restrict the columns ordinary customer policies are allowed to mutate.
-- Admin and service calls are exempt; database owners remain usable for resets.

create or replace function public.protect_customer_cart_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_admin()
     or coalesce(auth.role(), '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin')
  then
    return new;
  end if;

  if row(
    new.user_id, new.status, new.currency,
    new.subtotal_minor, new.discount_minor, new.shipping_minor,
    new.tax_minor, new.total_minor, new.pricing_version,
    new.converted_order_id, new.created_at
  ) is distinct from row(
    old.user_id, old.status, old.currency,
    old.subtotal_minor, old.discount_minor, old.shipping_minor,
    old.tax_minor, old.total_minor, old.pricing_version,
    old.converted_order_id, old.created_at
  ) then
    raise exception 'customers may only change coupon or expiry on an active cart'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists carts_protect_customer_fields on public.carts;
create trigger carts_protect_customer_fields
before update on public.carts
for each row execute function public.protect_customer_cart_fields();

create or replace function public.protect_customer_cart_item_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_admin()
     or coalesce(auth.role(), '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin')
  then
    return new;
  end if;

  if row(
    new.cart_id, new.variant_id, new.unit_price_minor,
    new.line_subtotal_minor, new.line_discount_minor, new.line_tax_minor,
    new.line_total_minor, new.pricing_snapshot, new.created_at
  ) is distinct from row(
    old.cart_id, old.variant_id, old.unit_price_minor,
    old.line_subtotal_minor, old.line_discount_minor, old.line_tax_minor,
    old.line_total_minor, old.pricing_snapshot, old.created_at
  ) then
    raise exception 'customer cart item pricing is server-managed'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists cart_items_protect_customer_fields on public.cart_items;
create trigger cart_items_protect_customer_fields
before update on public.cart_items
for each row execute function public.protect_customer_cart_item_fields();

create or replace function public.protect_customer_model_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_admin()
     or coalesce(auth.role(), '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin')
  then
    return new;
  end if;

  if row(
    new.user_id, new.external_model_id, new.original_filename,
    new.storage_bucket, new.storage_path, new.file_extension,
    new.mime_type, new.size_bytes, new.sha256, new.unit,
    new.status, new.error_code, new.error_message,
    new.deleted_at, new.created_at
  ) is distinct from row(
    old.user_id, old.external_model_id, old.original_filename,
    old.storage_bucket, old.storage_path, old.file_extension,
    old.mime_type, old.size_bytes, old.sha256, old.unit,
    old.status, old.error_code, old.error_message,
    old.deleted_at, old.created_at
  ) then
    raise exception 'uploaded model processing fields are worker-managed'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists uploaded_models_protect_customer_fields on public.uploaded_models;
create trigger uploaded_models_protect_customer_fields
before update on public.uploaded_models
for each row execute function public.protect_customer_model_fields();

create or replace function public.protect_customer_notification_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_admin()
     or coalesce(auth.role(), '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin')
  then
    return new;
  end if;

  if row(
    new.user_id, new.notification_type, new.title, new.body,
    new.action_url, new.payload, new.expires_at, new.created_at
  ) is distinct from row(
    old.user_id, old.notification_type, old.title, old.body,
    old.action_url, old.payload, old.expires_at, old.created_at
  ) then
    raise exception 'customers may only mark notifications read or archived'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists notifications_protect_customer_fields on public.notifications;
create trigger notifications_protect_customer_fields
before update on public.notifications
for each row execute function public.protect_customer_notification_fields();

create or replace function public.protect_customer_review_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_admin()
     or coalesce(auth.role(), '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin')
  then
    return new;
  end if;

  if row(
    new.product_id, new.user_id, new.order_item_id,
    new.status, new.verified_purchase, new.published_at, new.created_at
  ) is distinct from row(
    old.product_id, old.user_id, old.order_item_id,
    old.status, old.verified_purchase, old.published_at, old.created_at
  ) then
    raise exception 'review ownership, verification, and moderation fields are protected'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_protect_customer_fields on public.reviews;
create trigger reviews_protect_customer_fields
before update on public.reviews
for each row execute function public.protect_customer_review_fields();

-- SQL privileges complement RLS. The dynamic block above grants application
-- tables only; unrelated public-schema objects are not altered. TRUNCATE,
-- REFERENCES, and TRIGGER are never granted to client roles.

grant usage on schema public, extensions to anon, authenticated, service_role;

grant select on table
  public.materials,
  public.colors,
  public.material_colors,
  public.categories,
  public.products,
  public.product_options,
  public.product_option_values,
  public.product_variants,
  public.variant_option_values,
  public.variant_materials,
  public.variant_colors,
  public.product_images,
  public.product_categories,
  public.collections,
  public.collection_products,
  public.volume_discounts,
  public.reviews,
  public.review_media,
  public.media_assets,
  public.blog_posts,
  public.pages,
  public.homepage_sections,
  public.navigation_menus,
  public.navigation_items,
  public.external_model_sources,
  public.external_models,
  public.site_settings
to anon;

grant insert on table public.leads, public.messages to anon;

revoke all privileges on sequence
  public.order_number_seq,
  public.shipment_number_seq,
  public.quote_number_seq,
  public.audit_logs_id_seq
from anon, authenticated;

grant usage, select on sequence
  public.order_number_seq,
  public.shipment_number_seq,
  public.quote_number_seq,
  public.audit_logs_id_seq
to authenticated;

grant all privileges on sequence
  public.order_number_seq,
  public.shipment_number_seq,
  public.quote_number_seq,
  public.audit_logs_id_seq
to service_role;

comment on policy users_manage_own_uploaded_models on public.uploaded_models is
  'No anon policy exists: uploaded model metadata is never public.';
