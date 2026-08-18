# Testing

## Yerel ön koşullar

- Repository'nin desteklediği Node LTS ve `package-lock.json`.
- `npm ci`.
- Supabase integration testleri için Docker ve Supabase CLI.
- E2E için `npx playwright install chromium` (Linux CI'da gerekirse
  `--with-deps`).
- Yalnız test/staging credential'ları. Testleri production Supabase, PayTR veya
  gerçek müşteri verisine karşı çalıştırmayın.

## Standart komutlar

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run test:e2e
```

`npm run quality` lint + typecheck + unit test + production build çalıştırır;
Playwright ve database/RLS testlerini ayrıca çalıştırmak gerekir. Coverage
yüzdesi tek başına release kanıtı değildir.

Local database:

```bash
npx supabase start
npx supabase db reset
npx supabase db lint
```

Migration'ı tek tek elle uygulamak yerine reset kullanın. Seed kayıtlarının
`[DEMO]` olduğunu ve user/review/order/payment üretmediğini doğrulayın.

## Phase 1 test kapsamı

Unit/component:

- TRY minor-unit formatlama; float, negatif değer ve safe-integer sınırları.
- Cart fiyatının trusted katalogdan hesaplanması, variant adjustment, adet,
  stok yetersizliği ve ücretsiz kargo eşiği.
- Product/category input validation, slug, status/publication window ve
  admin mutation field allow-list.
- Supabase yokken demo etiketleri; production'da demo admin mutation'ın kapalı
  olması.
- Reduced-motion ve klavye ile temel navigation/dialog/cart etkileşimleri.

Database/RLS test matrisi:

- `anon`: yalnız active/published katalog/content read; private tablo ve exact
  inventory/pricing rule read yok.
- `customer A`: yalnız kendi profile/address/favorite/cart ve private satırları.
- `customer B`: A'nın UUID/object path'iyle select/update/delete reddi.
- `admin`: gereken CRUD var; immutable history ve protected role alanları yine
  kurallara bağlı.
- `service_role`: yalnız trusted test fixture/worker senaryosu; browser
  senaryosunda kullanılmaz.
- Storage: `model-uploads` public değil, owner prefix dışında access yok. Bu
  test Phase 3 aktivasyonuna kadar altyapı testidir, çalışan uploader iddiası
  değildir.

Playwright Phase 1 minimum:

1. Ana sayfadan mağazaya git, kategori/search ile ürün bul, ürün detayını aç.
2. Geçerli variant'ı sepete ekle; refresh sonrası adet ve trusted toplamı
   doğrula; stok üstü adedi engelle.
3. Login olmadan `/admin` ve `/hesabim` erişiminin production-mode test
   ortamında reddedildiğini doğrula.
4. Customer hesabıyla admin mutation'ın reddedildiğini doğrula.
5. Admin ürün/kategori draft oluşturur, düzenler ve publish eder; public sayfa
   yalnız publish sonrası görür.

Mevcut test dosyaları yalnız money/cart gibi sınırlı unit coverage sağlıyorsa,
Playwright config'in veya boş test komutunun başarılı olması yukarıdaki
akışların test edildiği anlamına gelmez.

## Sonraki faz zorunlu testleri

- **Phase 2:** coupon/stock reservation transaction'ı, immutable order
  snapshots, PayTR resmi signature vector'ları, invalid/duplicate/out-of-order
  callback, amount mismatch, checkout success/failure ve refund idempotency.
- **Phase 3:** extension/MIME/magic validation, 100 MB limit, quota, IDOR,
  private signed URL, malformed 3MF, preview fallback ve admin manual quote.
- **Phase 4:** queue transition/retry/dead-letter, duplicate job, signed worker
  callback, timeout, converter/slicer failure, FDM/SLA ayrımı ve pricing-rule
  version immutability.
- **Phase 5:** official API outage/rate limit, attribution, expired/revoked izin
  ve `permission_verified` dışındaki tüm status'larda checkout block.
- **Phase 6:** Lighthouse gerçek mobile profile, axe/manual WCAG, reduced
  motion, keyboard/screen reader, load ve recovery testleri.

Bu testler ilgili özellik implemente edilmeden skip/mock ile “başarılı”
gösterilmez.

## Production smoke ve release gate

Deployment sonrası yazma etkisi düşük smoke:

- `/`, mağaza, category, product ve 404 response/metadata;
- Supabase session refresh, login/logout ve Auth redirect;
- anonymous/customer/admin authorization negatifleri;
- cart yeniden fiyatlama ve TRY görüntüleme;
- static media, CSP ve browser console/network hataları;
- log redaction, error monitoring ve database bağlantı sağlığı.

Release ancak şu kanıtlarla yapılır: temiz install, format check, lint,
typecheck, unit/integration test, Phase 1 Playwright akışları, production build,
RLS negatif testleri ve migration reset/lint. Flaky test silinmez; owner ve
issue ile quarantine edilirse release kararında açık risk olarak kaydedilir.
