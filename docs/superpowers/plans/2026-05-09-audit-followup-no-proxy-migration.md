# Audit Follow-up Without Proxy Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the honest starter-side audit follow-up gaps while explicitly preserving `src/middleware.ts` and not adding `src/proxy.ts`.

**Architecture:** Treat this as proof-boundary repair, not a runtime migration. Add small contract tests that lock the no-proxy policy, update docs to explain why the migration is deferred for Cloudflare/OpenNext, capture fresh route-mode evidence, and leave real public-launch/deployed-lead gaps as explicit derived-project blockers.

**Tech Stack:** Next.js 16.2.6 App Router + Cache Components, React 19.2.6, TypeScript 6.0.3, pnpm 10.13.1, Vitest, Playwright, OpenNext Cloudflare 1.19.8, Wrangler 4.90.0.

---

## Scope and hard boundaries

- Work only in `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings`.
- Do not edit `/Users/Data/workspace/showcase-website-starter` except to read untracked audit artifacts as evidence.
- Do not rename `src/middleware.ts`.
- Do not create `src/proxy.ts`.
- Do not change the middleware matcher just to remove a warning.
- Do not claim strict public launch readiness for this starter repo.
- Do not fake deployed lead canary proof without a deployed URL and credentials.
- Do not add a `semgrep` npm package.
- Do not permanently delete files.
- Do not run `pnpm build` and `pnpm website:build:cf` in parallel.

## File structure map

### No-proxy migration policy

- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/tests/unit/middleware.test.ts`
  - Add a test that `src/middleware.ts` remains the runtime entrypoint and `src/proxy.ts` does not exist.
- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/.claude/rules/cloudflare.md`
  - Replace "prove renamed proxy convention" wording with "defer migration because Cloudflare/OpenNext support is not acceptable for a blind migration."
- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/quality/route-mode-contract.md`
  - Update Deferred section to match the no-proxy policy.
- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/website/quality-proof.md`
  - Rewrite Cloudflare middleware/proxy section as a deferral policy, not a migration checklist.
- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/tests/unit/scripts/proof-lane-contract.test.ts`
  - Add doc-contract test for this policy.

### Route-mode evidence

- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/quality/route-mode-contract.md`
  - Add a dated evidence note from the current build/snapshot.
- Generated ignored output: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/reports/quality/route-mode-snapshot.json`
  - Do not commit unless the repo already tracks report artifacts, which it currently does not.

### Public-launch and lead-canary proof boundaries

- Modify only if needed: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/website/quality-proof.md`
  - Keep strict launch and deployed lead language clear if the no-proxy edits touch nearby text.
- Existing tests:
  - `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/tests/e2e/smoke/post-deploy-form.spec.ts`
  - Do not edit unless a contract test reveals misleading wording.

## Task 1: Lock no-proxy migration policy in tests and docs

**Files:**
- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/tests/unit/middleware.test.ts`
- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/tests/unit/scripts/proof-lane-contract.test.ts`
- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/.claude/rules/cloudflare.md`
- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/quality/route-mode-contract.md`
- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/website/quality-proof.md`

- [ ] **Step 1: Add a failing runtime-entry contract test**

Append this test inside `describe("middleware next-intl boundary", () => { ... })` in `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/tests/unit/middleware.test.ts`:

```ts
  it("keeps middleware as the Cloudflare runtime entrypoint until proxy support is proven", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const repoRoot = path.resolve(__dirname, "../..");

    expect(fs.existsSync(path.join(repoRoot, "src/middleware.ts"))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, "src/proxy.ts"))).toBe(false);
  });
