# PayTR kurulumu

> **Durum: Phase 2 / aktif değil.** Phase 1 ödeme başlatmaz, kart bilgisi
> toplamaz ve siparişi “paid” yapmaz. `payments`/`payment_events` tabloları ile
> environment alanlarının bulunması canlı entegrasyon değildir.

## Hesap ve credential gereksinimleri

PayTR merchant başvurusu, şirket/KYC doğrulaması, satış domain'i ve PayTR'nin
güncel ürün onayı tamamlanmalıdır. PayTR panelinden alınan değerler:

```dotenv
PAYTR_MERCHANT_ID=
PAYTR_MERCHANT_KEY=
PAYTR_MERCHANT_SALT=
```

`MERCHANT_KEY` ve `MERCHANT_SALT` yalnız server-side secret store'da bulunur.
Browser'a, `NEXT_PUBLIC_*` değişkenine, log'a, veritabanı event payload'ına veya
support ekranına yazılmaz. Test ve production credential'ları ayrıdır.

TLS kullanan canonical URL'ler ayrıca tanımlanır:

- callback/webhook: örneğin `/api/payments/paytr/callback`;
- kullanıcı dönüşü: `/odeme/basarili` ve `/odeme/basarisiz`.

Bunlar planlanan adreslerdir; route gerçekten deploy ve test edilmeden panelde
canlı moda geçilmez. Browser'ın success URL'ine gelmesi ödeme kanıtı değildir;
tek otorite doğrulanmış server-to-server callback'tir.

## Payment akışı

1. Server cart'ı güncel ürün/stok/indirim/kargo kurallarıyla tekrar fiyatlar.
2. Unique, tahmin edilmesi zor bir payment attempt ve `merchant_oid` üretir;
   beklenen amount/currency database'e yazar.
3. PayTR token/signature yalnız server'da, PayTR'nin **aktif ürününe ait güncel
   resmi dokümandaki alan sırası ve encoding** ile oluşturulur.
4. Browser yalnız PayTR'nin döndürdüğü güvenli ödeme yüzeyine yönlendirilir.
5. Callback raw body/form semantics korunarak alınır; signature
   doğrulanmadan hiçbir domain kaydı değiştirilmez.
6. Doğrulanan event tek database transaction'ında işlenir.
7. Commit tamamlandıktan sonra PayTR'nin beklediği düz metin başarı cevabı
   (güncel dokümana göre genellikle `OK`) döndürülür.

PayTR ürün ve signature sözleşmesi değişebileceği için blog örneği veya tahmini
hash formülü kopyalanmaz. Resmi dokümandan sabit test vector oluşturulup unit
test ile doğrulanmalıdır. Karşılaştırma timing-safe yapılır.

## Callback doğrulama

İş mantığından önce:

- HTTP method/content type ve payload boyutu sınırlandırılır.
- Zorunlu alanlar schema ile doğrulanır; bilinmeyen status reddedilir.
- `merchant_oid` kayıtlı payment attempt'e bağlanır.
- Callback signature canonical raw değerlerden yeniden hesaplanır ve
  constant-time karşılaştırılır.
- Merchant, mode, currency ve PayTR alanlarının minor-unit anlamı resmi
  dokümana göre normalize edilir.
- Beklenen tutarla callback tutarı karşılaştırılır. Taksit/komisyonlu alanlar
  birbirine karıştırılmaz; belirsizlik otomatik “paid” değil manual review'dur.
- Başarısız signature/payload kişisel veri ve secret içermeden güvenlik log'una
  alınır; order state değişmez.

IP allow-list yalnız ek savunmadır; signature kontrolünün yerine geçmez.

## Idempotency ve duplicate koruması

- Her payment attempt'in `merchant_oid` değeri unique olmalıdır.
- PayTR ayrı event ID vermiyorsa, doğrulanmış canonical callback alanlarından
  deterministic `provider_event_id` türetilir.
- `payment_events(provider, provider_event_id)` unique constraint'i duplicate
  inbox kaydını engeller.
- Transaction payment/order satırını kilitler, izinli state transition'ı
  uygular ve stok/notification outbox yan etkilerini aynı idempotency key ile
  üretir.
- Daha önce başarıyla işlenmiş aynı callback no-op olur ve PayTR'ye başarı
  cevabı verir. Aynı sipariş ikinci kez ödenmiş/rezerv edilmiş sayılmaz.
- `failed` bir event sonraki geçerli `success` event'i engellemez; terminal
  state geçişleri açıkça tanımlanır.
- Callback başarılı olsa bile tutar/currency uyuşmazlığı order'ı otomatik
  onaylamaz.

Refund/cancel operasyonları da ayrı provider reference ve idempotency key ile
izlenir; admin butonuna tekrar basılması çift iade üretmemelidir.

## Aktivasyon checklist'i

- [ ] PayTR merchant ve domain onayı tamamlandı.
- [ ] Test/live credential'ları secret manager'a ayrı girildi.
- [ ] Callback public HTTPS üzerinden erişilebilir ve sadece server route'udur.
- [ ] Resmi signature test vector'ları ve timing-safe compare testleri geçti.
- [ ] Duplicate, out-of-order, invalid signature, wrong amount/currency ve
      timeout testleri geçti.
- [ ] Order/payment transaction ve stok rezervasyonu atomik/idempotent.
- [ ] Success/fail sayfaları “ödeme doğrulanıyor” durumunu doğru gösteriyor.
- [ ] Callback payload/log redaction ve retention tanımlı.
- [ ] PayTR test paneli uçtan uca geçti; operasyon ekibi refund akışını denedi.

Tüm kutular kapanmadan `PAYTR_*` değerlerini production'a eklemek entegrasyonu
aktif saydırmaz.
