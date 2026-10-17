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
