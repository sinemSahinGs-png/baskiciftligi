-- Octo Studio Phase 1: immutable commercial records and protected security fields.

create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    new.email is distinct from old.email
    or new.role is distinct from old.role
    or new.is_active is distinct from old.is_active
    or new.created_at is distinct from old.created_at
  )
  and not public.is_admin()
  and coalesce(auth.role(), '') <> 'service_role'
  and current_user not in ('postgres', 'supabase_admin', 'supabase_auth_admin')
  then
    raise exception 'email, role, active state, and creation time are protected profile fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_security_fields on public.profiles;
create trigger profiles_protect_security_fields
before update on public.profiles
for each row execute function public.protect_profile_security_fields();

create or replace function public.protect_order_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'pending' and new.status = 'pending' then
    raise exception 'orders cannot return to pending after processing starts'
      using errcode = '23514';
  end if;

  if new.user_id is distinct from old.user_id and new.user_id is not null then
    raise exception 'order user reference may only be cleared'
      using errcode = '55000';
  end if;

  if new.cart_id is distinct from old.cart_id and new.cart_id is not null then
    raise exception 'order cart reference may only be cleared'
      using errcode = '55000';
  end if;

  if row(
    new.order_number,
    new.currency,
    new.customer_snapshot,
    new.shipping_address_snapshot,
    new.billing_address_snapshot,
    new.coupon_snapshot,
    new.subtotal_minor,
    new.discount_minor,
    new.shipping_minor,
    new.tax_minor,
    new.total_minor,
    new.placed_at
  ) is distinct from row(
    old.order_number,
    old.currency,
    old.customer_snapshot,
    old.shipping_address_snapshot,
    old.billing_address_snapshot,
    old.coupon_snapshot,
    old.subtotal_minor,
    old.discount_minor,
    old.shipping_minor,
    old.tax_minor,
    old.total_minor,
    old.placed_at
  ) then
    raise exception 'order commercial snapshots are immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_protect_snapshot on public.orders;
create trigger orders_protect_snapshot
before update on public.orders
for each row execute function public.protect_order_snapshot();

create or replace function public.prevent_commercial_record_deletion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% records cannot be deleted', tg_table_name
    using errcode = '55000';
end;
$$;

drop trigger if exists orders_prevent_deletion on public.orders;
create trigger orders_prevent_deletion
before delete on public.orders
for each row execute function public.prevent_commercial_record_deletion();

drop trigger if exists payments_prevent_deletion on public.payments;
create trigger payments_prevent_deletion
before delete on public.payments
for each row execute function public.prevent_commercial_record_deletion();

create or replace function public.protect_order_item_insertion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.orders o
    where o.id = new.order_id and o.status = 'pending'
  ) then
    raise exception 'items can only be added while an order is pending'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

drop trigger if exists order_items_protect_insertion on public.order_items;
create trigger order_items_protect_insertion
before insert on public.order_items
for each row execute function public.protect_order_item_insertion();

create or replace function public.protect_append_only_row()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  allowed_null_column text;
  old_data jsonb;
  new_data jsonb;
begin
  if tg_op = 'DELETE' then
    raise exception '% is append-only and cannot be deleted', tg_table_name
      using errcode = '55000';
  end if;

  old_data := to_jsonb(old);
  new_data := to_jsonb(new);

  foreach allowed_null_column in array tg_argv
  loop
    if new_data -> allowed_null_column is distinct from old_data -> allowed_null_column
       and new_data -> allowed_null_column is distinct from 'null'::jsonb
    then
      raise exception '% may only null its % reference', tg_table_name, allowed_null_column
        using errcode = '55000';
    end if;

    old_data := old_data - allowed_null_column;
    new_data := new_data - allowed_null_column;
  end loop;

  if new_data is distinct from old_data then
    raise exception '% is append-only and cannot be updated', tg_table_name
      using errcode = '55000';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_mutation on public.order_items;
create trigger prevent_mutation
before update or delete on public.order_items
for each row execute function public.protect_append_only_row('product_id', 'variant_id');

drop trigger if exists prevent_mutation on public.coupon_redemptions;
create trigger prevent_mutation
before update or delete on public.coupon_redemptions
for each row execute function public.protect_append_only_row('user_id');

drop trigger if exists prevent_mutation on public.inventory_movements;
create trigger prevent_mutation
before update or delete on public.inventory_movements
for each row execute function public.protect_append_only_row('actor_id');

drop trigger if exists prevent_mutation on public.audit_logs;
create trigger prevent_mutation
before update or delete on public.audit_logs
for each row execute function public.protect_append_only_row('actor_id');

create or replace function public.protect_payment_record()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if row(
    new.order_id,
    new.provider,
    new.amount_minor,
    new.currency,
    new.created_at
  ) is distinct from row(
    old.order_id,
    old.provider,
    old.amount_minor,
    old.currency,
    old.created_at
  ) then
    raise exception 'payment identity and amount are immutable'
      using errcode = '55000';
  end if;

  if old.provider_reference is not null
     and new.provider_reference is distinct from old.provider_reference
  then
    raise exception 'payment provider reference is immutable once assigned'
      using errcode = '55000';
  end if;

  if old.payment_method_type is not null
     and new.payment_method_type is distinct from old.payment_method_type
  then
    raise exception 'payment method type is immutable once assigned'
      using errcode = '55000';
  end if;

  if old.payment_method_last_four is not null
     and new.payment_method_last_four is distinct from old.payment_method_last_four
  then
    raise exception 'payment method suffix is immutable once assigned'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

