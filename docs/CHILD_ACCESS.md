# Child device pairing — first secure child-access milestone

Parents authenticate through Google. A child **never** uses the parent's Google account or gets an unrestricted parent login.

## Setup

1. Open `/habit-hero/parent/` while signed in as a parent.
2. Under **Συσκευές παιδιών**, select the child and generate a device pairing code.
3. On a **different device or separate browser profile**, open `/habit-hero/child/`.
4. Enter the 32-character pairing code within ten minutes.
5. The child receives a separate, HttpOnly, Secure, SameSite=Lax, host-only session cookie valid up to seven days.

A parent can revoke all active sessions and unused pairing codes for the selected child. Child logout revokes the current session.

## Isolation and limitations

- The pairing code has 192 bits of entropy, is one-use, and only a SHA-256 digest is held in D1. It is displayed once; treat it like a password until consumed.
- The child cookie (`__Host-hh_child`) is distinct from the parent cookie (`__Host-hh_session`). Child endpoints validate role `child`, active session, ownership and family-scoped assignments server-side.
- Child endpoints can display **only that child's** assigned habits and submit completions. They cannot award points, approve completions, create profiles, edit habits, or change rewards.
- A parent must approve submissions before ledger credit. Uniqueness constraints prevent repeat credits.
- **Important limitation:** A child who uses the same browser profile as an authenticated parent can still access the parent's pages via the pre-existing parent cookie. Use separate devices or profiles; this is not a kiosk lock or a parent-session switch feature.
- No PIN or password recovery has been implemented for children: a parent issues a fresh pairing code to reconnect.
- Session lifetime is seven days; production should eventually support named devices, narrower expirations, parent session re-authentication for device pairing, activity audit, abuse controls, and GDPR child-access review.
- The original full React Native/Expo app is not yet connected to these child APIs; this stage uses a restricted Worker-owned UI.

## Files

- `cloudflare/migrations/0004_child_pairing.sql`
- `cloudflare/child-auth.mjs`, `cloudflare/child-page.mjs`, `cloudflare/parent-page.mjs`
- `scripts/test-child-auth.mjs`, `scripts/test-d1-schema.py`
