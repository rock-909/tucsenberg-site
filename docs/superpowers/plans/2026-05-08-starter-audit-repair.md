# Starter Audit Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the confirmed audit findings without touching the deferred `src/middleware.ts` -> `src/proxy.ts` migration.

**Architecture:** This plan fixes small, evidence-backed gaps first: proof wording, CI Cloudflare dry-run, Knip noise, i18n fallback strings, ops access hardening, Cloudflare env contract, route-mode evidence, lead delivery semantics, warning baselines, and starter positioning docs. Keep starter example content valid for the starter repo while making public-launch proof impossible to overclaim.

**Tech Stack:** Next.js 16.2.6 App Router + Cache Components, React 19.2.6, TypeScript 6.0.3, pnpm 10.13.1, Vitest, Playwright, Storybook 10.3.6, OpenNext Cloudflare 1.19.8, Wrangler 4.90.0.

---

## Scope and hard boundaries

### Explicitly deferred

- Do **not** migrate `src/middleware.ts` to `src/proxy.ts` in this plan.
- Do **not** rename the current branch.
- Do **not** permanently delete files. If a file must be removed, use a recoverable Trash move or ask first. For git-tracked source cleanup, prefer code edits that remove exports/imports and only delete files when the executor has explicit approval for that exact file.
- Do **not** run `pnpm build` and `pnpm website:build:cf` in parallel; both write `.next`.
- Do **not** turn the starter into a minimal blank shell in implementation tasks. Product/demo/ops slimming is a decision document first.

### Confirmed current facts from audit reproduction

- `origin/main` and local HEAD are `12deafd8929096a6d31392b7f7eab315bef9a35b`.
- `PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config` fails with 18 expected public-launch blockers.
- `node scripts/starter-checks.js content-readiness` passes with 237 warnings.
- `pnpm exec knip` fails with 1 unused file, 53 unused exports, 89 unused exported types, 14 duplicate exports, 7 unused devDependencies, and 3 config hints.
- `pnpm exec semgrep --config semgrep.yml src` is blocked because `semgrep` is not installed.
- `pnpm build`, `pnpm website:build:cf`, `pnpm exec wrangler deploy --dry-run --env preview`, and `pnpm component:check` pass with warnings.
- `DYNAMIC_SERVER_USAGE` appears during build and is not yet attributed to a route contract.
- Storybook has known Vite warnings and a large `iframe` chunk.
- Lead pipeline intentionally returns user success when Airtable record creation succeeds but owner email fails.

---

## File structure map

### Proof and CI

- Modify: `.github/workflows/ci.yml`
  - Add Wrangler dry-run after `pnpm website:build:cf` in the Cloudflare build job.
- Modify: `scripts/starter-checks.js`
  - Clarify `release-verify` final output.
- Modify: `tests/unit/scripts/proof-lane-contract.test.ts`
  - Assert local release proof wording cannot be confused with public-launch proof.
  - Assert CI Cloudflare job contains Wrangler dry-run.
- Modify: `docs/guides/RELEASE-PROOF-RUNBOOK.md`
  - Keep runbook consistent with changed wording.
- Modify: `docs/website/quality-proof.md`
  - Clarify public launch strict status and proof layer language.

### Knip cleanup

- Modify: `knip.jsonc`
  - Remove stale ignore binaries: `open`, `du`, `openssl`.
  - Add intentional tool dependency allowlist only after each is checked.
- Modify: `src/lib/content-query/stats.ts`
  - No production caller was found. Execution must stop for explicit approval before moving this tracked file to Trash and staging its deletion.
- Modify duplicate export files:
  - `src/components/footer/Footer.tsx`
  - `src/components/ui/social-icons.tsx`
  - `src/constants/core.ts`
  - `src/constants/time.ts`
  - `src/constants/validation-limits.ts`
  - `src/emails/ConfirmationEmail.tsx`
  - `src/emails/ContactFormEmail.tsx`
  - `src/emails/EmailField.tsx`
  - `src/emails/EmailLayout.tsx`
  - `src/emails/ProductInquiryEmail.tsx`
  - `src/test/constants/mock-messages.ts`
- Modify related barrel/import files that currently import default exports:
  - `src/constants/index.ts`
  - email service/test imports under `src/lib/resend-core.tsx`, `src/emails/__tests__/**`
  - component imports under `src/components/**`

### i18n fallback and Turnstile contract

- Modify: `messages/en/critical.json`
- Modify: `messages/zh/critical.json`
  - Add concrete keys for degraded Turnstile labels.
- Modify: `messages/en/deferred.json`
- Modify: `messages/zh/deferred.json`
  - Add concrete keys for localized form network fallback strings.
- Modify: `src/components/security/turnstile.tsx`
  - Accept localized labels as props and keep English fallback only as internal default if props are omitted.
- Modify: `src/components/forms/lazy-turnstile.tsx`
  - Accept/pass localized fallback label and lazy-load error label.
- Modify: contact form container/component files that instantiate `LazyTurnstile`
  - Pass translated labels from existing `useTranslations`.
- Modify: `src/components/forms/use-contact-form.ts`
  - Replace raw English catch error with an error code or translated fallback key contract.
- Modify: `src/components/forms/contact-form-feedback.tsx`
  - Do not render raw unknown English error text directly on localized pages.
- Modify: `src/app/[locale]/layout.tsx`
  - Use existing `accessibility.skipToContent` translation instead of hardcoded zh/en text.
- Modify: `playwright.config.ts`
  - Change `NEXT_PUBLIC_TURNSTILE_ACTION` from `contact-form` to `contact_form`.
- Test:
  - `src/components/forms/__tests__/use-contact-form.test.tsx`
  - Add/modify Turnstile/lazy Turnstile tests under `src/components/forms/__tests__/**` or `src/components/security/**`.
  - `src/app/[locale]/__tests__/layout.test.tsx`

### Ops access hardening

- Modify: `src/lib/security/distributed-rate-limit.ts`
  - Add `opsAccess` preset with fail-closed behavior.
- Modify: `src/app/ops/traffic/access/route.ts`
  - Wrap POST with rate limiting.
  - Use `constantTimeCompare` from `src/lib/security-crypto.ts`.
- Modify: `src/app/ops/traffic/access/__tests__/route.test.ts`
  - Add tests for throttled invalid attempts and constant-time compare usage.
  - Construct `NextRequest` in tests; do not change `src/lib/api/with-rate-limit.ts` in this task.

### Cloudflare env contract

- Modify: `next.config.ts`
  - Treat `DEPLOYMENT_PLATFORM=cloudflare` as Cloudflare, while keeping `DEPLOY_TARGET=cloudflare` as compatibility fallback.
- Modify: `tests/unit/scripts/proof-lane-contract.test.ts`
  - Assert `next.config.ts` recognizes `DEPLOYMENT_PLATFORM`.