```

- [ ] **Step 2: Add a failing documentation contract test**

Add this test inside `describe("proof lane contract", ...)` in `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/tests/unit/scripts/proof-lane-contract.test.ts`:

```ts
  it("documents the no-proxy migration policy for Cloudflare/OpenNext", () => {
    const cloudflareRules = readRepoFile(".claude/rules/cloudflare.md");
    const routeModeContract = readRepoFile("docs/quality/route-mode-contract.md");
    const qualityProof = readRepoFile("docs/website/quality-proof.md");

    for (const content of [cloudflareRules, routeModeContract, qualityProof]) {
      expect(content).toContain("Do not rename `src/middleware.ts` to `src/proxy.ts`");
      expect(content).toContain("Cloudflare/OpenNext support is not acceptable for a blind migration");
    }

    expect(qualityProof).toContain("Next.js deprecation warning");
    expect(qualityProof).toContain("known platform-transition warning");
  });
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
pnpm exec vitest run tests/unit/middleware.test.ts tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: `middleware.test.ts` should pass the new file-state assertion if no proxy exists; `proof-lane-contract.test.ts` should fail because the docs do not yet contain the new policy text.

- [ ] **Step 4: Update Cloudflare rule**

In `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/.claude/rules/cloudflare.md`, replace the current `## Runtime entry` section with this exact text:

````markdown
## Runtime entry

Keep `src/middleware.ts` as the runtime entrypoint.

Do not rename `src/middleware.ts` to `src/proxy.ts` in this starter until
Cloudflare/OpenNext support is acceptable for a blind migration. Next.js warns
that `middleware` is deprecated, but this repo treats that as a known
platform-transition warning, not as a reason to risk the locale-routing
entrypoint.

The matcher must remain static string literals.

If a future branch revisits the migration, it must be a dedicated proof lane
with at least:

```bash
pnpm build
pnpm website:build:cf
node scripts/starter-checks.js cf-preview-smoke
```

If a deployed preview URL exists, also run:

```bash
node scripts/starter-checks.js deployed-smoke --base-url "$DEPLOYED_BASE_URL"
```
````

- [ ] **Step 5: Update route-mode contract**

In `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/quality/route-mode-contract.md`, replace the `## Deferred` section with:

```markdown
## Deferred

Do not rename `src/middleware.ts` to `src/proxy.ts`.

Next.js reports a `middleware` deprecation warning, but Cloudflare/OpenNext
support is not acceptable for a blind migration in this starter. Keep
`src/middleware.ts` until a dedicated proof lane demonstrates the renamed
runtime entrypoint across local build, Cloudflare/OpenNext build, local
Cloudflare preview smoke, and deployed smoke when a preview URL exists.
```

- [ ] **Step 6: Update quality proof middleware/proxy section**

In `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/website/quality-proof.md`, replace the whole section starting at:

```markdown
### 7. Cloudflare middleware/proxy 迁移证明
```

through the deployed smoke command block with:

````markdown
### 7. Cloudflare middleware/proxy 边界

Next.js 当前推荐 `proxy.ts`，并会输出 Next.js deprecation warning。
但这个 starter 暂不迁移：

- Do not rename `src/middleware.ts` to `src/proxy.ts`.
- Cloudflare/OpenNext support is not acceptable for a blind migration.
- 当前 `src/middleware.ts` 只负责 next-intl locale routing，稳定性优先于消除 warning。
- 这条 warning 作为 known platform-transition warning 记录，不作为 public launch blocker。

如果未来要迁移，必须单独开 proof lane，至少证明：

```bash
pnpm build
pnpm website:build:cf
node scripts/starter-checks.js cf-preview-smoke
```

如果有真实 preview deployment URL，再补：

