---
paths:
  - "src/app/api/**/*"
  - "src/app/actions.ts"
  - "src/app/**/actions.ts"
  - "src/lib/security/**/*"
  - "src/lib/api/**"
  - "src/lib/actions/**"
  - "src/lib/lead-pipeline/lead-schema.ts"
  - "src/lib/security-validation.ts"
  - "src/config/security.ts"
  - "next.config.ts"
---

# Security Rules

Use this file when changing API routes, public write endpoints, Server Actions,
validation, rate limits, CSP, sensitive server code, or env exposure.

For Cloudflare build/runtime topology, use `cloudflare.md`.

## Public write endpoints

Browser-exposed write endpoints need:

- body size gate;
- Zod validation;
- Turnstile or equivalent browser anti-abuse check;
- small route-local or shared rate limit when currently wired;
- stable machine-readable error codes.

The existing distributed rate limiter (`src/lib/security/distributed-rate-limit.ts`,
Upstash-backed with an in-memory fallback) is already wired to the public write
routes and is the allowed established state — do not tear it out. What is
forbidden is adding new abuse-control complexity on top of it (body hashing,
duplicate-submission replay detection, per-field fingerprinting, etc.) as a
starter default; add those later only when a real incident justifies them.

If Upstash becomes a problem, the official Workers-native alternative is the
`ratelimits` binding (wrangler >= 4.36, free, per-colo). Treat it as the
established migration direction rather than inventing a new custom store.

## Turnstile failure classification

Keep Turnstile failure handling centralized. Do not create route-local
classification logic unless the route has a documented business reason.

- Missing browser token means verification is required.
- Invalid token, action, or hostname means anti-abuse failure.
- Missing server configuration, network failure, or timeout means service
  unavailable.
- Public write routes must expose stable machine-readable error codes for these
  categories.

## Lead-family behavior

Canonical behavior for contact and inquiry (owner decision, 2026-07-07):

```text
browser form -> route handler -> Zod -> Turnstile -> process lead -> parallel owner email + Airtable record
```

- Owner email and Airtable record creation start in parallel; either channel
  succeeding is the user-facing success condition (email-best-effort policy:
  a lead must never be rejected while at least one delivery channel works).
- When Airtable fails but email succeeds, the route returns success and the
  failure is logged as an error for manual CRM backfill.
- Both channels failing returns failure with a stable error code.
- Newsletter subscribe remains Airtable-only: record failure returns failure.
- User-facing `partialSuccess` is not part of the target contract.

Buyer-controlled free-text fields sent to Airtable or another spreadsheet-like
sink must use `sanitizeAirtableTextField()` before record creation. Airtable's
typed Email field is the narrow exception: the lead schema rejects
formula-capable prefixes, and the valid address is stored unchanged so ordinary
plus-addressing keeps working.

When changing contact, inquiry, subscribe, or Airtable field mapping behavior,
update focused lead-family tests for the changed contract. Do not rely on email
happy-path proof to prove CRM persistence.

## Server-only code

- Add `import "server-only"` to sensitive server modules.
- Route handlers and Server Actions must validate and authorize internally.
- Middleware/proxy filtering is optional front-line protection, not the only
  authorization layer.
- Do not pass trusted identity, client IP, or auth decisions through middleware
  headers for public write flows.

## Endpoint notes

| Endpoint | Expected protection |
| --- | --- |
| `/api/inquiry` | Turnstile + validation + body size gate + rate limit while wired |
| `/api/subscribe` | Turnstile + validation + body size gate + rate limit while wired |
| `/api/contact` | same public route model as inquiry/subscribe |
| `/api/csp-report` | body size gate + rate limit; never trust payload content |
| `/api/health` | public health only; no credentials, config dumps, or env details |

Turnstile verification is internal to the protected write routes. Do not add a
public token preflight endpoint: Turnstile tokens are single-use, so a preflight
would consume the token before the real submission.

### Owner ops access

`/ops/traffic/access` is a route-local rate-limit exception. It must use the
shared `opsAccess` preset and trusted client-IP keying, but only failed owner
access attempts consume the bucket. A valid access key must not be locked out by
previous failed attempts. Do not copy this pattern to public write endpoints;
they should keep the shared `withRateLimit` wrapper unless their auth flow
requires route-local ordering.

## CSP and headers

- Security header behavior lives in `src/config/security.ts` and Next.js
  native `headers()` in `next.config.ts`.
- Middleware owns locale redirects, locale cookies, and leaked middleware
  cookie cleanup. It does not own CSP or generic security headers.
- Do not use `NextResponse.next({ headers })` to push broad response headers
  from middleware/proxy. It can break framework-owned responses such as Server
  Actions and streaming.
- `NEXT_PUBLIC_SECURITY_MODE=strict` means enforced security headers with a
  static-compatible CSP. It is not nonce-level strict CSP.
- CSP is static by starter default. Do not add dynamic nonce handling unless a
  dedicated dynamic rendering proof plan justifies the trade-off.
- A nonce CSP lane needs a proxy-generated nonce plus Cloudflare/OpenNext proof;
  do not mix that into ordinary security cleanup.
- Current nonce CSP feasibility decision lives in
  `docs/项目基础/技术栈.md`.
- CSP reports go to `/api/csp-report`.
- Do not use unfiltered `dangerouslySetInnerHTML`.
- URL values must allow only `https://`, `http://`, or site-relative `/`.

## Env boundaries

- App/runtime code reads server values through `@/lib/env`.
- Browser code reads only `NEXT_PUBLIC_*` helpers exported from `@/lib/env`.
- Do not expose server secrets through `NEXT_PUBLIC_*`.
- Sensitive keys include `AIRTABLE_API_KEY`, `RESEND_API_KEY`,
  `TURNSTILE_SECRET_KEY`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`,
  Cloudflare API tokens, and owner dashboard access keys.

For future auth/session cookies, default to `httpOnly`, `secure`, and
`sameSite: "strict"` unless a specific flow proves otherwise.