- Modify docs:
  - `docs/technical/deployment-notes.md`
  - `docs/website/部署设置.md`
  - `docs/website/quality-proof.md`

### Route-mode and warning baselines

- Create: `docs/quality/route-mode-contract.md`
  - Human-readable route-mode contract.
- Create: `scripts/quality/route-mode-snapshot.mjs`
  - Parse current `.next` build artifacts or route summary inputs into `reports/quality/route-mode-snapshot.json`.
- Create: `tests/unit/scripts/route-mode-snapshot.test.ts`
  - Test parser behavior with fixture route-summary text.
- Create: `docs/quality/cloudflare-warning-baseline.md`
  - Known OpenNext/Wrangler generated-bundle warnings and owner notes.
- Create: `docs/quality/storybook-warning-baseline.md`
  - Known Storybook/Vite warnings and chunk warning policy.
- Modify: `docs/website/quality-proof.md`
  - Reference these baselines as warning baseline, not production-failure proof.

### Lead delivery semantics

- Modify: `src/lib/lead-pipeline/process-lead.ts`
  - Add explicit field name `ownerNotified` or document/alias existing `emailSent` as owner notification.
- Modify: API route response handling if business chooses exposing metadata internally.
  - Public browser response should still avoid exposing unnecessary operational detail unless explicitly needed.
- Modify tests:
  - `src/lib/lead-pipeline/__tests__/process-lead.test.ts`
  - `src/app/api/inquiry/__tests__/route.test.ts`
  - `src/app/__tests__/actions.test.ts`
  - `src/components/forms/use-contact-form.ts` tests if client state changes.
- Modify docs:
  - `docs/website/quality-proof.md`
  - Add deployed canary acceptance: Airtable record + owner email delivery must both be checked before public launch.

### Semgrep

- Modify `.github/workflows/ci.yml`
  - Add a Semgrep CE job using the official `semgrep/semgrep` container and `semgrep scan --config semgrep.yml src`.
- Modify docs:
  - `docs/website/quality-proof.md`
  - `docs/guides/QUALITY-PROOF-LEVELS.md`
  - Mark Semgrep unavailable locally unless the tool is installed.
- Avoid adding npm `semgrep` package. `pnpm view semgrep version` returns `0.0.1`, not the real scanner.

### Starter positioning / core slimming

- Create: `docs/website/starter-positioning-decision.md`
  - Decide between high-config showcase starter and minimal core + presets.
- Modify: `docs/website/README.md`
  - Link this decision doc.
- Modify: `docs/website/新项目替换清单.md`
  - Keep replacement scope explicit.
- Do not implement product/ops/storybook/test deletion in this plan. This task creates the decision artifact and follow-up backlog only.

---

## Task 1: Tighten release proof wording and CI Cloudflare dry-run

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `scripts/starter-checks.js`
- Modify: `tests/unit/scripts/proof-lane-contract.test.ts`
- Modify: `docs/guides/RELEASE-PROOF-RUNBOOK.md`
- Modify: `docs/website/quality-proof.md`

- [ ] **Step 1: Add failing test for local-vs-launch proof wording**

Add this test inside `describe("proof lane contract", ...)` in `tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("makes release verify wording impossible to confuse with public launch proof", () => {
    const releaseProofScript = readRepoFile("scripts/starter-checks.js");
    const qualityProof = readRepoFile("docs/website/quality-proof.md");
    const releaseRunbook = readRepoFile("docs/guides/RELEASE-PROOF-RUNBOOK.md");

    expect(releaseProofScript).toContain("Local release proof completed");
    expect(releaseProofScript).toContain("NOT public launch proof");
    expect(releaseProofScript).not.toContain(
      "Release verification completed successfully.",
    );

    for (const content of [qualityProof, releaseRunbook]) {
      expect(content).toContain("Local release proof is not public launch proof");
      expect(content).toContain(
        "PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config",
      );
      expect(content).toContain("deployed lead canary");
    }
  });
```

- [ ] **Step 2: Add failing test for Wrangler dry-run in PR CI**

Add this test in `tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("runs Wrangler dry-run in the PR Cloudflare build job", () => {
    const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
    const buildIndex = ciWorkflow.indexOf("pnpm website:build:cf");
    const dryRunIndex = ciWorkflow.indexOf(
      "pnpm exec wrangler deploy --dry-run --env preview",
    );

    expect(buildIndex).toBeGreaterThan(-1);
    expect(dryRunIndex).toBeGreaterThan(-1);
    expect(buildIndex).toBeLessThan(dryRunIndex);
  });
```

- [ ] **Step 3: Run the focused proof tests and verify they fail**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected now: FAIL on the two newly added tests because the wording and CI job are not updated yet.

- [ ] **Step 4: Update release verify wording**

In `scripts/starter-checks.js`, replace:

```js
  console.log("Release verification completed successfully.");
```

with:

```js
  console.log(
    "Local release proof completed. This is NOT public launch proof.",
  );
  console.log(
    "Public launch still requires strict config, deployed smoke, real lead canary, and owner signoff.",
  );
```

- [ ] **Step 5: Add Wrangler dry-run to CI**

In `.github/workflows/ci.yml`, after the `Cloudflare/OpenNext 构建` step, add:

```yaml
      - name: Cloudflare/Wrangler dry-run
        run: pnpm exec wrangler deploy --dry-run --env preview
        env:
          NODE_ENV: production
          APP_ENV: preview
          NEXT_PUBLIC_SITE_URL: https://showcase-website-starter.test
```

- [ ] **Step 6: Update proof docs**

In `docs/guides/RELEASE-PROOF-RUNBOOK.md` and `docs/website/quality-proof.md`, add this exact sentence near the release proof explanation:

```markdown
Local release proof is not public launch proof. Public launch still requires `PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config`, deployed smoke against the real URL, deployed lead canary, and owner signoff.
```

Ensure the docs keep the phrase `deployed lead canary`.

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/current-truth-docs.test.ts
```

Expected: PASS.

- [ ] **Step 8: Run CI-equivalent Cloudflare proof locally**

Run sequentially:

```bash
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: all exit 0. Warnings can remain but must be listed in final notes.

- [ ] **Step 9: Commit**

```bash
git add .github/workflows/ci.yml scripts/starter-checks.js tests/unit/scripts/proof-lane-contract.test.ts docs/guides/RELEASE-PROOF-RUNBOOK.md docs/website/quality-proof.md
git commit -m "chore: clarify release proof boundary"
```

---

