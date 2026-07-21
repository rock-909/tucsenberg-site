> Historical.
>
> Planning artifact. No runtime, provider, production, or owner proof has been completed by this file.

# Repair Wave 1 Runtime Lead Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the three P1 paths that can wedge the Cloudflare Worker, report a nonexistent inquiry delivery, or admit unsafe production switches.

**Architecture:** FPH-001 uses one shared concurrent route probe and a single-variable `cacheComponents` experiment; the configuration change is kept only if the repeated Workerd proof passes. FPH-004 validates provider receipts at the Resend and Airtable adapter boundaries. FPH-005 extends the existing production runtime contract and adds runtime self-defense so unsafe public values cannot silently override production behavior.

**Tech Stack:** Next.js 16 Cache Components, OpenNext Cloudflare, Workerd/Wrangler, Node.js, TypeScript, Vitest, React Testing Library, GitHub Actions.

---

## Task 1: FPH-001 specify one reusable concurrent route probe

**Files:**
- Modify: `scripts/quality/checks/cloudflare-smoke.js`
- Modify: `tests/unit/scripts/cloudflare-smoke.test.ts`
- Read first: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`
- Read first: `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`

- [ ] **Step 1: Add the failing concurrency test**

Add a test that holds the first response open and proves the remaining routes are started before it settles:

```ts
it("starts every route in a smoke round before the first response settles", async () => {
  let releaseRoot!: () => void;
  const started: string[] = [];

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const pathname = getRequestPath(input);
      started.push(pathname);

      if (pathname === "/") {
        return new Promise<Response>((resolve) => {
          releaseRoot = () => resolve(response(200, "root"));
        });
      }

      return createPreviewFetchMock()(input);
    }),
  );

  const proof = runCloudflarePreviewSmoke([
    "--base-url",
    "https://preview.example",
    "--include-api-health",
    "--rounds",
    "1",
  ]);

  await vi.waitFor(() => {
    expect(started).toEqual(
      expect.arrayContaining(["/products", "/contact", "/api/health"]),
    );
  });

  releaseRoot();
  await expect(proof).resolves.toBe(true);
});
```

- [ ] **Step 2: Run the test and confirm the current sequential boundary fails**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/cloudflare-smoke.test.ts -t "starts every route in a smoke round"
```

Expected: FAIL because `--rounds` is unknown or because the requested reusable round behavior does not exist.

- [ ] **Step 3: Add the minimum shared round implementation**

Extend the existing argument parser with a positive integer `rounds`, default `1`, and add one helper used by the local Cloudflare preview smoke:

```js
async function requestSmokeRound(expectations, request) {
  return Promise.all(
    expectations.map(({ pathname }) => request(pathname)),
  );
}
```

For strict local Workerd proof, build one expectation list containing the current page routes plus `/api/health`, run it `rounds` times, and evaluate each response with the existing status, body, and `x-middleware-set-cookie` checks. Do not add a second script or dependency.

- [ ] **Step 4: Add round-count validation tests**

Cover `--rounds 0`, non-integer input, and two successful rounds. Expected invalid input error:

```text
--rounds must be a positive integer
```

- [ ] **Step 5: Run the focused file**

```bash
pnpm exec vitest run tests/unit/scripts/cloudflare-smoke.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the probe separately**

```bash
git add scripts/quality/checks/cloudflare-smoke.js tests/unit/scripts/cloudflare-smoke.test.ts
git commit -m "test: add repeatable cloudflare concurrency proof"
```

## Task 2: FPH-001 run the single-variable Cache Components experiment

**Files:**
- Modify conditionally: `next.config.ts`
- Verify: `scripts/quality/checks/cloudflare-smoke.js`
- Verify: `tests/unit/scripts/cloudflare-smoke.test.ts`

- [ ] **Step 1: Capture the failing baseline on the unchanged branch**

Build and run the same candidate through local Workerd, then execute at least three rounds:

```bash
pnpm website:build:cf
pnpm exec wrangler dev --env preview
node scripts/starter-checks.js cf-preview-smoke --base-url http://127.0.0.1:8787 --include-api-health --rounds 3
```

Expected baseline: reproduce at least one timeout, 500, or hung-request cancellation. Save the exact command output outside tracked source. If the failure no longer reproduces, stop and diagnose drift before changing config.

- [ ] **Step 2: Change only `cacheComponents`**

Replace:

```ts
cacheComponents: true,
```

with:

```ts
cacheComponents: false,
```

Update the adjacent comment to state that current production code has no required `"use cache"` boundary and the flag is disabled because the bound OpenNext/Workerd path failed concurrent requests. Do not change Next.js, OpenNext, Wrangler, or Workerd versions in this experiment.

- [ ] **Step 3: Run the Next.js and OpenNext chain serially**

```bash
pnpm type-check
pnpm test
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: all exit 0; no missing Cache Components API or route-build regression appears.

