# Feature parity and next implementation order

Updated 2026-10-18. Features take priority over additional themes. Source inspection is not proof of historical production reliability.

## Available in v3

- Child/parent session separation, household PIN selection, device pairing and revocation, child PIN reset, child lock/unlock.
- Child profiles with parent-set girl/boy collection (one character per collection), custom missions and assignments, instructions and benefits, daily/weekly/monthly/one-time recurrence, repetition counts and cooldowns.
- Weekdays and same-day time windows in family timezone; server enforcement in child and supervised submission APIs. Unsupported overnight windows are rejected.
- Submission/approval/help flow, points, reward creation/editing/eligibility/archive/request/review/fulfillment, point adjustments and family export.
- Durable parent encouragement messages, optional claim-once Love Credits, read/claim receipts and message export.
- Ordered morning/after-school/bedtime routines, child progress cards, routine filters and next-available-step navigation.
- Goals and editable suggestions, parent 30-day activity calendar, child milestone badges and recent attempts, child reward-request history.
- One Playful world with independent depth planes, scenery animation, pointer/tilt/scroll movement, garden curtain and animated egg.

## APK comparison: corrected baseline

Inspected on 2026-10-18: `application-d830e72d-029a-41ca-96f8-796adcd4b957.apk`, 88.6 MiB, modified 2026-09-26. This is the most recent non-Netflix APK in Downloads. It is not the largest by byte count: the February builds are slightly larger. Habit Hero identity is confirmed by strings in its packaged Hermes bundle.

SHA-256: `69f3808998b0e961ed64b3eb27be22a0ea98a8e208c004ec111b3782e593e551`.

Method: inspected packaged `assets/index.android.bundle` screen/API identifiers and cross-referenced corresponding repository source. This establishes included feature code, not successful execution against the APK's former backend. No Android runtime acceptance was performed. The source snapshot is corroborating evidence, not a claim of exact build-source equivalence.

Confirmed included capabilities not fully represented in v3:

- **Task postponement:** bundle includes `/child/postponed-tasks`; original task API has postponement. V3 offers submit/help, without the equivalent postponement flow.
- **Detailed analytics:** packaged parent analytics and child-analytics screens; original charts include daily trends, per-habit outcomes, weekly/monthly totals. V3 has a 30-day calendar and summary metrics, not equivalent analytics screens.
- **Comprehensive points and event histories:** packaged comprehensive-points-history, approval-history and redemption-history endpoints. V3's bounded recent lists and basic review views do not provide equivalent full history/period controls.
- **Custom photo avatars with parent controls:** packaged custom-avatar-status and custom-avatar-settings. Original source supports enablement and eligibility modes. V3 currently uses the parent-set illustrated collection only.
- **Automatic inactivity penalties:** packaged inactivity-penalty-settings; original parent controls configure points/time interval. V3 manual point adjustments are not this feature. Restore only after deciding whether automatic deductions fit the product.
- **Help retry flow:** packaged parent encourage-retry endpoint and original corresponding action. V3's help handling does not yet provide equivalent retry semantics for a rejected occurrence.
- **Love Credits parent reminders:** packaged love-credits-reminder endpoint and original dashboard reminder. Sending/claiming credits exists in v3; this prompt is missing.
- **Account reset/deletion:** packaged reset-app and delete-account API paths; original Danger Zone implements confirmation flows. V3 export is available, but reset/deletion is not.
- **Onboarding/support information:** packaged onboarding-guide, help-feedback and privacy-policy screens. V3 lacks equivalent dedicated guided/support screens. This is separate from ordinary authentication/setup.

Do not present custom routine names, offline sync, narrative weekly recaps, recoverable archives or richer world unlocks as proven APK capabilities: those were proposed improvements in the earlier backlog. Native push code exists in the repository, but packaged working notification delivery has not been established by this inspection. Additional themes are deliberately deferred by the user.

## Broader backlog (not an APK parity checklist)

The original `original/backend/server.py` and `original/frontend/src/` contain functionality beyond the current Cloudflare implementation. These services are not used as a production backend for v3.

1. **Encouragement improvements:** basic personal messages and Love Credits now exist. Further work includes better message organisation and optional parent-configured notification delivery. Manual point adjustments remain separate.
2. **Routine expansion:** the three common ordered routines and next-step flow are implemented. Custom routine names, bulk routine creation and child-specific ordering for shared missions remain future work.
3. **Reminders:** parent-controlled timing, quiet hours and permission-aware delivery. In-app messages currently update on refresh/foreground; no background push delivery is claimed.
4. **Family review:** weekly recap of effort, help requests and improvement, with useful per-habit insight. Current metrics are recent activity, counts, levels and streaks.
5. **Resilience controls:** reversible pauses, recoverable archives, parent-guided retry of rejected attempts, and forgiving progress semantics. Rejected slots currently retain the server's existing unique-occurrence rule.
6. **Account/privacy completion:** self-service account deletion/retention workflow and broader multi-parent/session administration. Export exists; it does not mean deletion is implemented.
7. **Reliability:** physical-device acceptance of PIN/pairing, install behaviour and motion; offline authenticated reads/sync are not implemented. No offline point mutation queue is planned without a deduplication design.
8. **Hero selection and world progression:** multiple child-selectable characters within the parent-set collection, plus meaningful companion and environment unlocks beyond current level/streak/egg presentation.

Other themes come after this functional work. No claim of full original-version parity should be made until these gaps are resolved or explicitly removed from scope.

## Structural delivery progress

1. Habit lifecycle implemented: pause/resume/restore, same-day timed postponement and parent-authorized retries retaining rejected records. General rescheduling uses the existing parent schedule editor. No automatic carry-over across recurrence periods.
2. Comprehensive history: next.
Items 3–9 follow the agreed order. Item 10 (onboarding/help content, additional graphics/themes) is explicitly deferred.

2. Comprehensive history implemented for parent and child: 30-entry pages, stable cursors, family-local date ranges, type/status/name filters and child isolation. Parent Histories / child Hero → full history.
