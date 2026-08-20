# Production deployment

## Phase 1 topolojisi

- **Vercel:** Next.js web uygulaması, Server Components/Actions ve kısa API
  request'leri.
- **Supabase:** PostgreSQL, Auth ve gerektiğinde Storage.
- **DNS:** canonical production domain Vercel'e; aynı URL Supabase Auth allow
  list'ine eklenir.

Phase 1'de payment, email, Thingiverse, converter ve slicer servisi yoktur.
Eksik credential için production'da sessiz mock/fallback açılmamalıdır.

## Supabase hazırlığı

1. Production ve staging için ayrı Supabase project oluşturun; kullanıcıya
   yakın bir EU region seçin.
2. Migration'ları timestamp sırasıyla uygulayın. Production migration'ı Vercel
   build sırasında değil, kontrollü bir release adımında çalıştırın:

   ```bash
   npx supabase link --project-ref <PROJECT_REF>
   npx supabase db push
   ```

3. RLS'nin tüm `public` tablolarında açık olduğunu ve public read'in yalnız
   published catalog/content ile sınırlı kaldığını doğrulayın.
4. Supabase Auth içinde `Site URL` ve izinli redirect URL'leri staging ve
   production domain'leriyle sınırlandırın. Wildcard preview URL'lerini
   production auth projesine eklemeyin.
5. İlk admin'i [admin bootstrap runbook](./admin-setup.md) ile oluşturun.
6. Migration/seed ayrımı için [database dokümanını](./database.md) izleyin.
   Demo seed production satış verisi değildir.

## Vercel ayarları

Repository'yi Vercel'e bağlayın; install/build adımları sırasıyla `npm ci` ve
`npm run build` olmalıdır. Lockfile kullanılmalı, Node LTS sürümü staging
build'iyle doğrulanıp project setting'de sabitlenmelidir.

Production environment:

```dotenv
NEXT_PUBLIC_SITE_URL=https://baskiciftligi.com
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>
ALLOW_DEMO_ADMIN_MUTATIONS=false
```

Supabase Auth (when configured):

- Site URL: `https://baskiciftligi.com`
- Redirect allow-list (no wildcards):
  - `http://localhost:3000/auth/callback`
  - `https://baskiciftligi.com/auth/callback`
  - `https://www.baskiciftligi.com/auth/callback`
- Password recovery uses PKCE only: `/auth/callback?next=/sifre-yenile`.
  Do not enable implicit token-in-URL recovery links.

İsteğe bağlı public iletişim alanları:

```dotenv
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_CONTACT_PHONE=
NEXT_PUBLIC_INSTAGRAM_URL=
NEXT_PUBLIC_YOUTUBE_URL=
```

Kurallar:

- `NEXT_PUBLIC_*` değerleri browser bundle'ına girebilir; buraya secret
  koymayın. Supabase anon key public olabilir fakat RLS zorunludur.
- `SUPABASE_SERVICE_ROLE_KEY` yalnız gerçekten gereken server/worker
  deployment'ına verilir; browser, preview ve client log'una verilmez. Phase 1
  web runtime bunu gerektirmiyorsa Vercel'e eklemeyin.
- `PAYTR_*`, `THINGIVERSE_*`, `RESEND_API_KEY` ve
  `SLICER_WEBHOOK_SECRET` ilgili faz aktive edilmeden uygulamayı çalışırmış gibi
  göstermemelidir.
- Secret'ları `.env`, log, issue veya dokümana yazmayın. Vercel/Supabase secret
  yönetimini kullanın; staging ve production değerlerini ayırın.
- Preview deployment production Supabase'e bağlanmamalı; ayrı staging projesi
  veya credentials'sız açıkça demo preview kullanılmalıdır.

## Release sırası

1. Staging backup/restore prosedürünü ve migration'ı deneyin.
2. `npm ci`, `npm run lint`, `npx tsc --noEmit`, mevcut testler ve
   `npm run build` çalıştırın.
3. Geriye uyumlu migration'ı production'a uygulayın.
4. Vercel deployment'ını yayınlayın.
5. `/`, katalog, ürün detayı, login/session refresh, admin 403/redirect ve cart
   hesaplarını smoke test edin.
6. Supabase query/auth hatalarını ve Vercel function log'larını kontrol edin;
   secret veya kişisel veri loglanmadığını doğrulayın.
7. Şema geri alma gerektiriyorsa destructive rollback yerine restore veya
   forward-fix migration kullanın. Önceki Vercel deployment'ına dönüş yalnız
   uygulama kodunu geri alır, veritabanını değil.

## Slicer neden Vercel'de çalışmaz?

Slicer/converter; native binary, yüksek CPU/RAM, büyük geçici dosya, uzun
timeout ve kontrollü retry ister. Bu nedenle **Vercel Serverless/Edge içinde
OrcaSlicer, PrusaSlicer, CuraEngine veya STEP converter çalıştırılmaz**.
Serverless katman ileride yalnız upload metadata doğrular, private object'i
kaydeder ve queue job üretir.

## Slicer worker container hosting

The Next.js site may run on Vercel. `apps/slicer-worker` must not be deployed
as a Vercel Function. Host the existing Dockerfile later on Railway, Render,
Fly.io, Cloud Run, or a VPS after authorization.

Documented worker shape and hosting runbook: [slicer-worker-hosting.md](./slicer-worker-hosting.md).

- Health: `GET /health` on port `8788` (or `PORT`)
- Non-root user `slicer` (uid 10001)
- Authenticated polling via `SLICER_WORKER_SECRET`; no public slice endpoint
- Temp files under `/tmp/slicer-jobs`, deleted after each job
- Graceful shutdown on SIGTERM/SIGINT
- Suggested size: 2 vCPU / 4 GB RAM, 8 GB if concurrent jobs are enabled

Until `SLICER_WORKER_URL` is a hosted HTTPS origin, the public site must show
automatic quoting as unavailable.

## Production gate

- Production'da `DEMO` ürün/sayaç/yorum/sipariş yok.
- RLS ve admin authorization negatif testleri geçti.
- Canonical URL, TLS, Auth redirect'leri ve cookie ayarları doğru.
- Database backup, restore denemesi ve migration sorumlusu tanımlı.
- Error monitoring ve erişim logu retention'ı tanımlı.
- Sonraki faz entegrasyonları UI'da “aktif” gösterilmiyor.
- Yayına alma merkezi ve katalog göçü: [yayina-alma.md](./yayina-alma.md).
