-- Octo Studio Phase 1: extensions, shared types, identities, and addresses.
-- Migrations are intentionally ordered by timestamp; use `supabase db reset`
-- rather than applying individual files out of order.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.app_role as enum ('customer', 'admin');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.publication_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.catalog_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.cart_status as enum ('active', 'converted', 'abandoned', 'expired');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.order_status as enum (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  );
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.fulfillment_status as enum (
    'unfulfilled', 'partial', 'fulfilled', 'returned'
  );
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_status as enum (
    'pending', 'authorized', 'paid', 'failed', 'cancelled',
    'partially_refunded', 'refunded'
  );
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_event_status as enum ('pending', 'processed', 'failed', 'ignored');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.shipment_status as enum (
    'pending', 'ready', 'shipped', 'in_transit', 'delivered',
    'exception', 'returned', 'cancelled'
  );
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.discount_type as enum ('fixed', 'percentage', 'free_shipping');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.inventory_movement_type as enum (
    'receipt', 'adjustment', 'reservation', 'release', 'sale', 'return'
  );
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.model_status as enum (
    'uploaded', 'queued', 'processing', 'ready', 'failed', 'deleted'
  );
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.analysis_status as enum ('pending', 'processing', 'completed', 'failed');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.quote_status as enum (
    'draft', 'calculating', 'ready', 'accepted', 'expired', 'cancelled'
  );
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.quote_item_type as enum (
    'model', 'setup', 'material', 'machine_time',
    'finishing', 'shipping', 'discount', 'tax'
  );
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.printer_status as enum ('active', 'maintenance', 'retired');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.pricing_adjustment_type as enum ('fixed', 'percentage', 'per_unit');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.permission_scope as enum ('view', 'download', 'commercial_use');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.lead_status as enum ('new', 'contacted', 'qualified', 'converted', 'closed');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.message_status as enum ('new', 'read', 'archived', 'spam');
exception when duplicate_object then null;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text check (display_name is null or char_length(display_name) between 1 and 120),
  phone text check (phone is null or char_length(phone) <= 32),
  avatar_url text,
  locale text not null default 'tr-TR' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  role public.app_role not null default 'customer',
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_uidx
  on public.profiles (lower(email))
  where email is not null;
create index if not exists profiles_role_idx on public.profiles (role) where is_active;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'::public.app_role
      and is_active
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

create or replace function public.handle_auth_user_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '')
    )
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

revoke all on function public.handle_auth_user_sync() from public;

drop trigger if exists on_auth_user_synced on auth.users;
create trigger on_auth_user_synced
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_auth_user_sync();

insert into public.profiles (id, email, display_name)
select
  id,
  lower(email),
  coalesce(
    nullif(btrim(raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(raw_user_meta_data ->> 'full_name'), '')
  )
from auth.users
on conflict (id) do nothing;

create or replace function public.admin_set_profile_access(
  target_user_id uuid,
  new_role public.app_role,
  new_is_active boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_profile public.profiles;
begin
  if not public.is_admin() then
    raise exception 'administrator privileges required'
      using errcode = '42501';
  end if;

  update public.profiles
  set role = new_role,
      is_active = new_is_active
  where id = target_user_id
  returning * into changed_profile;

  if changed_profile.id is null then
    raise exception 'profile not found'
      using errcode = 'P0002';
  end if;

  return changed_profile;
end;
$$;

revoke all on function public.admin_set_profile_access(uuid, public.app_role, boolean) from public;
grant execute on function public.admin_set_profile_access(uuid, public.app_role, boolean)
  to authenticated, service_role;

create table if not exists public.addresses (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text not null check (char_length(phone) between 5 and 32),
  company text,
  tax_number text,
  address_line1 text not null,
  address_line2 text,
  district text,
  city text not null,
  province text,
  postal_code text,
  country_code text not null default 'TR'
    check (country_code ~ '^[A-Z]{2}$'),
  delivery_instructions text,
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on public.addresses (user_id);
create unique index if not exists addresses_one_default_shipping_uidx
  on public.addresses (user_id) where is_default_shipping;
create unique index if not exists addresses_one_default_billing_uidx
  on public.addresses (user_id) where is_default_billing;

create or replace function public.keep_single_default_address()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_default_shipping then
    update public.addresses
    set is_default_shipping = false
    where user_id = new.user_id
      and id <> new.id
      and is_default_shipping;
  end if;

  if new.is_default_billing then
    update public.addresses
    set is_default_billing = false
    where user_id = new.user_id
      and id <> new.id
      and is_default_billing;
  end if;

  return new;
end;
$$;

revoke all on function public.keep_single_default_address() from public;

drop trigger if exists addresses_keep_single_default on public.addresses;
create trigger addresses_keep_single_default
before insert or update of is_default_shipping, is_default_billing on public.addresses
for each row execute function public.keep_single_default_address();

drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

comment on table public.profiles is
  'Application identity extension for auth.users. Role is never sourced from user metadata.';
comment on function public.is_admin() is
  'Non-recursive SECURITY DEFINER role check used by RLS policies.';