```bash
node scripts/starter-checks.js deployed-smoke --base-url "$DEPLOYED_BASE_URL"
```
````

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```bash
pnpm exec vitest run tests/unit/middleware.test.ts tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 1**

Run:

```bash
git add tests/unit/middleware.test.ts tests/unit/scripts/proof-lane-contract.test.ts .claude/rules/cloudflare.md docs/quality/route-mode-contract.md docs/website/quality-proof.md
git commit -m "docs: defer proxy migration for cloudflare"
```

Expected: commit succeeds. Pre-commit may run type/lint checks.

## Task 2: Capture route-mode evidence without claiming closure

**Files:**
- Modify: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/quality/route-mode-contract.md`
- Generated ignored output only: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/reports/quality/route-mode-snapshot.json`

- [ ] **Step 1: Capture fresh build output**

Run:

```bash
pnpm build 2>&1 | tee /tmp/showcase-website-starter-20260509-build.log
```

Expected: build exits 0. It may still print `DYNAMIC_SERVER_USAGE` and `middleware` deprecation warnings.

- [ ] **Step 2: Generate route-mode snapshot**

Run:

```bash
pnpm route-mode:snapshot /tmp/showcase-website-starter-20260509-build.log
```

Expected: command exits 0 and writes `reports/quality/route-mode-snapshot.json`.

- [ ] **Step 3: Inspect the warning and route evidence**

Run:

```bash
rg -n "DYNAMIC_SERVER_USAGE|Route \\(app\\)|○|◐|ƒ|middleware.*deprecated|proxy" /tmp/showcase-website-starter-20260509-build.log
sed -n '1,220p' reports/quality/route-mode-snapshot.json
```

Expected: output shows whether `DYNAMIC_SERVER_USAGE` remains and shows parsed routes. If `DYNAMIC_SERVER_USAGE` is still present, do not claim route-mode closure.

- [ ] **Step 4: Update route-mode contract with exact current status**

If `DYNAMIC_SERVER_USAGE` remains, add this section to `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/quality/route-mode-contract.md` after `## Known build warning`:

````markdown
## 2026-05-09 evidence note

Fresh `pnpm build` evidence still emits `DYNAMIC_SERVER_USAGE`. The build exits
0, so this is not a compile failure, but route-mode proof remains not fully
closed. The route summary should be captured with:

```bash
pnpm route-mode:snapshot /tmp/showcase-website-starter-20260509-build.log
```

Do not report static/dynamic boundaries as fully attributed until the warning is
mapped to exact route/helper behavior or removed.
````

If `DYNAMIC_SERVER_USAGE` is gone, add this section instead:

```markdown
## 2026-05-09 evidence note

Fresh `pnpm build` evidence did not emit `DYNAMIC_SERVER_USAGE`. The route-mode
snapshot was generated from `/tmp/showcase-website-starter-20260509-build.log`.
Keep recording route summaries after release-facing builds because this document
is still a proof note, not a hard gate.
```

- [ ] **Step 5: Run doc and parser tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/route-mode-snapshot.test.ts tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Confirm generated reports are not staged**

Run:

```bash
git status --short --untracked-files=all
```

Expected: `reports/quality/route-mode-snapshot.json` may appear as ignored or untracked depending on local gitignore behavior, but do not stage it. Only docs should be staged for this task.

- [ ] **Step 7: Commit Task 2**

Run:

```bash
git add docs/quality/route-mode-contract.md
git commit -m "docs: record route mode warning evidence"
```

Expected: commit succeeds.

## Task 3: Verify strict launch and deployed lead proof boundaries

**Files:**
- Modify only if needed: `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/website/quality-proof.md`
- No expected source-code edits.

- [ ] **Step 1: Prove normal production config still passes**

Run:

```bash
node scripts/starter-checks.js validate-production-config
```

Expected: exit 0.

- [ ] **Step 2: Prove strict public-launch gate still blocks starter defaults**

Run:

```bash
set +e
PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config > /tmp/showcase-website-starter-20260509-strict-launch.log 2>&1
status=$?
set -e
cat /tmp/showcase-website-starter-20260509-strict-launch.log
test "$status" -ne 0
rg -n "PUBLIC_LAUNCH|starter|example|owner|logo|product|legal|Cloudflare|dashboard" /tmp/showcase-website-starter-20260509-strict-launch.log
```

Expected: command sequence exits 0 overall because strict launch itself exits non-zero and the shell test confirms that non-zero status. The log should contain launch blockers.

- [ ] **Step 3: Verify post-deploy canary remains gated**

Run:

