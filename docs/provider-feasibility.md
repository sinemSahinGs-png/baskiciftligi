# External model provider feasibility (Baskı Çiftliği)

Research date: 2026-08-20. Official documentation and terms only.

| Provider | Official docs | Search API | File download | Auth | Live integration status |
|----------|---------------|------------|---------------|------|-------------------------|
| **Thingiverse** | [Developers](https://www.thingiverse.com/developers), [Swagger](https://www.thingiverse.com/developers/swagger) | Yes (`/search/{term}`, `/popular`) | Yes via official file endpoints | OAuth / access token | **Provider-ready but unconfigured** — code complete; requires `THINGIVERSE_ACCESS_TOKEN` and legal approval |
| **MyMiniFactory** | [For Developers](https://www.myminifactory.com/pages/for-developers), [OpenAPI](https://myminifactory.github.io/api-documentation) | Yes (OAuth 2.0, `/api/v2`) | Yes with authorized client | OAuth 2.0 app registration | **Awaiting user action** — partnership/app approval via manufacturers@myminifactory.com |
| **Printables** | [Printables ToS](https://www.prusa3d.com/page/terms-of-service-of-printables-com_231249/), [PRUSA GTC](https://www.prusa3d.com/page/general-terms-and-conditions-of-use-of-the-prusa-websites_231226/), [compliance memo](./printables-discovery-compliance.md) | **No public official API** | Not via documented public API | N/A | **Live scrape/search blocked by ToS** — GTC §9.1 bans automated extraction/scraping; §9.5 restricts commercial re-display without prior consent. Free legal paths: partnership, curated admin links, or user-opened search URL only |
| **Thangs** | No self-service public search API found | Unknown / partnership | Unknown | Unknown | **Not implemented** — requires official agreement |
| **MyMiniFactory alt contact** | [Private API page](https://www.myminifactory.com/pages/developers) | Contact api@myminifactory.com | Manual approval | OAuth after approval | **Awaiting user action** |

## Rules enforced in codebase

- No HTML scraping or undocumented GraphQL for Printables
- No popularity badges fabricated on cards
- No price before real file + PrusaSlicer quote
- Attribution retained on detail and order provenance
- External models never labeled as Baskı Çiftliği designs

## Recommended next steps

1. Obtain Thingiverse API approval and set server-only `THINGIVERSE_ACCESS_TOKEN` for **legal** on-page cards when configured
2. Apply for MyMiniFactory manufacturer OAuth client if multi-provider catalog is required
3. Do **not** scrape Printables; pursue written Prusa partnership **or** ship admin-curated external link catalog (manual title/thumbnail)
4. Re-read `docs/printables-discovery-compliance.md` before any Printables discovery change
