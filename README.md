# Habit Hero

Habit Hero is a family habit-and-rewards Progressive Web App (PWA).

## Playful v3 preview

The first v3 child experience adds original layered artwork and scroll/pointer depth effects while using the existing Cloudflare APIs. See [the v3 scope, routes and verification limits](docs/V3-PLAYFUL.md) and [changelog](docs/CHANGELOG.md). The family entry point opens v3 for children after PIN unlock; parents keep their existing workspace.

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

## Current state (2026-10-16)

- Cloudflare Worker and D1 host authenticated parent and child flows, including parent-approved child pairing.
- Users have confirmed habit creation/assignment, child submissions, approvals, points and persistence.
- Repository code now includes habit and reward editing/archiving, multi-child assignments, reward redemption, profiles, progress, histories and frequency-aware occurrence keys.
- Newly committed changes require deployment and consolidated end-to-end verification before being described as live.
- The original Expo and historical backend sources remain under `original/`; Cloudflare/D1 is the supported application backend.
- See [development status](docs/DEVELOPMENT-STATUS.md) for planned work and verification gaps.

## Development and deployment

The GitHub Actions workflow `.github/workflows/cloudflare.yml` builds the web app and deploys when the repository variable `HABIT_HERO_CLOUDFLARE_DEPLOY` is `true`; its Cloudflare token lives in GitHub Actions secrets. D1 provisioning is handled by the separate `.github/workflows/provision-d1.yml` workflow. The Worker configuration includes the existing database binding.

See [cloudflare/DEPLOYMENT.md](cloudflare/DEPLOYMENT.md).