- [ ] **Step 4: Run repeated sequential and concurrent Workerd proof**

Start the built candidate and run:

```bash
node scripts/starter-checks.js cf-preview-smoke --base-url http://127.0.0.1:8787 --include-api-health --rounds 5
```

Then run eight one-at-a-time route requests and another five concurrent rounds against the same process. Expected: 0 unexpected status, 0 timeout, 0 cancellation, and `/api/health` remains 200 after load.

- [ ] **Step 5: Decide by evidence**

If the candidate passes, keep the one-line config change. If it fails, restore `cacheComponents: true` with `apply_patch`, retain the probe commit, mark FPH-001 blocked on a separate version-combination design, and do not mix dependency upgrades into this Wave.

- [ ] **Step 6: Commit only a passing candidate**

```bash
git add next.config.ts
git commit -m "fix: disable cache components on cloudflare runtime"
```

## Task 3: FPH-004 reject invalid Resend receipt IDs

**Files:**
- Modify: `src/lib/email/resend-http-client.ts`
- Modify: `src/lib/email/__tests__/resend-http-client.test.ts`

- [ ] **Step 1: Add failing table-driven tests**

```ts
it.each([undefined, null, "", "   "])(
  "fails closed for invalid message id %j",
  async (id) => {
    const fetchFn: typeof fetch = async () => createJsonResponse({ id });
    const client = new ResendHttpEmailClient("test-api-key", fetchFn);

    await expect(client.send(SAMPLE_PAYLOAD)).resolves.toEqual({
      data: null,
      error: { message: "Resend success response is missing a message id" },
    });
  },
);
```

- [ ] **Step 2: Confirm whitespace currently passes**

```bash
pnpm exec vitest run src/lib/email/__tests__/resend-http-client.test.ts -t "invalid message id"
```

Expected: the whitespace case fails because it is returned as success.

- [ ] **Step 3: Normalize once at the HTTP adapter boundary**

Replace `getSuccessData` with:

```ts
function getSuccessData(payload: unknown): { id: string } | null {
  if (!isJsonObject(payload) || typeof payload.id !== "string") return null;

  const id = payload.id.trim();
  return id.length > 0 ? { id } : null;
}
```

Keep the existing error envelope. Do not re-check Resend IDs in `processValidatedInquiry()`.

- [ ] **Step 4: Run and commit**

```bash
pnpm exec vitest run src/lib/email/__tests__/resend-http-client.test.ts
git add src/lib/email/resend-http-client.ts src/lib/email/__tests__/resend-http-client.test.ts
git commit -m "fix: reject invalid resend receipt ids"
```

## Task 4: FPH-004 reject invalid Airtable record IDs

**Files:**
- Modify: `src/lib/airtable/service-internal/lead-records.ts`
- Modify: `src/lib/airtable/service-internal/lead-records.test.ts`
- Verify: `src/lib/lead-pipeline/__tests__/process-lead.test.ts`

- [ ] **Step 1: Add failing receipt tests**

```ts
it.each([undefined, null, "", "   "])(
  "rejects an Airtable create result with invalid id %j",
  async (id) => {
    const mockCreate = vi.fn().mockResolvedValue({ id });
    const base = createMockBase(mockCreate);

    await expect(
      createLeadRecord({
        base: base as never,
        tableName: "Leads",
        data: validProductLeadData,
      }),
    ).rejects.toThrow("Failed to create lead record");
  },
);
```

