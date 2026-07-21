> Historical.
>
> Planning artifact. It does not turn current CI, Daily, or deploy runs into proof for a future repair SHA.

# Repair Wave 3 Release Gate Credibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Cloudflare CI, source-policy checks, production deploy serialization, Daily E2E, and post-deploy smoke report the behavior they actually prove.

**Architecture:** The CI job separates a sourcemap-dependent analysis build from the canonical Cloudflare production artifact. Cloudflare policy checks parse tokens and configuration fields instead of comments. Production deploy runs serialize through post-deploy verification, Daily disables Playwright retries, and the Wave 1 concurrent route helper becomes the only mandatory deployed-smoke contract.

**Tech Stack:** GitHub Actions YAML, js-yaml, TypeScript compiler API, Node.js CommonJS, Vitest, Playwright, OpenNext Cloudflare, Wrangler.

---

## Task 1: FPH-007 specify canonical Cloudflare CI artifact behavior

**Files:**
- Modify: `tests/unit/workflows/ci-preview-env.test.ts`
- Modify: `.github/workflows/ci.yml`
- Verify: `next.config.ts`

- [ ] **Step 1: Add failing workflow assertions**

Extend `WorkflowStep` checks so:

```ts
expect(analysisStep?.name).toContain("分析构建");
expect(analysisStep?.env?.DEPLOYMENT_PLATFORM).toBeUndefined();

for (const step of [cloudflareBuildStep, wranglerDryRunStep]) {
  expect(step?.env).toMatchObject({
    DEPLOYMENT_PLATFORM: "cloudflare",
    NEXT_PUBLIC_DEPLOYMENT_PLATFORM: "cloudflare",
  });
}
```

Also assert the client-boundary step runs immediately after the analysis build and before the canonical Cloudflare build.

- [ ] **Step 2: Run and confirm canonical values are missing**

```bash
pnpm exec vitest run tests/unit/workflows/ci-preview-env.test.ts
```

Expected: FAIL on `DEPLOYMENT_PLATFORM` and the honest analysis-step name.

- [ ] **Step 3: Rename and wire the job**

Rename `构建检查` to:

```text
分析构建（保留 sourcemap，供 client-boundary 使用）
```

Keep it without the Cloudflare platform signal. Add both canonical values to `Cloudflare/OpenNext 构建` and `Cloudflare/Wrangler dry-run`:

```yaml
DEPLOYMENT_PLATFORM: cloudflare
NEXT_PUBLIC_DEPLOYMENT_PLATFORM: cloudflare
```

Do not reuse the analysis `.next` as the production artifact; `pnpm website:build:cf` rebuilds it under the canonical signal.

- [ ] **Step 4: Add artifact-config proof**

After the OpenNext build, add a CI step that parses the generated `.next` and `.open-next` required-server-files config files and fails unless:

```text
productionBrowserSourceMaps = false
images.unoptimized = true
```

Use a checked-in Node script only if the same parser is also unit-tested; otherwise keep the short parsing code inside a workflow contract helper already owned by `scripts/quality/`.

- [ ] **Step 5: Run the workflow contract test**

```bash
pnpm exec vitest run tests/unit/workflows/ci-preview-env.test.ts
```

Expected: PASS.

## Task 2: FPH-010 replace comments-sensitive Cloudflare source checks

**Files:**
- Modify: `scripts/quality/checks/cloudflare-official-compare.js`
- Create: `tests/unit/scripts/cloudflare-official-compare.test.ts`
- Verify: `open-next.config.ts`
- Verify: `wrangler.jsonc`
- Verify: `package.json`
- Verify: `.github/workflows/cloudflare-deploy.yml`

- [ ] **Step 1: Create a comments-only regression fixture in a temporary directory**

The test should create minimal copies where required text appears only in comments and then call an exported collector with an explicit root directory:

```ts
const failures = collectCloudflareOfficialCompareFailures(fixtureRoot);

expect(failures).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ file: "wrangler.jsonc" }),
    expect.objectContaining({ file: ".github/workflows/cloudflare-deploy.yml" }),
  ]),
);
```

Add a real-repository positive case.

- [ ] **Step 2: Confirm the fixture is falsely accepted by the current collector**

```bash
pnpm exec vitest run tests/unit/scripts/cloudflare-official-compare.test.ts
```

Expected: FAIL because raw `includes()` sees comment text as configuration.

- [ ] **Step 3: Parameterize the collector root**

Change:

```js
function collectCloudflareOfficialCompareFailures(rootDir = ROOT) {
```

and make `readCloudflareCompareFile(rootDir, relPath)` read below that root. Keep the CLI default behavior unchanged.

