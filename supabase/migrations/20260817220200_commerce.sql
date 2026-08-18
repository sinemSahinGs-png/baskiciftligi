-- Octo Studio Phase 1: carts, promotions, orders, payments, shipping, and reviews.

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists favorites_product_idx
  on public.favorites (product_id, created_at desc);

create table if not exists public.coupons (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null check (code ~ '^[A-Za-z0-9_-]{3,40}$'),
  name text not null check (char_length(name) between 1 and 140),
  description text,
  discount_type public.discount_type not null,
  amount_minor bigint,
  percentage_bps integer,
  maximum_discount_minor bigint
    check (maximum_discount_minor is null or maximum_discount_minor >= 0),
  minimum_subtotal_minor bigint not null default 0
    check (minimum_subtotal_minor >= 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_limit_per_user integer
    check (usage_limit_per_user is null or usage_limit_per_user > 0),
  times_redeemed integer not null default 0 check (times_redeemed >= 0),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (
    (discount_type = 'fixed' and amount_minor is not null and amount_minor > 0 and percentage_bps is null)
    or
    (
      discount_type = 'percentage'
      and amount_minor is null
      and percentage_bps is not null
      and percentage_bps between 1 and 10000
    )
    or
    (discount_type = 'free_shipping' and amount_minor is null and percentage_bps is null)
  )
);

create unique index if not exists coupons_code_lower_uidx
  on public.coupons (lower(code));
create index if not exists coupons_active_window_idx
  on public.coupons (is_active, starts_at, ends_at);

create table if not exists public.coupon_products (
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (coupon_id, product_id)
);

create index if not exists coupon_products_product_idx
  on public.coupon_products (product_id, coupon_id);

create table if not exists public.coupon_categories (
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (coupon_id, category_id)
);

create index if not exists coupon_categories_category_idx
  on public.coupon_categories (category_id, coupon_id);

create table if not exists public.carts (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.cart_status not null default 'active',
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  coupon_id uuid references public.coupons(id) on delete set null,
  subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  total_minor bigint not null default 0 check (total_minor >= 0),
  pricing_version integer not null default 1 check (pricing_version > 0),
  expires_at timestamptz,
  converted_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_minor <= subtotal_minor + shipping_minor),
  check (total_minor = subtotal_minor - discount_minor + shipping_minor + tax_minor)
);

create unique index if not exists carts_one_active_per_user_uidx
  on public.carts (user_id) where status = 'active';
create index if not exists carts_user_updated_idx
  on public.carts (user_id, updated_at desc);
create index if not exists carts_expiry_idx
  on public.carts (expires_at) where status = 'active' and expires_at is not null;

create table if not exists public.cart_items (
  id uuid primary key default extensions.gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 999),
  customization jsonb not null default '{}'::jsonb
    check (jsonb_typeof(customization) = 'object'),
  customization_hash text not null default '',
  unit_price_minor bigint not null default 0 check (unit_price_minor >= 0),
  line_subtotal_minor bigint not null default 0 check (line_subtotal_minor >= 0),
  line_discount_minor bigint not null default 0 check (line_discount_minor >= 0),
  line_tax_minor bigint not null default 0 check (line_tax_minor >= 0),
  line_total_minor bigint not null default 0 check (line_total_minor >= 0),
  pricing_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(pricing_snapshot) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id, customization_hash),
  check (line_discount_minor <= line_subtotal_minor),
  check (line_total_minor = line_subtotal_minor - line_discount_minor + line_tax_minor)
);

create index if not exists cart_items_cart_idx on public.cart_items (cart_id, created_at);
create index if not exists cart_items_variant_idx on public.cart_items (variant_id);

create sequence if not exists public.order_number_seq start with 100000;