- [ ] **Step 2: Confirm the current adapter accepts a blank ID**

```bash
pnpm exec vitest run src/lib/airtable/service-internal/lead-records.test.ts -t "invalid id"
```

Expected: FAIL for blank or whitespace ID.

- [ ] **Step 3: Validate before success logging**

After selecting `createdRecord`, add:

```ts
const recordId =
  typeof createdRecord.id === "string" ? createdRecord.id.trim() : "";

if (recordId.length === 0) {
  throw new Error("Airtable success response is missing a record id");
}
```

Use `recordId` in the success log and returned object. Do not add Airtable-specific checks in the pipeline.

- [ ] **Step 4: Prove pipeline failure semantics remain correct**

```bash
pnpm exec vitest run src/lib/airtable/service-internal/lead-records.test.ts src/lib/lead-pipeline/__tests__/process-lead.test.ts
```

Expected: adapter invalid-ID tests pass; pipeline still succeeds with one valid channel and fails when both channels reject.

- [ ] **Step 5: Commit**

```bash
git add src/lib/airtable/service-internal/lead-records.ts src/lib/airtable/service-internal/lead-records.test.ts
git commit -m "fix: reject invalid airtable receipt ids"
```

## Task 5: FPH-005 reject unsafe production switches in the central contract

**Files:**
- Modify: `scripts/quality/checks/production-config.js`
- Modify: `tests/unit/scripts/validate-production-config.test.ts`
- Modify: `.github/workflows/cloudflare-deploy.yml`

- [ ] **Step 1: Add failing contract cases**

Add a table to `validate-production-config.test.ts`:

```ts
it.each([
  ["NEXT_PUBLIC_TEST_MODE", "true"],
  ["SECURITY_HEADERS_ENABLED", "false"],
  ["NEXT_PUBLIC_SECURITY_MODE", "relaxed"],
] as const)("rejects production %s=%s", (key, value) => {
  const result = validateProductionRuntimeContract({
    ...createValidProductionEnv(),
    [key]: value,
  });

  expect(result.errors).toEqual([
    expect.stringContaining(`${key}=${value}`),
  ]);
});
```

Add one combination case and keep the valid fixture green.

- [ ] **Step 2: Run and confirm all three unsafe cases currently pass**

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts -t "rejects production"
```

Expected: FAIL because `errors` is empty.

- [ ] **Step 3: Add three direct checks to `validateProductionRuntimeContract`**

Use existing `isTrue` and `readEnv` helpers:

```js
if (isTrue(env, "NEXT_PUBLIC_TEST_MODE")) {
  errors.push("NEXT_PUBLIC_TEST_MODE=true is forbidden in production.");
}

if (readEnv(env, "SECURITY_HEADERS_ENABLED")?.toLowerCase() === "false") {
  errors.push("SECURITY_HEADERS_ENABLED=false is forbidden in production.");
}

if (readEnv(env, "NEXT_PUBLIC_SECURITY_MODE")?.toLowerCase() === "relaxed") {
  errors.push("NEXT_PUBLIC_SECURITY_MODE=relaxed is forbidden in production.");
}
```

- [ ] **Step 4: Export the effective production public vars into the workflow gate**

Extend the `requiredKeys` array in `.github/workflows/cloudflare-deploy.yml` with:

```js
"NEXT_PUBLIC_TEST_MODE",
"SECURITY_HEADERS_ENABLED",
"NEXT_PUBLIC_SECURITY_MODE",
```

The production `wrangler.jsonc` values must be explicit safe values (`false`, `true`, `strict`) so the strict contract validates the same values the build receives.

- [ ] **Step 5: Add a parsed workflow contract assertion**

In the existing production-config test suite, parse `wrangler.jsonc` and `.github/workflows/cloudflare-deploy.yml`; assert the three names are exported before `validate-production-config` and passed to the production build environment. Do not assert only that the strings exist somewhere in comments.

- [ ] **Step 6: Run focused tests**

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
```

Expected: all cases pass.

## Task 6: FPH-005 add production runtime self-defense

