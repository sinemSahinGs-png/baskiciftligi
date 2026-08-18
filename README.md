# Octo Studio Commerce

Octo Studio için premium, Türkçe, Supabase tabanlı e-ticaret ve özel 3D baskı platformu.

Bu çalışma şu anda **Faz 1** kapsamındadır: tasarım sistemi, mağaza, ürün/kategori
yönetimi, güvenli sunucu fiyatlamalı kalıcı sepet, Supabase Auth sınırları,
PostgreSQL şeması/RLS ve yerel geliştirme modu. Ödeme, sipariş işleme, dosya
yükleme, slicer ve Thingiverse entegrasyonları sonraki fazlardır; arayüzde etkin
gibi gösterilmez.

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
4. İlk yöneticiyi `docs/admin-setup.md` adımlarına göre atayın.

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
- `docs/todo-external-services.md`

## Önemli üretim sınırları

- PayTR Faz 2 tamamlanmadan ödeme alınmaz.
- Müşteri modeli Faz 3 tamamlanmadan yüklenmez.
- Slicer ikilileri Vercel fonksiyonlarında çalıştırılmaz; Faz 4'te ayrı,
  uzun süre çalışan Docker worker kullanılır.
- Thingiverse yalnızca resmi API ve doğrulanmış ticari izin akışıyla
  etkinleştirilir. Scraping yapılmaz.
- `supabase/seed.sql` içindeki ürünler demo verisidir; yorum, sipariş ve satış
  istatistiği uydurulmaz.
