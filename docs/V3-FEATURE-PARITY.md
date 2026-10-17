# Feature parity and next implementation order

Updated 2026-10-18. Features take priority over additional themes. Source inspection is not proof of historical production reliability.

## Available in v3

- Child/parent session separation, household PIN selection, device pairing and revocation, child PIN reset, child lock/unlock.
- Child profiles, hero selection, custom missions and assignments, instructions and benefits, daily/weekly/monthly/one-time recurrence, repetition counts and cooldowns.
- Weekdays and same-day time windows in family timezone; server enforcement in child and supervised submission APIs. Unsupported overnight windows are rejected.
- Submission/approval/help flow, points, reward creation/editing/eligibility/archive/request/review/fulfillment, point adjustments and family export.
- Goals and editable suggestions, parent 30-day activity calendar, child milestone badges and recent attempts, child reward-request history.
- One Playful world with independent depth planes, scenery animation, pointer/tilt/scroll movement, garden curtain and animated egg.

## Still missing from the original product's broader feature set

The original `original/backend/server.py` and `original/frontend/src/` contain functionality beyond the current Cloudflare implementation. These services are not used as a production backend for v3.

1. **Encouragement / Love Credits:** personal parent messages and deliberate gifts, including a durable history and notifications. Manual point adjustment is not presented as a substitute for this feature.
2. **Routines:** named morning/after-school/bedtime collections with an ordered “what next” flow. Individual scheduled missions are not a routine system.
3. **Reminders:** parent-controlled timing, quiet hours and permission-aware delivery. In-app messages currently update on refresh/foreground; no background push delivery is claimed.
4. **Family review:** weekly recap of effort, help requests and improvement, with useful per-habit insight. Current metrics are recent activity, counts, levels and streaks.
5. **Resilience controls:** reversible pauses, recoverable archives, parent-guided retry of rejected attempts, and forgiving progress semantics. Rejected slots currently retain the server's existing unique-occurrence rule.
6. **Account/privacy completion:** self-service account deletion/retention workflow and broader multi-parent/session administration. Export exists; it does not mean deletion is implemented.
7. **Reliability:** physical-device acceptance of PIN/pairing, install behaviour and motion; offline authenticated reads/sync are not implemented. No offline point mutation queue is planned without a deduplication design.
8. **World progression:** meaningful companion and environment unlocks beyond current level/streak/egg presentation.

Other themes come after this functional work. No claim of full original-version parity should be made until these gaps are resolved or explicitly removed from scope.
