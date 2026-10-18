# Changelog

## 3.0.0-preview.3 — 2026-10-17

- Remember tilt preference, reconnect to existing browser grants automatically, and retry after an ordinary page gesture when iOS requires one. Explicitly disabled tilt stays off.
- Strengthen scroll parallax and add a reversible flower/leaf canopy over the Playful scene.
- Add character illustrations for making the bed, brushing teeth and reading; retain themed activity icons in lists.
- Make switching profiles cancellable from both selection and PIN entry. Keep the current child session until a replacement PIN is verified, then revoke it atomically.
- Add tablet scene/content columns and a desktop navigation rail with wider activity and mission-detail layouts.
- Animate the magic egg with a gentle wobble and shine, respecting reduced motion.

## 3.0.0-preview.2 — 2026-10-17

- Replaced the mature-looking first-preview characters with reconstructions based directly on the mockup hero cards, preserving childlike proportions, reference outfits and companions.
- Replaced habit/activity scene thumbnails with colourful rounded Playful SVG badges; larger artwork is reserved for mission detail.
- Added optional, permission-aware device tilt with calibration, smoothing, screen-rotation handling and reduced-motion support.
- Connected family child selection to the real v3 child application; parent workflows remain available.
- Added scenery-specific ambient background animation: drifting clouds and soft daylight, paused off Home and disabled for reduced motion.
- Updated the scenery and foreground to the mockup’s softer Playful art style while preserving independent depth layers.

## 3.0.0-preview.1 — 2026-10-17

- Added the first Playful child experience with original illustrated landscape, transparent hero/companion appearances and foreground foliage.
- Added independently moving depth planes, touch-scroll parallax, soft atmospheric light and reduced-motion behavior.
- Added a five-destination mobile shell, Home progress, mission list/detail, help and approval-aware submission, rewards, hero choice and messages using existing Cloudflare APIs.
- Added an explicitly isolated visual sandbox and a lean GitHub Actions deployment path that reuses the existing static build.
- Made version checks compare against the deployed source branch, with an explicit release reference for preview builds.
- Preserved the existing family entry point and v2 interface. This is a preview of the first theme, not the full v3 launch.

## 3.0.0-preview.4 — Parent workspace

- Add a responsive cream/sage parent dashboard using existing family APIs and PIN security.
- Add v3 child/profile forms, custom missions and assignment controls, progress, approval/help inbox, reward creation/review, timezone and export.
- Route parent unlock to v3; retain full legacy administration through a visible link.
- Provide an isolated, labelled parent sandbox for review without changing family data.

## 3.0.0-preview.5 — Parent management

- Bring child PIN reset, device pairing/revocation and manual point adjustments into v3.
- Add reward editing, child assignment management and archive confirmations; add mission archiving.
- Clear sensitive dialog fields on close and report successful changes.
- Keep existing server authorization, expiry, history and idempotency rules.

## 3.0.0-preview.6 — Family goals

- Add 20 family goals and age-adjusted mission starting points directly to v3.
- Open each suggestion as an editable mission before saving; flag matching assigned titles.
- Store goal preferences locally per family, with isolated sample behaviour and storage-failure feedback.

## 3.0.0-preview.7 — Scheduling and child feature parity

- Edit existing mission instructions, benefits, repetitions and cooldowns.
- Add selected weekdays and same-day time windows with family-timezone server enforcement; preserve unrestricted legacy schedules.
- Use family-local days for weekly/monthly repetition checks.
- Separate child missions for other days and explain unavailable windows.
- Restore child badges, recent attempts, reward history and paired-device PIN lock/unlock.
- Add the parent 30-day activity calendar and an explicit feature parity backlog; additional themes are last.
- Fix newline rendering and a stale schema-test fixture. No database migration required.

## 3.0.0-preview.8 — Encouragement and Love Credits

- Add durable personal parent-to-child encouragement with optional 0–100 Love Credits.
- Children explicitly receive gifts; unique ledger keys prevent repeated claims from awarding extra points.
- Add parent sent history and server-backed read/claim receipts; include messages in family export.
- Keep normal encouragement free of point requirements and separate from manual corrections.
- Add migration 0007, verified against SQLite transaction rollback, retries and family boundaries before manual migration/deployment.

## 3.0.0-preview.9 — Message layout fix and routines

