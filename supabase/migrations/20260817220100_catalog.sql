-- Octo Studio Phase 1: normalized catalog, merchandising, and inventory.

create table if not exists public.materials (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  material_type text not null check (char_length(material_type) between 1 and 60),
  description text,
  density_g_cm3 numeric(8,4) check (density_g_cm3 is null or density_g_cm3 > 0),
  price_per_gram_minor bigint not null default 0 check (price_per_gram_minor >= 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  properties jsonb not null default '{}'::jsonb
    check (jsonb_typeof(properties) = 'object'),
  status public.catalog_status not null default 'draft',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists materials_status_position_idx
  on public.materials (status, position, name);

create table if not exists public.colors (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  hex_code text not null check (hex_code ~ '^#[0-9A-Fa-f]{6}$'),
  is_active boolean not null default true,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists colors_active_position_idx
  on public.colors (is_active, position, name);

create table if not exists public.material_colors (
  material_id uuid not null references public.materials(id) on delete cascade,
  color_id uuid not null references public.colors(id) on delete cascade,
  manufacturer_code text,
  price_adjustment_minor bigint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (material_id, color_id)
);

create index if not exists material_colors_color_idx
  on public.material_colors (color_id, material_id) where is_active;

create table if not exists public.categories (
  id uuid primary key default extensions.gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  image_url text,
  status public.publication_status not null default 'draft',
  position integer not null default 0 check (position >= 0),
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);

create index if not exists categories_parent_position_idx
  on public.categories (parent_id, position);
create index if not exists categories_publication_idx
  on public.categories (status, published_at desc);

create table if not exists public.products (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text,
  description text,
  product_type text not null default 'physical'
    check (product_type in ('physical', 'digital', 'custom_print')),
  status public.catalog_status not null default 'draft',
  base_price_minor bigint not null default 0 check (base_price_minor >= 0),
  compare_at_price_minor bigint
    check (compare_at_price_minor is null or compare_at_price_minor >= 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  tax_rate_bps integer not null default 2000 check (tax_rate_bps between 0 and 10000),
  requires_shipping boolean not null default true,
  default_material_id uuid references public.materials(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    compare_at_price_minor is null
    or compare_at_price_minor >= base_price_minor
  )
);

create index if not exists products_publication_idx
  on public.products (status, published_at desc);
create index if not exists products_default_material_idx
  on public.products (default_material_id) where default_material_id is not null;
create index if not exists products_search_idx
  on public.products using gin (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' ||
      coalesce(short_description, '') || ' ' ||
      coalesce(description, '')
    )
  );

create table if not exists public.product_options (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, name),
  unique (id, product_id)
);

create index if not exists product_options_product_position_idx
  on public.product_options (product_id, position);

create table if not exists public.product_option_values (
  id uuid primary key default extensions.gen_random_uuid(),
  option_id uuid not null references public.product_options(id) on delete cascade,
  value text not null check (char_length(value) between 1 and 100),
  swatch_hex text check (swatch_hex is null or swatch_hex ~ '^#[0-9A-Fa-f]{6}$'),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (option_id, value),
  unique (id, option_id)
);

create index if not exists product_option_values_option_position_idx
  on public.product_option_values (option_id, position);

create table if not exists public.product_variants (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null check (char_length(sku) between 1 and 80),
  title text not null check (char_length(title) between 1 and 180),
  barcode text,
  status public.catalog_status not null default 'draft',
  price_minor bigint not null check (price_minor >= 0),
  compare_at_price_minor bigint
    check (compare_at_price_minor is null or compare_at_price_minor >= 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  weight_g numeric(12,3) check (weight_g is null or weight_g >= 0),
  length_mm numeric(12,3) check (length_mm is null or length_mm >= 0),
  width_mm numeric(12,3) check (width_mm is null or width_mm >= 0),
  height_mm numeric(12,3) check (height_mm is null or height_mm >= 0),
  attributes jsonb not null default '{}'::jsonb
    check (jsonb_typeof(attributes) = 'object'),
  is_default boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, product_id),
  check (
    compare_at_price_minor is null
    or compare_at_price_minor >= price_minor
  )
);

create unique index if not exists product_variants_sku_lower_uidx
  on public.product_variants (lower(sku));
create unique index if not exists product_variants_one_default_uidx
  on public.product_variants (product_id) where is_default;
create index if not exists product_variants_product_status_position_idx
  on public.product_variants (product_id, status, position);

create table if not exists public.variant_option_values (
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  option_id uuid not null references public.product_options(id) on delete cascade,
  option_value_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (variant_id, option_id),
  unique (variant_id, option_value_id),
  foreign key (option_value_id, option_id)
    references public.product_option_values(id, option_id)
    on delete cascade
);

create index if not exists variant_option_values_value_idx
  on public.variant_option_values (option_value_id, variant_id);

create table if not exists public.variant_materials (
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete restrict,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (variant_id, material_id)
);

create unique index if not exists variant_materials_one_default_uidx
  on public.variant_materials (variant_id) where is_default;
create index if not exists variant_materials_material_idx
  on public.variant_materials (material_id, variant_id);

create table if not exists public.variant_colors (
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  color_id uuid not null references public.colors(id) on delete restrict,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (variant_id, color_id)
);

create unique index if not exists variant_colors_one_default_uidx
  on public.variant_colors (variant_id) where is_default;
create index if not exists variant_colors_color_idx
  on public.variant_colors (color_id, variant_id);

create table if not exists public.product_images (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid,
  storage_path text,
  external_url text,
  alt_text text,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  position integer not null default 0 check (position >= 0),
  is_primary boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (variant_id, product_id)
    references public.product_variants(id, product_id)
    on delete cascade,
  check (num_nonnulls(storage_path, external_url) = 1)
);

create unique index if not exists product_images_storage_path_uidx
  on public.product_images (storage_path) where storage_path is not null;
create unique index if not exists product_images_one_primary_uidx
  on public.product_images (product_id) where is_primary and variant_id is null;
create index if not exists product_images_product_position_idx
  on public.product_images (product_id, position);
create index if not exists product_images_variant_position_idx
  on public.product_images (variant_id, position) where variant_id is not null;

create table if not exists public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  is_primary boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create unique index if not exists product_categories_one_primary_uidx
  on public.product_categories (product_id) where is_primary;
create index if not exists product_categories_category_position_idx
  on public.product_categories (category_id, position, product_id);

create table if not exists public.collections (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  cover_image_url text,
  status public.publication_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index if not exists collections_publication_window_idx
  on public.collections (status, starts_at, ends_at);

create table if not exists public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  primary key (collection_id, product_id)
);

create index if not exists collection_products_position_idx
  on public.collection_products (collection_id, position, product_id);

create table if not exists public.inventory_locations (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null check (char_length(name) between 1 and 120),
  address jsonb not null default '{}'::jsonb
    check (jsonb_typeof(address) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_levels (
  id uuid primary key default extensions.gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  location_id uuid not null references public.inventory_locations(id) on delete cascade,
  on_hand_quantity integer not null default 0 check (on_hand_quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  available_quantity integer generated always as
    (on_hand_quantity - reserved_quantity) stored,
  reorder_point integer not null default 0 check (reorder_point >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_id, location_id),
  check (reserved_quantity <= on_hand_quantity)
);

create index if not exists inventory_levels_location_idx
  on public.inventory_levels (location_id, variant_id);
create index if not exists inventory_levels_reorder_idx
  on public.inventory_levels (location_id, available_quantity)
  where available_quantity <= reorder_point;

create table if not exists public.inventory_movements (
  id uuid primary key default extensions.gen_random_uuid(),
  inventory_level_id uuid not null references public.inventory_levels(id) on delete restrict,
  movement_type public.inventory_movement_type not null,
  on_hand_delta integer not null default 0,
  reserved_delta integer not null default 0,
  reference_type text,
  reference_id uuid,
  idempotency_key text,
  reason text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (on_hand_delta <> 0 or reserved_delta <> 0)
);

create unique index if not exists inventory_movements_idempotency_uidx
  on public.inventory_movements (idempotency_key)
  where idempotency_key is not null;
create index if not exists inventory_movements_level_created_idx
  on public.inventory_movements (inventory_level_id, created_at desc);
create index if not exists inventory_movements_reference_idx
  on public.inventory_movements (reference_type, reference_id)
  where reference_id is not null;

create table if not exists public.pricing_rules (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 140),
  description text,
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  adjustment_type public.pricing_adjustment_type not null,
  operation text not null default 'add' check (operation in ('add', 'subtract', 'set')),
  amount_minor bigint,
  percentage_bps integer,
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  conditions jsonb not null default '{}'::jsonb
    check (jsonb_typeof(conditions) = 'object'),
  priority integer not null default 100,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (
    (adjustment_type in ('fixed', 'per_unit') and amount_minor is not null and percentage_bps is null)
    or
    (
      adjustment_type = 'percentage'
      and amount_minor is null
      and percentage_bps is not null
      and percentage_bps between 0 and 10000
    )
  )
);

create index if not exists pricing_rules_active_priority_idx
  on public.pricing_rules (is_active, priority, starts_at, ends_at);
create index if not exists pricing_rules_product_idx
  on public.pricing_rules (product_id) where product_id is not null;
create index if not exists pricing_rules_variant_idx
  on public.pricing_rules (variant_id) where variant_id is not null;
create index if not exists pricing_rules_material_idx
  on public.pricing_rules (material_id) where material_id is not null;

create table if not exists public.volume_discounts (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 140),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  minimum_quantity integer not null check (minimum_quantity > 0),
  maximum_quantity integer check (maximum_quantity is null or maximum_quantity >= minimum_quantity),
  discount_bps integer not null check (discount_bps between 1 and 10000),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(product_id, variant_id, material_id) = 1),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index if not exists volume_discounts_active_range_idx
  on public.volume_discounts (is_active, minimum_quantity, maximum_quantity);
create index if not exists volume_discounts_product_idx
  on public.volume_discounts (product_id, minimum_quantity) where product_id is not null;
create index if not exists volume_discounts_variant_idx
  on public.volume_discounts (variant_id, minimum_quantity) where variant_id is not null;
create index if not exists volume_discounts_material_idx
  on public.volume_discounts (material_id, minimum_quantity) where material_id is not null;

create or replace function public.validate_catalog_relationships()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  variant_product_id uuid;
  option_product_id uuid;
begin
  if tg_table_name = 'variant_option_values' then
    select product_id into variant_product_id
    from public.product_variants where id = new.variant_id;

    select product_id into option_product_id
    from public.product_options where id = new.option_id;

    if variant_product_id is distinct from option_product_id then
      raise exception 'variant and option must belong to the same product'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'pricing_rules' and new.variant_id is not null and new.product_id is not null then
    select product_id into variant_product_id
    from public.product_variants where id = new.variant_id;

    if variant_product_id is distinct from new.product_id then
      raise exception 'pricing rule variant must belong to its product'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists variant_option_values_validate on public.variant_option_values;
create trigger variant_option_values_validate
before insert or update on public.variant_option_values
for each row execute function public.validate_catalog_relationships();

drop trigger if exists pricing_rules_validate on public.pricing_rules;
create trigger pricing_rules_validate
before insert or update on public.pricing_rules
for each row execute function public.validate_catalog_relationships();

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'materials', 'colors', 'categories', 'products', 'product_options',
    'product_option_values', 'product_variants', 'product_images',
    'collections', 'inventory_locations', 'inventory_levels',
    'pricing_rules', 'volume_discounts'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', target_table);
    execute format(
      'create trigger set_updated_at before update on public.%I ' ||
      'for each row execute function public.set_updated_at()',
      target_table
    );
  end loop;
end
$$;

comment on column public.products.base_price_minor is
  'Money is stored as integer minor units (kuruş for TRY).';
comment on table public.inventory_movements is
  'Append-only inventory ledger; inventory_levels is the current projection.';
