# CSP Report JSON Parser Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/api/csp-report` route-local JSON stream parsing with the shared `safeParseJson()` helper while preserving CSP report behavior.

**Architecture:** Extend `safeParseJson()` with a narrow `emptyBodyErrorCode` option. Then make the CSP route use `safeParseJson()` with the CSP-specific 16 KB limit and empty-body mapping. Add architecture coverage to prevent route-local JSON parsing helpers from returning.

**Tech Stack:** Next.js 16 Route Handlers, TypeScript, Vitest, Zod.

---

## File structure

- Modify `src/lib/api/safe-parse-json.ts`
  - Add `emptyBodyErrorCode` option.
- Add `src/lib/api/__tests__/safe-parse-json.test.ts`
  - Cover default empty body behavior and CSP-specific empty body behavior.
- Modify `src/app/api/csp-report/route.ts`
  - Replace local stream parser and `JSON.parse` with `safeParseJson()`.
- Modify `tests/architecture/lib-facade-boundary.test.ts`
  - Add source guard preventing route-local body parser helpers in `/api/csp-report`.

## Task 1: Add failing tests for empty body mapping

**Files:**
- Add: `src/lib/api/__tests__/safe-parse-json.test.ts`

- [ ] **Step 1: Add tests**

```ts
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { safeParseJson } from "../safe-parse-json";

function createRequest(body: BodyInit | null, headers: HeadersInit = {}) {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    body,
    headers,
  });
}

describe("safeParseJson", () => {
  it("keeps empty body mapped to INVALID_JSON_BODY by default", async () => {
    const result = await safeParseJson(createRequest(""));

    expect(result).toEqual({
      ok: false,
      errorCode: API_ERROR_CODES.INVALID_JSON_BODY,
      statusCode: 400,
    });
  });

  it("can map empty body to INVALID_REQUEST for CSP report compatibility", async () => {
    const result = await safeParseJson(createRequest(""), {
      emptyBodyErrorCode: API_ERROR_CODES.INVALID_REQUEST,
    });

    expect(result).toEqual({
      ok: false,
      errorCode: API_ERROR_CODES.INVALID_REQUEST,
      statusCode: 400,
    });
  });

  it("keeps malformed JSON mapped to INVALID_JSON_BODY even with empty body override", async () => {
    const result = await safeParseJson(createRequest("not-json"), {
      emptyBodyErrorCode: API_ERROR_CODES.INVALID_REQUEST,
    });

    expect(result).toEqual({
      ok: false,
      errorCode: API_ERROR_CODES.INVALID_JSON_BODY,
      statusCode: 400,
    });
  });

  it("returns PAYLOAD_TOO_LARGE when content-length exceeds maxBytes", async () => {
    const result = await safeParseJson(createRequest("{}", { "content-length": "10" }), {
      maxBytes: 5,
    });

    expect(result).toEqual({
      ok: false,
      errorCode: API_ERROR_CODES.PAYLOAD_TOO_LARGE,
      statusCode: 413,
    });
  });
});
```

- [ ] **Step 2: Verify red**

```bash
pnpm exec vitest run src/lib/api/__tests__/safe-parse-json.test.ts
```

Expected: FAIL because `emptyBodyErrorCode` is not supported yet.

## Task 2: Implement `emptyBodyErrorCode`

**Files:**
- Modify: `src/lib/api/safe-parse-json.ts`

- [ ] **Step 1: Widen failure type**

Change `SafeJsonParseFailure["errorCode"]` to allow `INVALID_REQUEST`:

```ts
errorCode:
  | typeof API_ERROR_CODES.INVALID_JSON_BODY
  | typeof API_ERROR_CODES.INVALID_REQUEST
  | typeof API_ERROR_CODES.PAYLOAD_TOO_LARGE;
```

- [ ] **Step 2: Add helper**

Add:

```ts
type EmptyBodyErrorCode =
  | typeof API_ERROR_CODES.INVALID_JSON_BODY
  | typeof API_ERROR_CODES.INVALID_REQUEST;

function createJsonFailure(errorCode: EmptyBodyErrorCode): SafeJsonParseFailure {
  return {
    ok: false,
    errorCode,
    statusCode: HTTP_BAD_REQUEST,
  };
}
```

