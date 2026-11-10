# OCTO STUDIO asset plan

Audited `public/images`, `public/videos`, category artwork, manufacturing stills, posters and the television shell. Existing files are reused. Only genuinely missing visuals are listed.

## Already usable (do not recreate)

| File | Use |
| --- | --- |
| `public/images/hero/octo-tv-sand-shell-source.png` | Master television photograph |
| `public/images/hero/octo-tv-sand-shell-desktop.webp` | Desktop hero shell |
| `public/images/hero/octo-tv-sand-shell-mobile.webp` | Mobile TV-centered crop |
| `public/videos/home-industrial/hero-desktop.mp4` | Manufacturing lamp video, desktop |
| `public/videos/home-industrial/hero-mobile.mp4` | Same video, mobile |
| `public/images/home-industrial/hero-poster.jpg` | Hero poster fallback |
| `public/images/categories/*.png` | Seven storefront categories |
| `public/images/home-industrial/path-*.png` | Idea / ready / upload path stills |
| `public/images/home-industrial/production-tunnel.png` | Process tunnel |
| `public/images/home-industrial/material-pla.png` | PLA specimen |
| `public/images/home-industrial/material-petg.png` | PETG specimen |
| `public/images/home-industrial/material-tpu.png` | TPU specimen (resin still missing) |
| `public/images/home-industrial/printer-farm.png` | Wholesale / corporate farm |
| `public/images/home-industrial/featured-product.png` | Campaign fallback only; live catalogue images take priority |
| `public/images/store-premium/*` | Store editorial and empty states |

Live catalogue product photographs come from the published catalogue. Never AI-generate a real SKU without its reference photo.

---

## Critical before visual approval

### 1. Sand-to-abyss handoff still

1. Priority: **1**
2. Filename: `octo-sand-to-abyss-handoff.webp`
3. Path: `public/images/atmosphere/octo-sand-to-abyss-handoff.webp`
4. Section / route: Homepage, immediately after `#ne-uretmek-istiyorsun`
5. Desktop and mobile
6. Desktop 2400×900 (8:3). Mobile crop 1200×1600 (3:4), TV/sand horizon in the upper third
7. Photo / photographic still (not illustration)
8. Prompt: `Photographed mineral sand shoreline dissolving into a dark oceanic abyss, warm espresso sand in the foreground, aged copper and muted champagne light catching fine grains, gradual descent into graphite then abyss-black water, no people, no text, no animals, no pirate or aquarium decoration, cinematic 3D-manufacturing mood, 35mm film grain, restrained luxury.`
9. Avoid: turquoise UI, neon orange, cartoon octopus, coral, treasure, logos, typography, bright cyan, tropical beach, daylight sky
10. Text must be absent
11. No product reference
12. Desktop: full width horizon. Mobile: crop to keep sand in the top 40% and abyss below
13. Fallback removed. Live still: `public/images/atmosphere/octo-sand-to-abyss-handoff.webp`
14. Integration: wired between `#ne-uretmek-istiyorsun` and `#uc-uretim-yolu`. Desktop uses the 8:3 master. Mobile is a CSS `object-fit: cover` 3:4 crop of the same file (sand held at `object-position: 50% 18%`). No second generated artwork; a 1200×1600 export would upscale the 900 px master.

### 2. Resin material specimen

1. Priority: **2**
2. Filename: `material-resin.png`
3. Path: `public/images/home-industrial/material-resin.png`
4. Materials tab on `/` and `/malzemeler`
5. Desktop and mobile
6. 1600×1200 (4:3)
7. Photo of a resin print / translucent specimen
8. Prompt: `Macro photograph of a translucent 3D-printed resin specimen on dark mineral sand, warm copper rim light, champagne highlights, abyss-black studio, no text, no logos, geological-stratum presentation, luxury manufacturing still.`
9. Avoid: cyan gels, cartoon, watermark, UI chrome
10. Text absent
11. Optional real-part reference if you have a resin print photo
12. Center crop, leave sand margin
13. Live as informational homepage specimen only. Reçine is not a production/checkout material.
14. Wired in `#malzeme-secenekleri` as `data-material-info="resin"` with `object-fit: contain`

---

## Important (temporary fallback in use)

### 3. Upload chamber still

