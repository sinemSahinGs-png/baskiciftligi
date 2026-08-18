# Baskı Çiftliği yayına alma

Bu belge, üretim sitesinin kalan yapılandırmasını sır sızdırmadan yönetmek
içindir. Eksik bir entegrasyon yeşil “Hazır” sayılmaz.

Canlı izleme: `/admin/yayina-alma` (yalnız `owner` / `admin`).

## 1. Üretim sırası

1. Alan adı ve HTTPS (`https://baskiciftligi.com`)
2. Supabase proje ve ortam değişkenleri
3. Göçler (`npx supabase db push`) — bilinmeyen projeye otomatik uygulanmaz
4. Sahip hesabı ([admin-setup.md](./admin-setup.md))
5. Katalog dışa aktarma (`npm run catalog:export`)
6. Dry-run içe aktarma
7. Commit içe aktarma
8. Medya göçü
9. Thingiverse
10. Dilimleme işçisi (ayrı konteyner; Vercel Function değil)
11. Üretim fiyat aktivasyonu
12. PayTR (ileride; bu fazda kapalı)
13. E-posta / iletişim
14. `/admin/yayina-alma` → Canlı sistemi kontrol et

## 2. Supabase proje kurulumu

Ayrı production projesi kullanın. `NEXT_PUBLIC_SUPABASE_URL` ve
`NEXT_PUBLIC_SUPABASE_ANON_KEY` Vercel Production’a eklenir.
`SUPABASE_SERVICE_ROLE_KEY` yalnız sunucuda kalır; `NEXT_PUBLIC_` öneki almaz.
Auth Site URL: `https://baskiciftligi.com`.

## 3. Ortam değişkeni adları

Zorunlu üretim:

- `NEXT_PUBLIC_SITE_URL=https://baskiciftligi.com`

Güvenlik (üretimde literal `false`):

- `THINGIVERSE_FIXTURE_MODE`
- `ALLOW_PRODUCTION_DEMO_IMPORT`
- `ALLOW_DEMO_ADMIN_MUTATIONS`

Yalnızca normalize edilmiş `true` bir bayrağı açar. `false`, `0`, boş veya
eksik değer açık sayılmaz.

İsteğe bağlı: Supabase, Thingiverse, işçi, PayTR, Resend. Değerler bu belgede
ve yönetim panelinde gösterilmez.

## 4. Göç uygulaması

```sh
npm run catalog:db-ready
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

Otomatik `db reset` production’da çalıştırılmaz.

## 5. Sahip oluşturma

Rastgele kullanıcıya owner rolü vermeyin. Auth kullanıcısını oluşturun,
profilin oluşmasını bekleyin, ardından [admin-setup.md](./admin-setup.md)
içindeki UUID bootstrap’ini `owner` rolüyle uygulayın.

## 6. Katalog dışa aktarma

Geliştirme makinesinde:

```sh
npm run catalog:export
```

Paket `.octo-data/exports/catalog-<zaman damgası>/` altına yazılır. Var olan
klasör sessizce üzerine yazılmaz. Kullanıcı hesapları, oturumlar, sırlar,
teklif işleri ve müşteri yüklemeleri pakete girmez. Görseller base64 değildir.

## 7. Dry-run içe aktarma

```sh
npm run catalog:import:supabase -- --file .octo-data/exports/<paket>/catalog.json --dry-run
```

Yazma yapılmaz. SKU/slug, fiyat (kuruş), varyant ve medya planı raporlanır.

## 8. Commit içe aktarma

```sh
npm run catalog:import:supabase -- --file .octo-data/exports/<paket>/catalog.json --commit
```

`SUPABASE_SERVICE_ROLE_KEY` ve açık `--commit` olmadan yazılmaz. Aynı paket
ikinci kez SKU üzerinden günceller; çoğaltmaz. Taslak taslak, arşiv arşiv,
yayın yayın kalır.

## 9. Medya göçü

```sh
npm run catalog:import:media -- .octo-data/exports/<paket>/catalog.json
```

SVG ve yürütülebilir içerik reddedilir. Dry-run: bulunan, eksik, geçersiz,
zaten yüklenmiş, yüklenmesi gereken dosya sayıları.

## 10. Thingiverse

Resmî jeton Vercel’e eklenir. Fixture üretimde kapalı kalır. Jeton ekranda
görünmez. Ticari lisans kapısı otomatik satışı engeller.

## 11. İşçi dağıtımı

Dockerfile ayrı konteyner içindir. Önerilen: Railway, Render, Fly.io veya
Cloud Run; yaklaşık 2 vCPU / 4 GB RAM. `SLICER_WORKER_URL` localhost olamaz.
Env varlığı otomatik teklifi yeşil yapmaz; sağlık, depolama ve üretim fiyatı
da gerekir.

## 12. Fiyat aktivasyonu

Geliştirme tohum fiyatı üretim teklifi vermez. Yönetim → Fiyatlandırma.

## 13. PayTR (gelecek)

Değişken adları ve callback:
`https://baskiciftligi.com/api/payments/paytr/callback`
Bu fazda tahsilat açılmaz. Ayrıntı: [paytr-setup.md](./paytr-setup.md).

## 14. Son duman testi

`/admin/yayina-alma` içinde **Canlı sistemi kontrol et**. Sipariş, ödeme,
yükleme, dilimleme ve e-posta yoktur. Sonuç zaman damgalıdır ve hız sınırlıdır.

## 15. Geri alma ve yedek

- Katalog paketini ve Supabase yedeğini commit öncesi saklayın.
- Başarısız import doğrulama hatalarında durur; dry-run yazmaz.
- Production demo import kapalı kalır (`ALLOW_PRODUCTION_DEMO_IMPORT=false`).
