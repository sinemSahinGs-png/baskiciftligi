-- Octo Studio local/demo seed.
-- Every customer-facing seeded record is visibly DEMO-labeled.
-- Deliberately contains no reviews, orders, payments, sales counters, or users.

insert into public.materials (
  id, name, slug, material_type, description, density_g_cm3,
  price_per_gram_minor, currency, properties, status, position
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '[DEMO] Premium PLA',
    'demo-premium-pla',
    'PLA',
    'Kolay basılan, bitkisel kaynaklı günlük kullanım filamenti.',
    1.2400,
    80,
    'TRY',
    '{"nozzle_temperature_c":[200,220],"bed_temperature_c":[50,60],"finish":"mat"}'::jsonb,
    'active',
    10
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '[DEMO] Dayanıklı PETG',
    'demo-dayanikli-petg',
    'PETG',
    'Darbe ve neme karşı dayanıklı işlevsel parça filamenti.',
    1.2700,
    105,
    'TRY',
    '{"nozzle_temperature_c":[230,250],"bed_temperature_c":[70,85],"finish":"yarı parlak"}'::jsonb,
    'active',
    20
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '[DEMO] Standart Reçine',
    'demo-standart-recine',
    'Resin',
    'Yüksek detay gerektiren dekoratif baskılar için standart reçine.',
    1.1000,
    180,
    'TRY',
    '{"technology":"SLA","finish":"pürüzsüz"}'::jsonb,
    'active',
    30
  )
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    material_type = excluded.material_type,
    description = excluded.description,
    density_g_cm3 = excluded.density_g_cm3,
    price_per_gram_minor = excluded.price_per_gram_minor,
    currency = excluded.currency,
    properties = excluded.properties,
    status = excluded.status,
    position = excluded.position;

insert into public.colors (id, name, slug, hex_code, is_active, position)
values
  (
    '31000000-0000-4000-8000-000000000001',
    '[DEMO] Gece Siyahı',
    'demo-gece-siyahi',
    '#1E1E1E',
    true,
    10
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    '[DEMO] Mercan',
    'demo-mercan',
    '#FF6B5F',
    true,
    20
  ),
  (
    '31000000-0000-4000-8000-000000000003',
    '[DEMO] Doğal Beyaz',
    'demo-dogal-beyaz',
    '#F5F2E8',
    true,
    30
  ),
  (
    '31000000-0000-4000-8000-000000000004',
    '[DEMO] Okyanus Mavisi',
    'demo-okyanus-mavisi',
    '#277DA1',
    true,
    40
  )
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    hex_code = excluded.hex_code,
    is_active = excluded.is_active,
    position = excluded.position;

insert into public.material_colors (
  material_id, color_id, manufacturer_code, price_adjustment_minor, is_active
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    'DEMO-PLA-BLK',
    0,
    true
  ),
  (
    '30000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000002',
    'DEMO-PLA-CRL',
    5,
    true
  ),
  (
    '30000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000003',
    'DEMO-PLA-WHT',
    0,
    true
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000001',
    'DEMO-PETG-BLK',
    0,
    true
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000004',
    'DEMO-PETG-BLU',
    10,
    true
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003',
    'DEMO-RESIN-WHT',
    0,
    true
  )
on conflict (material_id, color_id) do update
set manufacturer_code = excluded.manufacturer_code,
    price_adjustment_minor = excluded.price_adjustment_minor,
    is_active = excluded.is_active;

insert into public.categories (
  id, parent_id, name, slug, description, status, position, published_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    null,
    '[DEMO] Masaüstü Düzenleyiciler',
    'demo-masaustu-duzenleyiciler',
    'Çalışma alanını düzenleyen modüler 3D baskı ürünleri.',
    'published',
    10,
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    null,
    '[DEMO] Ev ve Yaşam',
    'demo-ev-ve-yasam',
    'Günlük yaşam için işlevsel ve sade tasarımlar.',
    'published',
    20,
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    null,
    '[DEMO] Kişiye Özel 3D Baskı',
    'demo-kisiye-ozel-3d-baski',
    'Dosya veya metin girdisiyle kişiselleştirilebilen baskılar.',
    'published',
    30,
    now()
  )
on conflict (id) do update
set parent_id = excluded.parent_id,
    name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    status = excluded.status,
    position = excluded.position,
    published_at = excluded.published_at;

