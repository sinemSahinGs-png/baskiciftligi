-- Isolated wholesale lighter checkout. Does not alter retail catalog or retail orders.

create table if not exists public.wholesale_settings (
  id integer primary key check (id = 1),
  shipping_gross_minor integer,
  shipping_updated_at timestamptz,
  shipping_updated_by text,
  constraint wholesale_shipping_non_negative
    check (shipping_gross_minor is null or shipping_gross_minor >= 0)
);

insert into public.wholesale_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.wholesale_orders (
  id uuid primary key,
  order_number text not null unique,
  merchant_oid text not null unique,
  idempotency_key text not null unique,
  user_id uuid references auth.users (id),
  guest_email text not null,
  tracking_token_hash text not null,
  package_sku text not null check (package_sku in ('WS-LIGHTER-50', 'WS-LIGHTER-100')),
  unit_quantity integer not null check (unit_quantity in (50, 100)),
  unit_gross_minor integer not null check (unit_gross_minor >= 0),
  product_gross_minor integer not null check (product_gross_minor >= 0),
  stand_gross_minor integer not null check (stand_gross_minor = 0),
  shipping_gross_minor integer not null check (shipping_gross_minor >= 0),
  grand_total_minor integer not null check (grand_total_minor >= 0),
  currency text not null default 'TRY' check (currency = 'TRY'),
  payment_state text not null check (
    payment_state in ('payment_pending', 'paid', 'payment_failed', 'cancelled', 'refunded')
  ),
  fulfilment_state text not null check (
    fulfilment_state in ('new', 'preparing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled')
  ),
  customer_snapshot jsonb not null,
  shipping_snapshot jsonb not null,
  invoice_snapshot jsonb not null,
  customer_note text,
  agreements_snapshot jsonb not null,
  paytr_payment_type text,
  paytr_paid_amount_minor integer,
  paytr_failure_code text,
  paytr_failure_message text,
  paytr_test_mode boolean not null default true,
  shipment_carrier text,
  shipment_tracking_number text,
  shipment_tracking_url text,
  email_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists wholesale_orders_user_id_idx
  on public.wholesale_orders (user_id);
create index if not exists wholesale_orders_payment_state_idx
  on public.wholesale_orders (payment_state);
create index if not exists wholesale_orders_fulfilment_state_idx
  on public.wholesale_orders (fulfilment_state);
create index if not exists wholesale_orders_created_at_idx
  on public.wholesale_orders (created_at desc);

create table if not exists public.wholesale_order_events (
  id uuid primary key,
  order_id uuid not null references public.wholesale_orders (id) on delete cascade,
  previous_payment_state text,
  new_payment_state text,
  previous_fulfilment_state text,
  new_fulfilment_state text,
  actor text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists wholesale_order_events_order_id_idx
  on public.wholesale_order_events (order_id, created_at);

alter table public.wholesale_settings enable row level security;
alter table public.wholesale_orders enable row level security;
alter table public.wholesale_order_events enable row level security;

drop policy if exists wholesale_orders_owner_select on public.wholesale_orders;
create policy wholesale_orders_owner_select
on public.wholesale_orders
for select
to authenticated
using (user_id is not null and user_id = auth.uid());

drop policy if exists wholesale_order_events_owner_select on public.wholesale_order_events;
create policy wholesale_order_events_owner_select
on public.wholesale_order_events
for select
to authenticated
using (
  exists (
    select 1
    from public.wholesale_orders o
    where o.id = wholesale_order_events.order_id
      and o.user_id = auth.uid()
  )
);

revoke all on public.wholesale_settings from anon, authenticated;
revoke insert, update, delete on public.wholesale_orders from anon, authenticated;
revoke insert, update, delete on public.wholesale_order_events from anon, authenticated;
grant select on public.wholesale_orders to authenticated;
grant select on public.wholesale_order_events to authenticated;
