# Habit Hero — Parent single sign-on (SSO) decision

**Selected approach:** social sign-in via standards-based OpenID Connect (OIDC), beginning with **Continue with Google** for parent accounts. Apple may be added later, with a separate provider configuration. This is not enterprise SAML SSO.

**State (2026-10-16):** Google OIDC server routes and the original web welcome button are deployed. The live OIDC start redirect, PKCE/flow-cookie tests, D1 health probe and Expo web build pass. **A complete Google account callback and D1 session creation have not yet been tested with a real Google user.** Do not call the entire application production-ready; family feature endpoints remain unavailable.

## Google Cloud configuration (owner action required)

1. Open https://console.cloud.google.com/auth/overview and select/create a Google Cloud project named Habit Hero.
2. Configure Google Auth Platform Branding (app name Habit Hero, support email, developer contact) and Audience. During testing, use **External** with a restricted test-user list. Configure verified domains and privacy policy before broad publication.
3. In https://console.cloud.google.com/auth/clients create an OAuth **Web application** client named Habit Hero Cloudflare.
4. Set **Authorized redirect URI** exactly to:
   `https://habit-hero-cloudflare.george-stathopoulos.workers.dev/api/auth/google/callback`
5. Set **Authorized JavaScript origin** if the chosen login library requires it:
   `https://habit-hero-cloudflare.george-stathopoulos.workers.dev`
6. Keep the Client Secret private. Never send it in chat, add it to GitHub, or put it in `EXPO_PUBLIC_*` variables. Configure it later through a scoped Cloudflare Worker secret.
7. The OAuth Client ID is not a secret; the owner can report the Client ID or confirm setup without sharing the secret.

The PWA is served under `/habit-hero/original-preview/`, but the server-side authorization callback is a root-level API route. The callback URL must match Google's configuration byte-for-byte.

## Security design to implement after provider configuration

- Begin login only with exact-issuer Google OIDC Authorization Code flow and PKCE S256. Random `state` and `nonce` are bound to a short-lived, host-only Secure HttpOnly SameSite=Lax flow cookie. Explicit expiration, single use, and fixed callback URL.
- Exchange the code in the Worker using a server-only Client Secret; no tokens passed in query parameters to the frontend.
- Verify the Google ID token's RS256 signature against Google's published JWKS, as well as `iss`, `aud`, `exp`, `iat`, and `nonce`; require `email_verified` for a sign-in email.
- Identity keys are `issuer + sub`, **not email alone**. Persist an explicit identity link in D1 so an email change cannot hijack or orphan an account. Add that in a separate migration with automated tests.
- Create an opaque cryptographically random session token; store only its SHA-256 hash in D1. Deliver the token in a Secure, HttpOnly, SameSite=Lax, host-only cookie. Set a clear expiration and session revocation flow.
- On first sign-in, create a parent user/family and owner membership transactionally; never let the browser select a family ID, grant itself a role, or skip authorization checks.
- Children do **not** get Google accounts: parents create limited child profiles; child sessions cannot perform approvals, change rewards, or access other families.
- Access controls, abuse prevention, logout, deletion/export, GDPR/privacy safeguards, and test families are release gates before real onboarding.

## Hosting and cost

The Worker and D1 remain Cloudflare-native and designed for the free tier. Google's identity platform configuration and consent screen can impose publishing requirements, and actual costs or quotas must be checked before launch.

## Work gate

The Google Client ID and encrypted Client Secret were configured by the owner in Cloudflare. The Worker now exposes `/api/auth/google/start`, `/api/auth/google/callback`, `/api/auth/me` and `/api/auth/logout`. The GitHub Actions deployment verified that `/api/auth/google/start` returns HTTP 302 and the D1 connectivity route succeeds. The **next verification requires the owner to complete a real Google sign-in** and confirm the callback screen. Unimplemented family and child API routes continue to return HTTP 503; children and account operations must not be treated as functional yet. Do not persist real family/child information before security tests pass.

References: https://developers.google.com/identity/openid-connect/openid-connect and https://developers.google.com/identity/protocols/oauth2/web-server
