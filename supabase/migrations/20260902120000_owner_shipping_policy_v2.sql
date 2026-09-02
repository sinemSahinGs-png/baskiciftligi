-- Idempotent commerce_shipping_policies bootstrap.
--
-- Root cause: 20260820060000_production_persistence.sql creates this table, but
-- that migration is not present on production. The previous revision of this
-- file only INSERTed into the missing relation (42P01).
--
-- Safe to run on:
--   * empty / partial hosted schemas that already have public.profiles
--   * schemas where 20260820060000 already created the table
-- Does not touch pricing_configs or activate manufacturing tariffs.
--
-- free_shipping_threshold_minor = 0 means the free-shipping threshold is
-- disabled (standard shipping always applies for non-empty carts). It does
-- not mean "always free shipping". Application code uses threshold > 0.

create table if not exists public.commerce_shipping_policies (
  version integer primary key check (version > 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  standard_shipping_minor bigint not null check (standard_shipping_minor >= 0),
  free_shipping_threshold_minor bigint not null
    check (free_shipping_threshold_minor >= 0),
  activated_at timestamptz,
  activated_by uuid,
  notes text,
  created_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.profiles') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'commerce_shipping_policies_activated_by_fkey'
         and conrelid = 'public.commerce_shipping_policies'::regclass
     )
  then
    alter table public.commerce_shipping_policies
      add constraint commerce_shipping_policies_activated_by_fkey
      foreign key (activated_by) references public.profiles(id) on delete set null;
  end if;
end
$$;

comment on table public.commerce_shipping_policies is
  'Versioned cart shipping policy; quote gross excludes shipping. free_shipping_threshold_minor 0 = no free-shipping threshold.';

comment on column public.commerce_shipping_policies.free_shipping_threshold_minor is
  'Integer kuruş. 0 disables free shipping (standard shipping applies). Values > 0 are the cart subtotal that unlocks free shipping.';

alter table public.commerce_shipping_policies enable row level security;

drop policy if exists shipping_policies_public_read on public.commerce_shipping_policies;
create policy shipping_policies_public_read
on public.commerce_shipping_policies for select to anon, authenticated
using (activated_at is not null);

drop policy if exists shipping_policies_service on public.commerce_shipping_policies;
create policy shipping_policies_service
on public.commerce_shipping_policies for all to service_role
using (true) with check (true);

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_admin'
      and p.pronargs = 0
  ) then
    execute $policy$
      drop policy if exists shipping_policies_admin_write on public.commerce_shipping_policies;
      create policy shipping_policies_admin_write
      on public.commerce_shipping_policies for all to authenticated
      using ((select public.is_admin()))
      with check ((select public.is_admin()));
    $policy$;
  end if;
end
$$;

grant select on table public.commerce_shipping_policies to anon, authenticated;
grant all privileges on table public.commerce_shipping_policies to service_role;

do $$
begin
  if to_regclass('public.carts') is not null then
    begin
      alter table public.carts
        add column if not exists shipping_policy_version integer
        references public.commerce_shipping_policies(version) on delete restrict;
    exception
      when duplicate_object then
        null;
    end;
  end if;

  if to_regclass('public.orders') is not null then
    begin
      alter table public.orders
        add column if not exists shipping_policy_version integer
        references public.commerce_shipping_policies(version) on delete restrict;
    exception
      when duplicate_object then
        null;
    end;
  end if;
end
$$;

insert into public.commerce_shipping_policies (
  version,
  currency,
  standard_shipping_minor,
  free_shipping_threshold_minor,
  activated_at,
  notes
)
values (
  2,
  'TRY',
  10000,
  0,
  now(),
  'Bambu Lab A1 Combo — 100 TL kargo, ücretsiz eşik yok, sipariş başına bir kez'
)
on conflict (version) do update
set
  currency = excluded.currency,
  standard_shipping_minor = excluded.standard_shipping_minor,
  free_shipping_threshold_minor = excluded.free_shipping_threshold_minor,
  notes = excluded.notes,
  activated_at = coalesce(
    public.commerce_shipping_policies.activated_at,
    excluded.activated_at
  );
