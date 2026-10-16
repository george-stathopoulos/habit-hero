# Habit Hero Cloudflare deployment

This folder contains the Worker serving Habit Hero's static assets and its optional API gateway.

Deployment is controlled by the GitHub Actions repository variable `HABIT_HERO_CLOUDFLARE_DEPLOY=true` and secret `CLOUDFLARE_API_TOKEN`. The account ID defaults to the same non-secret identifier used by the owner's site-analytics project.

The Worker serves `/habit-hero/` and proxies `/api/*` to an HTTPS API origin when `API_ORIGIN` is configured. Without that backend configuration, `/api/*` intentionally responds with HTTP 503. This is a static frontend deployment, not full-stack readiness.

The deployment run output is the source of truth for whether Cloudflare actually published this Worker.
