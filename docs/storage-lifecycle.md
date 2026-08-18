# Storage lifecycle

> Phase 1 yalnız katalog altyapısını hazırlar. Customer model upload ve otomatik
> lifecycle işi Phase 3'te aktive edilir. Policy'nin belgelenmesi, cleanup
> worker'ın şu anda çalıştığı anlamına gelmez.

## Bucket sınıfları

Hedef bucket ayrımı:

- `catalog-media`: yalnız yayınlanması onaylanan ürün/kategori görselleri;
  public olabilir. Admin upload alanı public write değildir.
- `model-uploads`: **private**; customer STL/OBJ/3MF/STEP/STP. Public URL hiçbir
  zaman üretilmez.
- `review-media`: private quarantine; moderation sonrası ayrı public derivative
  üretilebilir.
- `permission-evidence`: **private/admin-only**; external model izin kanıtları.
- `order-documents`: **private**; yalnız ilgili müşteri ve yetkili admin.

Bucket'lar gerçekten oluşturulup policy testleri geçmeden uygulama ilgili
özelliği aktif göstermemelidir.

## Object key ve upload kuralları

Model object key'i tahmin edilemez ID içermeli ve sahibiyle başlamalıdır:

```text
<user_uuid>/<upload_uuid>/original.<normalized_extension>
<user_uuid>/<upload_uuid>/derived/<artifact_name>
```

Kullanıcı filename'i path olarak kullanılmaz; yalnız sanitize edilmiş display
metadata'sıdır. Database `uploaded_models.user_id`, bucket ve path'in otoritesidir.

Upload akışı:

1. Authenticated kullanıcı için server quota/rate limit kontrolü yapar.
2. Server tek path ve kısa süre için signed upload token üretir; service-role
   key browser'a verilmez.
3. Uygulama başlangıçta en fazla **100 MB** kabul eder. Database'deki daha geniş
   safety ceiling, application limitini artırmaz.
4. Upload sonrası byte count, extension, MIME ve file signature birlikte
   doğrulanır; hash alınır. 3MF gibi container formatlarında zip-bomb/path
   traversal limitleri uygulanır.
5. Dosya quarantine durumunda kalır. Analiz/preview yalnız doğrulama sonrası
   başlar; başarısız dosya indirilebilir public asset'e dönüşmez.

Phase 1 storage migration'ındaki `1 GiB` bucket/row ceiling yalnız savunma üst
sınırıdır ve 100 MB iş kuralıyla aynı değildir. Authenticated direct insert
policy'si Phase 3'te açılmadan önce bucket `file_size_limit` değeri
`104857600` byte'a indirilmeli veya tüm upload'lar aynı limiti zorlayan trusted
signed-upload servisine alınmalıdır.

CORS yalnız production/staging origin'leri ve gereken method/header'larla
sınırlandırılır.

## Signed URL kuralları

- URL yalnız current user sahipliği veya admin/worker authorization'ı server'da
  doğrulandıktan sonra üretilir.
- User preview/download için varsayılan TTL en fazla 10 dakika; worker download
  için 5 dakikadır. Gerekirse işlem başına yeniden üretilir.
- URL object listeleme yetkisi vermez; tek path'e bağlıdır.
- Signed URL query string'i analytics, error message, Referer veya log'a
  yazılmaz. Response `Cache-Control: private, no-store` kullanır.
- User'a object path vermek authorization yerine geçmez. IDOR negatif testleri
  zorunludur.
- Worker result upload/download'ı ayrı, minimum yetkili credential veya
  tek-kullanımlık signed URL ile yapılır.

## Varsayılan retention

Süreler `site_settings`/operasyon policy'sinde versioned ve KVKK/hukuk onaylı
olmalıdır. İlk production varsayımları:

- tamamlanmamış upload reservation/orphan object: **24 saat**;
- quote'a bağlanmamış upload: son aktiviteden **7 gün** sonra;
- validation/analysis hatalı dosya: kullanıcı bildirildikten **14 gün** sonra;
- expired/cancelled quote dosyası: quote bitiminden **30 gün** sonra;
- siparişe dönüşen model binary/derived artifacts: teslim/iptalden **90 gün**
  sonra;
- unpublished catalog media'nın eski sürümü: referansı kalmadıktan **30 gün**
  sonra;
- permission evidence: izin geçerli olduğu sürece ve sonrasında hukukça
  onaylanan süre; başlangıç operasyon varsayımı **5 yıl**;
- worker scratch file: job sonunda hemen, crash durumunda en geç **24 saat**.

Sipariş, ödeme, fatura ve immutable price/analysis snapshot'larının yasal
retention'ı raw 3D binary'den ayrıdır. Raw dosyayı silmek finansal kaydı silmez.
Legal hold, açık uyuşmazlık veya zorunlu saklama süreyi durdurur ve audit log'a
gerekçesiyle yazılır.

Kullanıcı silme talebi doğrulandıktan sonra hedef 30 gün içinde işlenir; yasal
istisna varsa binary erişimi kapatılır, saklama gerekçesi ve bitişi kaydedilir.

## Güvenli silme

Cleanup idempotent, iki aşamalı olmalıdır:

1. Database kaydını `deletion_pending`/eşdeğer tombstone ile erişime kapat.
2. Original, preview, converted ve worker artifact'larını liste yerine kayıtlı
   exact path'lerden sil.
3. Storage deletion sonucunu doğrula; retry/dead-letter uygula.
4. Metadata'yı `deleted` yap, kişisel filename/notları gerektiği kadar redact
   et; hash, policy version, actor ve zamanı audit için tut.
5. Düzenli orphan sweep ile “object var, row yok” ve “row var, object yok”
   durumlarını raporla.

Database satırını önce hard-delete etmek orphan ve kanıtsız silme üretir.
Backup'larda silinen veri backup expiry'ye kadar bulunabilir; restore işleminde
deletion tombstone'ları yeniden uygulanmalıdır.

## Operasyon metrikleri

- bucket başına object/byte ve yaş dağılımı;
- quarantine'da bekleyen, cleanup retry/dead-letter ve orphan sayısı;
- signed URL üretiminde user/admin/worker ayrımı;
- quota/rate-limit reddi ve signature validation hataları;
- deletion talebi, legal hold ve tamamlanma süresi.

Metrik/log içinde raw dosya, signed URL, model içeriği veya gereksiz kişisel
filename bulunmaz.
