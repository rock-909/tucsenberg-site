# Design Governance Command Guard Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the active section redesign checklist onto current proof commands and prevent retired command names from returning.

**Architecture:** Extend the existing truth-doc command guard to scan `docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md`. Then update that document to use `node scripts/starter-checks.js truth-docs` and `pnpm component:check` as the current proof lane.

**Tech Stack:** Node guardrail script in `scripts/starter-checks.js`, Vitest guard tests, markdown docs.

---

## File structure

- Modify: `tests/unit/scripts/current-truth-docs.test.ts`
  - Add a failing test proving retired commands in `SECTION-REDESIGN-CHECKLIST.md` are flagged.
- Modify: `scripts/starter-checks.js`
  - Add `docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md` to `CURRENT_TRUTH_COMMAND_DOCS`.
- Modify: `docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md`
  - Replace retired command references with current commands.

## Task 1: Add failing guard test

**Files:**
- Modify: `tests/unit/scripts/current-truth-docs.test.ts`

- [ ] **Step 1: Add test**

Add this test after the website-doc stale command test:

```ts
  it("flags retired package scripts in active design governance docs", () => {
    const files = createValidFiles();
    files["package.json"] = JSON.stringify({
      scripts: {
        "component:check": "echo ok",
      },
    });
    files["docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md"] =
      "Run `pnpm storybook:build` for section review.";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md",
        error: 'unknown package script command "pnpm storybook:build"',
      }),
    );
  });
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```

Expected: FAIL because the design-governance doc is not yet scanned.

## Task 2: Expand guard scope

**Files:**
- Modify: `scripts/starter-checks.js`

- [ ] **Step 1: Add doc path**

Add to `CURRENT_TRUTH_COMMAND_DOCS`:

```js
  "docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md",
```

- [ ] **Step 2: Run focused tests and confirm the new test passes or exposes live doc drift**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```

Expected: if the live doc still has retired commands, this may now fail on current-doc truth; proceed to Task 3.

## Task 3: Update section redesign checklist commands

**Files:**
- Modify: `docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md`

- [ ] **Step 1: Replace command block**

Replace:

```bash
pnpm review:docs-truth
pnpm component:governance:test
pnpm component:check
pnpm storybook:build
pnpm type-check
pnpm lint:check
```

with:

```bash
node scripts/starter-checks.js truth-docs
pnpm component:governance:test
pnpm component:check
pnpm type-check
pnpm lint:check
```

- [ ] **Step 2: Replace explanatory bullets**

Replace:

```md
- 只改治理文档：优先跑 `pnpm review:docs-truth`。
- 改 UI primitive、registry、scanner 或 Storybook coverage：跑 `pnpm component:governance:test` 和相关 Storybook 检查。
```

with:

```md
- 只改治理文档：优先跑 `node scripts/starter-checks.js truth-docs`。
- 改 UI primitive、registry、scanner 或 Storybook coverage：跑 `pnpm component:governance:test`；需要 Storybook build 证明时跑 `pnpm component:check`。
```

## Task 4: Verify

**Files:**
- No additional edits expected.

- [ ] **Step 1: Run focused guard tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run truth-doc guard**

Run:

```bash
node scripts/starter-checks.js truth-docs
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm lint:check
```

Expected: PASS.

- [ ] **Step 4: Search active docs for retired commands**

Run:

```bash
rg -n "pnpm (build:cf|smoke:cf|website:content:readiness|website:review:client-boundary|validate:launch-content|storybook:build|review:docs-truth)" docs -g '!docs/superpowers/**' -g '!docs/audits/**'
```

Expected: no active-doc hits.