insert into public.products (
  id, name, slug, short_description, description, product_type, status,
  base_price_minor, compare_at_price_minor, currency, tax_rate_bps,
  requires_shipping, default_material_id, metadata, published_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '[DEMO] Modüler Masaüstü Düzenleyici',
    'demo-moduler-masaustu-duzenleyici',
    'Kalem, kablo ve küçük aksesuarlar için birbirine geçen modüller.',
    'İhtiyaca göre yan yana eklenebilen üç bölmeli masaüstü düzenleyici.',
    'physical',
    'active',
    44990,
    49990,
    'TRY',
    2000,
    true,
    '30000000-0000-4000-8000-000000000001',
    '{"demo":true,"production_method":"FDM","lead_time_days":[2,4]}'::jsonb,
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '[DEMO] Katlanabilir Telefon Standı',
    'demo-katlanabilir-telefon-standi',
    'Çantada taşınabilen, iki açılı kompakt telefon standı.',
    'Video görüşmeleri ve masaüstü kullanım için kaymaz tabanlı katlanabilir stand.',
    'physical',
    'active',
    24990,
    null,
    'TRY',
    2000,
    true,
    '30000000-0000-4000-8000-000000000002',
    '{"demo":true,"production_method":"FDM","lead_time_days":[1,3]}'::jsonb,
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '[DEMO] Kişiye Özel Masa İsimliği',
    'demo-kisiye-ozel-masa-isimligi',
    'İsim ve unvan bilgisiyle hazırlanan çift renkli masa isimliği.',
    'Sipariş notunda verilen metinle üretilen, değiştirilebilir ön yüzlü isimlik.',
    'custom_print',
    'active',
    59990,
    null,
    'TRY',
    2000,
    true,
    '30000000-0000-4000-8000-000000000001',
    '{"demo":true,"production_method":"FDM","personalization_required":true,"lead_time_days":[3,5]}'::jsonb,
    now()
  )
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    short_description = excluded.short_description,
    description = excluded.description,
    product_type = excluded.product_type,
    status = excluded.status,
    base_price_minor = excluded.base_price_minor,
    compare_at_price_minor = excluded.compare_at_price_minor,
    currency = excluded.currency,
    tax_rate_bps = excluded.tax_rate_bps,
    requires_shipping = excluded.requires_shipping,
    default_material_id = excluded.default_material_id,
    metadata = excluded.metadata,
    published_at = excluded.published_at;

insert into public.product_categories (product_id, category_id, is_primary, position)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    true,
    10
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    true,
    10
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    true,
    10
  )
on conflict (product_id, category_id) do update
set is_primary = excluded.is_primary,
    position = excluded.position;

insert into public.product_options (id, product_id, name, position)
values
  (
    '21000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '[DEMO] Boyut',
    10
  ),
  (
    '21000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '[DEMO] Renk',
    20
  ),
  (
    '21000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000002',
    '[DEMO] Renk',
    10
  ),
  (
    '21000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000003',
    '[DEMO] Uzunluk',
    10
  )
on conflict (id) do update
set product_id = excluded.product_id,
    name = excluded.name,
    position = excluded.position;

insert into public.product_option_values (id, option_id, value, swatch_hex, position)
values
  (
    '21100000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    '[DEMO] Kompakt',
    null,
    10
  ),
  (
    '21100000-0000-4000-8000-000000000002',
    '21000000-0000-4000-8000-000000000001',
    '[DEMO] Geniş',
    null,
    20
  ),
  (
    '21100000-0000-4000-8000-000000000003',
    '21000000-0000-4000-8000-000000000002',
    '[DEMO] Gece Siyahı',
    '#1E1E1E',
    10
  ),
  (
    '21100000-0000-4000-8000-000000000004',
    '21000000-0000-4000-8000-000000000002',
    '[DEMO] Mercan',
    '#FF6B5F',
    20
  ),
  (
    '21100000-0000-4000-8000-000000000005',
    '21000000-0000-4000-8000-000000000003',
    '[DEMO] Gece Siyahı',
    '#1E1E1E',
    10
  ),
  (
    '21100000-0000-4000-8000-000000000006',
    '21000000-0000-4000-8000-000000000003',
    '[DEMO] Okyanus Mavisi',
    '#277DA1',
    20
  ),
  (
    '21100000-0000-4000-8000-000000000007',
    '21000000-0000-4000-8000-000000000004',
    '[DEMO] 20 cm',
    null,
    10
  ),
  (
    '21100000-0000-4000-8000-000000000008',
    '21000000-0000-4000-8000-000000000004',
    '[DEMO] 30 cm',
    null,
    20
  )
