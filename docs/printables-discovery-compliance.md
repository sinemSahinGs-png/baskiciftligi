# Printables discovery compliance review

**Product:** Baskı Çiftliği `/hazir-modeller`  
**Review date:** 2026-08-20 (Europe/Istanbul)  
**Purpose:** Determine whether Baskı Çiftliği may run automated server-side search against Printables and display third-party model cards (title, thumbnail, canonical URL) on baskiciftligi.com.

## Summary verdict

**Do not implement live Printables scraping, undocumented GraphQL/API clients, HTML search scraping, or proxy-rotated automated harvesting.**

Reason: Prusa Research General Terms (incorporated into Printables Terms) **explicitly prohibit automated extraction / scraping** of website contents. `robots.txt` alone does **not** authorize commercial re-display of search results. There is **no public, documented Printables search API** for third-party storefronts.

Competitor behavior is **not** permission.

---

## Evidence log

| Source | URL | Accessed | Finding |
|---|---|---|---|
| Printables `robots.txt` | https://www.printables.com/robots.txt | 2026-08-20 | `User-agent: *` / `Allow: /` / `Disallow: /world/` / sitemap present. Search paths are not Disallow’d for generic crawlers. **This is a crawl hint only, not a content-reuse licence.** |
| Printables Terms of Service | https://www.prusa3d.com/page/terms-of-service-of-printables-com_231249/ | 2026-08-20 | §1.2 incorporates PRUSA website Terms. §1.4: any use = agreement. §4.3: other Printables use must follow general Terms; sites only in usual manner / anticipated purposes. Effective from 2022-08-01. |
| PRUSA General Terms (Websites) | https://www.prusa3d.com/page/general-terms-and-conditions-of-use-of-the-prusa-websites_231226/ | 2026-08-20 | **§9.1 (critical):** users must refrain from activities aimed at unauthorised copying, **manual or automated extraction of Website contents including scraping**, artificial inquiry load, etc. **§9.5:** site content may not be reproduced / communicated to the public without prior consent of Provider or rights holders; commercial dissemination prohibited unless expressly allowed. Domains explicitly include **printables.com**. |
| Printables third-party licences page | https://www.printables.com/licenses | 2026-08-20 | Software attribution notices only; **not** a public search/API grant for third-party ecommerce discovery. |
| `api.printables.com/robots.txt` | https://api.printables.com/robots.txt | 2026-08-20 | **HTTP 404** — no published robot policy / no public documented search API surface for partners. |
| Industry notes on undocumented endpoints | Third-party scraper blogs (e.g. ScrapingLab guides) | 2026-08-20 | Claim rate limits / undocumented GraphQL–REST used by the frontend. **Not official documentation.** Using those endpoints would violate the project rule against undocumented APIs and ToS scraping ban. |

### Key ToS quote (GTC §9.1)

> “…the user is obliged to refrain from any activities aimed at unauthorised copying, **manual or automated extraction of the contents of the Websites including scraping**, artificial increase in inquiries and burdening of the accessibility capacity of PRUSA Services…”

### Key ToS quote (GTC §9.5)

> Website content “…may not be used for any other purpose… without the prior consent of the Provider or rights holders — in particular, such content may not be… **reproduced, distributed, communicated to the public**…”

---

## Question checklist (task §2)

| Question | Result |
|---|---|
| Does `robots.txt` allow crawling `/search/...`? | Technically Allow for `*`, except `/world/`. |
| Do Terms allow automated extraction for a third-party storefront? | **No — scraping / automated extraction prohibited.** |
| Is indexing / re-display of titles + thumbnails on another commercial site licensed? | **Not granted** without prior Provider consent; commercial dissemination restricted. |
| Official public search API? | **None found.** |
| May we use undocumented GraphQL used by the Printables SPA? | **No** (project + ToS). |
| May we bypass CAPTCHA / rotate IPs / impersonate sessions? | **No.** |
| May we download model files for quoting? | **No** (out of scope + ToS/licence risks). |

---

## Decision for Baskı Çiftliği engineering

1. **Blocked method:** Server-side Printables HTML scrape, undocumented API, browser automation against Printables search, thumbnail CDN bulk proxying of Printables results into Baskı Çiftliği grids.
2. **Allowed interim / free legal paths:**
   - **A. User-initiated same-tab open** of a Printables search URL built only on Baskı Çiftliği (no result cards copied). Already discussed product-wise as insufficient UX.
   - **B. Admin-curated “Harici model bağlantıları”** (task §10): owner adds canonical model URLs; title/thumbnail entered manually (or OG only if separately cleared); user searches curated set on `/hazir-modeller`; `source` remains external; no file copy; no auto price.
   - **C. Official partnership / manufacturer programme** with Prusa Research / Printables for sanctioned discovery metadata.
   - **D. Paid / official search APIs** from providers that publish commercial search products and allow re-display (not Printables undocumented endpoints).
3. **Thingiverse** remains credential-gated official API path when configured; do not confuse with Printables.

---

## What was not done

- No Printables scrape adapter shipped.
- No undocumented GraphQL client.
- No CAPTCHA bypass / proxy rotation.
- No fabricated Printables result fixtures presented as live production data.

---

## Re-check cadence

Re-verify `robots.txt`, Printables ToS, and PRUSA GTC before any future attempt at live Printables discovery. Require written partnership or a documented public API before changing this verdict.