## Task 2: Repair Semgrep proof lane without adding fake npm semgrep

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/website/quality-proof.md`
- Modify: `docs/guides/QUALITY-PROOF-LEVELS.md`
- Modify: `tests/unit/scripts/proof-lane-contract.test.ts`

- [ ] **Step 1: Add failing test that Semgrep is not represented by the fake npm package**

Add this test to `tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("keeps Semgrep proof in CI without adding the fake npm semgrep package", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
    const qualityProof = readRepoFile("docs/website/quality-proof.md");

    expect(packageJson.dependencies?.semgrep).toBeUndefined();
    expect(packageJson.devDependencies?.semgrep).toBeUndefined();
    expect(ciWorkflow).toContain("container: semgrep/semgrep");
    expect(ciWorkflow).toContain("semgrep scan --config semgrep.yml src");
    expect(ciWorkflow).toContain("semgrep.yml");
    expect(qualityProof).toContain("Semgrep local CLI may be unavailable");
  });
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: FAIL because CI/docs do not yet contain Semgrep lane wording.

- [ ] **Step 3: Add a Semgrep CI job**

In `.github/workflows/ci.yml`, add a job after `tests` and before `cloudflare-build`:

```yaml
  semgrep:
    name: Semgrep 安全扫描
    runs-on: ubuntu-latest
    needs: quality
    timeout-minutes: 10
    container: semgrep/semgrep:latest

    steps:
      - name: 检出代码
        uses: actions/checkout@v6
        with:
          submodules: false
          persist-credentials: false

      - name: 运行 Semgrep
        run: semgrep scan --config semgrep.yml src
```

Then update `ci-summary.needs` from:

```yaml
    needs: [quality, tests, e2e, cloudflare-build]
```

to:

```yaml
    needs: [quality, tests, e2e, semgrep, cloudflare-build]
```

- [ ] **Step 4: Document local Semgrep boundary**

In `docs/website/quality-proof.md`, add:

```markdown
### Semgrep proof boundary

Semgrep local CLI may be unavailable on a developer machine. When local `pnpm exec semgrep --config semgrep.yml src` returns `Command "semgrep" not found`, record the lane as blocked locally, not passed. CI owns the canonical Semgrep scan through `semgrep scan --config semgrep.yml src` in the official `semgrep/semgrep` container.
```

In `docs/guides/QUALITY-PROOF-LEVELS.md`, add:

```markdown
- Semgrep security scan: CI runs `semgrep scan --config semgrep.yml src` in the official `semgrep/semgrep` container. A missing local `semgrep` binary is `Blocked`, not `Passed`.
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ci.yml docs/website/quality-proof.md docs/guides/QUALITY-PROOF-LEVELS.md tests/unit/scripts/proof-lane-contract.test.ts
git commit -m "ci: add semgrep proof lane"
```

---

## Task 3: First Knip cleanup wave

**Files:**
- Modify: `knip.jsonc`
- Modify/delete with approval: `src/lib/content-query/stats.ts`
- Modify duplicate-export files listed in the file map.
- Modify imports that currently use removed default exports.

- [ ] **Step 1: Capture current Knip output**

Run:

```bash
pnpm exec knip
```

Expected: FAIL with known categories. Save the output in the task notes, not in repo unless asked.

- [ ] **Step 2: Remove stale `ignoreBinaries`**

In `knip.jsonc`, remove:

```jsonc
  // 系统自带的命令无需额外二进制依赖，忽略告警。
  "ignoreBinaries": ["open", "du", "openssl"],
```

Expected later: the three configuration hints disappear.

- [ ] **Step 3: Check whether `src/lib/content-query/stats.ts` has any real caller**

Run:

```bash
rg -n "getContentStats|getContentTypeStats|content-query/stats|ContentStats" src tests scripts
```

Expected: no production caller for `src/lib/content-query/stats.ts`. If a caller exists, stop and reassess.

- [ ] **Step 4: Remove the unused stats file only with explicit file-level approval**

Stop here and ask the user for explicit approval to remove this exact file:

```text
src/lib/content-query/stats.ts
```

Reason: it has no production caller, but the workspace rule says deletion is not allowed by default.

If approval is granted, stage deletion:

```bash
mkdir -p .context/trash/2026-05-08-knip
mv src/lib/content-query/stats.ts .context/trash/2026-05-08-knip/stats.ts
git add -A src/lib/content-query/stats.ts .context/trash/2026-05-08-knip/stats.ts
```

Expected: git sees `src/lib/content-query/stats.ts` as deleted and the recoverable copy stays under gitignored `.context/trash/2026-05-08-knip/stats.ts`.

If approval is not granted, leave the file in place and add this explicit ignore instead:

```jsonc
  "ignore": [
    "src/constants/test-performance-constants.ts",
    // 2026-05-08: kept for future content dashboard API; no runtime caller in starter yet.
    "src/lib/content-query/stats.ts",
  ],
```

- [ ] **Step 5: Remove default exports where named exports already exist**

For each of these files, keep the named export and remove the default export line:

```text
src/components/footer/Footer.tsx
src/components/ui/social-icons.tsx
src/emails/ConfirmationEmail.tsx
src/emails/ContactFormEmail.tsx
src/emails/EmailField.tsx
src/emails/EmailLayout.tsx
src/emails/ProductInquiryEmail.tsx
src/test/constants/mock-messages.ts
```

Example change in `src/components/footer/Footer.tsx`:

```ts
// Remove this line:
export default Footer;
```

Example change in `src/emails/ConfirmationEmail.tsx`:

```ts
// Keep:
export function ConfirmationEmail(data: EmailTemplateData) {
  // existing body
}

// Remove:
export default ConfirmationEmail;
```

After each file, run a quick import search:

```bash
rg -n "import [A-Z][A-Za-z0-9_]* from \"@/(emails/ConfirmationEmail|emails/ContactFormEmail|emails/EmailField|emails/EmailLayout|emails/ProductInquiryEmail|components/footer/Footer|components/ui/social-icons|test/constants/mock-messages)\"" src tests
```

If a default import exists, convert it to named import.

- [ ] **Step 6: Remove duplicate constant aliases only after import search**

For each alias pair in Knip duplicate exports, search before editing:

```bash
rg -n "HTTP_OK_CONST|HTTP_BAD_REQUEST_CONST|IDLE_CALLBACK_FALLBACK_DELAY|IDLE_CALLBACK_TIMEOUT|IDLE_CALLBACK_TIMEOUT_LONG|MAX_LEAD_PRODUCT_NAME_LENGTH" src tests scripts
```

Rules:

- If both names are used, do not remove in this wave.
- If only the alias is unused, remove the unused alias.
- If both names are used for different readability reasons, add a Knip ignore with a reason instead of forcing churn.

- [ ] **Step 7: Re-run Knip**

Run:

```bash
pnpm exec knip --include files,exports,types,duplicates,binaries
```

Expected: fewer findings than the baseline, with the duplicate default-export entries removed. It does not need to reach zero in this first wave.

- [ ] **Step 8: Run safety checks**

Run:

