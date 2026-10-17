# Habit Hero 3.0 — Playful vertical slice

2026-10-17. First theme and child experience; the other themes and parent redesign have not been released.

## Open it

- Visual sandbox: `/habit-hero/v3/preview/` — clearly labelled example data. Help, submissions and reward requests simulate UI states only; no API writes.
- Existing-account version: `/habit-hero/v3/child/` — reads and writes through the existing child APIs. Unlock the child in the existing family screen; child selection now opens this v3 route. The parent workspace remains v2.
- Local: `node scripts/v3/preview.mjs`, then http://127.0.0.1:4173/habit-hero/v3/preview/.
- Phone composition review: http://127.0.0.1:4173/qa (development server only).

## The visual foundation

The supplied Habit Hero v3 Visual Implementation Blueprint is the visual reference. Playful has a sunny pastel garden kingdom, mockup-based childlike hero and companion reconstructions, foreground flowers, warm paper cards, and five navigation destinations. Artwork is generated specifically for this world rather than using the v2 geometric SVG scenes.

Three independently composited illustrated planes establish the scene:

1. Distant castle, mountains, waterfalls and garden landscape.
2. Transparent hero and companion: the reference girl with her white kitten, or reference boy with his blue dragon. Both appearances are available to everyone.
3. Transparent flowers, foliage and rocks in front of the hero.

The near plants overlap the character; the character sits in front of the scenery. Atmospheric perspective and light give depth while still. Pointer movement shifts scenery and foreground opposite the hero, with the near plane moving most. Scrolling supplies parallax on touch devices without device-motion permissions. Supported touch devices also offer relative device-tilt parallax; iOS requests orientation permission only after tapping “Κίνηση με κλίση”. Reduced motion disables tilt. The sensor stream is ignored off Home and while hidden, values are clamped and smoothed, and axes follow screen rotation. Reduced motion disables decorative animation and layer transforms. Motion is frame-scheduled and transforms do not change layout. Background clouds drift continuously and daylight gently shifts; ambient motion pauses outside Home or while the page is hidden. Background pollen glints remain behind the characters. Heroes, foreground foliage and controls have no idle animation. There is no full-screen canvas or continuous JS animation loop.

`app/v3/worlds/playful.js` owns art mappings and depth coefficients; `worlds/playful.css` owns base palette/type tokens. The shared client owns navigation, data, and interaction behavior. Future worlds should supply original matching artwork and additional art direction; changing colors alone is insufficient.

Production WebP assets retain transparency and are self-hosted. Home's background, active hero and foreground together are approximately 292 KB. The second hero and task scenes load when used. No runtime AI service or per-image generation call is required for families.

## Working slice

- Home with actual mission statuses, level progress, and consistency-based companion progress when signed in.
- Colourful Playful SVG activity badges in the Home and mission lists, with larger illustrations reserved for focused mission detail.
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

## Reference artwork correction — 2026-10-17

The first-preview mature art is replaced by reconstructions using the dedicated Girl Hero/Boy Hero cards and first Playful phone in the supplied PDF as direct references. These are close reconstructions, not pixel-identical original source assets. The girl keeps her pink outfit, purple leggings and kitten; the boy keeps his blue cape and little dragon. See [the art direction](PLAYFUL-ART-DIRECTION.md) and [reference prompts](PLAYFUL-REFERENCE-PROMPTS.md).

Activity rows now use shaded, colourful native SVG bed/toothbrush/book/outdoor badges instead of scene thumbnails. Browser inspection confirmed zero row images and three Playful icons in the sample Home. Clouds were confirmed running while Home was visible and paused after changing tabs; heroes and foreground had no idle animation. All scene images loaded successfully, and both hero choices were inspected in the browser.

## Device testing

Open the family entry point, sign in as the parent, create/select a child, and unlock that child to enter v3 with actual API data. On supported iPhones, tap “Κίνηση με κλίση” and grant the orientation prompt to test layer movement. On devices that do not require permission it activates automatically. Turning it off or enabling reduced motion stops tilt. Real-device sensor response remains for user testing; browser checks cannot verify physical hardware.

## Usability pass — preview.3

- Tilt preference is stored per device/browser. On page load the client attempts to reuse the browser's existing grant, and remembers an explicit off choice. If a retained grant still needs activation, it reconnects after a normal page gesture rather than requiring the dedicated button again. The browser controls whether consent is retained; the app cannot override a revoked grant or mandatory permission prompt.
- Scroll changes foreground/hero/background transforms at visibly different rates and closes a themed flower-and-leaf canopy; upward scrolling reverses it. Reduced motion removes the curtain and decorative transforms.
- Mission detail now shows the reference child actually making a bed, brushing teeth or reading. Lists keep their Playful SVG icons. Other custom missions use the existing coherent world/icon fallback.
- The switch icon opens profile selection without logging out first. Cancel/× returns to the current child; opening the picker and failed PINs preserve the child session. A successful switch revokes that session in the same transaction as the new unlock. Parent entry also clears the child cookie.
- Tablet screens use two scene/content columns. Desktop screens use a navigation rail and wider Home, rewards and mission-detail layouts. The mobile layout remains compact.
- The magic egg gently wobbles and glimmers. This is the requested exception to background-only idle animation; reduced motion disables it.

Focused verification includes automatic tilt reconnection/opt-out/denied-grant tests and profile cancellation/failed-PIN/verified-switch session tests. Browser inspection covered Cancel on the PIN form, the brushing illustration, the egg's animation, scroll-driven transforms, and layouts at 320/390/768/1280px with no horizontal overflow and valid navigation touch targets. Layout measurements are recorded in `screenshots/v3-responsive-check.json`.

![Brushing activity in the desktop layout](screenshots/v3-brushing-activity.png)
