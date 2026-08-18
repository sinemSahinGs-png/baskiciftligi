# Thingiverse provider kurulumu

> **Durum:** Resmî Thingiverse API sağlayıcısı bağlandı. Kimlik bilgisi yoksa
> keşif “yapılandırılmadı” durumunu gösterir; sahte model üretilmez. HTML
> kazıma yoktur.

## Değişmez kurallar

- Yalnız **resmi Thingiverse API** ve onaylanmış authentication yöntemi
  kullanılır. HTML scraping, browser automation, undocumented endpoint veya
  sayfa içeriğinden dosya URL'i çıkarma yasaktır.
- API erişimi, model lisansı ve ticari fiziksel baskı izni üç ayrı kontroldür.
  Bir Creative Commons etiketi tek başına Thingiverse API/Platform şartlarını
  veya tasarımcının gerekli ticari iznini geçersiz kılmaz.
- Thingiverse içeriği otomatik olarak yeniden satılmaz. Yalnız
  `permission_verified` kayıt checkout'a açılabilir.
- Creator attribution, model başlığı, kaynak, lisans ve orijinal link görünür
  kalır. Watermark/attribution kaldırılmaz.
- Açık izin yoksa orijinal model dosyası kalıcı cache edilmez, yeniden
  dağıtılmaz veya public bucket'a kopyalanmaz.
- NSFW/restricted içerik gösterilmez. API rate limit, deletion/takedown ve
  güncel kullanım şartlarına uyulur.

## Credential ve provider approval

Thingiverse developer application ve gerekli platform/ticari kullanım onayı
alındıktan sonra server-side secret store'a eklenir:

```dotenv
THINGIVERSE_CLIENT_ID=
THINGIVERSE_CLIENT_SECRET=
THINGIVERSE_REDIRECT_URI=
THINGIVERSE_ACCESS_TOKEN=
THINGIVERSE_API_BASE_URL=https://api.thingiverse.com
```

Belgelenmiş uç noktalar: `GET /popular?page=`, `GET /search/{term}?page=`,
`GET /things/{id}`, `GET /things/{id}/images`, `GET /things/{id}/files`.
Dosya indirme yalnız API’nin döndürdüğü `download_url` / `direct_url`
üzerinden, `api.thingiverse.com` ve `cdn.thingiverse.com` (ve
`*.thingiverse.com`) allow-list’i ile yapılır. Web’deki `posted_after=all-time`
ve `license=public` süzgeçleri resmî API parametresi olarak belgelenmediği için
uygulanmaz. Varsayılan keşif `GET /popular` ile Things listeler; sayfa 1’den
başlar ve kullanıcı sayfalar arasında gezer.

OAuth redirect URI gerekiyorsa provider panelinde yalnız canonical HTTPS
callback'leri tanımlanır; uygulama environment contract'ı Phase 5'te buna göre
genişletilir. Client secret veya access/refresh token browser'a, URL'e, log'a
ya da public database satırına yazılmaz. Staging ve production uygulamaları
ayrılır; token rotation/revocation sahibi belirlenir.

Credential'ın varlığı yeterli değildir. API application durumu, kullanım
şartları, rate limit ve Octo Studio'nun ücretli fiziksel baskı senaryosu için
gerekli platform onayı yazılı olarak arşivlenmeden provider disabled kalır.

## Legal permission workflow

Her external model şu durumlardan biriyle izlenir:

1. `discovery_only` — metadata yalnız keşif; satın alınamaz.
2. `license_review` — lisans ve platform şartları inceleniyor.
3. `permission_requested` — gerekli designer/platform izni istenmiş.
4. `permission_verified` — kapsamı geçerli izin kanıtlandı; admin ayrıca
   curation/publish kararı verebilir.
5. `rejected` — izin verilmedi veya şartlar uygun değil.
6. `revoked` — daha önceki izin geri çekildi/sona erdi; yeni checkout anında
   engellenir.
7. `unavailable` — API kaydı silindi, gizlendi veya erişilemiyor.

`permission_verified` kararı için admin şu kanıtları saklar:

- model ve creator'ın immutable provider kimliği ile original source URL;
- inceleme tarihindeki license/terms snapshot veya referansı;
- designer/platform izninin kimden, ne zaman alındığı;
- izin kapsamı: fiziksel üretim, satış kanalı, ülke, adet, süre ve attribution;
- kanıt dosyasının private storage path/hash'i;
- inceleyen admin, tarih, sona erme ve revocation bilgisi.

Kanıt private ve admin-only olmalıdır. Süresi dolan izin otomatik olarak satışa
kapalı hale gelir. Takedown/revocation işlemi yeni satışları hemen durdurur;
mevcut siparişlerin hukuki/operasyonel kararı audit log ile manuel ele alınır.

## Provider davranışı

- API DTO'ları doğrudan domain/checkout state'i değildir; normalize edilip
  source kimliğiyle cache edilir.
- External sonuçlar Octo Studio-owned/licensed katalogdan görsel ve metinsel
  olarak ayrılır.
- Metadata cache TTL ve deletion reconciliation uygulanır. Dosya cache'i ancak
  açık izin ve retention kaydı varsa mümkündür.
- API timeout/rate-limit durumunda stale sonuç satılabilir hale gelmez;
  kullanıcıya hizmetin geçici kullanılamadığı söylenir.
- Kullanıcının model URL'i yapıştırması yalnız source/id tespiti ve permission
  review kaydı başlatır. İçeriği scrape etmez, indirme veya lisans kontrolünü
  atlamaz.
- Development mock varsa ekranda ve kayıtta `DEMO / satın alınamaz` olarak
  işaretlenir; production build'de kapalıdır.

## Aktivasyon checklist'i

- [ ] Resmi API application/credential ve gerekli platform onayları alındı.
- [ ] Güncel API/Terms/Attribution gereksinimleri hukuk sorumlusu tarafından
      incelendi.
- [ ] Secret/token rotation ve rate-limit monitoring hazır.
- [ ] Permission state machine, evidence storage, expiry ve revocation testleri
      geçti.
- [ ] `permission_verified` olmayan her durum için checkout negatif testi var.
- [ ] Creator attribution ve original link tüm sonuç/detail/cart yüzeylerinde
      doğrulandı.
- [ ] Takedown/deletion reconciliation ve API outage fallback'i denendi.
- [ ] NSFW/moderation ve admin curation akışı çalışıyor.

Bu checklist tamamlanmadan UI'da Thingiverse entegrasyonu “aktif” gösterilmez.