- [ ] **Step 3: Add option and empty body branch**

Extend options:

```ts
options?: {
  route?: string;
  maxBytes?: number;
  emptyBodyErrorCode?: EmptyBodyErrorCode;
}
```

After reading `rawText`, before `JSON.parse`:

```ts
if (!rawText.trim()) {
  return createJsonFailure(
    options?.emptyBodyErrorCode ?? API_ERROR_CODES.INVALID_JSON_BODY,
  );
}
```

- [ ] **Step 4: Verify helper tests**

```bash
pnpm exec vitest run src/lib/api/__tests__/safe-parse-json.test.ts
```

Expected: PASS.

## Task 3: Refactor CSP route to use `safeParseJson`

**Files:**
- Modify: `src/app/api/csp-report/route.ts`

- [ ] **Step 1: Add import**

Add:

```ts
import { safeParseJson } from "@/lib/api/safe-parse-json";
```

- [ ] **Step 2: Remove local parser helpers**

Delete:

- `createPayloadTooLargeResponse`
- `parseContentLengthHeader`
- `readRequestTextWithLimit`
- route-local `JSON.parse` block

- [ ] **Step 3: Use `safeParseJson` in `parseAndValidateCSPReport`**

Replace the body read and JSON parse portion with:

```ts
const parsedBody = await safeParseJson<unknown>(request, {
  route: "/api/csp-report",
  maxBytes: MAX_CSP_REPORT_BODY_BYTES,
  emptyBodyErrorCode: API_ERROR_CODES.INVALID_REQUEST,
});

if (!parsedBody.ok) {
  return createApiErrorResponse(parsedBody.errorCode, parsedBody.statusCode);
}

const result = cspReportSchema.safeParse(parsedBody.data);
```

Keep the schema failure and empty `csp-report` object handling unchanged.

- [ ] **Step 4: Remove unused imports**

Remove `HTTP_PAYLOAD_TOO_LARGE` import from `src/app/api/csp-report/route.ts`.

## Task 4: Add architecture guard

**Files:**
- Modify: `tests/architecture/lib-facade-boundary.test.ts`

- [ ] **Step 1: Add source guard**

Add this test:

```ts
it("keeps csp-report on shared JSON body parsing", () => {
  const source = read("src/app/api/csp-report/route.ts");

  expect(source).toContain("@/lib/api/safe-parse-json");
  expect(source).toContain("safeParseJson<unknown>");
  expect(source).toContain("maxBytes: MAX_CSP_REPORT_BODY_BYTES");
  expect(source).not.toContain("readRequestTextWithLimit");
  expect(source).not.toContain("parseContentLengthHeader");
  expect(source).not.toContain("createPayloadTooLargeResponse");
  expect(source).not.toContain("JSON.parse");
});
```

## Task 5: Verification

**Files:**
- No extra files unless focused tests expose a small issue.

- [ ] **Step 1: Run focused tests**

```bash
pnpm exec vitest run \
  src/lib/api/__tests__/safe-parse-json.test.ts \
  src/app/api/csp-report/__tests__/route-post-core.test.ts \
  src/app/api/csp-report/__tests__/route-post-security.test.ts \
  src/app/api/csp-report/__tests__/route-post-advanced.test.ts \
  src/app/api/csp-report/__tests__/route.test.ts \
  src/app/api/csp-report/__tests__/route-get-options.test.ts \
  src/app/api/csp-report/__tests__/route-rate-limit.test.ts \
  tests/architecture/lib-facade-boundary.test.ts
```

Expected: all pass.

- [ ] **Step 2: Run type and lint**

```bash
pnpm type-check
pnpm lint:check
```

Expected: both pass.

- [ ] **Step 3: Run build and Cloudflare proof**

```bash
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: all pass. Do not run `pnpm build` and `pnpm website:build:cf` in parallel.

## Self-review

- Spec coverage: all acceptance criteria map to Tasks 1-5.
- Placeholder scan: no TBD/TODO/incomplete steps.
- Type consistency: `emptyBodyErrorCode` only accepts existing API error code constants that map to HTTP 400.