```bash
pnpm type-check
pnpm test
```

Expected: both pass.

- [ ] **Step 9: Commit**

```bash
git add knip.jsonc src tests
git commit -m "chore: reduce knip cleanup noise"
```

---

## Task 4: Localize Turnstile and form degraded-state text

**Files:**
- Modify: `messages/en/critical.json`
- Modify: `messages/zh/critical.json`
- Modify: `messages/en/deferred.json`
- Modify: `messages/zh/deferred.json`
- Modify: `src/components/security/turnstile.tsx`
- Modify: `src/components/forms/lazy-turnstile.tsx`
- Modify: `src/components/forms/contact-form-container.tsx`
- Modify: `src/components/forms/contact-form-container-view.tsx`
- Modify: `src/components/forms/use-contact-form.ts`
- Modify: `src/components/forms/contact-form-feedback.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `playwright.config.ts`
- Test: `src/components/forms/__tests__/use-contact-form.test.tsx`
- Test: Turnstile/lazy Turnstile tests
- Test: `src/app/[locale]/__tests__/layout.test.tsx`

- [ ] **Step 1: Add message keys**

Add under `accessibility` in both `messages/en/critical.json` and `messages/zh/critical.json`:

English:

```json
"securityVerificationUnavailable": "Security verification is temporarily unavailable.",
"turnstileDevBypass": "Dev mode: Turnstile verification bypassed",
"turnstileTestMode": "Bot protection disabled in test mode",
"turnstileLoadFailed": "Security verification failed to load."
```

Chinese:

```json
"securityVerificationUnavailable": "安全验证暂时不可用。",
"turnstileDevBypass": "开发模式：Turnstile 验证已跳过",
"turnstileTestMode": "测试模式下已关闭机器人防护",
"turnstileLoadFailed": "安全验证加载失败。"
```

Then add `networkError` under `contact.form` in `messages/en/deferred.json`:

```json
"networkError": "We could not submit the form. Please try again."
```

and under `contact.form` in `messages/zh/deferred.json`:

```json
"networkError": "表单暂时无法提交，请稍后重试。"
```

Preserve valid JSON commas.

- [ ] **Step 2: Make Turnstile labels injectable**

In `src/components/security/turnstile.tsx`, extend `TurnstileProps`:

```ts
  labels?: {
    unavailable: string;
    devBypass: string;
    testMode: string;
  };
```

Inside `TurnstileWidget`, create defaults:

```ts
  const labelText = labels ?? {
    unavailable: "Security verification is temporarily unavailable.",
    devBypass: "Dev mode: Turnstile verification bypassed",
    testMode: "Bot protection disabled in test mode",
  };
```

Replace hardcoded JSX text:

```tsx
<strong>Dev Mode:</strong> Turnstile verification bypassed
```

with:

```tsx
{labelText.devBypass}
```

Replace:

```tsx
Security verification is temporarily unavailable.
```

with:

```tsx
{labelText.unavailable}
```

Replace:

```tsx
Bot protection disabled in test mode
```

with:

```tsx
{labelText.testMode}
```

- [ ] **Step 3: Make LazyTurnstile labels injectable**

In `src/components/forms/lazy-turnstile.tsx`, extend props with:

```ts
  labels?: {
    unavailable: string;
    loadFailed: string;
    devBypass: string;
    testMode: string;
  };
```

Set default labels in the component:

```ts
  const labelText = labels ?? {
    unavailable: "Security verification is temporarily unavailable.",
    loadFailed: "Security verification failed to load.",
    devBypass: "Dev mode: Turnstile verification bypassed",
    testMode: "Bot protection disabled in test mode",
  };
```

Replace fallback text with `labelText.unavailable`, replace `onError?.("Turnstile widget failed to load")` with `onError?.(labelText.loadFailed)`, and pass Turnstile labels:

```ts
    labels: {
      unavailable: labelText.unavailable,
      devBypass: labelText.devBypass,
      testMode: labelText.testMode,
    },
```

- [ ] **Step 4: Pass translated labels from the contact form**

In `src/components/forms/contact-form-container.tsx`, add:

```ts
  const tAccessibility = useTranslations("accessibility");
```

Pass these labels into `ContactFormContainerView`:

```tsx
      turnstileLabels={{
        unavailable: tAccessibility("securityVerificationUnavailable"),
        loadFailed: tAccessibility("turnstileLoadFailed"),
        devBypass: tAccessibility("turnstileDevBypass"),
        testMode: tAccessibility("turnstileTestMode"),
      }}
```

In `src/components/forms/contact-form-container-view.tsx`, extend props:

```ts
  turnstileLabels: {
    unavailable: string;
    loadFailed: string;
    devBypass: string;
    testMode: string;
  };
```

Destructure `turnstileLabels`, then pass it to `LazyTurnstile`:

```tsx
        <LazyTurnstile
          labels={turnstileLabels}
          onSuccess={onTurnstileSuccess}
          onError={onTurnstileError}
          onExpire={onTurnstileExpire}
          onLoad={onTurnstileLoad}
        />
```

- [ ] **Step 5: Replace network catch raw English with error code**

In `src/components/forms/use-contact-form.ts`, replace:

```ts
error: "Failed to submit form. Please try again.",
```

with:

```ts
errorCode: "FORM_NETWORK_ERROR",
```

Keep `ServerActionResult.error` empty for this catch branch so localized pages do not render raw English text.

- [ ] **Step 6: Translate network error code**

In `src/components/forms/contact-form-feedback.tsx`, update `getErrorDisplayState` so `FORM_NETWORK_ERROR` maps through `translateForm("networkError")`.

Then update logic:

```ts
  const translatedError =
    state.errorCode === "FORM_NETWORK_ERROR"
      ? translateForm("networkError")
      : state.errorCode
        ? translateApiError(translateApi, state.errorCode)
        : undefined;
```

Change raw-message logic to avoid rendering unknown raw English on localized pages:

```ts
    shouldShowRawMessage: false,
```

This intentionally suppresses unknown raw errors. Known API errors still render through `translateApiError`.

- [ ] **Step 7: Use existing skip-link translation**

In `src/app/[locale]/layout.tsx`, remove:

```ts
  const skipToContentLabel =
    typedLocale === "zh" ? "跳转到主要内容" : "Skip to main content";
```

Move the skip link into `AsyncLocaleLayoutContent`, after `tAccessibility` is loaded:

```ts
  const skipToContentLabel = tAccessibility("skipToContent");
```

Return it inside the fragment before `NextIntlClientProvider`:

```tsx
      <a href="#main-content" className="skip-link">
        {skipToContentLabel}
      </a>