1. Priority: **3**
2. Filename: `octo-upload-chamber.webp`
3. Path: `public/images/home-industrial/octo-upload-chamber.webp`
4. `#sana-gore-hazir-modeller` on `/`
5. Desktop 2000×1250 (16:10), mobile 1200×1500
6. Photographic render of a dark fabrication chamber
7. Prompt: `Dark underwater fabrication chamber, a physical 3D model entering a scanning volume, warm copper instrument lights, espresso sand on the floor, abyss-black water pressure, vintage industrial housing, no screens with text, no logos.`
8. Avoid: sci-fi HUD type, turquoise, cartoon
9. Text absent
10. No catalogue SKU
11. Crop to the model in the scan volume
12. Fallback: `path-upload-object.png` + CSS chamber
13. Fallback in use

### 4. Footer octopus silhouette

1. Priority: **4**
2. Filename: `octo-abyss-silhouette.svg`
3. Path: `public/images/brand/octo-abyss-silhouette.svg`
4. Footer, all routes
5. One SVG, scales
6. 1600×500 viewBox
7. Vector silhouette
8. Prompt: `Single restrained octopus silhouette as negative space, eight long curves, no cartoon eyes, no suction-cup clutter, champagne-on-abyss, editorial poster.`
9. Avoid: mascot, pirate, smile, extra sea life
10. Text absent
11. No product
12. Sit on the lower third
13. Fallback: CSS SVG in `.octo-abyss-floor::before`
14. Fallback in use

### 5. Product plinth environment

1. Priority: **5**
2. Filename: `octo-product-plinth.webp`
3. Path: `public/images/atmosphere/octo-product-plinth.webp`
4. Featured product `/` and PDP studio
5. 1800×1800
6. Photo / studio still, empty plinth
7. Prompt: `Empty dark bronze plinth on mineral sand, submerged design-archive lighting, champagne caustics fading, abyss background, space in the center for a product photograph, no object, no text.`
8. Avoid: fake products, DEMO type, turquoise cubes
9. Text absent
10. Do not place a real SKU in the generated image
11. Leave the center 50% empty for live catalogue overlay
12. Fallback: live product image on espresso gradient
13. Fallback in use

---

## Optional polish

### 6. Caustic overlay tile

- `public/images/atmosphere/octo-caustic-tile.webp`, 1024×1024 seamless, photo of champagne light on dark water. Fallback: CSS radials.

### 7. Trust pressure lines

- `public/images/atmosphere/octo-pressure-lines.svg`. Fallback: CSS repeating lines.

### 8. Category atmosphere plates

- Only if a category PNG feels too bright. Existing seven PNGs remain the source of truth.

---

## Integration status summary

| Asset | Status |
| --- | --- |
| Television shell + videos | Live |
| Category artwork | Live |
| Manufacturing stills | Live |
| Sand-to-abyss handoff | Live |
| Resin specimen | Live, editorial only |
| Upload chamber | Missing — existing upload still |
| Footer silhouette | CSS fallback |
| Product plinth | CSS fallback |

---

## Project category media (copied, not generated)

Located and copied into `public/categories/{orbia,memoora,cep-album}/`. Do not regenerate these.

| Project | Source folder | Copied files |
| --- | --- | --- |
| Orbia | `C:\Users\ATA\OneDrive\Masaüstü\siteler\websites\astra-key` | `hero-desktop.mp4`, `hero-mobile.mp4`, `poster.webp`, `logo.svg`, `product.webp` |
| Memoora | `C:\Users\ATA\OneDrive\Masaüstü\memoora` | `hero.mp4`, `poster.png`, `logo.svg`, `magnet.png`, `keychain.png` |
| Cep Albüm | `C:\Users\ATA\OneDrive\Masaüstü\siteler\websites\memory-card-mini-album` | `hero.mp4`, `poster.webp`, `product-hero.webp`, `preview-*.webp` |

Data gaps (not image requests):

- Orbia published price is empty in the source project (`[Fiyat eklenecek]`). Purchase stays disabled.
- Cep Albüm collection packages are “fiyat için iletişime geç” in the source. Only 200 TL singles are sold.

Cep Albüm uses `product-hero.webp` as the category wordmark until a dedicated logo exists. That is a fallback, not a new generation request.

---

## Ask next (one asset)

Paused. Do not request the next visual until the Orbia, Memoora and Cep Albüm integrations are visually approved.
