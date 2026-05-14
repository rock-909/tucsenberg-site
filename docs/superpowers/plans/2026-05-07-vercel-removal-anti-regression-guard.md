# Vercel Removal Anti-Regression Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Vercel deployment artifacts from returning to the Cloudflare-only starter.

**Architecture:** Add one focused proof-lane contract test that asserts removed Vercel files stay absent. This is a guard-only change; no runtime or workflow behavior changes.

**Tech Stack:** Vitest, Node `fs.existsSync`, current `tests/unit/scripts/proof-lane-contract.test.ts`.

---

## File structure

- Modify: `tests/unit/scripts/proof-lane-contract.test.ts`
  - Add a focused Vercel anti-regression test.

## Task 1: Add the anti-regression test

**Files:**
- Modify: `tests/unit/scripts/proof-lane-contract.test.ts`

- [ ] **Step 1: Add test**

Add this test inside `describe("proof lane contract", () => { ... })`, near other deployment/script-surface tests:

```ts
  it("keeps Vercel deployment artifacts out of the starter", () => {
    for (const relativePath of [
      "vercel.json",
      ".github/workflows/vercel-deploy.yml",
      "docs/impeccable/external/vercel-design-system/README.md",
    ]) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test iterates over a fixed retired Vercel artifact allowlist
      expect(fs.existsSync(path.join(REPO_ROOT, relativePath))).toBe(false);
    }
  });
```

- [ ] **Step 2: Run focused test**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: PASS in the current repo because those artifacts are already absent.

## Task 2: Verify repo safety

**Files:**
- No extra edits expected.

- [ ] **Step 1: Run lint**

Run:

```bash
pnpm lint:check
```

Expected: PASS.

- [ ] **Step 2: Search active surfaces for Vercel deployment references**

Run:

```bash
rg -n "Vercel|vercel|VERCEL|vercel\\.json|@vercel" README.md AGENTS.md CLAUDE.md .github docs/website docs/technical docs/guides tests scripts package.json src/config src/lib src/app
```

Expected: no active deployment references, except tests that intentionally guard absence if the search scope includes them.