```

Do not call `getTranslations` from `LocaleLayout`; keep the translation read inside `AsyncLocaleLayoutContent`.

- [ ] **Step 8: Align Playwright Turnstile action**

In `playwright.config.ts`, replace:

```ts
NEXT_PUBLIC_TURNSTILE_ACTION: "contact-form",
```

with:

```ts
NEXT_PUBLIC_TURNSTILE_ACTION: "contact_form",
```

- [ ] **Step 9: Add focused tests**

In `src/components/forms/__tests__/use-contact-form.test.tsx`, add:

```ts
  it("stores a localized network error code when fetch fails", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    });
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.setTurnstileToken("valid-token");
    });

    await act(async () => {
      result.current.formAction(createValidFormData());
    });

    await waitFor(() => {
      expect(result.current.state).toEqual(
        expect.objectContaining({
          success: false,
          errorCode: "FORM_NETWORK_ERROR",
        }),
      );
    });
  });
```

Add or update Turnstile tests to render `TurnstileWidget` with labels and assert the provided labels appear in unavailable/test mode.

Add a layout test in `src/app/[locale]/__tests__/layout.test.tsx` that proves the skip link comes from the `accessibility.skipToContent` translation:

```ts
  it("renders skip link from the accessibility translation namespace", async () => {
    const page = await LocaleLayout({
      children: <div>Child</div>,
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page);

    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
  });
```

If this test already exists, keep it and update the `next-intl/server` mock so namespace `"accessibility"` returns `"Skip to main content"` for key `"skipToContent"`.

- [ ] **Step 10: Run focused tests**

Run:

```bash
pnpm exec vitest run src/components/forms/__tests__/use-contact-form.test.tsx src/components/forms/__tests__/lazy-turnstile.test.tsx src/app/[locale]/__tests__/layout.test.tsx
pnpm content:check
```

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add messages/en/critical.json messages/zh/critical.json messages/en/deferred.json messages/zh/deferred.json src/components src/app/[locale]/layout.tsx playwright.config.ts
git commit -m "fix: localize contact degraded states"
```

---

## Task 5: Harden owner ops access route

**Files:**
- Modify: `src/lib/security/distributed-rate-limit.ts`
- Modify: `src/app/ops/traffic/access/route.ts`
- Modify: `src/app/ops/traffic/access/__tests__/route.test.ts`

- [ ] **Step 1: Add failing tests for throttling and constant-time comparison**

In `src/app/ops/traffic/access/__tests__/route.test.ts`, add mocks above the `POST` import:

```ts
const mockCheckDistributedRateLimit = vi.hoisted(() => vi.fn());
const mockCreateRateLimitHeaders = vi.hoisted(() => vi.fn(() => new Headers()));
const mockConstantTimeCompare = vi.hoisted(() => vi.fn());

vi.mock("@/lib/security/distributed-rate-limit", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/security/distributed-rate-limit")>();
  return {
    ...original,
    checkDistributedRateLimit: mockCheckDistributedRateLimit,
    createRateLimitHeaders: mockCreateRateLimitHeaders,
  };
});

vi.mock("@/lib/security-crypto", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/security-crypto")>();
  return {
    ...original,
    constantTimeCompare: mockConstantTimeCompare,
  };
});
```

In `beforeEach`, set defaults:

```ts
    mockCheckDistributedRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 60000,
      retryAfter: null,
    });
    mockConstantTimeCompare.mockImplementation((a: string, b: string) => a === b);
```

Add tests:

```ts
  it("rate limits invalid owner access attempts before comparing the key", async () => {
    vi.stubEnv("OPS_DASHBOARD_ACCESS_KEY", "owner-access-key-123456");
    mockCheckDistributedRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
      deniedReason: "limit",
    });
    const form = new FormData();
    form.set("accessKey", "wrong");

    const response = await POST(
      new NextRequest("http://localhost/ops/traffic/access", {
        method: "POST",
        body: form,
      }),
    );

    expect(response.status).toBe(429);
    expect(mockConstantTimeCompare).not.toHaveBeenCalled();
  });

  it("uses constant-time comparison for provided access keys", async () => {
    vi.stubEnv("OPS_DASHBOARD_ACCESS_KEY", "owner-access-key-123456");
    const form = new FormData();
    form.set("accessKey", "owner-access-key-123456");

    await POST(
      new NextRequest("http://localhost/ops/traffic/access", {
        method: "POST",
        body: form,
      }),
    );

    expect(mockConstantTimeCompare).toHaveBeenCalledWith(
      "owner-access-key-123456",
      "owner-access-key-123456",
    );
  });
```

Add this import at the top of the test file:

```ts
import { NextRequest } from "next/server";
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm exec vitest run src/app/ops/traffic/access/__tests__/route.test.ts
```

Expected: FAIL because route does not rate-limit or use constant-time comparison yet.

- [ ] **Step 3: Add `opsAccess` preset**

In `src/lib/security/distributed-rate-limit.ts`, add to `RATE_LIMIT_PRESETS`:

```ts
  opsAccess: {
    maxRequests: COUNT_FIVE,
    windowMs: MINUTE_MS,
    failureMode: "closed" as const,
  },
```

- [ ] **Step 4: Wrap route with rate limiting and constant-time comparison**

In `src/app/ops/traffic/access/route.ts`, import:

```ts
import { NextRequest } from "next/server";
import {
  withRateLimit,
  type RateLimitContext,
} from "@/lib/api/with-rate-limit";
import { constantTimeCompare } from "@/lib/security-crypto";
```

Change the handler shape:

```ts
async function handlePost(
  request: NextRequest,
  _context: RateLimitContext,
) {
  const secret = getRuntimeEnvString("OPS_DASHBOARD_ACCESS_KEY");
  const form = await request.formData();
  const accessKey = String(form.get("accessKey") ?? "");

  if (!secret || !constantTimeCompare(accessKey, secret)) {
    const response = redirectTo("/ops/traffic?access=denied");
    response.cookies.delete({
      name: OPS_TRAFFIC_ACCESS_COOKIE_NAME,
      path: "/ops/traffic",
    });
    return response;
  }

  const response = redirectTo("/ops/traffic");
  response.cookies.set({
    name: OPS_TRAFFIC_ACCESS_COOKIE_NAME,
    value: await createOpsAccessCookieValue({ secret }),
    httpOnly: true,
    sameSite: "strict",
    secure: isRuntimeProduction(),
    path: "/ops/traffic",
    maxAge: OPS_TRAFFIC_ACCESS_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

const POST_RATE_LIMITED = withRateLimit("opsAccess", handlePost);

export async function POST(request: NextRequest) {
  return POST_RATE_LIMITED(request);
}
```

Keep tests on `new NextRequest(...)` because `withRateLimit` expects `NextRequest`.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm exec vitest run src/app/ops/traffic/access/__tests__/route.test.ts src/lib/security/__tests__/distributed-rate-limit.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run broader API tests**

Run:

```bash
pnpm exec vitest run src/app/api/contact/__tests__/route.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/lead-family-protection.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/security/distributed-rate-limit.ts src/app/ops/traffic/access/route.ts src/app/ops/traffic/access/__tests__/route.test.ts
git commit -m "fix: harden ops access route"
```

---

## Task 6: Align Cloudflare deployment platform env contract

**Files:**
- Modify: `next.config.ts`
- Modify: `tests/unit/scripts/proof-lane-contract.test.ts`
- Modify: `docs/technical/deployment-notes.md`
- Modify: `docs/website/部署设置.md`
- Modify: `docs/website/quality-proof.md`

- [ ] **Step 1: Add static contract test**

Add to `tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("uses DEPLOYMENT_PLATFORM as the canonical Cloudflare platform signal", () => {
    const nextConfig = readRepoFile("next.config.ts");
    const wrangler = readRepoFile("wrangler.jsonc");
    const deploymentNotes = readRepoFile("docs/technical/deployment-notes.md");

    expect(wrangler).toContain('"DEPLOYMENT_PLATFORM": "cloudflare"');
    expect(nextConfig).toContain("process.env.DEPLOYMENT_PLATFORM === \"cloudflare\"");
    expect(nextConfig).toContain("process.env.DEPLOY_TARGET === \"cloudflare\"");
    expect(deploymentNotes).toContain("DEPLOYMENT_PLATFORM=cloudflare");
    expect(deploymentNotes).toContain("DEPLOY_TARGET=cloudflare");
  });
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: FAIL because `next.config.ts` currently only uses `DEPLOY_TARGET`.

- [ ] **Step 3: Update `next.config.ts` platform detection**

Replace:

```ts
const isCloudflare = process.env.DEPLOY_TARGET === "cloudflare";
```

with:

```ts
const isCloudflare =
  process.env.DEPLOYMENT_PLATFORM === "cloudflare" ||
  process.env.DEPLOY_TARGET === "cloudflare";
```

Do not remove legacy `DEPLOY_TARGET` yet.

- [ ] **Step 4: Update docs**

In `docs/technical/deployment-notes.md`, `docs/website/部署设置.md`, and `docs/website/quality-proof.md`, add:

```markdown
Cloudflare platform detection uses `DEPLOYMENT_PLATFORM=cloudflare` as the canonical signal. `DEPLOY_TARGET=cloudflare` is accepted only as a legacy compatibility alias.
```

- [ ] **Step 5: Run tests and Cloudflare build proof**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: all exit 0. Warnings can remain as known baseline.

- [ ] **Step 6: Commit**

```bash
git add next.config.ts tests/unit/scripts/proof-lane-contract.test.ts docs/technical/deployment-notes.md docs/website/部署设置.md docs/website/quality-proof.md
git commit -m "fix: align cloudflare platform env"
```

---

## Task 7: Create route-mode contract and snapshot helper

**Files:**
- Create: `docs/quality/route-mode-contract.md`
- Create: `scripts/quality/route-mode-snapshot.mjs`
- Create: `tests/unit/scripts/route-mode-snapshot.test.ts`
- Modify: `package.json`
- Modify: `docs/website/quality-proof.md`

- [ ] **Step 1: Create failing parser test**

Create `tests/unit/scripts/route-mode-snapshot.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseRouteModeSummary } from "../../../scripts/quality/route-mode-snapshot.mjs";