- [ ] **Step 4: Parse each active surface with installed tools**

Use:

```js
const ts = require("typescript");
const yaml = require("js-yaml");
```

- Parse `wrangler.jsonc` with `ts.parseConfigFileTextToJson` and inspect real fields such as `main`, `assets.binding`, `compatibility_flags`, bindings, migrations, and environment vars.
- Parse `.github/workflows/cloudflare-deploy.yml` with `yaml.load` and inspect `jobs.*.steps[].run` values.
- Continue parsing `package.json` with `JSON.parse` and compare the exact `website:build:cf` command.
- Tokenize `open-next.config.ts` with the TypeScript scanner and compare identifier/string tokens so comments cannot satisfy `defineCloudflareConfig` or forbidden topology names.

Do not add another parser dependency.

- [ ] **Step 5: Delete raw checks already covered by real behavior**

Remove snippet rules whose only purpose is already enforced by `pnpm website:build:cf` plus `wrangler deploy --dry-run`. Keep only architecture policy that behavior proof cannot express, and parse it semantically.

- [ ] **Step 6: Run and commit the gate repair**

```bash
pnpm exec vitest run tests/unit/scripts/cloudflare-official-compare.test.ts tests/unit/scripts/proof-lane-contract.test.ts
node scripts/starter-checks.js cf-official-compare --source-only
git add scripts/quality/checks/cloudflare-official-compare.js tests/unit/scripts/cloudflare-official-compare.test.ts
git commit -m "fix: parse executable cloudflare configuration"
```

## Task 3: FPH-011 serialize production deployment through verification

**Files:**
- Modify: `.github/workflows/cloudflare-deploy.yml`
- Modify: `tests/architecture/deploy-workflow-contract.test.ts`

- [ ] **Step 1: Replace source-string tests with parsed workflow shape**

Load the YAML with `js-yaml` and define only the fields used by the test:

```ts
interface DeployWorkflow {
  readonly concurrency?: {
    readonly group?: string;
    readonly "cancel-in-progress"?: boolean | string;
  };
  readonly jobs?: Record<string, {
    readonly needs?: string | readonly string[];
    readonly steps?: readonly { readonly name?: string; readonly run?: string }[];
  }>;
}
```

Assert production does not cancel while preview may cancel, and `post-deploy-verification` still needs `build-and-deploy`.

- [ ] **Step 2: Confirm the current workflow fails**

```bash
pnpm exec vitest run tests/architecture/deploy-workflow-contract.test.ts
```

Expected: FAIL because `cancel-in-progress` is always `true`.

- [ ] **Step 3: Make cancellation environment-aware**

Use:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ inputs.environment }}
  cancel-in-progress: ${{ inputs.environment != 'production' }}
