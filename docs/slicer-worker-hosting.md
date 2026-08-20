# PrusaSlicer worker hosting

The Next.js storefront runs on Vercel. The slicer worker in `apps/slicer-worker`
must run as a long-lived Linux container elsewhere. It polls
`https://baskiciftligi.com/api/internal/slicer/claim` with bearer auth; there is
no public slice endpoint.

## Minimum shape

| Resource | Target |
| --- | --- |
| OS / arch | Linux x86_64 |
| CPU | ~2 vCPU |
| RAM | ~4 GB |
| Temp disk | 2–4 GB (`/tmp/slicer-jobs`, tmpfs or ephemeral) |
| Concurrency | 1 (`SLICER_MAX_CONCURRENT=1`) |
| PrusaSlicer | 2.8.1 (AppImage SHA256 pinned in Dockerfile) |
| Health | `GET /health` on port 8788 |

## Provider comparison (estimate, early-stage always-on worker)

Figures are **approximate monthly USD** for one always-on worker (~2 vCPU / 4 GB),
excluding Supabase/Vercel. Verify on each provider before billing.

| Factor | Railway | Render | Fly.io | Google Cloud Run |
| --- | --- | --- | --- | --- |
| Docker support | Yes | Yes | Yes (Machines) | Yes |
| Background worker | Yes | Background worker / private service | Yes (no HTTP required) | Poor fit (request-driven; max 60 min/request) |
| Always-on | Yes | Yes (Starter+; free tier sleeps) | Yes | Scales to zero; not ideal for 2.5s polling |
| Cold start | Low for always-on | Free tier sleeps ~15 min | Low for always-on | Cold start on scale-from-zero |
| Private env vars | Yes | Yes | Yes | Yes (Secret Manager) |
| Outbound HTTPS to Vercel/Supabase | Yes | Yes | Yes | Yes |
| Temp disk | Ephemeral container FS | Ephemeral | Ephemeral + optional volume | Ephemeral (in-memory / emptyDir) |
| Ops complexity | Low (dashboard + Dockerfile) | Low | Medium (CLI, fly.toml) | Medium–high (IAM, region, min instances) |
| Est. cost (2 vCPU / 4 GB) | ~$80–100 usage | ~$25–85 tier-dependent | ~$25–45 usage | ~$50–120 with min instances |
| Continuous slicing | Yes | Yes | Yes | Only with min instances ≥1 + long timeout tuning |

### Recommendation: **Render Starter background worker** (early stage)

For the current workload (concurrency 1, EU-ish latency to Vercel + Supabase,
owner-operated, minimal DevOps):

1. Predictable flat pricing and simple “background worker + Dockerfile” model.
2. No need for multi-region Fly Machines or Railway usage surprises while volume is low.
3. Cloud Run is a poor match for pull-based polling workers without paying for always-on min instances.
4. Fly.io is cost-competitive but adds CLI/ops overhead for a single worker.

Fly.io is the cost-optimized alternative if the owner is comfortable with `flyctl`.

## Secrets (names only)

Set the **same** `SLICER_WORKER_SECRET` in:

- Vercel production (`SLICER_WORKER_SECRET`)
- Worker host (`SLICER_WORKER_SECRET`)

Also required on Vercel (already used by quote signing):

- `MANUFACTURING_QUOTE_HMAC_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Worker host:

```dotenv
APP_BASE_URL=https://baskiciftligi.com
SLICER_WORKER_SECRET=<rotate-if-reused-from-dev>
SLICER_WORKER_ID=render-prod-1
PORT=8788
SLICER_MAX_CONCURRENT=1
```

Vercel production (after worker is live):

```dotenv
SLICER_WORKER_URL=https://<worker-host>/ 
```

Use HTTPS only. Do not set localhost URLs in Vercel production.

Generate secrets locally without logging them:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Run twice: once for `SLICER_WORKER_SECRET`, once if rotating `MANUFACTURING_QUOTE_HMAC_SECRET`.

## Deploy on Render (manual — no charge without owner approval)

1. Push this repository to GitHub (already connected to Vercel).
2. Render → New → Background Worker.
3. Connect repo; root directory: repository root.
4. Dockerfile path: `apps/slicer-worker/Dockerfile` (build context: repo root).
5. Instance: Starter or Standard with **≥2 CPU / 4 GB RAM**.
6. Add environment variables above (no secrets in repo).
7. Deploy; note the service URL (health only): `https://<name>.onrender.com/health`.
8. Set `SLICER_WORKER_URL=https://<name>.onrender.com` on Vercel; redeploy web.
9. Run production acceptance (unique STL upload on baskiciftligi.com).

Alternative configs in repo:

- `render.yaml` — Render Blueprint (review before Apply)
- `fly.toml` — Fly.io Machines
- `railway.toml` — Railway service metadata

## Deploy on Fly.io (manual)

```bash
fly auth login
fly launch --no-deploy --config fly.toml
fly secrets set SLICER_WORKER_SECRET=... APP_BASE_URL=https://baskiciftligi.com
fly scale vm shared-cpu-2x --memory 4096
fly deploy
```

## Local verification (before/without hosted worker)

```bash
npm run manufacturing:up
npm run manufacturing:health
npm run test:manufacturing:live
npm run lint
npx tsc --noEmit
npm run test
docker compose build slicer-worker
```

## Production acceptance checklist

Only after a **hosted** worker is running:

1. Upload a fresh unique STL on https://baskiciftligi.com (not fixtures).
2. Confirm `manufacturing-objects` private object in Supabase.
3. Confirm job claimed (`manufacturing_integration_status.worker_last_seen_at` updates).
4. Confirm real G-code metrics and bc-quote-v2 signed quote.
5. Add to cart with `quoteId` only; verify `/api/cart/price`.
6. Re-upload identical bytes → idempotent reuse.
7. Tamper client price → 409.
8. Clean up acceptance artifacts; keep audit rows.

Do not treat local Docker or fixture mode as production proof.