**Files:**
- Modify: `src/config/security.ts`
- Modify: `src/config/__tests__/security.test.ts`
- Modify: `src/components/security/turnstile.tsx`
- Modify: `src/components/security/__tests__/turnstile.test.tsx`

- [ ] **Step 1: Add failing production security-header tests**

```ts
it("keeps enforced security headers in production despite unsafe env values", () => {
  vi.stubEnv("APP_ENV", "production");
  vi.stubEnv("SECURITY_HEADERS_ENABLED", "false");
  vi.stubEnv("NEXT_PUBLIC_SECURITY_MODE", "relaxed");

  const headerKeys = getSecurityHeaders().map((header) => header.key);

  expect(headerKeys).toContain("Content-Security-Policy");
  expect(headerKeys).not.toContain("Content-Security-Policy-Report-Only");
});
```

- [ ] **Step 2: Implement production-safe decisions in `security.ts`**

```ts
function isSecurityHeadersEnabled(): boolean {
  return (
    isRuntimeProduction() ||
    getRuntimeEnvBoolean("SECURITY_HEADERS_ENABLED") !== false
  );
}

function isCspReportOnly(): boolean {
  if (isRuntimeProduction()) return false;

  return getRuntimeEnvString("NEXT_PUBLIC_SECURITY_MODE") === "relaxed";
}
```

Keep preview diagnosis behavior unchanged.

- [ ] **Step 3: Add a failing Turnstile production test**

Set `APP_ENV=production`, `NEXT_PUBLIC_TEST_MODE=true`, and a real site key. Assert the real widget path renders and `TURNSTILE_TEST_MODE_TOKEN` is never emitted.

- [ ] **Step 4: Gate test mode with public runtime production state**

Import `isPublicRuntimeProduction` and set:

```ts
const isTestMode =
  !isPublicRuntimeProduction() &&
  getPublicRuntimeEnvBoolean("NEXT_PUBLIC_TEST_MODE") === true;
```

- [ ] **Step 5: Run focused UI and config proof**

```bash
pnpm exec vitest run src/config/__tests__/security.test.ts src/components/security/__tests__/turnstile.test.tsx
pnpm type-check
```

Expected: production ignores unsafe public overrides; non-production test mode still works.

- [ ] **Step 6: Commit the production contract atomically**

```bash
git add scripts/quality/checks/production-config.js tests/unit/scripts/validate-production-config.test.ts .github/workflows/cloudflare-deploy.yml src/config/security.ts src/config/__tests__/security.test.ts src/components/security/turnstile.tsx src/components/security/__tests__/turnstile.test.tsx
git commit -m "fix: fail closed on unsafe production switches"
```

## Task 7: Wave 1 verification and proof boundary

- [ ] Run focused suites:

```bash
pnpm exec vitest run tests/unit/scripts/cloudflare-smoke.test.ts src/lib/email/__tests__/resend-http-client.test.ts src/lib/airtable/service-internal/lead-records.test.ts src/lib/lead-pipeline/__tests__/process-lead.test.ts tests/unit/scripts/validate-production-config.test.ts src/config/__tests__/security.test.ts src/components/security/__tests__/turnstile.test.tsx
```

- [ ] Run broader gates serially:

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

- [ ] Run five strict local Workerd rounds against the exact candidate SHA.
- [ ] If Cloudflare credentials exist, deploy an exact-SHA preview and run the same five rounds. Otherwise record `BLOCKED_EXTERNAL: Cloudflare deploy credentials`.
- [ ] If Resend/Airtable/Turnstile credentials exist, run one real inquiry canary and match both provider IDs. Otherwise record each provider separately as `BLOCKED_EXTERNAL`.
- [ ] Run `git diff --check`, inspect `git diff --stat`, and confirm no audit-report file changed.
- [ ] Use `superpowers:verification-before-completion`, push, wait for exact-SHA CI, mark `READY_FOR_ACCEPTANCE`, and stop.

## Self-Review

- FPH-001 has a reproducible baseline, a one-variable decision, and no bundled dependency upgrade.
- FPH-004 validates IDs at both provider boundaries and keeps partial success.
- FPH-005 has both deployment-contract rejection and runtime self-defense.
- Real provider and deployed proof remain distinct from local passing tests.
