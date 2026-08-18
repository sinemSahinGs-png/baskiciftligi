# Octo Studio Commerce

Octo Studio için premium, Türkçe, Supabase tabanlı e-ticaret ve özel 3D baskı platformu.

Bu çalışma **Faz 1 vitrin + Faz 2 üretim teklifi** kapsamındadır. PayTR hâlâ
kapalıdır. Üretim teklifi yerel Docker PrusaSlicer işçisi ile çalışır; ayrıntı:
`docs/manufacturing.md`.

## Gereksinimler

- Node.js 22 veya daha yeni LTS sürümü (geliştirme sırasında Node 24 doğrulandı)
- npm 11+
- Üretim için bir Supabase projesi
- İsteğe bağlı yerel Supabase CLI/Docker

## Yerel geliştirme

```bash
npm install
copy .env.example .env.local
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır.

Supabase değişkenleri yokken katalog, açıkça **Demo** olarak işaretlenen tohum
verisiyle çalışır. Geliştirme ortamındaki `/admin` değişiklikleri
`.octo-data/catalog.json` dosyasına kalıcı olarak yazılır. Bu davranış üretimde
bir yetkilendirme geçişi oluşturmaz ve Supabase'in yerine kullanılmamalıdır.

Gerçek Supabase kurulumu için:

1. `.env.local` içindeki `NEXT_PUBLIC_SUPABASE_URL` ve
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerlerini doldurun.
2. `supabase/migrations` dosyalarını sırayla uygulayın.
3. `supabase/seed.sql` yalnızca demo verisine ihtiyacınız varsa çalıştırın.
3. `docker compose up --build slicer-worker` ile dilimleme işçisini açın
4. İlk yöneticiyi `docs/admin-setup.md` adımlarına göre atayın

Service-role, PayTR, Thingiverse ve slicer sırları hiçbir zaman
`NEXT_PUBLIC_` değişkenlerinde tutulmaz.

## Kalite komutları

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Tüm yerel kalite kapısını çalıştırmak için `npm run quality` kullanılabilir.
Playwright ilk kullanımda tarayıcı kurulumu isteyebilir:

```bash
npx playwright install chromium
```

## Mimari

- Next.js App Router, React Server Components ve strict TypeScript
- Tailwind CSS 4 ve markaya göre özelleştirilmiş shadcn/ui primitive'leri
- Supabase PostgreSQL, Auth, private Storage ve Row Level Security
- Sunucuda yeniden hesaplanan integer kuruş fiyatları
- Geçici sepet/favori durumu için Zustand
- Provider sözleşmeleriyle PayTR, kargo, bildirim, slicer, dönüştürücü ve dış
  model kaynaklarının ayrıştırılması
- Vitest birim testleri ve Playwright kritik akışları

Ayrıntılar:

- `docs/architecture.md`
- `docs/deployment.md`
- `docs/security-checklist.md`
- `docs/testing.md`
- `docs/manufacturing.md`
- `docs/threat-model-manufacturing.md`
- `docs/todo-external-services.md`

## Önemli üretim sınırları

- PayTR Faz 2 tamamlanmadan ödeme alınmaz.
- Özel üretim teklifi yerel Docker işçisi ve sunucu formülü ile çalışır; üretim
  kalıcılığı Supabase + Storage olmadan “production ready” sayılmaz.
- Slicer ikilileri Next.js istek işleyicisinde çalıştırılmaz.
- Thingiverse yalnızca resmi API ile çağrılır. Scraping yapılmaz.
- `supabase/seed.sql` içindeki ürünler demo verisidir; yorum, sipariş ve satış
  istatistiği uydurulmaz.
