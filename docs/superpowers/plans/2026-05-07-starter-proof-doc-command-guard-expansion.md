# Starter Proof Doc Command Guard Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand stale command detection to starter-facing website and deployment docs.

**Architecture:** Reuse the existing `collectCurrentTruthDocFindings()` truth-doc guard. Move the checked doc list into a named constant, add website/technical docs to that list, and keep package-script detection focused on `pnpm <script>` commands.

**Tech Stack:** Node guardrail script in `scripts/starter-checks.js`, Vitest unit coverage in `tests/unit/scripts/current-truth-docs.test.ts`.

---

## File structure

- Modify: `tests/unit/scripts/current-truth-docs.test.ts`
  - Add RED test for stale `pnpm website:content:readiness` in `docs/website/quality-proof.md`.
  - Add pass test for supported direct `POST_DEPLOY_TEST=1 ... pnpm exec ...`.
- Modify: `scripts/starter-checks.js`
  - Add `CURRENT_TRUTH_COMMAND_DOCS`.
  - Use it inside `collectCurrentTruthDocFindings()`.
  - Add the deployed canary direct command prefix.

## Task 1: Add failing tests first

**Files:**
- Modify: `tests/unit/scripts/current-truth-docs.test.ts`

- [ ] **Step 1: Add stale command fixture test**

Add this test inside `describe("current-truth docs guard", () => { ... })`:

```ts
  it("flags retired package scripts in starter-facing website docs", () => {
    const files = createValidFiles();
    files["package.json"] = JSON.stringify({
      scripts: {
        build: "next build",
      },
    });
    files["docs/website/quality-proof.md"] =
      "Run `pnpm website:content:readiness` after replacement.";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/website/quality-proof.md",
        error:
          'unknown package script command "pnpm website:content:readiness"',
      }),
    );
  });
```

- [ ] **Step 2: Add direct canary command allowlist test**

Add this test after the stale command test:

```ts
  it("allows deployed lead canary direct pnpm exec command in starter-facing docs", () => {
    const files = createValidFiles();
    files["package.json"] = JSON.stringify({
      scripts: {
        build: "next build",
      },
    });
    files["docs/website/quality-proof.md"] =
      'POST_DEPLOY_TEST=1 PLAYWRIGHT_BASE_URL="$DEPLOYED_BASE_URL" pnpm exec playwright test tests/e2e/smoke/';

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        file: "docs/website/quality-proof.md",
        error: 'unknown package script command "pnpm exec"',
      }),
    );
  });
```

- [ ] **Step 3: Run tests and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```

Expected: FAIL because `docs/website/quality-proof.md` is not currently scanned by the unknown package-script guard.

## Task 2: Expand guard scope

**Files:**
- Modify: `scripts/starter-checks.js`

- [ ] **Step 1: Add command doc list constant**

Add below `TRUTH_DOC_CHECKS`:

```js
const CURRENT_TRUTH_COMMAND_DOCS = [
  "docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md",
  "docs/guides/DERIVATIVE-PROJECT-REPLACEMENT-CHECKLIST.md",
  "docs/guides/RELEASE-PROOF-RUNBOOK.md",
  "docs/guides/QUALITY-PROOF-LEVELS.md",
  "docs/website/quality-proof.md",
  "docs/website/新项目替换清单.md",
  "docs/website/部署设置.md",
  "docs/technical/deployment-notes.md",
];
```

- [ ] **Step 2: Use the constant**

Replace the local `commandDocs` array inside `collectCurrentTruthDocFindings()` with:

```js
    const commandDocs = CURRENT_TRUTH_COMMAND_DOCS;
```

- [ ] **Step 3: Allow deployed canary direct pnpm exec prefix**

Add this item to `directCommandPrefixes`:

```js
'POST_DEPLOY_TEST=1 PLAYWRIGHT_BASE_URL="$DEPLOYED_BASE_URL" pnpm exec ',
```

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```

Expected: PASS.

## Task 3: Verify current docs

**Files:**
- No production edits expected.

- [ ] **Step 1: Run truth-doc guard**

Run:

```bash
node scripts/starter-checks.js truth-docs
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm lint:check
```

Expected: PASS.

- [ ] **Step 3: Search active docs for retired commands**

Run:

```bash
rg -n "pnpm (build:cf|smoke:cf|website:content:readiness|website:review:client-boundary|validate:launch-content|storybook:build)" docs/website docs/technical docs/guides docs/README.md README.md AGENTS.md CLAUDE.md .github tests scripts package.json
```

Expected: no active-doc hits except guard constants/tests that intentionally mention retired commands as forbidden examples.