```bash
rg -n "POST_DEPLOY_TEST|STAGING_URL|PLAYWRIGHT_BASE_URL|AIRTABLE_API_KEY|AIRTABLE_BASE_ID|owner notification|recordCreated|ownerNotified" tests/e2e/smoke/post-deploy-form.spec.ts docs/website/quality-proof.md
```

Expected: output shows that `tests/e2e/smoke/post-deploy-form.spec.ts` requires deployed-mode environment variables and docs distinguish record creation from owner notification.

- [ ] **Step 4: Run proof-boundary contract tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/starter-positioning-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Update docs only if any wording is misleading**

If Step 3 shows that docs already distinguish `recordCreated` from `ownerNotified`, do not edit docs.

If the wording is misleading, update only `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings/docs/website/quality-proof.md` by adding this exact sentence under the form canary section:

```markdown
Local form tests do not prove deployed Airtable/CRM write plus owner notification; that proof requires the deployed canary environment and manual target-system confirmation.
```

- [ ] **Step 6: Commit Task 3 only if docs changed**

If Step 5 changed docs, run:

```bash
git add docs/website/quality-proof.md
git commit -m "docs: clarify deployed lead proof boundary"
```

If Step 5 did not change docs, do not create an empty commit.

## Task 4: Verify Semgrep boundary and final local gates

**Files:**
- No planned edits.

- [ ] **Step 1: Confirm CI Semgrep and package boundary**

Run:

```bash
rg -n "semgrep/semgrep|semgrep scan --error --severity ERROR --config semgrep.yml src" .github/workflows/ci.yml
node -e 'const p=require("./package.json"); if ((p.dependencies&&p.dependencies.semgrep)||(p.devDependencies&&p.devDependencies.semgrep)) process.exit(1); console.log("no npm semgrep package")'
```

Expected: CI workflow contains official Semgrep container scan and Node command prints `no npm semgrep package`.

- [ ] **Step 2: Probe local Semgrep without calling absence a pass**

Run:

```bash
set +e
pnpm exec semgrep --config semgrep.yml src > /tmp/showcase-website-starter-20260509-semgrep.log 2>&1
status=$?
set -e
cat /tmp/showcase-website-starter-20260509-semgrep.log
if [ "$status" -eq 0 ]; then
  echo "local semgrep passed"
else
  echo "local semgrep blocked or failed with status $status"
fi
```

Expected: if `semgrep` is not installed, final notes must say local Semgrep is blocked. If it runs and fails with findings, treat them as findings, not as blocked.

- [ ] **Step 3: Run type and lint gates**

Run:

```bash
pnpm type-check
pnpm lint:check
```

Expected: both pass.

- [ ] **Step 4: Run final focused tests**

Run:

```bash
pnpm exec vitest run tests/unit/middleware.test.ts tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/route-mode-snapshot.test.ts tests/unit/scripts/warning-baseline-contract.test.ts tests/unit/scripts/starter-positioning-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run Cloudflare build proof sequentially**

Run:

```bash
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: both exit 0. Known generated warnings are acceptable if they match `docs/quality/cloudflare-warning-baseline.md`.

- [ ] **Step 6: Final status check**

Run:

```bash
git status --short --untracked-files=all
git log --oneline -5
```

Expected: only ignored/generated artifacts should remain untracked. Tracked working tree should be clean after final commits.

## Self-review checklist

- Spec coverage:
  - No-proxy migration policy: Task 1.
  - Public-launch blockers remain honest starter blockers: Task 3.
  - Deployed lead canary remains gated and not overclaimed: Task 3.
  - Route-mode warning evidence captured without closure overclaim: Task 2.
  - Semgrep CI/local boundary preserved: Task 4.
- Placeholder scan:
  - No `TBD`.
  - No "add tests" without exact test files and commands.
  - No source-code task asks for implementation without exact text or command.
- Type/file consistency:
  - Runtime entrypoint remains `src/middleware.ts`.
  - `src/proxy.ts` is never created.
  - Route snapshot script remains `scripts/quality/route-mode-snapshot.mjs`.
  - No `semgrep` package is added to `package.json`.
