# Habit Hero

Habit Hero is a family habit-and-rewards Progressive Web App (PWA).

## Live builds

- **Cloudflare edge:** https://habit-hero-cloudflare.george-stathopoulos.workers.dev/habit-hero/original-preview/
- **Cloudflare health:** https://habit-hero-cloudflare.george-stathopoulos.workers.dev/_health
- **GitHub Pages fallback:** https://george-stathopoulos.github.io/habit-hero/original-preview/
- **Legacy small MVP:** https://george-stathopoulos.github.io/habit-hero/app/

The original Expo frontend has been compiled for the browser and deployed. It is **not yet a fully functioning cloud-backed application**. Accounts, family data, habit management and reward transactions require the new backend.

## Approved production architecture (2026-10-16)

**Cloudflare Workers + Static Assets + D1.** No Render or MongoDB in production. The frontend will retain the existing Expo/React Native Web interface; server-side authentication, authorization and domain logic will be implemented in a Cloudflare Worker with a D1 database. Scheduled jobs will use Cron Triggers. R2 is optional for future uploads.

**Free-tier-first is a design target, not a promise of unlimited free operation.** Review Cloudflare limits, external delivery providers and privacy/security requirements before inviting real families.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the authoritative architecture, security requirements, migration constraints and implementation stages.

## Current state

- Cloudflare frontend deployed and manually confirmed accessible.
- Cloudflare API returns **503** while the native backend has not been implemented. This is intentional; the app must not pretend data is saved.
- EU-jurisdiction D1 database `habit-hero-db` has been created and configured as Worker binding `DB`. No schema, auth implementation, migrations or family-data API is deployed yet.
- Original Expo/frontend and Python/MongoDB code are retained under `original/` **for reference only**. They are not an approved production backend.
- The historical MongoDB Atlas free cluster was created during setup but is **not connected to Habit Hero** and is not part of production.
- No production secrets should ever be committed or exposed as `EXPO_PUBLIC_*` variables.

## Development and deployment

The GitHub Actions workflow `.github/workflows/cloudflare.yml` builds the web app and deploys when the repository variable `HABIT_HERO_CLOUDFLARE_DEPLOY` is `true`; its Cloudflare token lives in GitHub Actions secrets. D1 provisioning is handled by the separate `.github/workflows/provision-d1.yml` workflow. The Worker configuration includes the existing database binding.

See [cloudflare/DEPLOYMENT.md](cloudflare/DEPLOYMENT.md).
