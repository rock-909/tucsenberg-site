# Component Governance Business Story Warning Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove business component missing-story warnings from component governance while preserving strict UI primitive Storybook governance.

**Architecture:** Keep `component:check` as the starter's component proof lane. The governance script remains strict for reusable UI primitives and design boundaries, but stops treating business/page Storybook coverage as a backlog.

**Tech Stack:** Node script in `scripts/starter-checks.js`, Vitest script tests, Storybook 10 with `@storybook/nextjs-vite`.

---

## File structure

- Modify: `tests/unit/scripts/component-governance-check.test.ts`
  - Update the fixture that currently expects a business missing-story warning.
  - It should now prove business components without stories produce no warnings.
- Modify: `scripts/starter-checks.js`
  - Remove the business story warning scan.
  - Keep the output payload's `warnings` property as an empty array.
- Modify: `docs/website/quality-proof.md`
  - Document the new component proof boundary in plain language.

## Task 1: Write the failing behavior test

**Files:**
- Modify: `tests/unit/scripts/component-governance-check.test.ts`

- [ ] **Step 1: Replace the business warning expectation**

Replace the first test with:

```ts
  it("passes valid primitive registry without warning on business components that lack stories", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/components/products/product-card.tsx":
          "export function ProductCard() { return null; }",
        "src/components/sections/hero-section.tsx":
          "export function HeroSection() { return null; }",
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("passed");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts
```

Expected: FAIL because the current script still returns `business-component-missing-story` warnings for selected business folders.

## Task 2: Remove the business story warning scan

**Files:**
- Modify: `scripts/starter-checks.js`

- [ ] **Step 1: Delete warning-specific constants and helpers**

Delete:

```js
const COMPONENT_GOVERNANCE_STORY_WARNING_ROOTS = [
  "src/components/contact",
  "src/components/footer",
  "src/components/forms",
  "src/components/products",
  "src/components/sections",
];
```

Delete:

```js
function getMatchingStoryPath(componentFile) {
  return componentFile.replace(/\.(?:tsx|jsx)$/, ".stories.tsx");
}

function isBusinessComponentOrSection(file) {
  if (!/\.(?:tsx|jsx)$/.test(file)) return false;
  if (!file.startsWith(`${COMPONENT_GOVERNANCE_COMPONENTS_ROOT}/`))
    return false;
  if (file.startsWith(`${COMPONENT_GOVERNANCE_UI_ROOT}/`)) return false;
  if (COMPONENT_GOVERNANCE_EXCLUDED_FILE_PATTERN.test(file)) return false;
  if (
    !COMPONENT_GOVERNANCE_STORY_WARNING_ROOTS.some((root) =>
      file.startsWith(`${root}/`),
    )
  ) {
    return false;
  }
  return true;
}

function collectStoryWarnings(rootDir, warnings) {
  for (const file of walkFiles(rootDir, COMPONENT_GOVERNANCE_COMPONENTS_ROOT)) {
    if (!isBusinessComponentOrSection(file)) continue;

    const storyPath = getMatchingStoryPath(file);
    if (!exists(rootDir, storyPath)) {
      warnings.push(
        createFinding(
          file,
          "business-component-missing-story",
          `Business component or section should have a matching story at ${storyPath}.`,
        ),
      );
    }
  }
}
```

- [ ] **Step 2: Keep warnings empty**

In `collectComponentGovernanceFindings()`, replace:

```js
  const warnings = [];
```

and remove:

```js
  collectStoryWarnings(rootDir, warnings);
```

Keep the return as:

```js
  return {
    status: errors.length === 0 ? "passed" : "failed",
    errors,
    warnings,
  };
```

This keeps CLI output stable.

- [ ] **Step 3: Run the focused tests and confirm GREEN**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts
```

Expected: PASS.

## Task 3: Document the proof boundary

**Files:**
- Modify: `docs/website/quality-proof.md`

- [ ] **Step 1: Add a short component proof section**

Add this section after the initial command list:

```md
## Component proof 边界

`pnpm component:check` 证明三件事：

- `src/components/ui/` 里的可复用 UI 基础组件都有 registry 和 Storybook story；
- 生产组件没有绕过 UI wrapper 直接用 Radix，也没有明显绕过设计 token；
- Storybook 当前能构建出来。

它不证明每一个业务区块、页面区块、表单组合都有 Storybook 覆盖。业务/page-level stories 是 starter 的示例和评审辅助，可以逐步增加，但不作为派生项目的硬门禁。
```

- [ ] **Step 2: Run docs-sensitive checks**

Run:

```bash
pnpm lint:check
```

Expected: PASS.

## Task 4: Run component proof lane

**Files:**
- No extra edits expected.

- [ ] **Step 1: Run component governance tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts tests/architecture/component-governance.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run governance CLI**

Run:

```bash
pnpm component:governance
```

Expected:

```text
[component-governance] passed: 0 error(s), 0 warning(s)
```

- [ ] **Step 3: Run full component check**

Run:

```bash
pnpm component:check
```

Expected: PASS, including Storybook build.

## Task 5: Run repo safety proof

**Files:**
- No extra edits expected.

- [ ] **Step 1: Run type check**

Run:

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 2: Run lint check**

Run:

```bash
pnpm lint:check
```

Expected: exit 0.