create table if not exists public.orders (
  id uuid primary key default extensions.gen_random_uuid(),
  order_number text not null default (
    'OCT-' || to_char(now(), 'YYYYMMDD') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 8, '0')
  ),
  user_id uuid references public.profiles(id) on delete set null,
  cart_id uuid references public.carts(id) on delete set null,
  status public.order_status not null default 'pending',
  fulfillment_status public.fulfillment_status not null default 'unfulfilled',
  payment_status public.payment_status not null default 'pending',
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  customer_snapshot jsonb not null check (jsonb_typeof(customer_snapshot) = 'object'),
  shipping_address_snapshot jsonb not null
    check (jsonb_typeof(shipping_address_snapshot) = 'object'),
  billing_address_snapshot jsonb not null
    check (jsonb_typeof(billing_address_snapshot) = 'object'),
  coupon_snapshot jsonb
    check (coupon_snapshot is null or jsonb_typeof(coupon_snapshot) = 'object'),
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  customer_note text,
  internal_note text,
  placed_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_number),
  check (discount_minor <= subtotal_minor + shipping_minor),
  check (total_minor = subtotal_minor - discount_minor + shipping_minor + tax_minor)
);

create index if not exists orders_user_placed_idx
  on public.orders (user_id, placed_at desc);
create index if not exists orders_status_created_idx
  on public.orders (status, created_at desc);
create index if not exists orders_payment_status_idx
  on public.orders (payment_status, created_at desc);
create index if not exists orders_fulfillment_status_idx
  on public.orders (fulfillment_status, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text not null,
  sku_snapshot text not null,
  options_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(options_snapshot) = 'object'),
  material_snapshot jsonb
    check (material_snapshot is null or jsonb_typeof(material_snapshot) = 'object'),
  color_snapshot jsonb
    check (color_snapshot is null or jsonb_typeof(color_snapshot) = 'object'),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  quantity integer not null check (quantity between 1 and 999),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  line_total_minor bigint not null check (line_total_minor >= 0),
  created_at timestamptz not null default now(),
  check (discount_minor <= unit_price_minor * quantity),
  check (line_total_minor = unit_price_minor * quantity - discount_minor + tax_minor)
);

create index if not exists order_items_order_idx on public.order_items (order_id, created_at);
create index if not exists order_items_product_idx
  on public.order_items (product_id) where product_id is not null;
create index if not exists order_items_variant_idx
  on public.order_items (variant_id) where variant_id is not null;

alter table public.carts
  drop constraint if exists carts_converted_order_id_fkey;
alter table public.carts
  add constraint carts_converted_order_id_fkey
  foreign key (converted_order_id) references public.orders(id) on delete set null;

