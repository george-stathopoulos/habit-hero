# Habit Hero 3.0 — Playful vertical slice

2026-10-17. First theme and child experience; the other themes and parent redesign have not been released.

## Open it

- Visual sandbox: `/habit-hero/v3/preview/` — clearly labelled example data. Help, submissions and reward requests simulate UI states only; no API writes.
- Existing-account version: `/habit-hero/v3/child/` — reads and writes through the existing child APIs. Unlock the child in the existing family screen first, then open this URL. This slice does not change the family's default v2 destination.
- Local: `node scripts/v3/preview.mjs`, then http://127.0.0.1:4173/habit-hero/v3/preview/.
- Phone composition review: http://127.0.0.1:4173/qa (development server only).

## The visual foundation

The supplied Habit Hero v3 Visual Implementation Blueprint is the visual reference. Playful has a sunny garden kingdom, a dimensional illustrated hero and companion, foreground flowers, warm paper cards, and five navigation destinations. Artwork is generated specifically for this world rather than using the v2 geometric SVG scenes.

Three independently composited illustrated planes establish the scene:

1. Distant castle, mountains, waterfalls and garden landscape.
2. Transparent hero and kitten, with separate boy/girl appearances available to everyone.
3. Transparent flowers, foliage and rocks in front of the hero.

The near plants overlap the character; the character sits in front of the scenery. Atmospheric perspective and light give depth while still. Pointer movement shifts scenery and foreground opposite the hero, with the near plane moving most. Scrolling supplies parallax on touch devices without device-motion permissions. Reduced motion disables decorative animation and layer transforms. Motion is frame-scheduled and transforms do not change layout. Particles are restrained, with no full-screen canvas or continuous JS animation loop.

`app/v3/worlds/playful.js` owns art mappings and depth coefficients; `worlds/playful.css` owns base palette/type tokens. The shared client owns navigation, data, and interaction behavior. Future worlds should supply original matching artwork and additional art direction; changing colors alone is insufficient.

Production WebP assets retain transparency and are self-hosted. Home's background, active hero and foreground together are approximately 615 KB. The second hero and task scenes load when used. No runtime AI service or per-image generation call is required for families.

## Working slice

- Home with actual mission statuses, level progress, and consistency-based companion progress when signed in.
- Separate mission list and focused mission detail, instructions, benefit, help and submit actions. Submission never grants immediate points.
- All-done state distinguishes waiting-for-approval from approved days.
- Rewards respect balance, backend previous-request state and parent review.
- Hero appearance choice remains local to this device, reusing the existing child preference key.
- Messages combine approval, reward and help events. Read state is per child in this browser's local storage, surviving reload. It is not yet synchronized across devices.
- Refresh on returning to the page and once per minute while visible. Failed loads expose retry; authenticated responses are not stored in a service-worker cache.
- Same-origin existing APIs retain all security, schedule, slot, cooldown and ledger authority. No database migration or API rewrite is introduced.
- Existing PWA identity and standalone display metadata, safe-area-aware tabs and install icons. Offline account use is not implemented in this slice.

## Focused verification

Use the existing routing, child-authorization and recurrence checks plus `node scripts/v3/check.mjs` for new routes and packaged assets. Review actual browser layouts at 320, 390, 430 and tablet widths, then one mission/help/submit journey. Do not rebuild the legacy Expo frontend repeatedly for visual edits.

The `cloudflare.yml` dispatch input `v3_preview=true` invokes the focused deployment workflow. It reuses the last successful main static artifact, overlays the current app, and deploys the current Worker. Legacy static routes are retained; no migrations run. The version endpoint reports `release_ref` and checks the deployed source branch, so a preview is not incorrectly offered the older main build as an update. Normal builds use `main`. An expired baseline fails explicitly and requires a full build. Normal main builds retain the original workflow.

Before calling the whole v3 product complete: verify a signed-in child → parent approval → updated balance journey on live test-family data; test an actual iPhone home-screen installation, VoiceOver, reduced motion and offline behavior. Complete and review the rest of the blueprint, including parent onboarding, scheduling UI, all character states and the other three worlds. A passing build or a visual sandbox is not proof of those flows.

## Preview verification record — 2026-10-17

- Browser reviewed the composed Home at 320, 390 and 430px, with tablet layout also available in the local review harness.
- Confirmed all three production illustrated planes loaded. Browser inspection measured different pointer transforms: landscape x=-2.665px, hero x=+4.797px, foreground x=-8.528px for the same pointer position.
- Verified the sandbox mission detail → help → submit → approval confirmation journey. Home updated from 1/3 to 2/3, and points remained unchanged.
- Opening Messages cleared its unread indicator; returning to the preview retained the read state.
- Existing Worker routing, child access/isolation and recurrence checks passed. V3 route and local asset checks passed in GitHub Actions.
- The additive Cloudflare deployment completed successfully using the previous static artifact; its built-in checks verified the deployed source SHA and D1 connection.
- No live family records were created or changed for this visual review. Real authenticated approval and actual iPhone installation remain unverified.

![Deployed Playful Home with layered scenery](screenshots/v3-playful-home.png)