const SAMPLE_SUMMARY = `
Route (app)
┌ ○ /_not-found
├ ◐ /[locale]
├ ƒ /api/contact
├ ○ /api/health
└ ƒ /sitemap.xml

○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
ƒ  (Dynamic)            server-rendered on demand
`;

describe("route mode snapshot parser", () => {
  it("parses static, partial prerender, and dynamic routes", () => {
    expect(parseRouteModeSummary(SAMPLE_SUMMARY)).toEqual([
      { mode: "static", route: "/_not-found" },
      { mode: "partial-prerender", route: "/[locale]" },
      { mode: "dynamic", route: "/api/contact" },
      { mode: "static", route: "/api/health" },
      { mode: "dynamic", route: "/sitemap.xml" },
    ]);
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/route-mode-snapshot.test.ts
```

Expected: FAIL because the script does not exist.

- [ ] **Step 3: Implement parser and CLI**

Create `scripts/quality/route-mode-snapshot.mjs`:

```js
#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODE_BY_SYMBOL = {
  "○": "static",
  "◐": "partial-prerender",
  "ƒ": "dynamic",
};

export function parseRouteModeSummary(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^[├└┌]\s*([○◐ƒ])\s+(\S+)/);
      if (!match) return null;
      const [, symbol, route] = match;
      return { mode: MODE_BY_SYMBOL[symbol], route };
    })
    .filter(Boolean);
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error(
      "Usage: node scripts/quality/route-mode-snapshot.mjs <build-output.txt>",
    );
    process.exitCode = 1;
    return;
  }

  const text = fs.readFileSync(inputPath, "utf8");
  const routes = parseRouteModeSummary(text);
  const outputDir = path.join(process.cwd(), "reports/quality");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "route-mode-snapshot.json"),
    `${JSON.stringify({ routes }, null, 2)}\n`,
  );
  console.log(`[route-mode-snapshot] wrote ${routes.length} route(s)`);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  main();
}
```

- [ ] **Step 4: Add package script**

In `package.json`, add:

```json
"route-mode:snapshot": "node scripts/quality/route-mode-snapshot.mjs"
```

Do not add this to `website:check` yet.

- [ ] **Step 5: Add route-mode contract doc**

Create `docs/quality/route-mode-contract.md`:

```markdown
# Route Mode Contract

This document records expected route modes for the starter. It is a proof note, not a hard gate yet.

## Current policy

- `○` static routes are expected for static assets and health checks.
- `◐` Partial Prerender routes are expected for localized marketing pages that stream dynamic server content under Cache Components.
- `ƒ` dynamic routes are expected for API routes, owner access, sitemap, and catch-all routes.

## Known build warning

`DYNAMIC_SERVER_USAGE` appears during `pnpm build`. Until this is fully attributed, do not claim static/dynamic boundaries are fully closed. Record route summary after each release-facing build.

## Deferred

`src/middleware.ts` to `src/proxy.ts` migration is intentionally deferred until Cloudflare/OpenNext support is proven.
```

- [ ] **Step 6: Link from quality proof**

In `docs/website/quality-proof.md`, under Route mode proof, add:

```markdown
Current route mode notes live in `docs/quality/route-mode-contract.md`. The snapshot helper can parse a saved build log with `pnpm route-mode:snapshot <build-output.txt>` and writes `reports/quality/route-mode-snapshot.json`.
```

- [ ] **Step 7: Run tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/route-mode-snapshot.test.ts
pnpm build 2>&1 | tee /tmp/showcase-next-build.log
pnpm route-mode:snapshot /tmp/showcase-next-build.log
```

