# Octo Studio Phase 1 database

The Phase 1 database is a Supabase PostgreSQL schema. Money is always stored as
`bigint` minor units (`100` = `₺1,00` when `currency = 'TRY'`). Application code
must never use floating-point values for prices, discounts, tax, refunds, or
shipping.

## Migration order

Supabase applies the files in `supabase/migrations` lexicographically:

1. `20260817220000_foundation.sql` — extensions, enums, `profiles`, addresses,
   auth profile synchronization, `is_admin()`.
2. `20260817220100_catalog.sql` — products, variants/options/images,
   categories, collections, materials/colors, inventory, and pricing.
3. `20260817220200_commerce.sql` — favorites, carts, coupons, orders,
   payments/events, shipments, and reviews/media.
4. `20260817220300_printing_and_models.sql` — uploaded and external models,
   analysis, print/printer profiles, and print quotes.
5. `20260817220400_content_and_operations.sql` — media, blog/pages/homepage,
   navigation, leads/messages, notifications, settings, and audit.
6. `20260817220500_integrity.sql` — immutable order/payment/quote records and
   protected profile fields.
7. `20260817220600_rls.sql` — grants and RLS.
8. `20260817220700_private_model_storage.sql` — private `model-uploads` bucket
   and owner-prefix object policies.
9. `supabase/seed.sql` — idempotent, visibly `[DEMO]`-labeled Turkish catalog
   data. It intentionally creates no users, reviews, orders, payments, or sales
   counters.

The canonical local check is:

```sh
supabase db reset
supabase db lint
```

`db reset` is preferred over manually re-running individual migrations.
Tables, indexes, functions, triggers, and policies use idempotent constructs
where practical, while the seed uses stable UUIDs and upserts.

## Identity and administrator bootstrap

`auth.users` remains the source of authentication identity. `public.profiles`
is a one-to-one application profile. The auth trigger always creates a
`customer` profile and deliberately ignores any role supplied in user metadata.

Create the first user through the normal Supabase Auth flow. Then, while
connected as the database owner in the Supabase SQL editor, bootstrap exactly
one administrator:

```sql
update public.profiles as p
set role = 'admin'
from auth.users as u
where p.id = u.id
  and lower(u.email) = lower('admin@example.com');
```

Do not place a real email in a migration or seed. After the first bootstrap, an
administrator can use the guarded function:

```sql
select public.admin_set_profile_access(
  '<target-user-uuid>'::uuid,
  'admin'::public.app_role,
  true
);
```

`profiles.role`, `profiles.is_active`, and the auth-synchronized email are
protected from customer changes. The `public.is_admin()` RLS helper is
`SECURITY DEFINER`, has an empty `search_path`, and is executable only by
authenticated/service roles. This avoids recursive profile-policy evaluation.

## Access model

- `anon` can select only active/published catalog and content rows whose
  publication windows are open. It cannot read inventory quantities, pricing
  rules, coupon definitions, profiles, payment events, or operational data.
- Authenticated customers get the same published reads plus only their own
  profile, addresses, favorites, cart, orders, payment summaries, shipments,
  reviews, notifications, model uploads/analysis, print profiles, and quotes.
- Customers never create orders, payments, shipments, analysis results, quote
  items, inventory movements, or audit rows directly. Trusted server/worker
  code performs those writes.
- Administrators are recognized only through `public.is_admin()`. Admin RLS
  policies cover all application tables, subject to immutable-history triggers.
- Supabase `service_role` has its normal `BYPASSRLS` capability and explicit
  worker policies. The service-role key must exist only in server-side secret
  storage and must never be bundled into a browser or mobile client.
- Anonymous lead/contact inserts are intentionally write-only. Apply CAPTCHA,
  IP throttling, payload-size limits, and abuse monitoring at the API/edge
  layer.

RLS is enabled on every application table. SQL privileges do not grant
`TRUNCATE`, `REFERENCES`, or `TRIGGER` to client roles.

## Private uploaded models

`uploaded_models` has no anonymous policy. Customer policies require
`user_id = auth.uid()`. The associated Storage bucket is always non-public, and
object paths must use:

```text
<auth.uid()>/<server-generated-object-name>
```

Both the table constraint and Storage policies enforce that prefix. Use signed,
short-lived URLs only after authorizing the database row. Do not copy uploaded
geometry into `media_assets`, public product images, or any public bucket.

The schema stores object paths and SHA-256 hashes, never storage credentials.
External model source records contain URLs and attribution only; API keys must
remain in server-side secret storage.

## Commercial integrity

- Orders and order items contain customer, address, product, option, coupon,
  material/color, and price snapshots. Catalog edits cannot rewrite history.
- Order commercial fields and order item rows are immutable. Operational
  statuses and internal notes may change through authorized paths.
- Quote inputs and prices become immutable when a quote reaches `ready`.
  `quote_items` can change only while the quote is `draft` or `calculating`.
- Payment identity/amount fields are immutable. Provider event source payloads
  cannot be changed or deleted after ingestion; only processing state can
  advance.
- Inventory movements, coupon redemptions, and audit logs are append-only.
- Exact inventory, internal pricing rules/printer costs, payment event payloads,
  and audit details are admin/service-only.

Order creation should be one server-side transaction: lock the active cart and
relevant inventory rows, recompute every amount from trusted catalog/pricing
data, reserve stock, insert order snapshots/items, and mark the cart converted.
Never accept totals, tax, discount, payment state, review verification, model
analysis, or quote pricing from a client.

Payment webhook handlers should insert `payment_events` using the provider event
ID as the idempotency boundary. Model-analysis and quote workers should use the
service role and idempotent job keys outside the browser.

## Publication and demo data

Setting a row's status to `published`/`active` is not always sufficient:
content/catalog policies also require a non-null `published_at` not in the
future, plus any `starts_at`/`ends_at` window. Media additionally requires
`is_public = true`.

All seed-facing names begin with `[DEMO]`, all seed IDs are stable, and metadata
contains `demo: true` where relevant. Remove or replace these records before a
production launch. The seed never manufactures social proof or transaction
history.
