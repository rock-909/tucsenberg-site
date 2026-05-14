# Cloudflare Rule and Architecture Path Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the remaining active `scripts/cloudflare/**` references with `scripts/starter-checks.js`.

**Architecture:** Update one rule frontmatter trigger and one architecture diagram label. Add the diagram to current-truth guards so the retired path cannot return unnoticed.

**Tech Stack:** Markdown/YAML frontmatter, SVG text label, existing Node truth-doc guard, Vitest tests.

---

## File structure

- Modify: `.claude/rules/cloudflare.md`
  - Replace retired path trigger.
- Modify: `docs/technical/project-architecture-diagram.svg`
  - Replace retired deployment build-chain label.
- Modify: `scripts/starter-checks.js`
  - Add architecture diagram forbidden-pattern check.
- Modify: `tests/unit/scripts/current-truth-docs.test.ts`
  - Add a test for stale architecture diagram path.

## Task 1: Add failing architecture diagram guard test

**Files:**
- Modify: `tests/unit/scripts/current-truth-docs.test.ts`

- [ ] **Step 1: Add test**

Add this test inside `describe("current-truth docs guard", () => { ... })`:

```ts
  it("flags retired Cloudflare script directory in the architecture diagram", () => {
    const files = createValidFiles();
    files["docs/technical/project-architecture-diagram.svg"] =
      "<text>next.config.ts + scripts/cloudflare/**</text>";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/technical/project-architecture-diagram.svg",
        error: 'forbidden current-truth pattern "scripts/cloudflare/**"',
      }),
    );
  });
```

- [ ] **Step 2: Run focused test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```

Expected: FAIL because the architecture diagram is not yet part of the truth-doc checks.

## Task 2: Update guard and files

**Files:**
- Modify: `scripts/starter-checks.js`
- Modify: `.claude/rules/cloudflare.md`
- Modify: `docs/technical/project-architecture-diagram.svg`

- [ ] **Step 1: Add truth-doc check**

Add to `TRUTH_DOC_CHECKS`:

```js
  {
    file: "docs/technical/project-architecture-diagram.svg",
    forbidden: ["scripts/cloudflare/**"],
  },
```

- [ ] **Step 2: Update Cloudflare rule path trigger**

Replace:

```yaml
  - "scripts/cloudflare/**"
```

with:

```yaml
  - "scripts/starter-checks.js"
```

- [ ] **Step 3: Update architecture diagram label**

Replace:

```xml
<text x="1448" y="866" class="code">next.config.ts + scripts/cloudflare/**</text>
```

with:

```xml
<text x="1448" y="866" class="code">next.config.ts + scripts/starter-checks.js</text>
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

- [ ] **Step 4: Search active surfaces**

Run:

```bash
rg -n "scripts/cloudflare/\\*\\*" docs/guides docs/technical docs/website README.md AGENTS.md CLAUDE.md .claude/rules tests scripts
```

Expected: only forbidden-pattern tests/constants mention the retired path.
