# Üretim hazırlığı (yerel kabul sonrası)

Bu belge bir **go-live kontrol listesidir**. Yerel üretim ve katalog kabulü
geçti. Aşağıdakiler tamamlanmadan üretim hazırlığı **iddia edilmez**.

## Doğrulanan yerel hat

- STL/OBJ/3MF yükleme ve gerçek mesh önizleme
- Canlı PrusaSlicer 2.8.1 (yerel Docker işçisi, port 8788)
- İmzalı teklif; tarayıcı fiyatı yok
- Sepet yalnızca `quoteId` ile sunucu toplamı
- Katalog yayınlama, arama, arşiv ve Playwright temizliği
- Mobil yapılandırıcı çekmecesi

İşçi hâlâ yerelde. Vercel Function olarak çalışmaz. Bu görevde işçi
barındırılmaz.

## Fiyat — hazır değil

- Aktif tarife: `bc-quote-v1` geliştirme tohumu (20 mm küp ₺238,06 + kargo)
- `bc-quote-v2` kalibrasyon formu `/admin/fiyatlandirma` — **inactive**
- Üç tarif önerisi (lansman / dengeli / premium) — **inactive**
- Sahip gerçek rulo, yazıcı, elektrik, emek, fire, marj, asgari, KDV ve kargo
  girdilerini girmeden tarife onaylanmaz
- İmzalı teklifler kendi sürümünü korur

Ayrıntı: `docs/pricing-model.md`.

## Yapılmayanlar (bu görev)

- Vercel / Cloudflare değişiklik yok
- Supabase yapılandırması yok
- PayTR yok
- İşçi deploy yok
- Tarif etkinleştirme yok

## Üretim öncesi kalanlar

1. Sahip kalibrasyon girdileri ve açık tarife onayı
2. Supabase (URL, anon, service role) + manufacturing migration
3. Private storage bucket ve nesne yaşam döngüsü
4. `MANUFACTURING_QUOTE_HMAC_SECRET` ve `SLICER_WORKER_SECRET` üretim sırları
5. Linux’ta HTTPS işçisi (Vercel Function değil)
6. PayTR mağaza / webhook (ayrı faz)
7. Sahip hesabı (yerel demo `admin` kalibrasyon operatörüdür; üretimde `owner`)
8. Yazıcı/malzeme doğrulaması üretim profiliyle
9. `NEXT_PUBLIC_SITE_URL=https://baskiciftligi.com`

Kontrol: `npm run deploy:check:production` (yalnızca ortam; fiyat onayı değildir).
