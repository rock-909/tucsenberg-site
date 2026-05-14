# API Rate Limit Wrapper Consolidation Design

## Goal

Continue slimming the starter API layer by removing duplicate hand-written rate-limit flow from `/api/verify-turnstile`, while preserving the route's security behavior.

## Current issue

Most public write endpoints already use `withRateLimit()`:

- `/api/contact`
- `/api/inquiry`
- `/api/subscribe`
- `/api/csp-report`

`/api/verify-turnstile` still manually imports and calls:

- `checkDistributedRateLimit`
- `createRateLimitHeaders`
- `getIPKey`

That duplicates the same infrastructure failure, 429/503, and header behavior that `src/lib/api/with-rate-limit.ts` already owns. For a starter project, this is unnecessary route-local complexity.

## Target behavior

`src/app/api/verify-turnstile/route.ts` should:

1. keep the endpoint-specific order: config check, JSON parse, token validation, server-derived client IP, Cloudflare verification, response;
2. receive `clientIP` from `withRateLimit("turnstile", handler)`;
3. keep fail-closed rate-limit behavior through the existing `turnstile` preset;
4. keep the same stable error codes:
   - missing token -> `TURNSTILE_MISSING_TOKEN`
   - invalid token -> `TURNSTILE_VERIFICATION_FAILED`
   - Turnstile network/upstream failure -> `TURNSTILE_NETWORK_ERROR`
   - rate-limit storage failure for fail-closed preset -> `SERVICE_UNAVAILABLE`
   - rate limit exceeded -> `RATE_LIMIT_EXCEEDED`
5. keep CORS handling and GET/OPTIONS behavior unchanged.

## Boundary

This round keeps `withRateLimit()` as a reusable helper. The cleanup target is duplicate route-local rate-limit orchestration, not removal of all helper modules.

Do not change:

- public API response shape;
- Turnstile verification implementation in `src/lib/turnstile.ts`;
- `RATE_LIMIT_PRESETS.turnstile`;
- CORS helper behavior;
- contact/inquiry/subscribe route logic.

## Acceptance criteria

1. `src/app/api/verify-turnstile/route.ts` imports `withRateLimit`.
2. `src/app/api/verify-turnstile/route.ts` no longer imports or calls `checkDistributedRateLimit`, `createRateLimitHeaders`, or `getIPKey`.
3. Existing verify-turnstile tests still pass, including fail-closed infrastructure failure tests.
4. `src/lib/api/with-rate-limit.ts` tests still pass.
5. A source-level architecture test prevents reintroducing manual rate-limit orchestration in `/api/verify-turnstile`.

## Self-review

- No placeholders remain.
- Scope is limited to one route plus its tests and one architecture guard.
- The design preserves security-sensitive behavior and only changes ownership of the rate-limit orchestration.
