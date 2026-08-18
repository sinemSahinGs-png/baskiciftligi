# Üretim tehdit modeli (Faz 2)

| Tehdit | Kontrol |
| --- | --- |
| Kötü niyetli mesh / NaN | İmzalar, üçgen limiti, sonlu koordinat doğrulaması |
| ZIP/3MF bomba | ZIP64 yok, giriş sayısı ve açılım boyutu limiti |
| Yol gezintisi | Arşiv adlarında `..` reddi, storageKey çözümlemesi kök altında |
| SSRF | Thingiverse indirmesi allow-list host + yönlendirme yeniden doğrulama |
| Aşırı boyut | 100 MB uygulama limiti, akış kesme |
| CPU/bellek | İşçi Docker bellek/CPU/PID limiti, dilimleme zaman aşımı |
| İş yağmuru | Yükleme / iş / arama / retry rate limit |
| Fiyat tahrifi | HMAC imzalı teklif, sepet sunucuda quoteId okur |
| Teklif tekrarı / süre | `expiresAt` ve durum kontrolü |
| Yetkisiz dosya | Oturum/kullanıcı sahipliği; yollar tarayıcıya gitmez |
| Kimlik bilgisi sızıntısı | `NEXT_PUBLIC_` yok; log sanitize |
| Çapraz kullanıcı | `ownsRecord` |
| Komut enjeksiyonu | `spawn(bin, argv)`; müşteri metni CLI’ye birleştirilmez |
| Güvensiz dosya adı | Saklama anahtarı UUID |
| Log enjeksiyonu | URL/sır temizleme, uzunluk kesme |
