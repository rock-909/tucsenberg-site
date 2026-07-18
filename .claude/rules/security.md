---
paths:
  - "src/app/api/**/*"
  - "src/lib/security/**/*"
  - "src/lib/api/**"
  - "src/lib/actions/**"
  - "src/lib/lead-pipeline/lead-schema.ts"
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
Upstash-backed) is already wired to the public write routes and is the allowed
established state — do not tear it out. The in-memory store is a
development-only fallback: in production, a missing Upstash configuration makes
store construction throw (fail-closed at startup) rather than silently degrading
to per-instance memory. Once the store is live, a per-limit `failureMode`
(`"open"` or `"closed"`) decides whether a runtime storage failure allows or
denies the request. What is forbidden is adding new abuse-control complexity on
top of this (body hashing, duplicate-submission replay detection, per-field
fingerprinting, etc.) as a starter default; add those later only when a real
incident justifies them.

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
- User-facing `partialSuccess` is not part of the target contract.

Buyer-controlled free-text fields sent to Airtable or another spreadsheet-like
sink must use `sanitizeAirtableTextField()` before record creation. Airtable's
typed Email field is the narrow exception: the lead schema rejects
formula-capable prefixes, and the valid address is stored unchanged so ordinary
plus-addressing keeps working.

When changing contact, inquiry, or Airtable field mapping behavior,
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
| `/api/contact` | same public route model as inquiry |
| `/api/csp-report` | body size gate + rate limit; never trust payload content |
| `/api/health` | public health only; no credentials, config dumps, or env details |

Turnstile verification is internal to the protected write routes. Do not add a
public token preflight endpoint: Turnstile tokens are single-use, so a preflight
would consume the token before the real submission.

### CSP report endpoint

`/api/csp-report` is intentionally minimal and never trusts payload content, but
it already carries more than a bare body-size gate:

- Body is capped at 16 KB (`MAX_CSP_REPORT_BODY_BYTES`) — CSP reports are tiny,
  so a small cap blocks body-based DoS.
- A content-type allowlist accepts only `application/csp-report`,
  `application/reports+json`, and `application/json`; anything else is rejected
  before parsing.
- Both the legacy single-report shape and the modern Reporting API top-level
  array (batched reports) are accepted. Array batching is only allowed here
  because the parser is called with `allowTopLevelArray: true`; an empty batch
  returns `204 No Content`.
- `GET /api/csp-report` is a lightweight health probe that returns
  `{ status: "CSP report endpoint active" }`; it never accepts report data.

### JSON body parsing contract

Public write routes parse request bodies through `safeParseJson`
(`src/lib/api/safe-parse-json.ts`). It takes an options contract:

- `maxBytes` — hard body-size ceiling; oversize bodies are rejected without
  parsing.
- `emptyBodyErrorCode` — the stable error code returned for an empty body.
- `allowTopLevelArray` — defaults to `false`, so a top-level JSON array is
  rejected. Only endpoints that genuinely accept batched arrays (the CSP report
  route) opt in by passing `true`.

Keep new routes on this shared parser instead of hand-rolling body reads, so the
size ceiling, empty-body handling, and array policy stay consistent.

### Contact anti-abuse (existing, not new)

`/api/contact` already carries two lightweight anti-abuse checks that predate any
future hardening and must not be mistaken for the forbidden new replay/hashing
complexity called out in the rate-limiter section above:

- A `website` honeypot field (`contact-form-config.ts`): real browsers leave it
  empty; a filled value is treated as bot traffic and returns the same public
  `200` success envelope as a real submission, with an `HP-` reference id logged
  server-side. Do not expose honeypot-specific validation errors to the client.
- A `submittedAt` freshness window (`submit-canonical-contact.ts`): submissions
  whose page-render timestamp is older than ten minutes are rejected as
  stale-page submissions. This is a staleness guard, not replay protection — it
  does not detect or block duplicate/replayed payloads, and must not be described
  as if it did.

Both are already-wired mechanisms. They do not count as the "duplicate-submission
replay detection" that the rate-limiter section forbids adding as a new starter
default; leave them in place and do not extend them into fingerprinting or
body-hashing without a real incident.

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
- Each accepted CSP violation is logged once: routine reports use `logger.warn`;
  suspicious patterns use a single `logger.error`.
- Do not use unfiltered `dangerouslySetInnerHTML`.
- URL values must allow only `https://`, `http://`, or site-relative `/`.

## Env boundaries

- App/runtime code reads server values through `@/lib/env`.
- Browser code reads only `NEXT_PUBLIC_*` helpers exported from `@/lib/env`.
- Do not expose server secrets through `NEXT_PUBLIC_*`.
- Sensitive keys include `AIRTABLE_API_KEY`, `RESEND_API_KEY`,
  `TURNSTILE_SECRET_KEY`, Cloudflare API tokens, and owner dashboard access
  keys.

For future auth/session cookies, default to `httpOnly`, `secure`, and
`sameSite: "strict"` unless a specific flow proves otherwise.
