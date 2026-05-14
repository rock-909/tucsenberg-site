# Retired Cloudflare Scripts Path Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove stale `scripts/cloudflare/**` current-truth references and guard against their return.

**Architecture:** Use the existing truth-doc guard. Add `scripts/cloudflare/**` as forbidden in `TIER-A-OWNER-MAP.md`, then update the owner map to the current `scripts/starter-checks.js` entrypoint.

**Tech Stack:** Node guardrail in `scripts/starter-checks.js`, Vitest truth-doc tests, markdown docs.

---

## File structure

- Modify: `scripts/starter-checks.js`
  - Add `scripts/cloudflare/**` to the forbidden patterns for `docs/guides/TIER-A-OWNER-MAP.md`.
- Modify: `tests/unit/scripts/current-truth-docs.test.ts`
  - Add a failing test for stale `scripts/cloudflare/**` in the Tier A owner map.
- Modify: `docs/guides/TIER-A-OWNER-MAP.md`
  - Replace `scripts/cloudflare/**` with `scripts/starter-checks.js`.

## Task 1: Add failing test

**Files:**
- Modify: `tests/unit/scripts/current-truth-docs.test.ts`

- [ ] **Step 1: Add test**

Add this test inside `describe("current-truth docs guard", () => { ... })`:

```ts
  it("flags retired Cloudflare script directory in Tier A owner map", () => {
    const files = createValidFiles();
    files["docs/guides/TIER-A-OWNER-MAP.md"] =
      "Platform build + deployment chain uses scripts/cloudflare/**.";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/guides/TIER-A-OWNER-MAP.md",
        error: 'forbidden current-truth pattern "scripts/cloudflare/**"',
      }),
    );
  });
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```

Expected: FAIL because `scripts/cloudflare/**` is not yet forbidden for the owner map.

## Task 2: Add guard and update owner map

**Files:**
- Modify: `scripts/starter-checks.js`
- Modify: `docs/guides/TIER-A-OWNER-MAP.md`

- [ ] **Step 1: Add forbidden pattern**

In `TRUTH_DOC_CHECKS`, for `docs/guides/TIER-A-OWNER-MAP.md`, add:

```js
"scripts/cloudflare/**",
```

- [ ] **Step 2: Update owner map platform row**

Replace:

```md
`open-next.config.ts`, `next.config.ts`, `.github/workflows/**`, `scripts/cloudflare/**`, `wrangler.jsonc`
```

with:

```md
`open-next.config.ts`, `next.config.ts`, `.github/workflows/**`, `scripts/starter-checks.js`, `wrangler.jsonc`
```

## Task 3: Verify

**Files:**
- No additional edits expected.

- [ ] **Step 1: Run focused truth-doc tests**

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

- [ ] **Step 4: Search active docs**

Run:

```bash
rg -n "scripts/cloudflare/\\*\\*" docs/guides docs/technical docs/website README.md AGENTS.md CLAUDE.md .claude/rules tests scripts
```

Expected: no active current-truth hits except tests that intentionally assert it as forbidden.
