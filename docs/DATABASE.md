# Habit Hero D1 schema — Step 9

The initial production database migration is `cloudflare/migrations/0001_initial.sql`. It was deployed to the Cloudflare EU-jurisdiction D1 database `habit-hero-db` using the `Step 9 - Verify and apply D1 schema` GitHub Actions workflow. The workflow's offline SQLite checks passed and a remote read-only schema query and `PRAGMA foreign_key_check` passed.

## Data structure

- `families`, `parent_users`, `family_memberships`: family ownership and parent access.
- `child_profiles`: children, avatar metadata, optional hardened PIN state; no date of birth required.
- `habits`, `habit_assignments`: family-owned habits and per-child assignments.
- `completion_submissions`: dated submissions and parent review status.
- `reward_catalog`, `reward_eligibility`, `reward_redemptions`: reward catalog and redemptions.
- `point_ledger`: append-only point change history; idempotency keys prevent duplicate event application.
- `auth_sessions`, `auth_challenges`: future server-side auth state, only hashed bearer/challenge secrets.
- `audit_events`: minimal structured, per-family activity tracing.

**No accounts or child information have been inserted.** Tables alone do not provide application-level access control. All API reads/writes must filter by family and validate the actor's role; do not use client-supplied family IDs as authorization evidence.

## Constraints and cautions

- Composite family/record foreign keys reject many accidental cross-family references.
- Append-only ledger triggers prevent ordinary updates/deletes. Balance calculation must use an atomic transaction and verify sufficient available points, prevent double spending and account for reversal/penalty logic when those endpoints are built.
- Unique idempotency keys provide replay protection for completions, redemptions, ledger entries, but their semantics must be implemented server-side.
- Identity and session routes are not yet active, and child 4-digit PIN handling requires rate limiting and a memory-hard secret hashing design before launch.
- `PRAGMA foreign_keys=ON` in the migration is not a substitute for checking enforcement in each execution context.
- This is v1, designed from the recovered original app models. New migrations, not modifications to already-deployed scripts, should handle later schema changes.

## Validation

- Offline: `python3 scripts/test-d1-schema.py -v` (creates only an in-memory database).
- Remote: `.github/workflows/d1-migrations.yml` runs the test suite first, applies D1 migrations, queries expected table names, then runs `PRAGMA foreign_key_check`.
- Runtime Worker connectivity: `GET /api/health` performs only `SELECT 1` through the `DB` binding and exposes no records. Other `/api/*` routes fail closed.

## Next gated work

Secure parent authentication requires choosing and configuring a delivery/identity provider. Do not add unauthenticated write routes or import private family records until that decision is made and session/family authorization has passed automated security tests.
