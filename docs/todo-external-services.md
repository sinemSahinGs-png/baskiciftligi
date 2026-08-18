# External services TODO

Bu liste owner/release manager içindir. Repository'de env adı, adapter, tablo
veya placeholder bulunması “configured/active” kanıtı değildir. Aşağıdaki
maddeler credential, provider approval ve staging test kaydı eklenene kadar
**TODO / disabled** kabul edilir.

## Phase 1 launch blockers

### Supabase production ve staging

- Durum: **external setup gerekli**.
- Ayrı project'ler, EU region, billing/backup ve erişim sahipleri oluşturulacak.
- `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` doğru Vercel
  environment'larına girilecek.
- Migration + RLS + seed temizliği uygulanacak; `db reset`, `db lint` ve actor
  bazlı RLS testleri kaydedilecek.
- Auth Site URL/redirect allow-list, email verification, rate limit ve MFA
  ayarlanacak.
- Production'da `[DEMO]` kayıtlar silinecek/değiştirilecek; gerçek admin
  [bootstrap runbook](./admin-setup.md) ile oluşturulacak.
- `SUPABASE_SERVICE_ROLE_KEY` web runtime gerektirmiyorsa eklenmeyecek.

Kapanış kanıtı: project ref kayıtları, migration version, RLS test çıktısı,
restore denemesi ve iki yetkili owner.

### Vercel, domain ve DNS

- Durum: **external setup gerekli**.
- Staging/production Vercel project ve branch politikası oluşturulacak.
- Node LTS pin, `npm ci`/`npm run build`, custom domain, TLS ve
  `NEXT_PUBLIC_SITE_URL` ayarlanacak.
- Preview deployment production Supabase'e bağlanmayacak.
- `ALLOW_DEMO_ADMIN_MUTATIONS=false` production'da doğrulanacak.

Kapanış kanıtı: successful quality/build, deployment URL, DNS/TLS ve production
smoke kaydı.

### İletişim ve gerçek içerik

- Durum: **owner verisi gerekli**.
- `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE`,
  `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_YOUTUBE_URL` yalnız gerçek,
  doğrulanmış değerlerle doldurulacak.
- Gerçek ürün fotoğrafı, fiyat, stok, lead time, şirket/yasal metin ve kargo
  bilgileri owner tarafından onaylanacak.
- Fake yorum, logo, satış sayacı, Google/Instagram feed veya ödeme ikonu
  yayınlanmayacak.

## Phase 1 security/operations

### Rate limiting ve bot koruması

- Durum: **provider seçilmedi**.
- Login, search, contact/lead ve admin mutations için edge/server rate limiter
  seçilecek; CAPTCHA yalnız riskli anonymous formda ve KVKK/cookie kapsamıyla
  değerlendirilecek.
- Provider outage ve privacy/retention davranışı test edilecek.

### Error monitoring ve telemetry

- Durum: **hazır değil**.
- Sentry veya eşdeğer hata izleme; OpenTelemetry collector/backend ve alarm
  sahipleri seçilecek.
- PII/secret/signed URL redaction, sampling ve retention onaylanacak.
- Phase 1 launch'ta minimum Vercel/Supabase alarm ve on-call iletişimi olmalı;
  dashboard varmış gibi UI gösterilmemeli.

## Phase 2 — checkout ve operasyon

### PayTR

- Durum: **aktif değil**.
- Merchant/KYC/domain onayı ile `PAYTR_MERCHANT_ID`,
  `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT` alınacak.
- Callback URL, resmi signature test vector'ı, idempotency, amount/currency,
  duplicate/out-of-order ve refund testleri tamamlanacak.
- Ayrıntı: [PayTR setup](./paytr-setup.md).

### Transactional email

- Durum: **aktif değil**.
- Resend veya adapter uyumlu provider, gönderici domain'i, SPF/DKIM/DMARC ve
  `RESEND_API_KEY` hazırlanacak.
- Order email'leri gerçek order state/outbox'tan gönderilecek; provider retry
  order transaction'ını bloklamayacak.
- Bounce/complaint, template Turkish copy ve log redaction test edilecek.

### Shipping ve ops notification

- Durum: **provider seçilmedi**.
- Kargo quotation/label/tracking API'si ve fallback/manual operasyon seçilecek.
- Optional Telegram bildirimi yalnız server-side bot secret/chat allow-list ile
  kurulacak; siparişin doğruluk kaynağı olmayacak.
- Address validation, desi/ücret, duplicate label ve provider outage testleri
  geçilecek.

## Phase 3 — private model upload

- Durum: **runtime aktif değil**; private `model-uploads` schema/policy bulunması
  uploader'ın çalıştığı anlamına gelmez.
- Supabase bucket limit'i başlangıç business limiti olan **100 MB** ile
  hizalanacak; mevcut daha yüksek database/storage ceiling düşürülecek veya
  trusted upload service ile kesin uygulanacak.
- CORS, user quota, signed upload/download TTL ve owner-prefix IDOR testleri
  tamamlanacak.
- File signature/malware/quarantine çözümü seçilecek; 3MF archive bomb ve
  malformed model test corpus'u hazırlanacak.
- Cleanup scheduler, legal hold ve orphan metrics
  [storage lifecycle](./storage-lifecycle.md) ile aktive edilecek.

## Phase 4 — converter ve slicer worker

- Durum: **hedef/provider seçilmedi**.
- Railway, Render, Fly.io, managed containers veya yönetilen VPS kararı.
- Container registry, queue/dead-letter, private network/egress, resource
  limitleri ve monitoring.
- OrcaSlicer CLI, PrusaSlicer CLI veya CuraEngine için kalite + lisans incelemesi.
- STEP/STP converter için teknik doğruluk ve ticari/open-source lisans incelemesi.
- `SLICER_WEBHOOK_SECRET`, rotation, imzalı result ve replay/idempotency testleri.
- FDM ve SLA estimation strategy'leri ayrı; düşük güven manual review'a gider.
- Native binary Vercel Serverless/Edge'e kurulmaz.

## Phase 5 — external model discovery

- Durum: **aktif değil / approval gerekli**.
- Official Thingiverse developer application, `THINGIVERSE_CLIENT_ID`,
  `THINGIVERSE_CLIENT_SECRET` ve gerekirse OAuth redirect kurulumu.
- Platform şartları ve ücretli fiziksel baskı onayı hukuk/owner tarafından
  belgelenecek.
- Permission evidence, expiry/revocation, curation, NSFW ve takedown operasyonu
  tamamlanacak.
- Scraping yapılmayacak; izin doğrulanmadan checkout yok.
- Ayrıntı: [Thingiverse setup](./thingiverse-setup.md).

## Phase 6 — growth ve audit

- Consent-aware analytics provider ve cookie preference merkezi seçilecek.
- Google Search Console/sitemap/domain doğrulaması yapılacak.
- Google Reviews/Instagram ancak resmi izinli API ve gerçek içerikle kurulacak;
  credential yoksa admin-managed galeri kullanılacak.
- Performance budget, accessibility audit, penetration test ve dependency
  review için dış/bağımsız sahip ve tarih atanacak.

## Credential teslim standardı

Her servis için owner, environment, oluşturulma/rotation tarihi, minimum scope,
billing sahibi, revoke yöntemi ve runbook link'i kaydedilir; **secret değeri
kaydedilmez**. Credential yalnız Vercel/Supabase/provider secret store üzerinden
teslim edilir. Bir servis devre dışıyken UI gerçek zamanlı veri, ödeme, arama,
email veya worker sonucu üretiyormuş gibi davranamaz.