on conflict (id) do update
set option_id = excluded.option_id,
    value = excluded.value,
    swatch_hex = excluded.swatch_hex,
    position = excluded.position;

insert into public.product_variants (
  id, product_id, sku, title, status, price_minor, compare_at_price_minor,
  currency, weight_g, length_mm, width_mm, height_mm,
  attributes, is_default, position
)
values
  (
    '22000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'DEMO-ORG-CMP-BLK',
    '[DEMO] Kompakt / Gece Siyahı',
    'active',
    44990,
    49990,
    'TRY',
    185,
    160,
    105,
    90,
    '{"demo":true}'::jsonb,
    true,
    10
  ),
  (
    '22000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'DEMO-ORG-WDE-CRL',
    '[DEMO] Geniş / Mercan',
    'active',
    54990,
    null,
    'TRY',
    260,
    220,
    105,
    90,
    '{"demo":true}'::jsonb,
    false,
    20
  ),
  (
    '22000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000002',
    'DEMO-STAND-BLK',
    '[DEMO] Gece Siyahı',
    'active',
    24990,
    null,
    'TRY',
    72,
    105,
    70,
    12,
    '{"demo":true}'::jsonb,
    true,
    10
  ),
  (
    '22000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000002',
    'DEMO-STAND-BLU',
    '[DEMO] Okyanus Mavisi',
    'active',
    26990,
    null,
    'TRY',
    72,
    105,
    70,
    12,
    '{"demo":true}'::jsonb,
    false,
    20
  ),
  (
    '22000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000003',
    'DEMO-NAME-20',
    '[DEMO] 20 cm',
    'active',
    59990,
    null,
    'TRY',
    140,
    200,
    45,
    35,
    '{"demo":true,"max_characters":24}'::jsonb,
    true,
    10
  ),
  (
    '22000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000003',
    'DEMO-NAME-30',
    '[DEMO] 30 cm',
    'active',
    74990,
    null,
    'TRY',
    205,
    300,
    45,
    35,
    '{"demo":true,"max_characters":36}'::jsonb,
    false,
    20
  )
on conflict (id) do update
set product_id = excluded.product_id,
    sku = excluded.sku,
    title = excluded.title,
    status = excluded.status,
    price_minor = excluded.price_minor,
    compare_at_price_minor = excluded.compare_at_price_minor,
    currency = excluded.currency,
    weight_g = excluded.weight_g,
    length_mm = excluded.length_mm,
    width_mm = excluded.width_mm,
    height_mm = excluded.height_mm,
    attributes = excluded.attributes,
    is_default = excluded.is_default,
    position = excluded.position;

insert into public.variant_option_values (variant_id, option_id, option_value_id)
values
  (
    '22000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    '21100000-0000-4000-8000-000000000001'
  ),
  (
    '22000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000002',
    '21100000-0000-4000-8000-000000000003'
  ),
  (
    '22000000-0000-4000-8000-000000000002',
    '21000000-0000-4000-8000-000000000001',
    '21100000-0000-4000-8000-000000000002'
  ),
  (
    '22000000-0000-4000-8000-000000000002',
    '21000000-0000-4000-8000-000000000002',
    '21100000-0000-4000-8000-000000000004'
  ),
  (
    '22000000-0000-4000-8000-000000000003',
    '21000000-0000-4000-8000-000000000003',
    '21100000-0000-4000-8000-000000000005'
  ),
  (
    '22000000-0000-4000-8000-000000000004',
    '21000000-0000-4000-8000-000000000003',
    '21100000-0000-4000-8000-000000000006'
  ),
  (
    '22000000-0000-4000-8000-000000000005',
    '21000000-0000-4000-8000-000000000004',
    '21100000-0000-4000-8000-000000000007'
  ),
  (
    '22000000-0000-4000-8000-000000000006',
    '21000000-0000-4000-8000-000000000004',
    '21100000-0000-4000-8000-000000000008'
  )
on conflict (variant_id, option_id) do update
set option_value_id = excluded.option_value_id;

insert into public.variant_materials (variant_id, material_id, is_default)
values
  (
    '22000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    true
  ),
  (
    '22000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    true
  ),
  (
    '22000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000002',
    true
  ),
  (
    '22000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000002',
    true
  ),
  (
    '22000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000001',
    true
  ),
  (
    '22000000-0000-4000-8000-000000000006',
    '30000000-0000-4000-8000-000000000001',
    true
  )
