# Homepage industrial image slots

Place final assets in this folder. Missing files must not break the build; the UI shows a technical wireframe placeholder of the same size.

| File | Section | Desktop ratio | Mobile ratio | Recommended px | Type | Transparency | Crop-safe | Max size |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `hero-wireframe-vase.avif` | Idea command | 4:5 | 4:5 | 1200×1500 | AVIF/WebP | Yes | Center object, keep edges empty | 180 KB |
| `path-idea-dragon.avif` | Production paths 01 | 4:5 | 4:5 | 1400×1750 | AVIF | No | Head/shoulders in center | 220 KB |
| `path-ready-model.avif` | Production paths 02 | 4:5 | 4:5 | 1400×1750 | AVIF | No | Full object | 220 KB |
| `path-upload-object.avif` | Production paths 03 | 4:5 | 4:5 | 1400×1750 | AVIF | No | Full object | 220 KB |
| `archive-main.avif` | Model archive hero | 5:4 | 4:5 | 1600×1280 | AVIF | No | Full figure | 240 KB |
| `archive-thumb-01.avif` | Archive thumb | 1:1 | 1:1 | 640×640 | AVIF | No | Center crop | 80 KB |
| `archive-thumb-02.avif` | Archive thumb | 1:1 | 1:1 | 640×640 | AVIF | No | Center crop | 80 KB |
| `featured-product.avif` | Featured product | 5:6 | 4:5 | 1400×1680 | AVIF | No | Editorial right crop | 240 KB |
| `production-tunnel.avif` | Production process | 16:10 | 16:10 | 1920×1200 | AVIF | No | Keep rail in lower third | 280 KB |
| `material-pla.avif` | Materials | 1:1 | 1:1 | 900×900 | AVIF | No | Macro fill | 120 KB |
| `material-petg.avif` | Materials | 1:1 | 1:1 | 900×900 | AVIF | No | Macro fill | 120 KB |
| `material-tpu.avif` | Materials | 1:1 | 1:1 | 900×900 | AVIF | No | Macro fill | 120 KB |
| `printer-farm.avif` | Corporate | 16:9 | 4:5 | 1920×1080 | AVIF | No | Rows of printers, right text-safe | 280 KB |

All images should be monochrome or near-monochrome. Do not use purple or blue studio gradients.

Until a file is present, the UI renders an on-brand wireframe placeholder of the same aspect ratio. After dropping an AVIF, add its filename to `READY` in `src/components/home-industrial/industrial-slots.ts` so `next/image` will load it.
