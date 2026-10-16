# Habit Hero — Approved Cloudflare-native architecture

**Decision date:** 2026-10-16  
**Status:** Architecture approved in Step 7; EU D1 database provisioned and Worker binding configured in Step 8. API and schema migration **not started**.  
**Production target:** Cloudflare Workers + Static Assets + D1. No Render, MongoDB, or persistent FastAPI service in production.

## Scope and current implementation

The original Expo/React Native Web UI is already hosted on Cloudflare under `/habit-hero/original-preview/`. The original Python/FastAPI/MongoDB source in `original/backend/` is migration reference material, not the deployment target. Existing login, habit, family, child, redemption, notification and point-balance screens **are not yet verified working end-to-end**. The frontend currently calls `/api/*`; that endpoint must safely return 503 until native backend routes are built.

**Do not connect the original Python backend or the previously created MongoDB Atlas cluster to the production Worker.** Do not assume current local/PWA data is durable account data.

## Target components

| Responsibility | Implementation |
| --- | --- |
| Web frontend | Existing Expo web export in Cloudflare Workers Static Assets |
| Same-origin API | Cloudflare Worker, `/api/*` |
| Primary transactional storage | Cloudflare D1, SQL migrations tracked in GitHub |
| Parent identity | Server-side session issuance, passwordless or OAuth via trusted provider, CSRF/state/nonce controls |
| Child access | Parent-provisioned profiles and limited-scope child PIN/session; never reuse parent authorization |
| File uploads | None required for initial MVP; optional private Cloudflare R2 with validated uploads |
| Scheduled work | Cron Triggers with idempotent tasks; add notification delivery only after reviewing provider and consent |
| Secrets | Wrangler secrets / Cloudflare bindings and GitHub Actions secrets, never public frontend bundles |

A separate Cloudflare deployment is not required for the API: a single Worker can serve static assets and protected same-origin routes.

## Data model — planned, NOT yet created

The D1 database and `DB` binding exist, but no tables are created yet. A planned relational model with `families`, `parent_users`, `family_memberships`, `child_profiles`, `habits`, `habit_occurrences`, `completion_submissions`, `parent_approvals`, `point_ledger`, `reward_catalog`, `reward_redemptions`, `sessions`, and `audit_events`.

Every tenant-owned record must include a family ID and enforce it **on the server for every read and write**. Never trust family/child IDs or role assertions supplied by clients. Point and reward changes must be atomic, idempotent, and backed by ledger records to avoid duplicate credits/debits. Plan migrations, indexes, constraints, and seed-only test fixtures before deployment.

## Security and privacy release gates

- Parent accounts authenticate securely; session cookies should be `HttpOnly`, `Secure`, `SameSite`, appropriately scoped and revocable. Rotate tokens and use expiry; avoid storing credentials in browser localStorage.
- Authorization distinguishes parents and children; parent approval actions require a parent session. Deny cross-family access, including ID enumeration, with automated tests.
- Use Cloudflare D1 parameterized queries; validate input and output; rate-limit sensitive login and PIN endpoints. Never log credentials, magic links, children's names, family records, or tokens.
- Define clear account/family deletion, retention and data-export behavior. Keep collection minimal and private by default. Review GDPR and child-data legal requirements before real user onboarding.
- Use cost and abuse safeguards. Free Cloudflare quotas are finite and do not provide unlimited requests/storage; email/SMS/push delivery may have costs.
- Verify the actual end-to-end app using browser tests and a test-only family before calling production ready.

## Delivery sequence

1. **Step 7 (this change):** Record architecture decision, remove legacy production deployment assumptions, preserve the current working frontend.
2. **Step 8 (completed):** Create a dedicated EU-jurisdiction D1 database and explicit `DB` binding via controlled Wrangler configuration. No schema or data migration at Step 8.
3. Implement SQL schema migrations, constraints and tests.
4. Implement parent authentication and family isolation.
5. Migrate feature areas incrementally: parent/child profiles, habit definitions, completion + approvals, ledger/points, rewards/redemptions, and optional notifications/uploads.
6. Automated E2E/security testing, then invite real families only after privacy/security gates pass.

## Prior infrastructure

The `habit-hero` MongoDB Atlas free cluster created in the setup process is not production infrastructure and no app data was migrated to it. Do not expose it through broad IP allowlists. Its later decommissioning is a separate, explicit housekeeping decision.

The former `render.yaml` blueprint was removed to prevent accidental provisioning of an obsolete Python/MongoDB backend. The original source remains in `original/backend/` solely for compatibility/reference analysis.

## Cloudflare routing at Step 7

`/` redirects to `/habit-hero/`; `/_health` reports healthy edge hosting but `apiConfigured: false`; `/api/*` returns an explicit 503 with no network access to third-party API origins. Future native routes must opt in through tested code and the configured D1 binding.
