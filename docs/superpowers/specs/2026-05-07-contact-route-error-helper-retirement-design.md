# Contact Route Error Helper Retirement Design

## Context

`src/app/api/contact/route.ts` still has a route-local helper:

```ts
function createSubmissionErrorResponse(errorCode: string, status?: number) {
  return createApiErrorResponse(
    errorCode as (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES],
    status ?? HTTP_BAD_REQUEST,
  );
}
```

This helper exists only because `src/lib/contact/submit-canonical-contact.ts` exposes contact failure `errorCode` as a broad `string`. That forces the route to cast back to the project API error-code union before calling `createApiErrorResponse()`.

The route helper is not a useful abstraction. The better fix is to type the canonical contact result correctly at the source.

## Goal

Remove the route-local contact error-response helper and make canonical contact failures expose `ApiErrorCode`.

## Non-goals

- Do not change contact form behavior.
- Do not change status codes.
- Do not change Server Action compatibility behavior.
- Do not change `ServerActionResult` or `translate-error-code` broader string-facing UI contracts in this round.
- Do not move Turnstile or lead processing out of the canonical contact module.

## Design

### Type tightening

In `src/lib/contact/submit-canonical-contact.ts`:

- import `type ApiErrorCode` from `@/constants/api-error-codes`;
- change `ContactValidationFailure.errorCode` from `string` to `ApiErrorCode`;
- change `CanonicalContactSubmissionFailure.errorCode` from `string` to `ApiErrorCode`;
- remove the unused success-side `submissionResult.errorCode?: string`.

All existing assigned error codes already come from `API_ERROR_CODES`, so this should be a type-only tightening.

### Route simplification

In `src/app/api/contact/route.ts`:

- delete `createSubmissionErrorResponse()`;
- delete the now-unused `HTTP_BAD_REQUEST` import;
- call `createApiErrorResponse(payloadValidation.errorCode, payloadValidation.statusCode ?? HTTP_BAD_REQUEST)` or add a tiny local constant expression inline.

Because `HTTP_BAD_REQUEST` is still needed for default status, the route can keep that constant but should not keep a separate helper. The key cleanup is removing the string cast wrapper.

Target shape:

```ts
if (!payloadValidation.success) {
  return createApiErrorResponse(
    payloadValidation.errorCode,
    payloadValidation.statusCode ?? HTTP_BAD_REQUEST,
  );
}
```

Same for `submission`.

### Architecture guard

Add a source guard in `tests/architecture/lib-facade-boundary.test.ts`:

- `src/app/api/contact/route.ts` must not contain `createSubmissionErrorResponse`;
- it must not contain `as (typeof API_ERROR_CODES)`;
- it must call `createApiErrorResponse(` directly for canonical submission failures.

## Acceptance criteria

Given invalid contact payload, when `/api/contact` handles it, then it still returns the same API error envelope and status.

Given canonical contact submission returns a Turnstile failure, when `/api/contact` handles it, then it still returns the same API error envelope and status.

Given the architecture guard runs, when someone reintroduces the route-local cast helper, then the guard fails.

## Verification

Run:

```bash
pnpm exec vitest run \
  tests/architecture/lib-facade-boundary.test.ts \
  src/app/api/contact/__tests__/route.test.ts \
  src/lib/__tests__/contact-form-processing.test.ts \
  src/app/__tests__/actions.test.ts \
  src/app/__tests__/contact-integration.test.ts
```

Then run:

```bash
pnpm type-check
pnpm lint:check
```
