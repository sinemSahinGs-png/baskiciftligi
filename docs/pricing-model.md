# Fiyat modeli (kalibrasyon)

Canlı yerel üretim hattı **değişmedi**:

```text
upload → gerçek önizleme → gerçek PrusaSlicer → imzalı teklif → sunucu sepet fiyatı
```

Doğrulanmış 20 mm küp metrikleri (4,6 g, 1193 s) değiştirilmez. `bc-quote-v1`
geliştirme tohumu hâlâ aktiftir. Üç önerilen profil (lansman / dengeli /
premium) **inactive** kalır.

## Neden yeni formül?

`bc-quote-v1` ₺150/saat “makine” bedelinden sonra %8 risk ve %35 marj uygular.
₺150 zaten yüklü bir atölye tarifesi gibi duruyorsa kâr çift sayılır. Yeni
`bc-quote-v2` kârı yalnızca en sonda, net = riskli maliyet ÷ (1 − marj)
olarak yazar.

## Ayrılan kavramlar

| # | Kavram | Formül |
| --- | --- | --- |
| 1 | Ham madde | rulo fiyatı ÷ rulo gramı × dilimlenen gram × adet |
| 2 | Fire | dilimlenen gram × (1 + fire%) |
| 3 | Elektrik | saat × (watt ÷ 1000) × ₺/kWh × adet |
| 4 | Yıpranma | saat × (yazıcı fiyatı ÷ ömür saati) × adet |
| 5 | Bakım | saat × (saatlik bakım veya yıllık ÷ yıllık baskı saati) × adet |
| 6 | Emek dakikası | emek ₺/sa ÷ 60 |
| 7 | Kurulum | kurulum dk × emek/dk **sipariş başına bir kez** |
| 8 | Son işlem | son işlem dk × emek/dk × adet |
| 9 | Paketleme | birim veya gönderi; kurye değil |
| 10 | Başarısız baskı | doğrudan maliyet ÷ (1 − pay) |
| 11 | Net kâr | riskli maliyet ÷ (1 − marj) |
| 12 | Asgari net | `max(hesap, asgari)` |
| 13 | KDV | net × KDV; maliyete karışmaz |
| 14 | Kargo | `shippingStatus: not_included`; sepet ayrı |

Makine saati = **yalnızca yıpranma + bakım**. Elektrik ve emek ayrıdır. Dilimleyici
`supportUsed` bayrağı v2’de ekstra kâr satırı üretmez; destek filamentı gramdadır.

## Sürümleme

- Her kayıt `version` + SHA-256 `checksum` taşır.
- İmzalı teklif `pricingVersion` ve `pricingChecksum` içerir.
- Tarife değişince eski teklif yeniden hesaplanmaz.
- Taslak kayıt `activatedAt: null` ile yazılır. Bu görevde etkinleştirme 409 döner.

## Kamu yüzeyi

Müşteri teklifinde marj, fire, yıpranma ve emek **yoktur**. Yalnızca net, KDV,
brüt ve `shippingStatus: not_included`.

## Hazır değil

Kalibrasyon, sahip gerçek alış fiyatlarını girene kadar hazır sayılmaz.
Boş form varsayılan kâr uydurmaz.