drop trigger if exists payments_protect_record on public.payments;
create trigger payments_protect_record
before update on public.payments
for each row execute function public.protect_payment_record();

create or replace function public.protect_payment_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'payment events cannot be deleted'
      using errcode = '55000';
  end if;

  if old.payment_id is not null
     and new.payment_id is distinct from old.payment_id
     and new.payment_id is not null
  then
    raise exception 'payment event cannot be reassigned to another payment'
      using errcode = '55000';
  end if;

  if row(
    new.provider,
    new.provider_event_id,
    new.event_type,
    new.payload,
    new.occurred_at,
    new.received_at
  ) is distinct from row(
    old.provider,
    old.provider_event_id,
    old.event_type,
    old.payload,
    old.occurred_at,
    old.received_at
  ) then
    raise exception 'payment event source data are immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

drop trigger if exists payment_events_protect_record on public.payment_events;
create trigger payment_events_protect_record
before update or delete on public.payment_events
for each row execute function public.protect_payment_event();

create or replace function public.protect_shipment_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('shipped', 'in_transit', 'delivered', 'returned')
     and row(
       new.order_id,
       new.shipping_address_snapshot,
       new.package_snapshot,
       new.shipping_cost_minor,
       new.currency,
       new.carrier,
       new.tracking_number
     ) is distinct from row(
       old.order_id,
       old.shipping_address_snapshot,
       old.package_snapshot,
       old.shipping_cost_minor,
       old.currency,
       old.carrier,
       old.tracking_number
     )
  then
    raise exception 'dispatched shipment snapshots are immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

drop trigger if exists shipments_protect_snapshot on public.shipments;
create trigger shipments_protect_snapshot
before update on public.shipments
for each row execute function public.protect_shipment_snapshot();

create or replace function public.protect_print_quote_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.uploaded_model_id is distinct from old.uploaded_model_id
  then
    raise exception 'quote owner and uploaded model are immutable'
      using errcode = '55000';
  end if;

  if new.status is distinct from old.status and not (
    (old.status = 'draft' and new.status in ('calculating', 'cancelled'))
    or
    (old.status = 'calculating' and new.status in ('ready', 'cancelled'))
    or
    (old.status = 'ready' and new.status in ('accepted', 'expired', 'cancelled'))
  ) then
    raise exception 'invalid quote status transition: % to %', old.status, new.status
      using errcode = '23514';
  end if;

  if old.status in ('ready', 'accepted', 'expired', 'cancelled')
     and row(
       new.model_analysis_id,
       new.print_profile_id,
       new.currency,
       new.customer_snapshot,
       new.model_snapshot,
       new.print_profile_snapshot,
       new.pricing_snapshot,
       new.subtotal_minor,
       new.discount_minor,
       new.shipping_minor,
       new.tax_minor,
       new.total_minor,
       new.expires_at
     ) is distinct from row(
       old.model_analysis_id,
       old.print_profile_id,
       old.currency,
       old.customer_snapshot,
       old.model_snapshot,
       old.print_profile_snapshot,
       old.pricing_snapshot,
       old.subtotal_minor,
       old.discount_minor,
       old.shipping_minor,
       old.tax_minor,
       old.total_minor,
       old.expires_at
     )
  then
    raise exception 'finalized quote snapshots are immutable'
      using errcode = '55000';
  end if;

  if old.status = 'accepted' and new.accepted_at is distinct from old.accepted_at then
    raise exception 'quote acceptance timestamp is immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

drop trigger if exists print_quotes_protect_snapshot on public.print_quotes;
create trigger print_quotes_protect_snapshot
before update on public.print_quotes
for each row execute function public.protect_print_quote_snapshot();

create or replace function public.prevent_finalized_quote_deletion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('ready', 'accepted', 'expired', 'cancelled') then
    raise exception 'finalized print quotes cannot be deleted'
      using errcode = '55000';
  end if;

  return old;
end;
$$;

drop trigger if exists print_quotes_prevent_finalized_deletion on public.print_quotes;
create trigger print_quotes_prevent_finalized_deletion
before delete on public.print_quotes
for each row execute function public.prevent_finalized_quote_deletion();

create or replace function public.protect_finalized_quote_items()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  quote_id uuid;
  current_status public.quote_status;
begin
  quote_id := case when tg_op = 'DELETE' then old.print_quote_id else new.print_quote_id end;

  select status into current_status
  from public.print_quotes
  where id = quote_id;

  if current_status in ('ready', 'accepted', 'expired', 'cancelled') then
    raise exception 'items of a finalized quote are immutable'
      using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists quote_items_protect_finalized on public.quote_items;
create trigger quote_items_protect_finalized
before insert or update or delete on public.quote_items
for each row execute function public.protect_finalized_quote_items();

comment on function public.protect_order_snapshot() is
  'Allows operational status changes while rejecting changes to historical order facts.';
comment on function public.protect_print_quote_snapshot() is
  'Freezes quote inputs and prices as soon as the quote reaches ready.';
