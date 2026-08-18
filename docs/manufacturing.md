# Üretim teklifi (Faz 2)

Baskı Çiftliği özel üretim teklifi, Next.js uygulaması ile ayrı bir
PrusaSlicer işçisine bölünmüştür. Fiyat tarayıcıdan kabul edilmez.
Bu işçi bir Vercel serverless function olarak çalışmaz.

## Docker önkoşulu (Windows)

Yerel dilimleme **Docker Desktop + Linux konteynerleri** ister.

1. Donanım sanallaştırma BIOS’ta açık olmalı.
2. **WSL2** ve **Virtual Machine Platform** Windows özellikleri açık olmalı.
   `wsl --status` “yüklü değil” diyorsa yönetici olarak `wsl --install` çalıştırın
   ve Windows’u yeniden başlatın.
3. Docker Desktop’ı başlatın. `docker desktop status` `running` olmalı;
   `hasNoVirtualization: true` ise motor Linux konteyneri başlatamaz.
4. Doğrulama:

```bash
docker --version
docker compose version
docker info
docker context show
docker ps
docker run --rm hello-world
```

`docker --version` tek başına yeterli değildir. `docker info` bir **Server**
bölümü göstermezse işçi derlenmez ve canlı dilimleme iddiası yapılamaz.

Bu makinede motor kapalıysa tam hata `npipe:////./pipe/dockerDesktopLinuxEngine`
veya `hasNoVirtualization` satırında görülür. Windows yeniden başlatması WSL
kurulumundan sonra gerekir; yalnızca Docker simgesine tıklamak yetmeyebilir.

Ayrıcalıklı kip, Docker soketi bağlama veya `/dev/fuse` eklemeyin.

WSL yazılımı kurulu olsa bile `wsl --status` “Sanal Makine Platformu” veya
“sanallaştırma etkin değil” diyorsa:

```powershell
wsl.exe --install --no-distribution
```

Bu komut başarılı olsa da **ikinci bir Windows yeniden başlatması** gerekir.
Yeniden başlatmadan `docker info` Server bölümü göstermez ve `hello-world`
çalışmaz. `docker-desktop` ve Ubuntu dağıtımları ancak hipervizör ayağa
kalktıktan sonra `wsl -l -v` çıktısında VERSION 2 olarak görünür.

## Ortam

`.env.example` değerlerini kopyalamayın diye ezmeyin. Eksik yerel sırlar için:

```bash
npm run manufacturing:env
```

Bu komut `.env.local` içine yalnızca boş olanları yazar:

- `MANUFACTURING_QUOTE_HMAC_SECRET`
- `SLICER_WORKER_SECRET`
- `SLICER_WORKER_URL=http://127.0.0.1:8788`

Değerler yazdırılmaz. Üretim (Vercel) ortamına koyulmaz.

Ağ:

- Tarayıcı → Next.js: `http://localhost:3000`
- Next.js (host) → işçi: `http://127.0.0.1:8788`
- İşçi (konteyner) → Next.js: `http://host.docker.internal:3000`

Konteynere `localhost:3000` yazmayın.

Geliştirme nesneleri `.octo-data/manufacturing/` altındadır.

## Yerel başlatma

```bash
npm run manufacturing:up
npm run manufacturing:health
npm run dev
```

Sağlık:

```bash
npm run manufacturing:health
docker compose ps
```

Konteyner `slicer` kullanıcısı (uid 10001) ile çalışır, `/health` dışındaki
uçlar halka açık dilimleme sunmaz, geçici dosyalar `/tmp` tmpfs üzerindedir.

Günlük:

```bash
npm run manufacturing:logs
```

Durdurma (yalnız bu servis; `docker system prune` kullanmayın):

```bash
npm run manufacturing:down
```

## 20 mm küp kabul testi

Fikstür: `fixtures/meshes/20mm-cube.stl`

Yazıcı: Bambu Lab A1 uyumlu `bambu-a1-dev`, 0,4 mm nozul, PLA, Standart 0,20 mm,
%20 dolgu, adet 1. `standart.ini` içinde `support_material = 0`.

```bash
npm run test:manufacturing:live
```

Bu komut gerçek PrusaSlicer ikilisini konteynerde çalıştırır. Docker yoksa
çıkış kodu 1’dir; atlanmış bir birim testi “geçti” sayılmaz.

Arayüz yolu:

1. `npm run dev` ve işçi ayakta
2. `/model-yukle`
3. Küpü seçin, hak onayını işaretleyin, PLA / Standart / %20 / 1 adet
4. Analizi başlatın
5. Kuyruk / dilimleme / fiyat yalnızca gerçek G-code metadata’sından sonra
6. Teklifi sepete ekleyin; `/sepet` satırı “Yüklenen model” ve sunucu `quoteId`

## Yerel ile üretim farkı

| | Geliştirme | Üretim |
| --- | --- | --- |
| Depolama | `.octo-data/manufacturing` | Supabase private bucket |
| Fiyat oranları | tohum `bc-quote-v1` | sahip Admin’den etkin sürüm |
| İşçi | Docker Desktop, port 8788 | ayrı Linux host, HTTPS |
| HMAC / işçi sırrı | `.env.local` | barındırma sırrı; Vercel Function değil |

## Sık hatalar

- **Docker API 500 / pipe yok:** Desktop açık ama motor yok. WSL2 veya yeniden başlatma.
- **hasNoVirtualization:** BIOS sanallaştırma veya Hypervisor yok.
- **FUSE / AppImage:** İmaj derlemede `--appimage-extract` kullanır; privileged eklemeyin.
- **Yetkisiz işçi:** `.env.local` ve Compose `SLICER_WORKER_SECRET` aynı olmalı.
- **host.docker.internal:** Windows’ta Compose `host-gateway` kaydı vardır.
- **PrusaSlicer 0 dışı kod:** model veya profil hatası; fiyat üretilmez.

## Thingiverse

Yalnız `https://api.thingiverse.com`. HTML kazıma yoktur. Bu fazın kabul
testine dahil değildir.

## Fiyatlandırma

Formül `bc-quote-v1` (kuruş). 90,00 TL taban, dilimleme kanıtı değildir.
Hesap tabanın altındaysa ön-taban, taban farkı, net, KDV ve brüt ayrıca
yazılır.

## Üretimde hâlâ gerekenler

- Supabase URL, anon key, service role
- `supabase/migrations` (özellikle `20260818050000_manufacturing_quotes.sql`)
- Private Storage bucket
- Sahip hesabı
- Yazıcı/malzeme doğrulaması
- Gerçek işletme maliyetleri
- İşçi barındırma (Vercel Function değil)

## Bilinçli olarak yok

- PayTR
- Yazıcıya otomatik gönderim
- Trendyol
- Thingiverse kazıma
- Sahte sipariş
- Canlı üretim “hazır” iddiası
