# Habit Hero development status

Updated 2026-10-16.

## Implemented in source

- Parent and independent child authentication; profile management and device pairing.
- Habits, additional child assignments, habit editing and archiving.
- Completion submissions, parent approvals and point ledger.
- Reward catalog, redemption workflow, reward editing and archiving.
- Child and parent 30-day progress and streak views.

## Not yet verified in this development batch

- Live deployment and complete browser journeys.
- Verify recurrence boundaries for weekly, monthly and one-time habits (source now implements period-specific keys).
- Rewards and progress integration, tenant isolation and concurrency cases; repeat reward requests are now blocked while pending or approved.
- Data export/deletion, privacy review, reminder system and visual polish.
- Child reward request history and completion history have now been implemented in source.

Committed source is not proof of deployed functionality. Consolidate tests after feature development.

## Latest additions

- Family-local dates, IANA timezone setting and additive migration applied before Worker deployment.
- Parent and child home-screen PWA manifests, mobile navigation and avatar display.
- Lifetime hero levels and milestone badges, along with recent history.
- Point corrections through immutable parent-only ledger entries.
- Parent family export and multi-child reward sharing.
- Rewards show their affordability and how many points remain for the child.
- The GitHub workflow now runs recurrence boundary checks; a successful deployment and family/browser checks remain to be confirmed.

## Parent-managed 4-digit PIN (2026-10-16)

- Optional 4-digit child PIN during profile creation; parent can set/reset later with confirmation.
- First-time independent child use still requires a parent-issued, one-use device pairing code. PIN is a secondary child unlock, **not** an internet-facing four-digit login.
- Child PIN unlock for paired device; child-only authorization rejects locked sessions.
- Child Lock button preserves pairing and returns to PIN prompt.
- PIN is stored as a salted PBKDF2 verifier (160,000 SHA-256 iterations) rather than plaintext. Five failed attempts trigger a fifteen-minute lockout, and parent reset clears the lock.
- Migration 0003 adds child-session unlock state; deployment workflow checks whether migration was already applied before running it.
- Tests cover cross-origin and anonymous authorization attempts. End-to-end browser and live database confirmation remain required.
