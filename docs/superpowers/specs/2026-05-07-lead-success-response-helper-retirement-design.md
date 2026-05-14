# Lead Success Response Helper Retirement Design

## Context

The starter still needs a reusable lead submission family:

- `/api/contact`
- `/api/inquiry`
- `/api/subscribe`

These public write routes must keep body size checks, validation, Turnstile, rate limiting, stable machine-readable error codes, and the same success envelope:

```json
{
  "success": true,
  "data": {
    "referenceId": "..."
  }
}
```

The current helper `src/lib/api/lead-route-response.ts` mixes two different concerns:

1. real shared lead-family behavior, such as Turnstile validation and processing-error mapping;
2. a thin success-payload wrapper, `createLeadSuccessPayload()`, that duplicates the already existing generic API helper `createApiSuccessResponse()`.

This round should retire only the thin wrapper. It should not delete the whole lead helper file, because doing so would duplicate Turnstile service-failure handling and lead failure mapping across `inquiry` and `subscribe`.

## Goal

Move lead success responses to the generic API success helper while preserving the public response contract and keeping the useful lead-family helpers.

## Non-goals

- Do not remove `src/lib/api/lead-route-response.ts`.
- Do not move contact Turnstile validation out of `src/lib/contact/submit-canonical-contact.ts`.
- Do not change any public response shape, status code, rate-limit behavior, CORS behavior, or Turnstile action.
- Do not delete route tests or lower coverage.
- Do not remove bottom-level script files in this round.

## Design

### Production code

Use `createApiSuccessResponse()` from `src/lib/api/api-response.ts` in the three lead routes:

- `src/app/api/contact/route.ts`
- `src/app/api/inquiry/route.ts`
- `src/app/api/subscribe/route.ts`

The success payload becomes:

```ts
createApiSuccessResponse({ referenceId })
```

For `inquiry` and `subscribe`, keep `requireLeadReferenceId()` from `lead-route-response.ts` so successful `processLead()` results still fail closed if a reference ID is missing.

Delete `createLeadSuccessPayload()` from `src/lib/api/lead-route-response.ts`.

Keep:

- `createLeadFailureResponse()`
- `requireLeadReferenceId()`
- `validateLeadTurnstileToken()`

### Tests and guardrails

Existing API route tests already assert the success response JSON. Add an architecture guard to make the boundary explicit:

- `src/lib/api/lead-route-response.ts` must not export `createLeadSuccessPayload`.
- contact, inquiry, and subscribe routes must import `createApiSuccessResponse`.
- lead-family success routes must not import `createLeadSuccessPayload`.

This prevents the thin wrapper from coming back while preserving the useful shared helper boundary.

## Acceptance criteria

Given a valid contact submission, when `/api/contact` succeeds, then the response remains:

```json
{
  "success": true,
  "data": {
    "referenceId": "contact-ref-001"
  }
}
```

Given a valid product inquiry, when `/api/inquiry` succeeds, then the response remains:

```json
{
  "success": true,
  "data": {
    "referenceId": "ref-123"
  }
}
```

Given a valid subscription, when `/api/subscribe` succeeds, then the response remains:

```json
{
  "success": true,
  "data": {
    "referenceId": "sub-ref-001"
  }
}
```

Given the architecture guard runs, when someone reintroduces `createLeadSuccessPayload`, then the guard fails.

## Verification

Run the focused proof:

```bash
pnpm exec vitest run \
  tests/architecture/lib-facade-boundary.test.ts \
  src/app/api/contact/__tests__/route.test.ts \
  src/app/api/inquiry/__tests__/route.test.ts \
  src/app/api/subscribe/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts \
  tests/integration/api/lead-family-protection.test.ts
```

Then run:

```bash
pnpm type-check
pnpm lint:check
```

If only these route/helper files changed, `pnpm build` is optional but preferred before reporting the broader cleanup as stable.
