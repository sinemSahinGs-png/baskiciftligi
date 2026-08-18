# Octo Studio mimarisi

Bu belge ürün vizyonunu değil, teslimat sınırlarını tanımlar. Bir tablo veya
provider interface'inin bulunması ilgili entegrasyonun çalıştığı anlamına
gelmez.

## Phase 1'in gerçek kapsamı

Phase 1, hazır fiziksel ürün satışının temelini kurar:

- Next.js App Router, TypeScript, Türkçe/TRY odaklı tasarım sistemi ve temel
  storefront.
- Yayındaki ürün, varyant, kategori, koleksiyon, materyal ve stok verilerinin
  okunması; geliştirme ortamında açıkça `DEMO` işaretli katalog fallback'i.
- Ürün/kategori yönetimi için admin yüzeyi ve server-side yetki kontrolü.
- Sepete ekleme, adet değiştirme ve fiyatı güncel katalog verisinden yeniden
  hesaplama. Sepet checkout veya stok rezervasyonu değildir.
- Supabase Auth/PostgreSQL için şema, RLS ve sahiplik modeli. Para alanları TRY
  kuruşu olarak integer minor unit saklanır.
- Sonraki fazların veri modeli ve adapter sınırları.

Teslimdeki operasyonel sınırlar:

- Cart satırları browser'da kalıcı local state'tir; server endpoint'i güncel
  katalogla yeniden fiyatlar. Database cart, guest/account merge, coupon,
  checkout ve stok rezervasyonu aktif değildir.
- Admin, temel ürün/varyant/stok/kategori CRUD, duplicate/archive ve medya URL
  sıralamasını hedefler. Binary medya upload, CSV import/export, bulk edit ve
  autosave tamamlanmış özellik değildir.
- Ödeme, model yükleme ve external discovery route'ları yalnız dürüst durum/TODO
  sayfası olabilir; bu sayfalar provider çağrısı yapmaz.
- Supabase-backed production launch ancak migration–application query contract,
  RLS actor matrix ve gerçek project smoke test'i geçince desteklenmiş sayılır.

Phase 1 şunları **desteklemez**: ödeme alma, sipariş tamamlama, kargo satın alma,
transactional email, gerçek model upload/preview, otomatik fiyat teklifi,
STEP dönüşümü, slicer worker veya Thingiverse sonuçları. Bu akışlara ait route,
tablo, ekran ya da environment variable bulunması onları aktif yapmaz.

Supabase bilgileri yokken demo katalog sadece geliştirme/gösterim içindir.
Production, demo veriyi gerçek stok veya satış verisi olarak kullanmamalı ve
admin demo mutasyonlarını açmamalıdır.

## Altı faz

1. **Foundation ve mağaza:** design system, veritabanı/RLS, authentication,
   storefront, ürün/kategori CRUD ve cart.
2. **Commerce:** checkout, PayTR, immutable order snapshots, stok rezervasyonu,
   order management, müşteri hesabı, email/notification.
3. **Manual 3D quote:** private upload, STL/OBJ/3MF tarayıcı preview,
   configurator, signed URL, admin manual review. STEP/STP yalnız server-side
   converter hazırsa kabul edilir.
4. **Automatic manufacturing:** containerized converter/slicer worker, queue,
   imzalı job sonuçları, FDM/SLA'ya ayrı estimation ve versioned pricing.
5. **Model library:** Octo Studio/lisanslı katalog ve resmi Thingiverse API
   provider'ı; ticari izin doğrulanmadan checkout yoktur.
6. **Hardening:** gelişmiş motion, analytics, SEO iyileştirmeleri, performance,
   WCAG 2.2 AA ve güvenlik denetimleri.

Her fazın activation gate'i test, production build, gerekli credential ve
operasyonel runbook'tur. Sonraki fazın şemada temsil edilmesi activation gate'i
geçmez.

## Çalışma zamanı ve güven sınırları

```text
Browser (güvenilmez)
  -> Next.js / Vercel (session, validation, authorization, fiyat otoritesi)
     -> Supabase Auth + PostgreSQL/RLS
     -> Supabase Storage (public katalog; sonraki fazlarda private modeller)
     -> Provider adapters (server-only, faza göre etkin)
        -> PayTR / shipping / notifications
        -> Thingiverse official API
     -> Queue -> Docker worker (converter/slicer; Vercel dışında)
```

- Browser fiyat, indirim, stok, role, payment status veya storage path için
  otorite değildir.
- Server authorization ile RLS birlikte uygulanır; biri diğerinin yerine
  geçmez. Admin kontrolü `public.profiles.role` ve non-recursive
  `public.is_admin()` üzerinden yapılır.
- `SUPABASE_SERVICE_ROLE_KEY` ve tüm provider secret'ları sadece güvenilen
  server/worker ortamında bulunur. İnsan admin hesabı service role değildir.
- Order/quote oluştuğunda ürün, adres, fiyat kuralı ve analiz girdileri snapshot
  olur; canlı katalog sonradan geçmiş kaydı değiştirmez.
- Uzun CPU işleri, native binary ve retry gerektiren işler serverless request
  içinde çalıştırılmaz.

## Provider sınırları

- `PaymentProvider` — Phase 2. PayTR token/callback, signature ve idempotency;
  provider payload'ı domain order state'ini doğrudan yazamaz.
- `ShippingProvider` — Phase 2+. Teklif, label ve tracking; checkout kargo
  ücretini client'tan kabul etmez.
- `NotificationProvider` — Phase 2+. Email/ops bildirimi; sipariş transaction'ı
  provider gecikmesine bağlanmaz.
- `StorageProvider` — Supabase Storage. Phase 1 admin'i katalog medyasında URL
  referansıyla sınırlıdır; binary katalog upload aktif değildir. Phase 3 private
  model bucket ve kısa ömürlü signed URL kullanır.
- `ModelConverterProvider` — Phase 4. Özellikle STEP/STP dönüşümü; geçici
  dosyaları izole eder.
- `SlicerProvider` — Phase 4. Engine-specific çıktıyı versioned, ortak analiz
  sonucuna çevirir; FDM sonucu SLA fiyatı gibi kullanılamaz.
- `ExternalModelProvider` — Phase 5. Resmi API metadata'sı sağlar; ticari izin
  kararı provider'dan ayrı bir admin/legal workflow'dur.

Adapter'lar domain modelini provider DTO'larından ayırır. Retry, timeout,
rate-limit ve webhook doğrulaması adapter sınırında; sipariş/quote state
transition kuralları domain katmanında kalır.

## İlgili runbook'lar

- [Deployment](./deployment.md)
- [Storage lifecycle](./storage-lifecycle.md)
- [Admin bootstrap](./admin-setup.md)
- [Security checklist](./security-checklist.md)
- [Testing](./testing.md)
- [External services TODO](./todo-external-services.md)