create table if not exists public.coupon_redemptions (
  id uuid primary key default extensions.gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete set null,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  code_snapshot text not null,
  discount_minor bigint not null check (discount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  redeemed_at timestamptz not null default now()
);

create index if not exists coupon_redemptions_coupon_date_idx
  on public.coupon_redemptions (coupon_id, redeemed_at desc);
create index if not exists coupon_redemptions_user_date_idx
  on public.coupon_redemptions (user_id, redeemed_at desc)
  where user_id is not null;

create table if not exists public.payments (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null check (char_length(provider) between 1 and 60),
  provider_reference text,
  status public.payment_status not null default 'pending',
  amount_minor bigint not null check (amount_minor >= 0),
  refunded_minor bigint not null default 0 check (refunded_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  payment_method_type text,
  payment_method_last_four text
    check (payment_method_last_four is null or payment_method_last_four ~ '^[0-9]{4}$'),
  failure_code text,
  failure_message text,
  authorized_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (refunded_minor <= amount_minor)
);

create unique index if not exists payments_provider_reference_uidx
  on public.payments (provider, provider_reference)
  where provider_reference is not null;
create index if not exists payments_order_created_idx
  on public.payments (order_id, created_at desc);
create index if not exists payments_status_created_idx
  on public.payments (status, created_at);

create table if not exists public.payment_events (
  id uuid primary key default extensions.gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null check (char_length(provider) between 1 and 60),
  provider_event_id text not null,
  event_type text not null check (char_length(event_type) between 1 and 120),
  processing_status public.payment_event_status not null default 'pending',
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  error_message text,
  occurred_at timestamptz,
  processed_at timestamptz,
  received_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index if not exists payment_events_processing_idx
  on public.payment_events (processing_status, received_at);
create index if not exists payment_events_payment_idx
  on public.payment_events (payment_id, received_at desc)
  where payment_id is not null;

create sequence if not exists public.shipment_number_seq start with 100000;

create table if not exists public.shipments (
  id uuid primary key default extensions.gen_random_uuid(),
  shipment_number text not null default (
    'SHP-' || to_char(now(), 'YYYYMMDD') || '-' ||
    lpad(nextval('public.shipment_number_seq')::text, 8, '0')
  ),
  order_id uuid not null references public.orders(id) on delete restrict,
  status public.shipment_status not null default 'pending',
  carrier text,
  service_level text,
  tracking_number text,
  tracking_url text,
  shipping_address_snapshot jsonb not null
    check (jsonb_typeof(shipping_address_snapshot) = 'object'),
  package_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(package_snapshot) = 'object'),
  shipping_cost_minor bigint not null default 0 check (shipping_cost_minor >= 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shipment_number)
);

create unique index if not exists shipments_carrier_tracking_uidx
  on public.shipments (carrier, tracking_number)
  where carrier is not null and tracking_number is not null;
create index if not exists shipments_order_idx
  on public.shipments (order_id, created_at desc);
create index if not exists shipments_status_idx
  on public.shipments (status, created_at);

create table if not exists public.shipment_items (
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  primary key (shipment_id, order_item_id)
);

create index if not exists shipment_items_order_item_idx
  on public.shipment_items (order_item_id, shipment_id);

create or replace function public.validate_shipment_item()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  shipment_order_id uuid;
  item_order_id uuid;
  ordered_quantity integer;
  already_assigned integer;
begin
  select order_id into shipment_order_id
  from public.shipments
  where id = new.shipment_id;

  select order_id, quantity
  into item_order_id, ordered_quantity
  from public.order_items
  where id = new.order_item_id
  for update;

  if shipment_order_id is distinct from item_order_id then
    raise exception 'shipment item must belong to the shipment order'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(sum(si.quantity), 0)::integer
    into already_assigned
    from public.shipment_items si
    where si.order_item_id = new.order_item_id
      and (si.shipment_id, si.order_item_id)
          <> (old.shipment_id, old.order_item_id);
  else
    select coalesce(sum(si.quantity), 0)::integer
    into already_assigned
    from public.shipment_items si
    where si.order_item_id = new.order_item_id;
  end if;

  if already_assigned + new.quantity > ordered_quantity then
    raise exception 'shipped quantity exceeds ordered quantity'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists shipment_items_validate on public.shipment_items;
create trigger shipment_items_validate
before insert or update on public.shipment_items
for each row execute function public.validate_shipment_item();

create table if not exists public.reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  title text check (title is null or char_length(title) <= 140),
  body text check (body is null or char_length(body) <= 5000),
  reviewer_name_snapshot text not null
    check (char_length(reviewer_name_snapshot) between 1 and 120),
  status public.review_status not null default 'pending',
  verified_purchase boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists reviews_public_product_idx
  on public.reviews (product_id, published_at desc)
  where status = 'approved';
create index if not exists reviews_user_created_idx
  on public.reviews (user_id, created_at desc);
create index if not exists reviews_moderation_idx
  on public.reviews (status, created_at);

create table if not exists public.review_moderation (
  review_id uuid primary key references public.reviews(id) on delete cascade,
  moderator_id uuid references public.profiles(id) on delete set null,
  decision public.review_status not null
    check (decision in ('approved', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_moderation_moderator_idx
  on public.review_moderation (moderator_id, updated_at desc)
  where moderator_id is not null;

create table if not exists public.review_media (
  id uuid primary key default extensions.gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null unique,
  alt_text text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create index if not exists review_media_review_position_idx
  on public.review_media (review_id, position);

create or replace function public.validate_review_purchase()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.order_item_id is not null and not exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = new.order_item_id
      and oi.product_id = new.product_id
      and o.user_id = new.user_id
  ) then
    raise exception 'review order item does not belong to this user and product'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_validate_purchase on public.reviews;
create trigger reviews_validate_purchase
before insert or update of order_item_id, product_id, user_id on public.reviews
for each row execute function public.validate_review_purchase();

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'coupons', 'carts', 'cart_items', 'orders', 'payments',
    'shipments', 'reviews', 'review_moderation'
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

comment on table public.order_items is
  'Immutable line snapshots. Catalog foreign keys are optional references, never the source of historical truth.';
comment on table public.payment_events is
  'Append-only provider event inbox. Payloads are never customer-readable.';
