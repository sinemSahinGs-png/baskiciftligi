-- Versioned commerce shipping policy for Baskı Çiftliği production:
-- 100 TL display shipping, no free-shipping threshold, charged once per cart.
-- Does not activate manufacturing pricing tariffs.

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
  standard_shipping_minor = excluded.standard_shipping_minor,
  free_shipping_threshold_minor = excluded.free_shipping_threshold_minor,
  notes = excluded.notes;
