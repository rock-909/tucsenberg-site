# AI Smell Remediation Stage 1 Implementation Plan

> Historical snapshot: this plan keeps the dependency versions that were true when it was written. For current versions, use `docs/technical/tech-stack.md` and `package.json`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every finding from `docs/audits/audit-report-20260503.md` while keeping the repository a reusable starter, not a Public Demo Starter Site.

**Architecture:** Treat this as proof/truth remediation, not runtime refactor. Use static contract tests for wording and documentation boundaries, one behavior test for content-readiness scan coverage, and small documentation edits for starter/client-launch truth.

**Tech Stack:** Next.js 16.2.4, React 19.2.5, TypeScript, Vitest, Playwright config, Node.js scripts, Markdown docs.

---

## File responsibility map

- `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`
  - Static proof-boundary contract tests for CI labels, docs, E2E wording, repo-profile paths, and closure coverage.
- `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/content-readiness-check.test.ts`
  - Behavior tests for buyer-visible content readiness scanning.
- `/Users/Data/workspace/showcase-website-starter/scripts/content-readiness-check.mjs`
  - Scanner implementation for starter/client-launch buyer-visible input surfaces.
- `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/validate-production-config.test.ts`
  - Behavior tests for strict client-launch content blocking.
- `/Users/Data/workspace/showcase-website-starter/scripts/validate-production-config.ts`
  - Runtime and launch-content validation script.
- `/Users/Data/workspace/showcase-website-starter/tests/e2e/contact-form-smoke.spec.ts`
  - Local Playwright smoke proof. It should not claim deployed or real submission proof.
- `/Users/Data/workspace/showcase-website-starter/playwright.config.ts`
  - Local Playwright webServer proof boundary and test-mode environment.
- `/Users/Data/workspace/showcase-website-starter/tests/integration/api/lead-family-contract.test.ts`
  - Auxiliary lead-family response and observability contract proof.
- `/Users/Data/workspace/showcase-website-starter/.github/workflows/ci.yml`
  - CI step labels. Labels must not overclaim proof strength.
- `/Users/Data/workspace/showcase-website-starter/docs/specs/behavioral-contracts.md`
  - Behavioral contract truth source.
- `/Users/Data/workspace/showcase-website-starter/docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md`
  - Owner/developer-facing proof-layer notes for lead-family review clusters.
- `/Users/Data/workspace/showcase-website-starter/docs/website/新项目替换清单.md`
  - Owner-facing replacement checklist.
- `/Users/Data/workspace/showcase-website-starter/docs/website/quality-proof.md`
  - Owner-facing proof boundary guide.
- `/Users/Data/workspace/showcase-website-starter/.codex/skills/ai-smell-audit/references/repo-profile.md`
  - Repo-specific audit path profile.
- `/Users/Data/workspace/showcase-website-starter/docs/audits/ai-smell-remediation-20260503.md`
  - Closure note for audit findings.

## Current dirty-worktree boundary

Do not revert or absorb unrelated existing changes. At plan time, these paths are already dirty or untracked and should be left alone unless a task explicitly touches them:

- `/Users/Data/workspace/showcase-website-starter/next-env.d.ts`
- `/Users/Data/workspace/showcase-website-starter/scripts/quality-gate.js`
- `/Users/Data/workspace/showcase-website-starter/scripts/run-all-guardrails-review.js`
- `/Users/Data/workspace/showcase-website-starter/scripts/run-scripts-env-review.js`
- `/Users/Data/workspace/showcase-website-starter/.codex/environments/`
- `docs/audits/audit-owner-summary-20260503.md`
- `docs/audits/audit-report-20260503.md`
- `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/guardrail-runner-deprecation.test.ts`

## Mandatory commit guard

Every task commit must use this guard because the worktree is already dirty.

Before `git add`, run:

```bash
git diff --cached --name-only
```

Expected: no output. If there is output, stop and inspect it before staging anything else.

After `git add`, run:

```bash
git diff --cached --name-only
```

Expected: exactly the files listed in that task's commit command. If any unrelated path appears, stop before committing.

---

### Task 1: Contact E2E and Playwright proof wording

**Closes:** `F-S28-001`, `F-S23-001`, `F-S27-001`

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/e2e/contact-form-smoke.spec.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/playwright.config.ts`

- [ ] **Step 1: Add failing contract test for local E2E wording**

Append this test inside `describe("proof lane contract", () => { ... })` in `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("does not overclaim local contact smoke as real submission proof", () => {
    const contactSmokeSpec = readRepoFile("tests/e2e/contact-form-smoke.spec.ts");
    const playwrightConfig = readRepoFile("playwright.config.ts");

    expect(contactSmokeSpec).not.toContain("应该能够成功提交表单");
    expect(contactSmokeSpec).toContain("完整填写后提交入口可见");
    expect(contactSmokeSpec).toContain("Local smoke");
    expect(contactSmokeSpec).toContain("does not submit to the deployed lead pipeline");

    expect(playwrightConfig).toContain("NEXT_PUBLIC_TEST_MODE");
    expect(playwrightConfig).toContain("Local E2E proof boundary");
    expect(playwrightConfig).toContain("not real Turnstile or deployed lead proof");
  });