Expected: test passes; snapshot command writes route count. Build may still show known warnings.

- [ ] **Step 8: Commit**

```bash
git add docs/quality/route-mode-contract.md scripts/quality/route-mode-snapshot.mjs tests/unit/scripts/route-mode-snapshot.test.ts package.json docs/website/quality-proof.md
git commit -m "chore: document route mode proof"
```

---

## Task 8: Make lead delivery semantics explicit

**Files:**
- Modify: `src/lib/lead-pipeline/process-lead.ts`
- Modify: `src/lib/lead-pipeline/__tests__/process-lead.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/process-lead-observability.test.ts`
- Modify: `src/app/api/inquiry/__tests__/route.test.ts`
- Modify: `tests/integration/api/lead-family-contract.test.ts`
- Modify: `tests/integration/api/lead-family-protection.test.ts`
- Modify: `src/app/__tests__/actions.test.ts`
- Modify: `docs/website/quality-proof.md`

- [ ] **Step 1: Add explicit `ownerNotified` field tests**

In `src/lib/lead-pipeline/__tests__/process-lead.test.ts`, update the existing email-failure test to expect `ownerNotified: false`:

```ts
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        emailSent: false,
        ownerNotified: false,
        recordCreated: true,
      }),
    );
```

Update success tests to expect `ownerNotified: true` where owner email succeeds.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/process-lead.test.ts
```

Expected: FAIL because `ownerNotified` does not exist yet.

- [ ] **Step 3: Add field to `LeadResult`**

In `src/lib/lead-pipeline/process-lead.ts`, update interface:

```ts
export interface LeadResult {
  success: boolean;
  emailSent: boolean;
  ownerNotified: boolean;
  recordCreated: boolean;
  referenceId?: string | undefined;
  error?: "VALIDATION_ERROR" | "PROCESSING_FAILED" | string | undefined;
}
```

Update failure results:

```ts
ownerNotified: false,
```

Update contact/product success:

```ts
const emailSent = await sendContactOwnerEmail(lead, context);

return {
  success: true,
  emailSent,
  ownerNotified: emailSent,
  recordCreated: true,
  referenceId,
};
```

For newsletter:

```ts
ownerNotified: false,
```

- [ ] **Step 4: Propagate type updates**

Update every mocked `LeadResult` object in these files to include `ownerNotified`:

```text
src/lib/lead-pipeline/__tests__/process-lead-observability.test.ts
src/app/api/inquiry/__tests__/route.test.ts
tests/integration/api/lead-family-contract.test.ts
tests/integration/api/lead-family-protection.test.ts
src/app/__tests__/actions.test.ts
```

Examples:

```ts
{
  success: true,
  emailSent: true,
  ownerNotified: true,
  recordCreated: true,
  referenceId: "lead-ref-001",
}
```

For record-created/email-failed:

```ts
{
  success: true,
  emailSent: false,
  ownerNotified: false,
  recordCreated: true,
  referenceId: "ref-record-123",
}
```

For validation or processing failure mocks:

```ts
{
  success: false,
  emailSent: false,
  ownerNotified: false,
  recordCreated: false,
  error: "PROCESSING_FAILED",
}
```

- [ ] **Step 5: Document launch canary acceptance**

In `docs/website/quality-proof.md`, under form canary, add:

```markdown
For contact and product inquiry launch canaries, success means both:

- a lead record exists in Airtable or the configured CRM;
- the owner notification was delivered or the configured owner-notification fallback was explicitly accepted.

The runtime result distinguishes `recordCreated` from `ownerNotified`; do not treat record creation alone as full owner delivery proof.
```

- [ ] **Step 6: Run tests**

Run:

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/process-lead.test.ts src/lib/lead-pipeline/__tests__/process-lead-observability.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/app/__tests__/actions.test.ts
pnpm type-check
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/lead-pipeline/process-lead.ts src docs/website/quality-proof.md tests
git commit -m "refactor: clarify lead owner notification result"
```

---

## Task 9: Establish Cloudflare and Storybook warning baselines

**Files:**
- Create: `docs/quality/cloudflare-warning-baseline.md`
- Create: `docs/quality/storybook-warning-baseline.md`
- Modify: `docs/website/quality-proof.md`
- Modify: `tests/unit/scripts/proof-lane-contract.test.ts`

- [ ] **Step 1: Add failing test for warning baseline docs**

Add to `tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("tracks generated warning baselines without treating them as source defects", () => {
    const cloudflareBaseline = readRepoFile(
      "docs/quality/cloudflare-warning-baseline.md",
    );
    const storybookBaseline = readRepoFile(
      "docs/quality/storybook-warning-baseline.md",
    );
    const qualityProof = readRepoFile("docs/website/quality-proof.md");

    expect(cloudflareBaseline).toContain("duplicate-case");
    expect(cloudflareBaseline).toContain("direct-eval");
    expect(cloudflareBaseline).toContain("equals-negative-zero");
    expect(storybookBaseline).toContain('"use client" was ignored');
    expect(storybookBaseline).toContain("iframe chunk");
    expect(qualityProof).toContain("warning baseline");
  });
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: FAIL because docs do not exist.

- [ ] **Step 3: Create Cloudflare baseline doc**

Create `docs/quality/cloudflare-warning-baseline.md`:

```markdown
# Cloudflare Warning Baseline

This baseline records warnings emitted by generated OpenNext/Wrangler artifacts. These are not source-code findings by themselves.

## Known warnings

- `duplicate-case` in `.open-next/server-functions/default/handler.mjs`
- `direct-eval` in generated handler code
- `equals-negative-zero` in generated bundle code

## Policy

- If the warning appears only inside `.open-next/**`, classify it as generated-bundle warning.
- Do not claim it is fixed by source edits unless a source change demonstrably removes it from a fresh `pnpm website:build:cf` and `pnpm exec wrangler deploy --dry-run --env preview`.
- New warning categories must be added here with date, command, and owner note.
```

- [ ] **Step 4: Create Storybook baseline doc**

Create `docs/quality/storybook-warning-baseline.md`:

```markdown
# Storybook Warning Baseline

`pnpm component:check` proves component governance and Storybook buildability. It does not prove production bundle performance.

## Known warnings

- `unable to find package.json for @opennextjs/cloudflare`
- Vite sourcemap warnings for client component files
- `"use client" was ignored` from Vite bundling
- Storybook `iframe` chunk larger than 500 kB

## Policy

