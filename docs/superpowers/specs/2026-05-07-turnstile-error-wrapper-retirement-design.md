# Turnstile Error Wrapper Retirement Design

## Context

`src/app/api/verify-turnstile/route.ts` now uses shared JSON parsing and shared rate limiting. One route-local helper remains as a pure one-line wrapper:

```ts
function createVerificationErrorResponse() {
  return createApiErrorResponse(
    API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED,
    HTTP_BAD_REQUEST,
  );
}
```

It has only one caller and does not encode a reusable rule beyond the generic API error helper call.

## Goal

Remove the one-line verification error wrapper and call `createApiErrorResponse()` directly at the single failure site.

## Non-goals

- Do not change Turnstile verification behavior.
- Do not change network failure handling.
- Do not change rate limiting, request body parsing, CORS, GET, or OPTIONS.
- Do not remove helpers that still carry real branching or logging behavior.

## Design

In `src/app/api/verify-turnstile/route.ts`:

- delete `createVerificationErrorResponse()`;
- in `createFailedVerificationResponse()`, return:

```ts
return createApiErrorResponse(
  API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED,
  HTTP_BAD_REQUEST,
);
```

Add an architecture guard in `tests/architecture/lib-facade-boundary.test.ts`:

- the verify route must not contain `createVerificationErrorResponse`;
- the route must still contain the direct `TURNSTILE_VERIFICATION_FAILED` + `HTTP_BAD_REQUEST` error response.

## Acceptance criteria

Given Cloudflare returns an invalid Turnstile result, when `/api/verify-turnstile` handles it, then response remains HTTP 400 with `TURNSTILE_VERIFICATION_FAILED`.

Given the guard runs, when someone reintroduces the one-line wrapper, then the guard fails.

## Verification

Run:

```bash
pnpm exec vitest run \
  tests/architecture/lib-facade-boundary.test.ts \
  src/app/api/verify-turnstile/__tests__/route.test.ts \
  src/app/api/verify-turnstile/__tests__/route-core.test.ts \
  tests/integration/api/verify-turnstile.test.ts
```

Then run:

```bash
pnpm type-check
pnpm lint:check
```
