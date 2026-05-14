# CSP Report JSON Parser Consolidation Design

## Goal

Continue slimming the API/helper layer by removing route-local JSON stream parsing from `/api/csp-report`, while keeping CSP report security behavior intact.

## Current issue

`src/app/api/csp-report/route.ts` still owns its own body parser:

- `createPayloadTooLargeResponse`
- `parseContentLengthHeader`
- `readRequestTextWithLimit`
- local `JSON.parse` error handling

Other public JSON routes already use `safeParseJson()` with request body byte limits. The CSP route should reuse the shared JSON parser instead of maintaining a second streaming implementation.

## Target behavior

`/api/csp-report` should:

1. keep accepting `application/csp-report` and `application/json`;
2. keep rejecting unsupported or missing content type with `UNSUPPORTED_MEDIA_TYPE`;
3. keep the 16 KB body-size cap;
4. keep returning `PAYLOAD_TOO_LARGE` with HTTP 413 for oversized CSP report bodies;
5. keep returning `INVALID_JSON_BODY` for malformed JSON;
6. keep returning `INVALID_REQUEST` for empty body, non-object JSON, arrays, and schema failures;
7. keep acknowledging empty `{ "csp-report": {} }` with HTTP 204;
8. keep log sanitization, suspicious report detection, and production logging unchanged.

## Required helper adjustment

`safeParseJson()` currently treats empty bodies as `INVALID_JSON_BODY` because `JSON.parse("")` throws. CSP report has a long-standing behavior of treating empty body as `INVALID_REQUEST`. To consolidate without changing behavior, add a narrow option:

```ts
emptyBodyErrorCode?: typeof API_ERROR_CODES.INVALID_JSON_BODY | typeof API_ERROR_CODES.INVALID_REQUEST;
```

Default remains `INVALID_JSON_BODY`, so contact/inquiry/subscribe/verify-turnstile behavior does not change.

## Acceptance criteria

1. `src/app/api/csp-report/route.ts` imports and uses `safeParseJson(..., { maxBytes: MAX_CSP_REPORT_BODY_BYTES, emptyBodyErrorCode: API_ERROR_CODES.INVALID_REQUEST })`.
2. `src/app/api/csp-report/route.ts` no longer contains `readRequestTextWithLimit`, `parseContentLengthHeader`, `createPayloadTooLargeResponse`, or route-local `JSON.parse`.
3. `safeParseJson()` supports route-specific empty-body error mapping while preserving its existing default.
4. Existing CSP report tests continue to pass:
   - empty body -> `INVALID_REQUEST`
   - malformed JSON -> `INVALID_JSON_BODY`
   - oversized report -> 413 `PAYLOAD_TOO_LARGE`
   - empty report object -> 204
5. A source-level architecture test prevents route-local JSON/body-size parser helpers from returning to `/api/csp-report`.

## Out of scope

- Changing CSP report schema.
- Changing CSP log sanitization.
- Changing content-type behavior.
- Changing rate-limit behavior.
- Generalizing CSP report parsing into a new helper file.

## Self-review

- No placeholders remain.
- Scope is one API route plus one existing shared helper.
- Behavior changes are intentionally avoided except for adding a backward-compatible `safeParseJson` option.