```

- [ ] **Step 2: Run the contract test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: FAIL because `tests/e2e/contact-form-smoke.spec.ts` still contains `应该能够成功提交表单` and the new proof-boundary strings are not present yet.

- [ ] **Step 3: Reword contact smoke test titles and comments**

In `/Users/Data/workspace/showcase-website-starter/tests/e2e/contact-form-smoke.spec.ts`, replace:

```ts
  test.describe("9. 表单提交验证", () => {
    test("应该能够成功提交表单（英文）", async ({ page }) => {
```

with:

```ts
  test.describe("9. 本地表单填写 smoke 验证", () => {
    test("完整填写后提交入口可见（英文）", async ({ page }) => {
```

Replace:

```ts
      // 等待 Turnstile 加载
```

in the English test with:

```ts
      // Local smoke only: Playwright uses test-mode Turnstile and does not submit to the deployed lead pipeline.
```

Replace:

```ts
      // 填写完整表单
```

in the English test with:

```ts
      // 填写完整表单，验证本地 UI 可填写和提交入口可见。
```

Replace:

```ts
      // 检查提交按钮
```

in the English test with:

```ts
      // 检查提交入口。本地 smoke 不声明真实提交成功。
```

Replace:

```ts
    test("应该能够成功提交表单（中文）", async ({ page }) => {
```

with:

```ts
    test("完整填写后提交入口可见（中文）", async ({ page }) => {
```

Replace:

```ts
      // 等待 Turnstile 加载
```

in the Chinese test with:

```ts
      // Local smoke only: Playwright uses test-mode Turnstile and does not submit to the deployed lead pipeline.
```

Replace:

```ts
      // 填写完整表单
```

in the Chinese test with:

```ts
      // 填写完整表单，验证本地 UI 可填写和提交入口可见。
```

Replace:

```ts
      // 检查提交按钮
```

in the Chinese test with:

```ts
      // 检查提交入口。本地 smoke 不声明真实提交成功。
```

- [ ] **Step 4: Add Playwright config proof-boundary comment**

In `/Users/Data/workspace/showcase-website-starter/playwright.config.ts`, replace:

```ts
          // 将关键测试环境变量直接注入到 Next.js 进程
          // NODE_ENV 必须为 production 以确保 React 19 正常工作
```

with:

```ts
          // Local E2E proof boundary: this webServer uses test-mode services for stable smoke coverage.
          // It proves local rendering and interaction only, not real Turnstile or deployed lead proof.
          // NODE_ENV 必须为 production 以确保 React 19 正常工作
```

- [ ] **Step 5: Run the contract test and confirm GREEN**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git diff --cached --name-only
git add tests/unit/scripts/proof-lane-contract.test.ts tests/e2e/contact-form-smoke.spec.ts playwright.config.ts
git diff --cached --name-only
git commit -m "test: align contact smoke proof wording"
```

Expected: first `git diff --cached --name-only` has no output; second output contains only the three Task 1 files; commit succeeds without staging unrelated dirty files.

---

### Task 2: Lead-family auxiliary proof labeling

**Closes:** `F-S25-001`

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/integration/api/lead-family-contract.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/.github/workflows/ci.yml`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md`

- [ ] **Step 1: Add failing contract test for lead-family proof layering**

Append this test inside `describe("proof lane contract", () => { ... })` in `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("labels lead-family contract proof as auxiliary rather than full-chain proof", () => {
    const contractSpec = readRepoFile(
      "tests/integration/api/lead-family-contract.test.ts",
    );
    const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
    const structuralClusters = readRepoFile(
      "docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md",
    );
    const normalizedContractSpec = contractSpec.replace(/\s+/gu, " ");

    expect(contractSpec).toContain("Auxiliary response and observability checks only.");
    expect(normalizedContractSpec).toContain("not full lead-chain protection proof");
    expect(ciWorkflow).toContain("Lead API Family Layered Proof Review");
    expect(ciWorkflow).not.toContain("Lead API Family Contract Review");
    expect(structuralClusters).toContain("auxiliary contract proof");
    expect(structuralClusters).toContain("route-level protection proof");
  });
```

- [ ] **Step 2: Run the contract test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: FAIL because the current CI step still says `Lead API Family Contract Review` and the exact auxiliary wording is not present.

- [ ] **Step 3: Strengthen lead-family contract suite comment**

In `/Users/Data/workspace/showcase-website-starter/tests/integration/api/lead-family-contract.test.ts`, replace:

```ts
 * Auxiliary contract surface checks only.
 *
 * This suite intentionally mocks the core protection and submission pipeline so
 * it can verify response shape and observability headers. It is not the primary
 * proof for runtime protection semantics.
```

with:

```ts
 * Auxiliary response and observability checks only.
 *
 * This suite intentionally mocks the core protection and submission pipeline so
 * it can verify response shape and observability headers. It is not full
 * lead-chain protection proof; route/action protection suites and deployed
 * canaries own that proof boundary.
```

- [ ] **Step 4: Rename the CI proof step**

In `/Users/Data/workspace/showcase-website-starter/.github/workflows/ci.yml`, replace:

```yaml
      - name: Lead API Family Contract Review
```

with:

```yaml
      - name: Lead API Family Layered Proof Review
```

- [ ] **Step 5: Clarify structural cluster proof layers**

In `/Users/Data/workspace/showcase-website-starter/docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md`, replace:

```md
- 当前 live contract surface 就是这些文件本身 + `pnpm review:lead-family`
```

with:

```md
- 当前 lead-family proof 分两层看：`lead-family-contract.test.ts` 是 auxiliary contract proof，只看响应外壳和 observability；`lead-family-protection.test.ts`、route tests 和 subscribe tests 是 route-level protection proof。
- 当前 live contract surface 就是这些文件本身 + `pnpm review:lead-family`
```

- [ ] **Step 6: Run the contract test and lead-family suite**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
pnpm review:lead-family
```

Expected: both PASS.

- [ ] **Step 7: Commit Task 2**

Run:

```bash
git diff --cached --name-only
git add tests/unit/scripts/proof-lane-contract.test.ts tests/integration/api/lead-family-contract.test.ts .github/workflows/ci.yml docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md
git diff --cached --name-only
git commit -m "docs: clarify lead-family proof layers"
```

Expected: first `git diff --cached --name-only` has no output; second output contains only the four Task 2 files; commit succeeds without staging unrelated dirty files.

---

### Task 3: Behavioral contract BC-024 consistency lock

**Closes:** `F-S31-001`

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/specs/behavioral-contracts.md`

- [ ] **Step 1: Add BC-024 gap wording regression test**

Append this test inside `describe("proof lane contract", () => { ... })` in `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("keeps BC-024 idempotency gap analysis aligned with listed route coverage", () => {
    const behavioralContracts = readRepoFile(
      "docs/specs/behavioral-contracts.md",
    );

    expect(behavioralContracts).toContain(
      "Inquiry route replay is covered in `src/app/api/inquiry/__tests__/route.test.ts`",
    );
    expect(behavioralContracts).toContain(
      "subscribe replay/conflict semantics are covered in `tests/integration/api/subscribe.test.ts`",
    );
    expect(behavioralContracts).not.toContain(
      "Idempotency only tested for contact, not inquiry/subscribe",
    );
    expect(behavioralContracts).toContain(
      "family-wide end-to-end alignment across all lead surfaces",
    );
  });
```

- [ ] **Step 2: Run the contract test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: FAIL because the current docs still contain the old BC-024 gap wording.

- [ ] **Step 3: Fix BC-024 high-priority gap line**

In `/Users/Data/workspace/showcase-website-starter/docs/specs/behavioral-contracts.md`, replace:

```md
- **BC-024** (Partial): Idempotency only tested for contact, not inquiry/subscribe
```

with:

```md
- **BC-024** (Partial): Route-level idempotency is covered for contact, inquiry, and subscribe; remaining gap is family-wide end-to-end alignment across all lead surfaces
```

- [ ] **Step 4: Run the contract test and docs truth check**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
pnpm truth:check
```

Expected: both PASS.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git diff --cached --name-only
git add tests/unit/scripts/proof-lane-contract.test.ts docs/specs/behavioral-contracts.md
git diff --cached --name-only
git commit -m "docs: fix BC-024 idempotency gap wording"
```

Expected: first `git diff --cached --name-only` has no output; second output contains only the two Task 3 files; commit succeeds without staging unrelated dirty files.

---

### Task 4: Content readiness scans catalog truth surfaces

**Closes:** `F-S21-002`

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/content-readiness-check.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/scripts/content-readiness-check.mjs`

- [ ] **Step 1: Add failing content-readiness behavior test**

Append this test inside `describe("content-readiness-check", () => { ... })` in `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/content-readiness-check.test.ts`:

```ts
  it("scans catalog specs and product catalog config as buyer-visible truth", () => {
    const rootDir = createFixture({
      "src/constants/product-specs/north-america.ts": [
        "export const NORTH_AMERICA_SPECS = {",
        '  technical: { material: "Replaceable core material" },',
        '  certifications: ["Example Standard A"],',
        "};",
      ].join("\n"),
      "src/config/single-site-product-catalog.ts": [
        "export const singleSiteProductCatalog = {",
        '  markets: [{ label: "Primary Offer Example" }],',
        "};",
      ].join("\n"),
    });
    fixtureRoots.push(rootDir);

    const result = runContentReadinessCheck(rootDir);

    expect(result.status).toBe("passed");
    expectFinding(
      result.warnings,
      "replaceable-content",
      "src/constants/product-specs/north-america.ts",
    );
    expectFinding(
      result.warnings,
      "example-standard",
      "src/constants/product-specs/north-america.ts",
    );
    expectFinding(
      result.warnings,
      "example-offer",
      "src/config/single-site-product-catalog.ts",
    );
  });
```

- [ ] **Step 2: Run the content-readiness test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/content-readiness-check.test.ts
```

Expected: FAIL because `src/constants/product-specs/**`, `src/config/single-site.ts`, `src/config/single-site-seo.ts`, and `src/config/single-site-product-catalog.ts` are not currently scanned.

- [ ] **Step 3: Add catalog truth scan targets**

In `/Users/Data/workspace/showcase-website-starter/scripts/content-readiness-check.mjs`, after this target:

```js
  {
    root: "src/config/website",
    extensions: new Set([".js", ".json", ".mjs", ".ts", ".tsx"]),
    scanTextRules: true,
  },
```

add:

```js
  {
    root: "src/constants/product-specs",
    extensions: new Set([".js", ".json", ".mjs", ".ts", ".tsx"]),
    scanTextRules: true,
  },
  {
    root: "src/config",
    extensions: new Set([".ts"]),
    allowedPathPattern:
      /^src\/config\/(?:single-site|single-site-seo|single-site-product-catalog)\.ts$/u,
    scanTextRules: true,
  },
```

- [ ] **Step 4: Add explicit catalog placeholder rules**

In `/Users/Data/workspace/showcase-website-starter/scripts/content-readiness-check.mjs`, add these rules to `TEXT_RULES` after the existing `sample-product` rule:

```js
  {
    ruleId: "replaceable-content",
    severity: "warning",
    pattern: /\breplaceable\b|\breplace with real\b/giu,
    message:
      "Replaceable starter catalog content is still present. Replace it before client launch.",
  },
  {
    ruleId: "example-standard",
    severity: "warning",
    pattern: /\bExample Standard [A-Z]\b/gu,
    message:
      "Example standard marker is still present in catalog truth. Replace it before client launch.",
  },
  {
    ruleId: "example-offer",
    severity: "warning",
    pattern: /\b(?:Primary|Secondary|Regional|Platform|Specialty) Offer Example\b/gu,
    message:
      "Example offer marker is still present in catalog truth. Replace it before client launch.",
  },
```

- [ ] **Step 5: Run the content-readiness test and scanner**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/content-readiness-check.test.ts
pnpm website:content:readiness
```

Expected:

- Vitest PASS.
- `pnpm website:content:readiness` exits 0. It may print warnings for starter/demo catalog residue; warnings are acceptable in starter mode.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git diff --cached --name-only
git add tests/unit/scripts/content-readiness-check.test.ts scripts/content-readiness-check.mjs
git diff --cached --name-only
git commit -m "test: scan catalog truth in content readiness"
```

Expected: first `git diff --cached --name-only` has no output; second output contains only the two Task 4 files; commit succeeds without staging unrelated dirty files.

---

### Task 5: Client-launch trust gate and replacement docs

**Closes:** `F-S21-001`, `F-S32-001`

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/validate-production-config.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/scripts/validate-production-config.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/品牌设置.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/新项目替换清单.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/quality-proof.md`

- [ ] **Step 1: Add failing launch-gate tests for starter identity, SEO truth, and owner review signoff**

Append this test inside `describe("public launch trust content guard", () => { ... })` in `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/validate-production-config.test.ts`:

```ts
  it("blocks starter identity, SEO defaults, and missing legal/contact owner review in client launch strict mode", () => {
    const result = validateProductionConfig({
      APP_ENV: "preview",
      NODE_ENV: "production",
      PUBLIC_LAUNCH_STRICT: "true",
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("SITE_CONFIG.name"),
        expect.stringContaining("SITE_CONFIG.baseUrl"),
        expect.stringContaining("SITE_CONFIG.contact.email"),
        expect.stringContaining("SITE_CONFIG.seo.defaultTitle"),
        expect.stringContaining("SITE_CONFIG.seo.defaultDescription"),
        expect.stringContaining("SITE_CONFIG.social.twitter"),
        expect.stringContaining("SITE_CONFIG.social.linkedin"),
        expect.stringContaining("SITE_CONFIG.seo.titleTemplate"),
        expect.stringContaining("SITE_CONFIG.description"),
        expect.stringContaining("SITE_CONFIG.facts.company.name"),
        expect.stringContaining("SITE_CONFIG.facts.company.location"),
        expect.stringContaining("PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED"),
        expect.stringContaining("content/pages/{locale}/{about,contact,privacy,terms}.mdx"),
      ]),
    );
  });

  it("does not make legal/contact owner review a permanent client-launch failure", () => {
    const result = validateProductionConfig({
      APP_ENV: "preview",
      NODE_ENV: "production",
      PUBLIC_LAUNCH_STRICT: "true",
      PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED: "true",
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("SITE_CONFIG.name")]),
    );
    expect(result.errors).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED"),
      ]),
    );
  });
```

- [ ] **Step 2: Run launch-gate test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
```

Expected: FAIL because `validatePublicLaunchTrustContent` currently only checks phone, logo, and product photos, so the new starter identity / SEO blockers are absent.

- [ ] **Step 3: Implement public launch starter identity checks**

In `/Users/Data/workspace/showcase-website-starter/scripts/validate-production-config.ts`, update the single-site import from:

```ts
import { SINGLE_SITE_FACTS } from "../src/config/single-site";
```

to:

```ts
import {
  SINGLE_SITE_DEFINITION,
  SINGLE_SITE_FACTS,
} from "../src/config/single-site";
```

Add this helper after `isTrue`:

```ts
function containsStarterMarker(value: string | undefined): boolean {
  if (!value) return true;

  return /Example Showcase Company|example\.com|sales@example\.com|showcase website example|replaceable showcase website example|Example Business Park|Example City|x\.com/example|linkedin\.com/company/example/iu.test(
    value,
  );
}

function validateNoStarterMarker(
  target: string[],
  path: string,
  value: string | undefined,
  reason: string,
): void {
  if (containsStarterMarker(value)) {
    target.push(`${path} is not public-launch ready (${reason}).`);
  }
}

function validateLaunchSignoff(
  target: string[],
  env: EnvMap,
  key: string,
  surface: string,
  reason: string,
): void {
  if (!isTrue(env, key)) {
    target.push(`${key} must be true after owner review of ${surface} (${reason}).`);
  }
}
```

Then inside `validatePublicLaunchTrustContent`, after the `shouldCheck` early return and before the phone check, add:

```ts
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.name",
    SINGLE_SITE_DEFINITION.config.name,
    "replace the starter company identity before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.baseUrl",
    SINGLE_SITE_DEFINITION.config.baseUrl,
    "configure the real public domain before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.contact.email",
    SINGLE_SITE_DEFINITION.config.contact.email,
    "replace the starter contact email before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.seo.defaultTitle",
    SINGLE_SITE_DEFINITION.config.seo.defaultTitle,
    "replace starter SEO title defaults before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.seo.defaultDescription",
    SINGLE_SITE_DEFINITION.config.seo.defaultDescription,
    "replace starter SEO description defaults before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.social.twitter",
    SINGLE_SITE_DEFINITION.config.social.twitter,
    "replace the starter social profile before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.social.linkedin",
    SINGLE_SITE_DEFINITION.config.social.linkedin,
    "replace the starter social profile before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.seo.titleTemplate",
    SINGLE_SITE_DEFINITION.config.seo.titleTemplate,
    "replace the starter SEO title template before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.description",
    SINGLE_SITE_DEFINITION.config.description,
    "replace the starter company description before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.facts.company.name",
    SINGLE_SITE_FACTS.company.name,
    "replace the starter legal/company name before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.facts.company.location",
    `${SINGLE_SITE_FACTS.company.location.city} ${SINGLE_SITE_FACTS.company.location.address ?? ""}`,
    "replace starter city/address before client launch",
  );
  validateLaunchSignoff(
    target,
    env,
    "PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED",
    "content/pages/{locale}/{about,contact,privacy,terms}.mdx",
    "confirm legal/contact page truth before client launch",
  );
```

- [ ] **Step 4: Run launch-gate test and validate launch content**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
bash -lc 'set +e; output="$(pnpm validate:launch-content 2>&1)"; status=$?; set -e; printf "%s\n" "$output"; test "$status" -ne 0; printf "%s\n" "$output" | rg "SITE_CONFIG.name"; printf "%s\n" "$output" | rg "SITE_CONFIG.baseUrl"; printf "%s\n" "$output" | rg "SITE_CONFIG.contact.email"; printf "%s\n" "$output" | rg "SITE_CONFIG.seo.defaultTitle"; printf "%s\n" "$output" | rg "SITE_CONFIG.seo.defaultDescription"; printf "%s\n" "$output" | rg "SITE_CONFIG.social.twitter"; printf "%s\n" "$output" | rg "SITE_CONFIG.social.linkedin"; printf "%s\n" "$output" | rg "SITE_CONFIG.seo.titleTemplate"; printf "%s\n" "$output" | rg "SITE_CONFIG.description"; printf "%s\n" "$output" | rg "SITE_CONFIG.facts.company.name"; printf "%s\n" "$output" | rg "SITE_CONFIG.facts.company.location"; printf "%s\n" "$output" | rg "PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED"; printf "%s\n" "$output" | rg -F "content/pages/{locale}/{about,contact,privacy,terms}.mdx"'
```

Expected:

- Vitest PASS.
- The launch-content shell check exits 0 after proving `pnpm validate:launch-content` itself exits non-zero and its output includes the new starter identity, SEO, company-location, legal/contact owner-review, and existing phone/logo/photo blockers. A non-zero status alone is not enough evidence because older blockers already existed.

- [ ] **Step 5: Add failing contract test for website docs replacement surfaces**

Append this test inside `describe("proof lane contract", () => { ... })` in `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("documents all client-launch catalog, identity, SEO, and legal replacement surfaces", () => {
    const brandSettings = readRepoFile("docs/website/品牌设置.md");
    const replacementChecklist = readRepoFile("docs/website/新项目替换清单.md");
    const qualityProof = readRepoFile("docs/website/quality-proof.md");

    for (const expectedSurface of [
      "src/config/single-site.ts",
      "src/config/website/profile.ts",
      "src/config/website/seo.ts",
      "src/config/single-site-seo.ts",
      "src/config/website/products.ts",
      "src/config/single-site-product-catalog.ts",
      "src/constants/product-specs/**",
      "messages/{locale}/critical.json",
      "messages/{locale}/deferred.json",
      "public/images/products/**",
      "content/pages/{locale}/about.mdx",
      "content/pages/{locale}/contact.mdx",
      "content/pages/{locale}/privacy.mdx",
      "content/pages/{locale}/terms.mdx",
    ]) {
      expect(replacementChecklist).toContain(expectedSurface);
    }

    expect(brandSettings).toContain("src/config/single-site.ts");
    expect(brandSettings).toContain("src/config/website/profile.ts");
    expect(brandSettings).toContain("src/config/website/seo.ts");
    expect(brandSettings).toContain("镜像层");
    expect(brandSettings).not.toContain("品牌信息集中在 `src/config/website/`");

    expect(replacementChecklist).toContain("client launch");
    expect(replacementChecklist).toContain("starter 示例");
    expect(replacementChecklist).toContain("SEO");
    expect(replacementChecklist).toContain("法务");
    expect(qualityProof).toContain("src/config/single-site.ts");
    expect(qualityProof).toContain("src/config/website/profile.ts");
    expect(qualityProof).toContain("src/config/website/seo.ts");
    expect(qualityProof).toContain("src/config/single-site-seo.ts");
    expect(qualityProof).toContain("src/config/single-site-product-catalog.ts");
    expect(qualityProof).toContain("product specs");
    expect(qualityProof).toContain("catalog truth");
    expect(qualityProof).toContain("crawl / indexing truth");
    expect(qualityProof).toContain("canonical authoring source");
    expect(qualityProof).toContain("starter 示例可以存在于 starter 仓库");
    expect(qualityProof).toContain("pnpm validate:launch-content");
  });
```

- [ ] **Step 6: Run the contract test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: FAIL because the checklist does not yet mention all expected identity, SEO, legal, and catalog surfaces.

- [ ] **Step 7: Expand brand, SEO, legal, and product replacement checklist**

In `/Users/Data/workspace/showcase-website-starter/docs/website/新项目替换清单.md`, add these bullets to section `## 1. 品牌身份` after `- 默认品牌色`:

```md
- `src/config/single-site.ts` 里的公司身份、社交链接、SEO titleTemplate 和 description
- `src/config/website/seo.ts` 里的默认标题、描述、站点 URL 和 SEO 默认值
- `src/config/single-site-seo.ts` 里的 sitemap、robots、crawl / indexing truth
- `content/pages/{locale}/about.mdx` 里的公司介绍、证明、团队和信任资产
- `content/pages/{locale}/contact.mdx` 里的联系承诺、响应时间和表单说明
- `content/pages/{locale}/privacy.mdx` 和 `content/pages/{locale}/terms.mdx` 里的法务主体、联系方式和适用条款
```

在 `docs/website/品牌设置.md` 里，把品牌信息的 canonical authoring source 改成 `src/config/single-site.ts`；如果项目还保留 `src/config/website/profile.ts` / `src/config/website/seo.ts`，它们只是兼容镜像层，必须与 `src/config/single-site.ts` 同步，不能当主来源。

In the same file, replace section `## 2. 产品或服务信息` through its bullet list:

```md
## 2. 产品或服务信息

修改 `src/config/website/products.ts`：

- 产品或服务分类
- 核心卖点
- 应用场景
- 规格表字段
- 示例图片
```

with:

```md
## 2. 产品或服务信息

不要只改 `src/config/website/products.ts`。它只控制 starter 的产品/服务入口卡片。派生项目进入 client launch 前，要把整组 catalog truth 都替换掉：

- `src/config/website/products.ts`：产品或服务入口分类、核心卖点、应用场景和入口图片。
- `src/config/single-site-product-catalog.ts`：市场、系列、slug、分类关系和列表页说明。
- `src/constants/product-specs/**`：材料、规格、认证、MOQ、交期、供货能力、包装和市场级产品数据。
- `messages/{locale}/critical.json`：首屏、导航、产品列表和关键买家可见 UI 文案。
- `messages/{locale}/deferred.json`：延迟加载区块、表单辅助文案和次级产品说明。
- `public/images/products/**`：产品/服务图片、示例 SVG 和买家会看到的图像资产。

starter 示例可以保留在 starter 仓库里；client launch 不能把 starter 示例当成真实产品事实。
```

- [ ] **Step 8: Clarify quality-proof launch checks and content readiness surfaces**

In `/Users/Data/workspace/showcase-website-starter/docs/website/quality-proof.md`, replace the scan surface list:

```md
- `content/pages/**`
- `messages/{locale}/{critical,deferred}.json`
- `public/images/**/*.svg`
- `src/config/website/**`
- 明确会进入页面或结构化数据的 runtime config
```

with:

```md
- `content/pages/**`
- `messages/{locale}/{critical,deferred}.json`
- `public/images/**/*.svg`
- `src/config/website/**`
- `src/config/single-site.ts`
- `src/config/single-site-seo.ts`
- `src/config/single-site-product-catalog.ts`
- `src/constants/product-specs/**`
- 明确会进入页面或结构化数据的 runtime config
```

After this paragraph:

```md
Starter 现在提供 `pnpm website:content:readiness` 做第一轮自动检查。它只扫上面这些买家可见输入面，并故意排除 docs、tests、reports、generated output，以及 `messages/en.json` / `messages/zh.json` 这类 flat 兼容副本。
```

add:

```md
client launch 前还要跑 `pnpm validate:launch-content`。这个 strict gate 会把 starter 公司身份、示例域名、示例邮箱、SEO 默认值、待确认 logo/product photos、`PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED`，以及 About / Contact / Privacy / Terms 这类 owner-reviewed 内容作为上线阻断项。
```

单站公司身份的 canonical authoring source 是 `src/config/single-site.ts`。`src/config/website/profile.ts` / `src/config/website/seo.ts` 只是兼容镜像层，必须与 `src/config/single-site.ts` 同步，不能当主来源。

After the paragraph ending with:

```md
这个命令能证明明显的 starter / fake / placeholder 残留有没有被扫出来；它不能证明内容法律上正确、文案足够有说服力，或已经得到 owner 确认。
```

add:

```md
对产品/服务页来说，catalog truth 是一整组输入面，不只是 `src/config/website/products.ts`。如果派生项目准备 client launch，产品分类、市场结构、product specs、messages 文案和产品图片都要一起替换。starter 示例可以存在于 starter 仓库；公开客户站不能把这些示例当成真实销售事实。

crawl / indexing truth 也要单独看：`src/config/single-site-seo.ts` 控制 sitemap、robots、公共静态页面索引策略和 lastmod 来源。派生项目如果改了页面结构、产品市场或公开索引策略，不能只改 `src/config/website/seo.ts`。
```

- [ ] **Step 9: Run docs contract test and launch gate**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
bash -lc 'set +e; output="$(pnpm validate:launch-content 2>&1)"; status=$?; set -e; printf "%s\n" "$output"; test "$status" -ne 0; printf "%s\n" "$output" | rg "SITE_CONFIG.name"; printf "%s\n" "$output" | rg "SITE_CONFIG.baseUrl"; printf "%s\n" "$output" | rg "SITE_CONFIG.contact.email"; printf "%s\n" "$output" | rg "SITE_CONFIG.seo.defaultTitle"; printf "%s\n" "$output" | rg "SITE_CONFIG.seo.defaultDescription"; printf "%s\n" "$output" | rg "SITE_CONFIG.facts.company.name"; printf "%s\n" "$output" | rg "SITE_CONFIG.facts.company.location"; printf "%s\n" "$output" | rg "PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED"; printf "%s\n" "$output" | rg -F "content/pages/{locale}/{about,contact,privacy,terms}.mdx"'
```

Expected:

- Both Vitest commands PASS.
- The launch-content shell check exits 0 after proving `pnpm validate:launch-content` exits non-zero and reports the new starter/client-launch blockers. This is expected for Stage 1 because the starter is not a client launch.

- [ ] **Step 10: Commit Task 5**

Run:

```bash
git diff --cached --name-only
git add tests/unit/scripts/validate-production-config.test.ts scripts/validate-production-config.ts tests/unit/scripts/proof-lane-contract.test.ts docs/website/品牌设置.md docs/website/新项目替换清单.md docs/website/quality-proof.md
git diff --cached --name-only
git commit -m "docs: expand starter launch truth surfaces"
```

Expected: first `git diff --cached --name-only` has no output; second output contains only the six Task 5 files; commit succeeds without staging unrelated dirty files.

---

### Task 6: Audit repo-profile current path update

**Closes:** `F-S30-001`

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/.codex/skills/ai-smell-audit/references/repo-profile.md`

- [ ] **Step 1: Add failing contract test for repo-profile current paths**

Append this test inside `describe("proof lane contract", () => { ... })` in `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("keeps ai-smell repo profile pointed at current critical surfaces", () => {
    const repoProfile = readRepoFile(
      ".codex/skills/ai-smell-audit/references/repo-profile.md",
    );

    expect(repoProfile).toContain("src/app/actions.ts");
    expect(repoProfile).toContain("src/app/api/inquiry/route.ts");
    expect(repoProfile).toContain("src/app/api/subscribe/route.ts");
    expect(repoProfile).toContain("src/app/api/verify-turnstile/route.ts");
    expect(repoProfile).toContain("src/lib/turnstile.ts");
    expect(repoProfile).toContain("src/lib/lead-pipeline/**");
    expect(repoProfile).toContain("src/config/single-site-product-catalog.ts");
    expect(repoProfile).toContain("src/constants/product-specs/**");
    expect(repoProfile).toContain("tests/e2e/contact-form-smoke.spec.ts");
    expect(repoProfile).toContain("tests/e2e/smoke/post-deploy-form.spec.ts");
    expect(repoProfile).toContain("playwright.config.ts");
    expect(repoProfile).toContain("docs/website/quality-proof.md");
    expect(repoProfile).not.toContain("src/app/api/contact/**");
    expect(repoProfile).not.toContain("src/components/products/product-inquiry-form");
    expect(repoProfile).not.toContain("src/lib/idempotency/**");
  });
```

- [ ] **Step 2: Run the contract test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: FAIL because the repo profile still references stale paths.

- [ ] **Step 3: Update critical surfaces in repo-profile**

In `/Users/Data/workspace/showcase-website-starter/.codex/skills/ai-smell-audit/references/repo-profile.md`, replace the first critical surface block:

```md
1. **Lead / inquiry / contact path**
   - `src/app/[locale]/contact/**`
   - `src/app/api/contact/**`
   - `src/app/api/verify-turnstile/**`
   - `src/components/forms/**`
   - `src/components/products/product-inquiry-form*`
```

with:

```md
1. **Lead / inquiry / contact path**
   - `src/app/[locale]/contact/**`
   - `src/app/actions.ts`
   - `src/app/api/inquiry/route.ts`
   - `src/app/api/subscribe/route.ts`
   - `src/components/forms/**`
   - `src/lib/lead-pipeline/**`
```

Replace:

```md
2. **Idempotency / anti-abuse / trust boundary**
   - `src/lib/idempotency/**`
   - `src/lib/security/**`
   - `src/lib/turnstile.ts`
   - `src/lib/lead-pipeline/**`
```

with:

```md
2. **Idempotency / anti-abuse / trust boundary**
   - `src/lib/idempotency.ts`
   - `src/lib/security/**`
   - `src/lib/turnstile.ts`
   - `src/lib/api/lead-route-response.ts`
   - `tests/integration/api/lead-family-protection.test.ts`
   - `tests/integration/api/lead-family-contract.test.ts`
```

After the Cloudflare proof boundary block, add this new critical surface:

```md
5. **E2E / deployed proof boundary**
   - `tests/e2e/contact-form-smoke.spec.ts`
   - `tests/e2e/smoke/post-deploy-form.spec.ts`
   - `playwright.config.ts`
   - `docs/website/quality-proof.md`

6. **Starter / catalog launch truth**
   - `docs/website/新项目替换清单.md`
   - `docs/website/quality-proof.md`
   - `src/config/website/**`
   - `src/config/single-site.ts`
   - `src/config/single-site-product-catalog.ts`
   - `src/constants/product-specs/**`
   - `scripts/content-readiness-check.mjs`
```

- [ ] **Step 4: Run the contract test**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 6**

Run:

```bash
git diff --cached --name-only
git add tests/unit/scripts/proof-lane-contract.test.ts .codex/skills/ai-smell-audit/references/repo-profile.md
git diff --cached --name-only
git commit -m "docs: refresh ai-smell repo profile"
```

Expected: first `git diff --cached --name-only` has no output; second output contains only the two Task 6 files; commit succeeds without staging unrelated dirty files.

---

### Task 7: Audit remediation closure note

**Closes:** all findings by traceability: `F-S21-001`, `F-S21-002`, `F-S28-001`, `F-S23-001`, `F-S25-001`, `F-S27-001`, `F-S31-001`, `F-S32-001`, `F-S30-001`

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`
- Create directory if missing: `/Users/Data/workspace/showcase-website-starter/docs/audits/`
- Create: `/Users/Data/workspace/showcase-website-starter/docs/audits/ai-smell-remediation-20260503.md`

- [ ] **Step 1: Add failing closure coverage test**

Append this test inside `describe("proof lane contract", () => { ... })` in `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("records closure for every 2026-05-03 ai-smell finding", () => {
    const closure = readRepoFile("docs/audits/ai-smell-remediation-20260503.md");

    for (const findingId of [
      "F-S21-001",
      "F-S21-002",
      "F-S28-001",
      "F-S23-001",
      "F-S25-001",
      "F-S27-001",
      "F-S31-001",
      "F-S32-001",
      "F-S30-001",
    ]) {
      expect(closure).toContain(findingId);
    }

    expect(closure).toContain("Public Demo Starter Site is out of scope");
    expect(closure).toContain("Fresh verification");
    expect(closure).toContain("| Finding | Changed files | Closure method | Verification | Remaining boundary |");
    expect(closure).toContain("pnpm validate:launch-content");
    expect(closure).toContain("scripts/validate-production-config.ts");
    expect(closure).toContain("tests/e2e/contact-form-smoke.spec.ts");
    expect(closure).toContain("playwright.config.ts");
  });
```

- [ ] **Step 2: Run the contract test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: FAIL because the closure note does not exist yet.

- [ ] **Step 3: Create the audit docs directory if missing**

Run:

```bash
mkdir -p docs/audits
```

Expected: directory exists. This is a reversible normal directory creation, not deletion.

- [ ] **Step 4: Create the closure note**

Create `/Users/Data/workspace/showcase-website-starter/docs/audits/ai-smell-remediation-20260503.md` with this content:

```md
# AI Smell Remediation Closure — 2026-05-03

This note closes the findings recorded in `docs/audits/audit-report-20260503.md`.

Stage 1 keeps the repository as a reusable showcase website starter. Public Demo Starter Site is out of scope for this closure and needs a separate design.

## Closure map

| Finding | Changed files | Closure method | Verification | Remaining boundary |
| --- | --- | --- | --- | --- |
| `F-S21-001` | `scripts/validate-production-config.ts`, `tests/unit/scripts/validate-production-config.test.ts`, `docs/website/新项目替换清单.md`, `docs/website/quality-proof.md` | Starter identity stays valid for this reusable starter, but `PUBLIC_LAUNCH_STRICT=true` now blocks starter company identity, example domain/email, SEO defaults, pending trust assets, and missing legal/contact owner-review signoff before client launch. The legal/contact check can pass once `PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED=true`, so it is not a permanent failure. | `pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts`; shell check around `pnpm validate:launch-content` that requires output for `SITE_CONFIG.name`, `SITE_CONFIG.baseUrl`, `SITE_CONFIG.contact.email`, SEO defaults, company truth, `PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED`, and `content/pages/{locale}/{about,contact,privacy,terms}.mdx` | Does not replace starter content with a real client or public demo identity. |
| `F-S21-002` | `scripts/content-readiness-check.mjs`, `tests/unit/scripts/content-readiness-check.test.ts`, `docs/website/新项目替换清单.md`, `docs/website/quality-proof.md` | Product specs, catalog config, messages, and product images are treated as one buyer-visible catalog truth group. Content readiness now scans catalog specs and catalog config markers. | `pnpm exec vitest run tests/unit/scripts/content-readiness-check.test.ts`; `pnpm website:content:readiness` | Warnings can remain in starter mode; client launch must replace the truth group. |
| `F-S28-001` | `tests/e2e/contact-form-smoke.spec.ts`, `tests/unit/scripts/proof-lane-contract.test.ts` | Contact local smoke wording now says it verifies filled form and visible submit entry, not successful deployed submission. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts` | Does not prove deployed lead submission. |
| `F-S23-001` | `playwright.config.ts`, `tests/unit/scripts/proof-lane-contract.test.ts` | Playwright config now states local E2E uses test-mode services and does not prove real Turnstile. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts` | Does not prove real Turnstile or external services. |
| `F-S25-001` | `tests/integration/api/lead-family-contract.test.ts`, `.github/workflows/ci.yml`, `docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md`, `tests/unit/scripts/proof-lane-contract.test.ts` | Lead-family contract proof is labeled as auxiliary response/observability proof; route/action protection suites and deployed canaries own protection proof. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts`; `pnpm review:lead-family` | Does not replace route-level protection tests or deployed canary. |
| `F-S27-001` | `playwright.config.ts`, `tests/e2e/contact-form-smoke.spec.ts`, `tests/unit/scripts/proof-lane-contract.test.ts` | Local relaxed/test environment boundary is documented next to webServer env and local contact smoke wording. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts` | Does not certify production security mode. |
| `F-S31-001` | `tests/unit/scripts/proof-lane-contract.test.ts`; pre-existing corrected truth in `docs/specs/behavioral-contracts.md` | BC-024 gap analysis already matches listed contact, inquiry, and subscribe idempotency coverage; Stage 1 adds a regression contract to keep it from drifting back. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts`; `pnpm truth:check` | Does not add a new family-wide E2E replay proof. |
| `F-S32-001` | `docs/website/新项目替换清单.md`, `docs/website/quality-proof.md`, `tests/unit/scripts/proof-lane-contract.test.ts` | Replacement docs now include identity, SEO, crawl/indexing truth, legal/contact pages, product config, catalog structure, specs, messages, and product images. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts` | Does not perform the larger Public Demo Starter Site rewrite. |
| `F-S30-001` | `.codex/skills/ai-smell-audit/references/repo-profile.md`, `tests/unit/scripts/proof-lane-contract.test.ts` | The ai-smell repo profile now points to current lead, catalog, E2E, deployed proof, and launch-truth surfaces. | `pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts` | Future topology changes still need profile refresh. |

## Fresh verification

Before claiming this remediation complete, run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/content-readiness-check.test.ts
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
pnpm review:lead-family
pnpm truth:check
pnpm website:content:readiness
bash -lc 'set +e; output="$(pnpm validate:launch-content 2>&1)"; status=$?; set -e; printf "%s\n" "$output"; test "$status" -ne 0; printf "%s\n" "$output" | rg "SITE_CONFIG.name"; printf "%s\n" "$output" | rg "SITE_CONFIG.baseUrl"; printf "%s\n" "$output" | rg "SITE_CONFIG.contact.email"; printf "%s\n" "$output" | rg "SITE_CONFIG.seo.defaultTitle"; printf "%s\n" "$output" | rg "SITE_CONFIG.seo.defaultDescription"; printf "%s\n" "$output" | rg "SITE_CONFIG.facts.company.name"; printf "%s\n" "$output" | rg "SITE_CONFIG.facts.company.location"; printf "%s\n" "$output" | rg "PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED"; printf "%s\n" "$output" | rg -F "content/pages/{locale}/{about,contact,privacy,terms}.mdx"'
pnpm type-check
pnpm lint:check
```

The launch-content shell check is expected to pass while proving `pnpm validate:launch-content` itself exits non-zero in this starter repository and emits the new identity/SEO/legal-contact blockers, plus the existing phone/logo/photo blockers. Record those blockers as evidence that client-launch starter truth is blocked, not as a Stage 1 failure.

## Remaining boundary

This closure does not prove a deployed lead canary, real Turnstile, real Airtable/Resend, or a public demo starter identity. Those need deployed credentials, a deployed URL, and a separate Public Demo Starter Site design if that direction is chosen.
```

- [ ] **Step 5: Run closure contract test**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 7**

Run:

```bash
git diff --cached --name-only
git add tests/unit/scripts/proof-lane-contract.test.ts docs/audits/ai-smell-remediation-20260503.md
git diff --cached --name-only
git commit -m "docs: record ai-smell remediation closure"
```

Expected: first `git diff --cached --name-only` has no output; second output contains only the two Task 7 files; commit succeeds without staging unrelated dirty files.

---

### Task 8: Final verification

**Closes:** completion proof for Stage 1

**Files:**
- No planned edits.

- [ ] **Step 1: Run targeted contract and content readiness tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/content-readiness-check.test.ts
```

Expected: PASS.

- [ ] **Step 1b: Run launch-gate unit test**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lead-family proof lane**

Run:

```bash
pnpm review:lead-family
```

Expected: PASS.

- [ ] **Step 3: Run truth and content readiness checks**

Run:

```bash
pnpm truth:check
pnpm website:content:readiness
```

Expected:

- `pnpm truth:check`: PASS.
- `pnpm website:content:readiness`: exits 0. Warnings for starter/demo residue are acceptable in starter mode.

- [ ] **Step 3b: Run strict client-launch content gate**

Run:

```bash
pnpm validate:launch-content
```

Expected: exits non-zero in this starter repository and reports starter/client-launch blockers from `scripts/validate-production-config.ts`. This raw command is recorded for human-readable output only; the next step performs the actual machine-checked proof that the new blockers are present.

- [ ] **Step 3c: Machine-check strict launch blocker output**

Run:

```bash
bash -lc 'set +e; output="$(pnpm validate:launch-content 2>&1)"; status=$?; set -e; printf "%s\n" "$output"; test "$status" -ne 0; printf "%s\n" "$output" | rg "SITE_CONFIG.name"; printf "%s\n" "$output" | rg "SITE_CONFIG.baseUrl"; printf "%s\n" "$output" | rg "SITE_CONFIG.contact.email"; printf "%s\n" "$output" | rg "SITE_CONFIG.seo.defaultTitle"; printf "%s\n" "$output" | rg "SITE_CONFIG.seo.defaultDescription"; printf "%s\n" "$output" | rg "SITE_CONFIG.facts.company.name"; printf "%s\n" "$output" | rg "SITE_CONFIG.facts.company.location"; printf "%s\n" "$output" | rg "PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED"; printf "%s\n" "$output" | rg -F "content/pages/{locale}/{about,contact,privacy,terms}.mdx"'
```

Expected: exits 0 after proving the strict launch command failed for the new identity, SEO, company truth, and legal/contact owner-review blockers. This is the real closure proof; the raw non-zero command alone is not sufficient.

- [ ] **Step 4: Run type and lint gates**

Run:

```bash
pnpm type-check
pnpm lint:check
```

Expected: both PASS.

- [ ] **Step 5: Confirm no unrelated files were staged**

Run:

```bash
git status --short
```

Expected:

- Stage 1 committed files are clean after their task commits.
- Pre-existing unrelated dirty files may still appear.
- No staged files remain.

- [ ] **Step 6: Final delivery note**

Report:

- commits created for Stage 1
- findings closed
- exact verification commands and results
- remaining boundaries: deployed canary, real external services, and Public Demo Starter Site are not part of Stage 1
