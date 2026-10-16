# Habit Hero — Cloudflare deployment

**Production architecture:** Cloudflare Workers + Static Assets + D1 (D1 provisioned and bound in Step 8; no application schema yet). See [architecture decision](../docs/ARCHITECTURE.md).

The Worker currently publishes the website and original Expo PWA. Its `/api/*` routes intentionally return **HTTP 503** until authenticated, family-isolated, D1-backed endpoints are implemented. **Do not configure `API_ORIGIN` or a legacy Render/MongoDB backend.** There is no remote proxy.

## Deployment controls

The workflow `.github/workflows/cloudflare.yml` compiles the Expo web app, runs the Cloudflare route tests, stages static assets, and deploys with Wrangler 4 when repository variable `HABIT_HERO_CLOUDFLARE_DEPLOY=true`. The deployment token is stored in the `CLOUDFLARE_API_TOKEN` GitHub Actions secret. The account ID defaults to the same account used for the site's analytics project, but can be overridden with `CLOUDFLARE_ACCOUNT_ID`.

Public Worker: https://habit-hero-cloudflare.george-stathopoulos.workers.dev

- `/`: redirects to `/habit-hero/`
- `/habit-hero/original-preview/`: source Expo frontend preview
- `/_health`: checks edge availability; `apiConfigured: false` is expected at Step 7
- `/api/*`: HTTP 503, no upstream connection

GitHub Actions workflow results verify publication. A successful build does **not** mean the full application is functional.

## Step 8 — D1 provisioned and verified

- D1 database: `habit-hero-db` (ID `0450de33-0812-45b4-8f52-62ed9947aaf3`)
- Data location: Cloudflare EU jurisdiction, reported serving region `EEUR`
- Worker binding: `env.DB` defined by `cloudflare/wrangler.jsonc` as `DB`
- Provisioning check: `.github/workflows/provision-d1.yml` created the database using Wrangler and successfully executed remote `SELECT 1 AS ready`.
- Database is intentionally empty. No schema, customer records, login endpoints or migrations have been implemented.
- Do not commit any credentials. Database UUID is an identifier, not an authentication secret.

## Next development gate

D1 creation and binding are Step 8 only. Schema migrations, authentication, and CRUD endpoints have **not** been implemented and require separate verification before live rollout. Keep database secrets and identifiers out of public client assets.
