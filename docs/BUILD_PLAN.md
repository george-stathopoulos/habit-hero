# Habit Hero — Build-first delivery plan

**Workflow decision (2026-10-16):** finish coherent feature areas in larger batches before comprehensive QA. Stop asking the owner to test every button. All GitHub deployment, D1 migration, Pages and heavy build workflows now run only through manual `workflow_dispatch`. The existing live Cloudflare build remains usable; unverified development commits remain in GitHub and do **not** automatically alter production.

## Existing live foundation

- Google parent sign-in and encrypted cookie-backed sessions
- Parent family dashboard, child profiles, habits and assignments
- Parent-supervised completion, parent approval and point ledger
- Child-device pairing and limited child session
- EU D1 schema through migration `0004_child_pairing.sql`

## Finish development first (ordered)

1. **Rewards and redemption — implementation drafted, not deployed or QA-verified.** Parent catalog, child eligibility, request/approval/fulfillment, ledger debit and balance check are in `cloudflare/rewards-api.mjs`, with parent/child UI added. Revisit single-use concurrency, approval race paths and full-ledger invariants in consolidated QA.
2. **Habit operations** — edits, deletes, assignment management, scheduling/frequency and safe retry behavior.
3. **Child experience** — home/progress/streaks, age-appropriate activity feedback and points views; no parent controls.
4. **Parent experience** — unified navigation, dashboard summaries, management of profiles/devices/rewards, responsive/mobile styling.
5. **Original feature parity** — presets, categories, progress/levels, love credits, notifications/messages, metrics and remaining original use cases, excluding any requiring a separately approved external provider.
6. **Account controls** — data export/deletion, privacy notices, consent/retention decisions, session and device administration.
7. **Polish/installability** — PWA metadata, offline-friendly reads, responsive accessibility, documentation and project site updates.

These features should be implemented but **not advertised as live until a milestone deployment**. Work must not depend on asking the owner to test every incremental change.

## Implementation batch log

- Reward feature files committed to GitHub without triggering Cloudflare or GitHub Pages deployments. Production retains the last verified release.
- Manual release workflows are `.github/workflows/cloudflare.yml`, `d1-migrations.yml`, `pages.yml`, `original-build.yml`, `backend-test.yml`, and `provision-d1.yml`.
- Next build batch: habit editing, deactivation/assignment changes, frequency handling and child progress.

## Later consolidated QA/release

- Offline syntax/unit tests + D1 schema migration check, test database and rollback plan
- Privacy and auth threat review (child/parent session isolation, CSRF, replay, cross-family objects, rate limits)
- E2E on desktop and phone; pairing, complete/review/points/rewards; refresh/relogin
- Controlled Cloudflare deployment, one real account acceptance pass, prioritized bug fixes
- Production launch only after required privacy decisions and security gates

## Guardrails

Production can remain at the last verified release while work continues in GitHub. No automatic D1 migration or deployment on source pushes. Never ship unaudited financial/point ledger code or migrations by bypassing release checks. No secrets committed.