```

Do not split deploy and verification into different concurrency groups.

- [ ] **Step 4: Run and commit**

```bash
pnpm exec vitest run tests/architecture/deploy-workflow-contract.test.ts
git add .github/workflows/cloudflare-deploy.yml tests/architecture/deploy-workflow-contract.test.ts
git commit -m "fix: serialize production deploy verification"
```

## Task 4: FPH-012 make Daily E2E fail on the first browser failure

**Files:**
- Modify: `.github/workflows/daily-e2e.yml`
- Modify: `tests/unit/workflows/daily-e2e.test.ts`
- Verify: `playwright.config.ts`

- [ ] **Step 1: Add the failing workflow assertion**

```ts
expect(testStep?.env).toMatchObject({
  CI_DAILY: "true",
  CI_FLAKE_SAMPLING: "1",
  PLAYWRIGHT_PROFILE_LANE: "all",
});
```

- [ ] **Step 2: Confirm the value is absent**

```bash
pnpm exec vitest run tests/unit/workflows/daily-e2e.test.ts
```

Expected: FAIL on `CI_FLAKE_SAMPLING`.

- [ ] **Step 3: Set the existing zero-retry switch**

Add to the `Run daily E2E` environment:

```yaml
CI_FLAKE_SAMPLING: "1"
```

Do not change ordinary PR retries in this finding.

- [ ] **Step 4: Prove Playwright resolves zero retries**

Add a focused config assertion or invoke the config loader with `CI=1 CI_FLAKE_SAMPLING=1`; expected `retries` is `0`.

- [ ] **Step 5: Run and commit**

```bash
pnpm exec vitest run tests/unit/workflows/daily-e2e.test.ts
git add .github/workflows/daily-e2e.yml tests/unit/workflows/daily-e2e.test.ts
git commit -m "fix: fail daily e2e on first browser failure"
```

## Task 5: FPH-013 make deployed smoke concurrent and cookie-aware

**Files:**
- Modify: `scripts/quality/checks/cloudflare-smoke.js`
- Modify: `tests/unit/scripts/cloudflare-smoke.test.ts`
- Modify: `tests/architecture/deploy-workflow-contract.test.ts`
- Verify: `scripts/quality/release-proof-manifest.js`
- Verify: `tests/unit/scripts/release-proof-manifest.test.ts`

- [ ] **Step 1: Add a failing mandatory-path concurrency test**

Hold `/` open in `runDeployedSmoke`, then assert `/products`, `/contact`, and `/api/health` were already requested before releasing `/`. Keep per-route retry behavior in the mock.

- [ ] **Step 2: Add a failing deployed cookie-leak test**

```ts
it("fails deployed smoke on x-middleware-set-cookie", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      response(200, "ok", { "x-middleware-set-cookie": "locale=en" }),
    ),
  );

  await expect(
    runDeployedSmoke(["--base-url", "https://deployed.example"]),
  ).resolves.toBe(false);
});
```

- [ ] **Step 3: Confirm both tests fail on the current implementation**

```bash
pnpm exec vitest run tests/unit/scripts/cloudflare-smoke.test.ts -t "deployed smoke"
```

Expected: the first route blocks later starts and the response object does not retain the middleware-cookie header.

- [ ] **Step 4: Reuse Wave 1's round helper**

Replace the deployed `for` loop with one concurrent round using `requestSmokeRound`. Keep retry state local to each route. Extend the returned response shape with:

```js
leakedMiddlewareCookie: response.headers.get("x-middleware-set-cookie"),
```

Evaluate the header for every route after the round.

- [ ] **Step 5: Lock the mandatory workflow path**

In the parsed deploy-workflow test, locate the `健康检查` step and assert its executable command is:

```text
node ./scripts/starter-checks.js deployed-smoke --base-url "${{ needs.build-and-deploy.outputs.deployment_url }}"
```

Also assert the job depends on `build-and-deploy` and is not marked `continue-on-error`.

- [ ] **Step 6: Keep proof-level wording honest**

The local `release:verify` manifest must remain local/test-mode and must not claim deployed proof. Its manual deployed-smoke entry may remain, while the actual production workflow is the mandatory deployed path.

- [ ] **Step 7: Run and commit**

```bash
pnpm exec vitest run tests/unit/scripts/cloudflare-smoke.test.ts tests/architecture/deploy-workflow-contract.test.ts tests/unit/scripts/release-proof-manifest.test.ts
git add scripts/quality/checks/cloudflare-smoke.js tests/unit/scripts/cloudflare-smoke.test.ts tests/architecture/deploy-workflow-contract.test.ts
git commit -m "fix: make deployed cloudflare smoke concurrent"
```

## Task 6: Wave 3 integrated verification

- [ ] Run focused workflow and script suites:

```bash
pnpm exec vitest run tests/unit/workflows/ci-preview-env.test.ts tests/unit/workflows/daily-e2e.test.ts tests/unit/scripts/cloudflare-official-compare.test.ts tests/unit/scripts/cloudflare-smoke.test.ts tests/architecture/deploy-workflow-contract.test.ts tests/unit/scripts/release-proof-manifest.test.ts
```

- [ ] Run source and local release gates:

```bash
node scripts/starter-checks.js cf-official-compare --source-only
pnpm release:verify
```

- [ ] Build serially under the canonical Cloudflare signal and inspect both generated configs.
- [ ] Run `pnpm website:build:cf`, then `pnpm exec wrangler deploy --dry-run --env preview`.
- [ ] Run `pnpm type-check`, `pnpm lint:check`, and `pnpm test`.
- [ ] Push the exact SHA and inspect the Cloudflare CI artifact values, not only the job status.
- [ ] For production cancellation, perform a second dispatch only during an owner-authorized production run; expected behavior is queued, not cancelled. Otherwise mark this runtime check `BLOCKED_EXTERNAL`.
- [ ] For Daily, inspect the next exact-SHA scheduled/manual run; a first-attempt failure must be red. Until that run exists, record `NOT_RUN`, not passing.
- [ ] Run `git diff --check`, use `superpowers:verification-before-completion`, mark `READY_FOR_ACCEPTANCE`, and stop.

## Self-Review

- Analysis and production artifact builds have distinct names and environment contracts.
- Comments cannot satisfy Cloudflare policy checks.
- Production cancellation, Daily retries, concurrent smoke, and cookie leakage each have a failing regression test.
- No local manifest step is misreported as deployed or real-service proof.