on conflict (variant_id, material_id) do update
set is_default = excluded.is_default;

insert into public.variant_colors (variant_id, color_id, is_default)
values
  (
    '22000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    true
  ),
  (
    '22000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002',
    true
  ),
  (
    '22000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000001',
    true
  ),
  (
    '22000000-0000-4000-8000-000000000004',
    '31000000-0000-4000-8000-000000000004',
    true
  ),
  (
    '22000000-0000-4000-8000-000000000005',
    '31000000-0000-4000-8000-000000000003',
    true
  ),
  (
    '22000000-0000-4000-8000-000000000006',
    '31000000-0000-4000-8000-000000000003',
    true
  )
on conflict (variant_id, color_id) do update
set is_default = excluded.is_default;

insert into public.collections (
  id, name, slug, description, status, published_at
)
values (
  '23000000-0000-4000-8000-000000000001',
  '[DEMO] Çalışma Masası Seçkisi',
  'demo-calisma-masasi-seckisi',
  'Düzenli ve işlevsel bir çalışma alanı için demo ürün seçkisi.',
  'published',
  now()
)
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    status = excluded.status,
    published_at = excluded.published_at;

insert into public.collection_products (collection_id, product_id, position)
values
  (
    '23000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    10
  ),
  (
    '23000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    20
  ),
  (
    '23000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    30
  )
on conflict (collection_id, product_id) do update
set position = excluded.position;

insert into public.volume_discounts (
  id, name, product_id, minimum_quantity, maximum_quantity,
  discount_bps, is_active
)
values (
  '24000000-0000-4000-8000-000000000001',
  '[DEMO] 10+ Masa İsimliği',
  '20000000-0000-4000-8000-000000000003',
  10,
  null,
  1000,
  true
)
on conflict (id) do update
set name = excluded.name,
    product_id = excluded.product_id,
    minimum_quantity = excluded.minimum_quantity,
    maximum_quantity = excluded.maximum_quantity,
    discount_bps = excluded.discount_bps,
    is_active = excluded.is_active;

insert into public.homepage_sections (
  id, section_key, section_type, heading, subheading,
  content, status, position, published_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    'demo-hero',
    'hero',
    '[DEMO] Fikrini Katmana Dönüştür',
    'Hazır tasarımları keşfet veya kendi 3D modelin için anında fiyat iste.',
    '{"demo":true,"primaryCta":{"label":"[DEMO] Ürünleri Keşfet","href":"/urunler"},"secondaryCta":{"label":"[DEMO] Model Yükle","href":"/model-yukle"}}'::jsonb,
    'published',
    10,
    now()
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    'demo-featured-categories',
    'categories',
    '[DEMO] Kategoriler',
    'İşlevsel tasarımlarla başla.',
    '{"demo":true,"categoryIds":["10000000-0000-4000-8000-000000000001","10000000-0000-4000-8000-000000000002","10000000-0000-4000-8000-000000000003"]}'::jsonb,
    'published',
    20,
    now()
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    'demo-featured-collection',
    'collection',
    '[DEMO] Çalışma Masası Seçkisi',
    'Masaüstü için özenle seçilmiş demo ürünler.',
    '{"demo":true,"collectionId":"23000000-0000-4000-8000-000000000001"}'::jsonb,
    'published',
    30,
    now()
  )
on conflict (id) do update
set section_key = excluded.section_key,
    section_type = excluded.section_type,
    heading = excluded.heading,
    subheading = excluded.subheading,
    content = excluded.content,
    status = excluded.status,
    position = excluded.position,
    published_at = excluded.published_at;

insert into public.site_settings (key, value, description, is_public)
values
  (
    'site.name',
    to_jsonb('[DEMO] Octo Studio'::text),
    'Local/demo storefront name.',
    true
  ),
  (
    'site.default_currency',
    to_jsonb('TRY'::text),
    'ISO 4217 currency used by demo catalog prices.',
    true
  ),
  (
    'site.default_locale',
    to_jsonb('tr-TR'::text),
    'Default storefront locale.',
    true
  ),
  (
    'homepage.demo_notice',
    '{"enabled":true,"label":"DEMO VERİSİ","message":"Bu içerik yalnızca geliştirme ve önizleme amaçlıdır."}'::jsonb,
    'Visible banner identifying seeded content as demo data.',
    true
  ),
  (
    'commerce.money_scale',
    '2'::jsonb,
    'Number of decimal places represented by bigint minor-unit amounts.',
    true
  )
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    is_public = excluded.is_public;
