# Habit Hero — Cloudflare deployment

**Production architecture:** Cloudflare Workers + Static Assets + D1 (D1 not yet provisioned). See [architecture decision](../docs/ARCHITECTURE.md).

The Worker currently publishes the website and original Expo PWA. Its `/api/*` routes intentionally return **HTTP 503** until authenticated, family-isolated, D1-backed endpoints are implemented. **Do not configure `API_ORIGIN` or a legacy Render/MongoDB backend.** There is no remote proxy.

## Deployment controls

The workflow `.github/workflows/cloudflare.yml` compiles the Expo web app, runs the Cloudflare route tests, stages static assets, and deploys with Wrangler 4 when repository variable `HABIT_HERO_CLOUDFLARE_DEPLOY=true`. The deployment token is stored in the `CLOUDFLARE_API_TOKEN` GitHub Actions secret. The account ID defaults to the same account used for the site's analytics project, but can be overridden with `CLOUDFLARE_ACCOUNT_ID`.

Public Worker: https://habit-hero-cloudflare.george-stathopoulos.workers.dev

- `/`: redirects to `/habit-hero/`
- `/habit-hero/original-preview/`: source Expo frontend preview
- `/_health`: checks edge availability; `apiConfigured: false` is expected at Step 7
- `/api/*`: HTTP 503, no upstream connection

GitHub Actions workflow results verify publication. A successful build does **not** mean the full application is functional.

## Next development gate

D1 creation, binding, schema migrations, auth and CRUD endpoints are **not** part of Step 7 and require separate verification before live rollout. Keep database secrets and identifiers out of public client assets.