- Put message text, timestamp and gift action in separate spaced rows; verify no overlap at 320/390/768/1280px.
- Add morning, after-school and bedtime mission grouping with parent-defined step order.
- Add child routine progress cards, routine filters and next-available-step navigation.
- Show missing-previous-attempt, cooldown, next-day and rejected-attempt explanations before submission.
- Reuse versioned schedule storage; no new database migration or theme work.

## 3.0.0-preview.10 — Readable mobile UI and parent-controlled profile category

- Enlarge child/parent text, touch targets, forms and navigation; add a readable collapsible parent menu.
- Add a prominent parent-to-child switch that locks parent access before opening profile/PIN selection.
- Require the parent to choose girl/boy at profile creation/editing and save it atomically.
- Remove the child category selector and old local overrides; reserve future child selection for characters inside the parent-set collection.

Greek typography correction: both v3 interfaces now use bundled Noto Sans with genuine variable weights and Greek/Latin coverage, including accented Greek. Removed misleading local Nunito aliases and mixed parent serif/system families. Fonts are served locally under the existing content security policy.

## 3.0 preview.11 — Habit lifecycle

Parent pause/resume, recoverable archives and explicit retry authorization; child 15/30/60-minute postponement/cancellation within the same local day. Schedule gates remain enforced. Rejected submissions are preserved and a partial unique index permits at most one pending/approved submission per occurrence slot. Retry identifiers cannot award the same attempt twice. Lifecycle events and controls are included in export. Migration 0008 is required before deployment. Further tests and visual QA were skipped at the user's request.

## 3.0 preview.12 — Comprehensive history

Parent History and child Hero → full history share one filter/browser implementation. Protected endpoints paginate points, submissions, reviewed decisions, rewards and lifecycle events with stable time/id cursors. Parents filter by child; child sessions are always restricted to their own records. Date boundaries follow family timezone, including DST offsets. Filters include period, name and status. No additional manual tests or visual checks, as requested.

## 3.0 preview.13 — Analytics and weekly review

Parent Progress supports 7/30/90-day periods and child filters. Family-local daily counts show attempts, approval status, earned/spent points, help and postponements. Per-habit totals and first/second-period approval counts support discussion without claiming a completion rate or ranking children. Weekly review includes active effort days and conversation prompts. Oversized reports request a smaller period rather than silently truncating. Manual tests/visual checks skipped on request.

## 3.0 preview.14 — Reminders and Web Push

Parent-configured daily reminder time and quiet hours per child/parents, pending approval reminders and Monday encouragement prompts. Browser/device opt-in is explicit. Native Web Push uses VAPID with an empty payload and generic lock-screen copy; family names and tasks are never sent to push providers. The Worker checks eligible tasks, schedule, postponement and retry availability every 15 minutes, records daily delivery keys and removes expired subscriptions. Each subscribed device requires browser support and permission; iPhone requires an installed web app. No physical-device delivery test was performed at the user's request. Migration 0009 precedes deployment. Settings, not private push keys/endpoints, are included in family export.

## 3.0 preview.15 — Custom and personal routines

Parents create/rename family routines and bulk-assign routine/step ordering across a child's assigned missions. Per-child overrides keep sibling ordering independent; clearing a routine is an explicit override of the shared default. Existing weekday/window/approval rules remain unchanged. Custom routines and overrides are included in export. Migration 0010 is additive. Manual tests/visual checks skipped as requested.

## 3.0 preview.16 — Family and account administration

Email-bound 24-hour parent invitations, explicit family switching with re-lock, revocable parent memberships and session management. Owner removal of a parent also revokes child sessions/pairings for reconnecting under remaining guardians. Parent data reset and account deletion require exact typed confirmation and PIN unlock within 15 minutes. Active database deletion uses a transaction-scoped family erasure guard; normal ledger updates/deletes remain forbidden. Joint-family records retain an anonymized actor, and ownership passes to another active guardian. Families without another active guardian are erased. Provider recovery-copy retention is outside this feature. No real deletions, invitations or access grants were performed during implementation; manual tests/visual checks skipped.

## 3.0 preview.17 — Trusted-device offline reading

Explicit device opt-in stores a last-known family/child snapshot for up to 24 hours. Shared service worker caches public assets and data-free app shells, never API responses. Offline views are labelled read-only; writes remain online-only and are not queued. Snapshots clear on account/profile-switch attempts, child locking and authorization failure. Cached data cannot verify remote revocation while disconnected; this is disclosed and intended only for trusted devices. Reconnection refreshes from authoritative APIs. Physical-device install/permission/offline acceptance is intentionally pending because the user requested no further manual tests or visual checks.