- Treat these as Storybook proof noise unless they reproduce in `pnpm build`.
- New warning categories should be investigated or added here with a short reason.
- Production performance requires Lighthouse or bundle analyzer proof, not Storybook chunk size alone.
```

- [ ] **Step 5: Link baseline docs**

In `docs/website/quality-proof.md`, add:

```markdown
Generated warning baseline lives in `docs/quality/cloudflare-warning-baseline.md` and `docs/quality/storybook-warning-baseline.md`. A known warning baseline is not a pass/fail claim; it prevents old generated warnings from hiding new warning categories.
```

- [ ] **Step 6: Run tests and proof commands**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
pnpm component:check
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: all exit 0; known warnings can remain.

- [ ] **Step 7: Commit**

```bash
git add docs/quality/cloudflare-warning-baseline.md docs/quality/storybook-warning-baseline.md docs/website/quality-proof.md tests/unit/scripts/proof-lane-contract.test.ts
git commit -m "docs: baseline generated warnings"
```

---

## Task 10: Document starter positioning and slimming decision

**Files:**
- Create: `docs/website/starter-positioning-decision.md`
- Modify: `docs/website/README.md`
- Modify: `docs/website/新项目替换清单.md`
- Modify: `tests/unit/scripts/proof-lane-contract.test.ts`

- [ ] **Step 1: Add failing doc contract test**

Add to `tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("records the starter positioning decision before slimming core modules", () => {
    const readme = readRepoFile("docs/website/README.md");
    const replacement = readRepoFile("docs/website/新项目替换清单.md");
    const decision = readRepoFile("docs/website/starter-positioning-decision.md");

    expect(readme).toContain("starter-positioning-decision.md");
    expect(decision).toContain("High-config showcase starter");
    expect(decision).toContain("Minimal core plus optional presets");
    expect(decision).toContain("Current decision");
    expect(replacement).toContain("Do not delete products, ops, Storybook, or governance tests without a positioning decision");
  });
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: FAIL because the decision doc does not exist.

- [ ] **Step 3: Create decision doc**

Create `docs/website/starter-positioning-decision.md`:

```markdown
# Starter Positioning Decision

## Current decision

The current repository remains a High-config showcase starter. It is not a blank minimal shell.

## Option A: High-config showcase starter

Keep products, ops dashboard, Storybook, content readiness, Cloudflare/OpenNext proof, and governance tests as starter capabilities. Public launch readiness is handled by strict replacement checks and owner signoff.

Use this when the derived project wants a complete showcase website foundation with inquiry flow, proof surfaces, i18n, component governance, and Cloudflare deployment.

## Option B: Minimal core plus optional presets

Core would include only home/about/contact/legal, minimal messages, minimal tests, and optional presets for products, ops dashboard, Storybook, Cloudflare analytics, Stryker, and governance.

This option requires a separate migration plan. Do not delete products, ops, Storybook, or governance tests without that plan.

## Follow-up backlog if Option B is selected

1. Define `starter:strip-demo` behavior.
2. Split product catalog into an opt-in preset.
3. Split ops dashboard into an opt-in preset.
4. Split Storybook/governance/mutation into opt-in lanes.
5. Split tests into `starter-contract`, `demo-site`, `governance`, and `deployed-canary`.
```

- [ ] **Step 4: Link doc from README**

In `docs/website/README.md`, add `starter-positioning-decision.md` to the reading list after `quality-proof.md`.

- [ ] **Step 5: Add warning to replacement checklist**

In `docs/website/新项目替换清单.md`, add:

```markdown
Do not delete products, ops, Storybook, or governance tests without a positioning decision. The current starter is a high-config showcase starter; slimming it into a minimal core requires a separate migration plan.
```

- [ ] **Step 6: Run test**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add docs/website/starter-positioning-decision.md docs/website/README.md docs/website/新项目替换清单.md tests/unit/scripts/proof-lane-contract.test.ts
git commit -m "docs: record starter positioning decision"
```

---

## Task 11: Final verification pass

**Files:**
- No planned code edits.

- [ ] **Step 1: Check worktree state**

Run:

```bash
git status --short
```

Expected: only intended staged/unstaged files before final commit; clean after commits.

- [ ] **Step 2: Run fast gates**

Run:

```bash
pnpm type-check
pnpm lint:check
pnpm content:check
node scripts/starter-checks.js content-readiness
node scripts/starter-checks.js client-boundary
node scripts/starter-checks.js validate-production-config
PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config
```

Expected:

- first six commands exit 0;
- strict launch gate still exits non-zero for the starter repo unless real client assets/config were intentionally supplied.

- [ ] **Step 3: Run unit/integration tests**

Run:

```bash
pnpm test
```

Expected: exit 0.

- [ ] **Step 4: Run architecture and proof checks**

Run:

```bash
pnpm exec depcruise src --config .dependency-cruiser.js
pnpm exec knip
```

Expected:

- depcruise exits 0;
- Knip should have fewer findings than baseline. If this plan completed all cleanup, Knip should exit 0 or have only intentional allowlisted findings. If nonzero remains, list exact remaining findings.

- [ ] **Step 5: Run build and Cloudflare proof sequentially**

Run:

```bash
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: all exit 0. Known warnings must match baseline docs.

- [ ] **Step 6: Run component check**

Run:

```bash
pnpm component:check
```

Expected: exits 0. Known Storybook warnings must match baseline docs.

- [ ] **Step 7: Run local Semgrep only if installed**

Run:

```bash
pnpm exec semgrep --config semgrep.yml src
```

Expected:

- If installed: exit 0 or report actionable findings.
- If not installed: record `Blocked: Command "semgrep" not found`; do not call it passed.

- [ ] **Step 8: Final status report**

Prepare a final report with:

- exact commit(s);
- command results;
- remaining strict public-launch blockers;
- remaining Knip/Semgrep state;
- warning baseline matches;
- confirmation that `src/middleware.ts` was not migrated to `proxy`.

---

## Self-review checklist

- Spec coverage:
  - Proof wording and strict gate: Task 1.
  - PR Wrangler dry-run: Task 1.
  - Semgrep blocked: Task 2.
  - Knip cleanup: Task 3.
  - i18n fallback and Turnstile drift: Task 4.
  - ops access hardening: Task 5.
  - Cloudflare env contract: Task 6.
  - Dynamic route attribution: Task 7.
  - lead success semantics: Task 8.
  - generated warning baselines: Task 9.
  - starter core heaviness / positioning: Task 10.
  - final verification: Task 11.
  - middleware/proxy: explicitly deferred.
- Placeholder scan:
  - No `TBD`.
  - No open-ended “add tests” without concrete test names/commands.
  - Product/ops slimming intentionally ends at a decision artifact.
- Type consistency:
  - `ownerNotified` is added to `LeadResult` and test mocks.
  - `opsAccess` is added to `RATE_LIMIT_PRESETS` before `withRateLimit("opsAccess", ...)`.
  - `FORM_NETWORK_ERROR` is intentionally a local UI error code unless moved into `API_ERROR_CODES`.
