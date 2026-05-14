# Lead Route Local Response Wrapper Retirement Design

## Context

After the previous cleanup rounds, `/api/inquiry` and `/api/subscribe` still have route-local response wrapper helpers:

- `src/app/api/inquiry/route.ts`
  - `createSuccessPayload()`
  - `createErrorResponse()`
- `src/app/api/subscribe/route.ts`
  - `createSuccessResponse()`
  - `createErrorResponse()`

These helpers now mostly hide one branch of the same handler flow. They are not shared across routes, and the actual response helpers already live in:

- `createApiSuccessResponse()` from `src/lib/api/api-response.ts`
- `createLeadFailureResponse()` from `src/lib/api/lead-route-response.ts`
- `requireLeadReferenceId()` from `src/lib/api/lead-route-response.ts`

The remaining route-local wrappers make the routes longer to navigate without adding a stable boundary.

## Goal

Inline the single-use success/error response wrappers in `inquiry` and `subscribe`, while preserving the same response shape, logging, error codes, and public submission protection.

## Non-goals

- Do not remove `validateLeadData()` from inquiry; it gives the product lead schema mapping a clear name.
- Do not remove `createLeadFailureResponse()` or `validateLeadTurnstileToken()` from `src/lib/api/lead-route-response.ts`; they still encode shared lead-family behavior.
- Do not remove business logs; move them into the branch that handles each outcome.
- Do not change rate limiting, Turnstile, body parsing, CORS, or status codes.
- Do not change the contact route in this round.

## Design

### Inquiry route

Replace:

```ts
return result.success
  ? createSuccessPayload(result, responseContext)
  : createErrorResponse(result, responseContext);
```

with direct branch handling:

```ts
if (result.success) {
  // existing non-production success log
  return createApiSuccessResponse({
    referenceId: requireLeadReferenceId(
      result,
      "referenceId missing on successful lead result",
    ),
  });
}

// existing failure warn log
return createLeadFailureResponse({
  result,
  validationErrorCode: API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
  processingErrorCode: API_ERROR_CODES.INQUIRY_PROCESSING_ERROR,
});
```

Delete:

- `InquiryResponseContext`
- `createSuccessPayload()`
- `createErrorResponse()`

Keep `startTime` / `processingTime` because the route still logs processing time.

### Subscribe route

Replace:

```ts
return result.success
  ? createSuccessResponse(result, leadValidation.data.email)
  : createErrorResponse(result);
```

with direct branch handling:

```ts
if (result.success) {
  // existing non-production success log
  return createApiSuccessResponse({
    referenceId: requireLeadReferenceId(
      result,
      "referenceId missing on successful lead result",
    ),
  });
}

// existing failure warn log
return createLeadFailureResponse({
  result,
  validationErrorCode: API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_INVALID,
  processingErrorCode: API_ERROR_CODES.SUBSCRIBE_PROCESSING_ERROR,
});
```

Delete:

- `createSuccessResponse()`
- `createErrorResponse()`

If `NextResponse` and `LeadResult` become unused in subscribe, remove those imports.

### Guardrail

Add an architecture guard to `tests/architecture/lib-facade-boundary.test.ts`:

- inquiry route must not contain `createSuccessPayload` or `createErrorResponse`;
- subscribe route must not contain `createSuccessResponse` or `createErrorResponse`;
- both routes must still use `createApiSuccessResponse`, `createLeadFailureResponse`, and `requireLeadReferenceId`.

## Acceptance criteria

Given a successful inquiry submission, when `/api/inquiry` returns, then the response remains:

```json
{
  "success": true,
  "data": {
    "referenceId": "..."
  }
}
```

Given a failed inquiry process result, when `/api/inquiry` returns, then the route still maps validation failures to `INQUIRY_VALIDATION_FAILED` and processing failures to `INQUIRY_PROCESSING_ERROR`.

Given a successful subscription, when `/api/subscribe` returns, then the response remains:

```json
{
  "success": true,
  "data": {
    "referenceId": "..."
  }
}
```

Given a failed subscription process result, when `/api/subscribe` returns, then the route still maps validation failures to `SUBSCRIBE_VALIDATION_EMAIL_INVALID` and processing failures to `SUBSCRIBE_PROCESSING_ERROR`.

Given the architecture guard runs, when someone reintroduces those single-use wrapper helpers, then the guard fails.

## Verification

Run:

```bash
pnpm exec vitest run \
  tests/architecture/lib-facade-boundary.test.ts \
  src/app/api/inquiry/__tests__/route.test.ts \
  src/app/api/subscribe/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts \
  tests/integration/api/lead-family-protection.test.ts \
  tests/integration/api/subscribe.test.ts
```

Then run:

```bash
pnpm type-check
pnpm lint:check
pnpm build
pnpm website:build:cf
```

Run `pnpm build` and `pnpm website:build:cf` sequentially, never in parallel.
