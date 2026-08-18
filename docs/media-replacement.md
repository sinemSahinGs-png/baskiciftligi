# Media replacement checklist

Chromatic Foundry can take real photography without a code change. Set
paths in product metadata, category `image_url`, or the existing public
environment keys. Do not invent product renders.

## How to replace media

| Field | Current layer | How to change |
|---|---|---|
| Hero MP4 | `NEXT_PUBLIC_HOME_HERO_VIDEO_URL` / `siteConfig.hero.videoUrl` | Env or later `site_settings` / `homepage_sections.demo-hero` |
| Hero WebM | `NEXT_PUBLIC_HOME_HERO_WEBM_URL` / `siteConfig.hero.webmUrl` | Same |
| Hero poster | `NEXT_PUBLIC_HOME_HERO_POSTER_URL` / `siteConfig.hero.posterUrl` | Same |
| Product stage | `products.metadata.stage_preset` | Admin “Ürün sahnesi” |
| Object position | `products.metadata.object_position` | Admin “Görsel konumu” |
| Mobile crop | `products.metadata.mobile_object_position` or media `role=mobile` | Admin |
| Isolated cutout | `products.metadata.isolated` or media `isolated` | Admin checkbox |
| Hover image | media `role=hover` | Second product image |
| Product video | media `type/role=video` | Product media URL |
| Category hero | `categories.image_url` | Category manager |
| Collection media | `collections.imageUrl` (ready) | When a collection image is stored |
| Alt text | `product_images.alt_text` | Required in admin |

## Demo assets to replace

| Route | Section | Current asset | Ratio | Transparent | Recommended shot | Mobile crop |
|---|---|---|---|---|---|---|
| `/` | Hero video | `/demo/hero/placeholder.mp4` | 16:9 min. 1920×1080 | No | Real studio / printer atmosphere, no fake product | Center 9:16 safe |
| `/` | Hero WebM | `/demo/hero/placeholder.webm` | 16:9 | No | Same as MP4 | Same |
| `/` | Hero poster | `/demo/hero/poster.jpg` | 16:9 | No | First video frame, high contrast | Faces/object in center third |
| `/` | Featured collection | `/demo/products/flux-vazo.svg` | 4:5 | Yes | Isolated Flux vase on seamless | Keep vessel in frame |
| `/` | Featured collection | `/demo/products/orbit-lamba.svg` | 4:5 | Yes | Isolated ring lamp | Keep ring complete |
| `/` | Featured collection | `/demo/products/*` secondaries | 4:5 | Yes | Matching isolated product | 50% 40% |
| `/` | Product cards | All `/demo/products/*.svg` except detail | 4:5 | Yes | Isolated PNG/WebP, no baked studio | Avoid cutting the base |
| `/` | Hover / detail | `/demo/products/flux-vazo-detail.svg` | 4:5 | No | Honest surface close-up, framed | Top-weighted |
| `/` | Category worlds | `/demo/categories/*.svg` | 2:1 or product 4:5 | Yes if overlay | Category hero or first product | Right-safe overlay |
| `/` | Model library promo | `/demo/products/*.svg` | 1:1 | Yes | Same isolated products | Center |
| `/` | Gallery | mix of product + category demo | 4:5 / 2:1 | Mixed | Customer photos only with permission | Honest crop |
| `/magaza` | Cards | same product SVGs | 4:5 | Yes | Same as homepage cards | Two-column readable |
| `/urun/[slug]` | Gallery | product media | 4:5 | Per asset | Primary isolated; extras may be framed | Sticky gallery |
| `/magaza/[category]` | Masthead | category SVG | ~16:9 | No if scene | Category lifestyle or first product | Title left, art right |
| `/hazir-modeller` | Model cards | product SVGs as stand-ins | 1:1 | Yes | Model preview stills, labeled demo until licensed | Square |
| `/malzemeler` | Material lab | generated swatches | 16:9 sample | n/a | Filament spool + surface macro | Keep swatch large |

Every current `/demo/**` file is labeled `data-demo-placeholder="true"` and is
illustration, not a photograph of a sellable object.
