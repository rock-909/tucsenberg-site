# Component Governance Foundation Implementation Plan

> Historical snapshot: this plan keeps the dependency versions that were true when it was written. For current versions, use `docs/technical/tech-stack.md` and `package.json`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first-stage governance foundation for the Starter redesign work so AI agents must reuse components, respect design tokens, expose reviewable Storybook states, and use one checklist before redesigning sections.

**Architecture:** This plan strengthens the existing governance layer through a machine-readable UI primitive registry, required Storybook coverage for every UI primitive, automated component governance checks, and documentation for future redesign work. It does not redesign production pages yet; later plans for full section redesign, product page redesign, Footer, Contact, page-level Storybook, and future client-site synchronization must use this foundation.

**Tech Stack:** Next.js 16.2.4, React 19.2.5, TypeScript 6.0.3, Tailwind CSS 4.2.4, Storybook 10.3.6, Vitest, Node.js scripts, existing project docs under `docs/website/` and `docs/impeccable/system/`.

---

## Scope and fixed decisions

This plan covers only **Phase 1: Starter component governance + redesign foundation**.

Fixed decisions:

- All `src/components/ui/*.tsx` primitives must be registered and must have Storybook stories.
- The plan file is committed with this branch.
- Component governance is wired only into `pnpm component:check` in Phase 1.
- Do not wire `component:check` into `website:check` or CI hard gates in this phase.
- Do not use permanent deletion APIs in plan examples, scripts, or tests.
- Scanner raw class scanning is a text-level obvious-violation scan, not a complete CSS or AST lint replacement.

This plan intentionally does **not** implement:

- Full-site section redesign.
- Product page redesign.
- Footer redesign.
- Contact form logic redesign.
- Business/section/page-level Storybook completion.
- Future client-site synchronization.

## Required current-project context

Before implementation, read:

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/rules/ui.md`
- `.claude/rules/testing.md`
- `.claude/rules/code-quality.md`
- `docs/website/README.md`
- `docs/website/新项目替换清单.md`
- `docs/website/AI工作流.md`
- `docs/impeccable/README.md`
- `docs/impeccable/system/COMPONENT-GOVERNANCE.md`
- `docs/impeccable/system/PAGE-PATTERNS.md`

Current facts:

- Current branch starts from `main`.
- Current `component:check` only runs `pnpm storybook:build`.
- Storybook config exists at `.storybook/main.ts` and `.storybook/preview.ts`.
- Current required-but-missing UI primitive stories are:
  - `accordion.stories.tsx`
  - `breadcrumb.stories.tsx`
  - `dropdown-menu.stories.tsx`
  - `lazy-island-error-boundary.stories.tsx`
  - `lazy-theme-switcher.stories.tsx`
  - `section-head.stories.tsx`
  - `separator.stories.tsx`
  - `sheet.stories.tsx`
  - `social-icons.stories.tsx`
  - `theme-switcher.stories.tsx`
  - `theme-switcher-highlight.stories.tsx`
- `.superpowers/` is local brainstorming runtime output and must remain ignored.

## File structure

Create:

- `src/components/component-governance.registry.json`
  - Machine-readable UI primitive inventory.
  - Every `src/components/ui/*.tsx` primitive must be listed.
  - Every listed primitive must be `{ "story": "required" }`.

- `scripts/component-governance-check.js`
  - Node.js governance scanner.
  - Emits hard errors for obvious AI misuse.
  - Emits warnings for reviewable Storybook backlog.
  - Writes `reports/guardrails/latest-component-governance.json` through `scripts/lib/guardrail-report.js`.

- `tests/unit/scripts/component-governance-check.test.ts`
  - Unit tests for the scanner using temporary fixture repositories.
  - Must not use Node permanent file or directory deletion APIs.

- Missing UI primitive stories under `src/components/ui/*.stories.tsx`.

- `docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md`
  - Required checklist for future section redesign tasks.

- `docs/impeccable/system/STORYBOOK-COVERAGE-MAP.md`
  - Storybook coverage tiers and planned fill order.

Modify:

- `.gitignore`
  - Add `.superpowers/`.

- `package.json`
  - Add component governance scripts.
  - Change `component:check` from Storybook-only to governance tests + governance scan + Storybook build.

- `tests/architecture/component-governance.test.ts`
  - Read the registry.
  - Enforce registry/schema/story coverage.

- `docs/impeccable/system/COMPONENT-GOVERNANCE.md`
- `.claude/rules/ui.md`
- `docs/website/AI工作流.md`
- `docs/impeccable/README.md`

---

## Governance policy to implement

Hard failures:

1. Registry file missing.
2. A UI primitive exists in `src/components/ui/*.tsx` but is missing from registry.
3. Registry lists a primitive whose `src/components/ui/<name>.tsx` file does not exist.
4. Registry item lacks `story`.
5. Registry item has `story` value other than `"required"`.
6. Required story file is missing.
7. Production app/component code imports `@radix-ui/*` outside `src/components/ui/`.
8. Production app/component code uses obvious raw Tailwind palette classes, such as `text-blue-600`, `bg-gray-50`, `border-amber-200`, or `dark:text-neutral-400`.
9. Browser UI imports `src/config/static-theme-colors.ts` or `@/config/static-theme-colors`.
10. Storybook build fails.

Warnings:

1. Composed business component under `src/components/forms/`, `src/components/products/`, `src/components/footer/`, or `src/components/contact/` lacks a matching story.
2. Section under `src/components/sections/` lacks a matching story.

Warnings are expected backlog in Phase 1. They must be visible but must not fail `pnpm component:governance`.

---

## Task 0: Branch hygiene and plan correction

**Owner:** Main session.

**Files:**

- Modify: `.gitignore`
- Modify: `docs/superpowers/plans/2026-05-01-component-governance-redesign-foundation.md`

Steps:

1. Confirm current state:

   ```bash
   git status --short --branch --untracked-files=all
   git rev-parse --short HEAD
   ```

2. Create branch:

   ```bash
   git switch -c feat/component-governance-foundation
   ```

3. Record base commit:

   ```bash
   git rev-parse HEAD > /tmp/showcase-component-governance-base.txt
   ```

4. Add `.superpowers/` to `.gitignore`.
5. Replace this plan with the corrected version that:
   - uses `git status --short --branch --untracked-files=all`;
   - makes all UI primitive stories required;
   - removes `deferred` as a registry policy;
   - removes permanent deletion APIs from examples;
   - adds invalid registry scanner tests.
6. Verify:

   ```bash
   git status --short --branch --untracked-files=all
   git status --short --ignored .superpowers
   node - <<'NODE'
   const fs = require("node:fs");
   const path = "docs/superpowers/plans/2026-05-01-component-governance-redesign-foundation.md";
   const source = fs.readFileSync(path, "utf8");
   const blocked = [
     ["fs", "rmSync"].join("."),
     [["fs", "un"].join("."), "linkSync"].join(""),
     ["fs", "rmdirSync"].join("."),
     ["find", "delete"].join(" -"),
   ];
   const hits = blocked.filter((pattern) => source.includes(pattern));
   if (hits.length > 0) {
     console.error(hits.join("\n"));
     process.exit(1);
   }
   NODE
   ```

   Expected: the `rg` command returns no matches.

7. Commit:

   ```bash
   git add .gitignore docs/superpowers/plans/2026-05-01-component-governance-redesign-foundation.md
   git commit -m "docs: plan component governance foundation"
   ```

---

## Task 1: Registry + architecture contract

**Owner:** Worker 1.

**Write scope:**

- `src/components/component-governance.registry.json`
- `tests/architecture/component-governance.test.ts`

Steps:

1. Create `src/components/component-governance.registry.json` with every current `src/components/ui/*.tsx` primitive and `"story": "required"` for each:

   ```json
   {
     "version": 1,
     "components": {
       "accordion": { "story": "required" },
       "badge": { "story": "required" },
       "breadcrumb": { "story": "required" },
       "button": { "story": "required" },
       "card": { "story": "required" },
       "dropdown-menu": { "story": "required" },
       "input": { "story": "required" },
       "label": { "story": "required" },
       "lazy-island-error-boundary": { "story": "required" },
       "lazy-theme-switcher": { "story": "required" },
       "section-head": { "story": "required" },
       "separator": { "story": "required" },
       "sheet": { "story": "required" },
       "social-icons": { "story": "required" },
       "textarea": { "story": "required" },
       "theme-switcher": { "story": "required" },
       "theme-switcher-highlight": { "story": "required" }
     }
   }
   ```

2. Update `tests/architecture/component-governance.test.ts` to:
   - read the registry file;
   - compare registry names exactly with `src/components/ui/*.tsx` component names;
   - fail if registry version is not `1`;
   - fail if a registry item is missing `story`;
   - fail if `story !== "required"`;
   - fail if any required story file is missing.
3. Keep existing checks for direct Radix imports outside UI wrappers and Storybook exploration imports out of production.
4. Run:

   ```bash
   pnpm exec vitest run tests/architecture/component-governance.test.ts
   ```

   Expected during Task 1 before Task 2: this may fail only because required stories are still missing.

5. Commit only if the failure mode is exactly missing story coverage. Otherwise fix the contract first.

Commit:

```bash
git add src/components/component-governance.registry.json tests/architecture/component-governance.test.ts
git commit -m "test: enforce component governance registry"
```

---

## Task 2: Complete UI primitive Storybook coverage

**Owner:** Worker 2.

**Write scope:**

- Missing `src/components/ui/*.stories.tsx` files only.

Create stories for:

- `accordion`
- `breadcrumb`
- `dropdown-menu`
- `lazy-island-error-boundary`
- `lazy-theme-switcher`
- `section-head`
- `separator`
- `sheet`
- `social-icons`
- `theme-switcher`
- `theme-switcher-highlight`

Requirements:

- Import real production components.
- Do not change production component APIs.
- Do not create story-only production components.
- Include at least one practical default story per primitive.
- Include meaningful variants where the primitive already exposes variants or orientations, such as `Separator` horizontal/vertical and `Sheet` side placement.
- Use generic starter content, not client-site-specific content.
- For lazy components, use controlled Storybook examples that do not depend on deleting files or causing real import failures.

Validation:

```bash
pnpm storybook:build
pnpm exec vitest run tests/architecture/component-governance.test.ts
```

Commit:

```bash
git add src/components/ui/*.stories.tsx
git commit -m "test: add ui primitive story coverage"
```

---

## Task 3: Component governance scanner + tests

**Owner:** Worker 3.

**Write scope:**

- `scripts/component-governance-check.js`
- `tests/unit/scripts/component-governance-check.test.ts`

Scanner requirements:

- Export `collectComponentGovernanceFindings(rootDir = process.cwd())`.
- Return:

  ```ts
  {
    status: "passed" | "failed";
    errors: Array<{ file: string; line: number; kind: string; detail: string }>;
    warnings: Array<{ file: string; line: number; kind: string; detail: string }>;
  }
  ```

- Write guardrail report with `writeGuardrailSummary("component-governance", payload)`.
- Scan only `src/components` and `src/app` for production UI violations.
- Exclude `.stories.*`, `.test.*`, `.spec.*`, and `__tests__/`.
- Treat raw Tailwind palette detection as a text-level obvious-violation scan and say so in script comments.
- Detect static imports from `@radix-ui/*` outside `src/components/ui/`.
- Detect static and dynamic obvious imports of `static-theme-colors`.
- Detect obvious raw palette classes.

Test requirements:

- Do not use Node permanent file or directory deletion APIs.
- Missing story test must create fixture without the story file.
- Temporary fixture cleanup must move fixture directories into a recoverable trash directory under `os.tmpdir()`, for example `showcase-component-governance-test-trash`.
- Cover:
  - valid registry and stories pass with expected warnings;
  - registry missing;
  - UI primitive missing from registry;
  - registry lists nonexistent primitive;
  - registry item missing `story`;
  - registry item has invalid `story`;
  - required story missing;
  - direct Radix import outside UI wrapper;
  - direct Radix import inside UI wrapper allowed;
  - raw Tailwind palette class in production UI;
  - raw Tailwind palette in story/test ignored;
  - static color import via alias and relative paths detected.

Validation:

```bash
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts
node scripts/component-governance-check.js
```

Expected:

- test passes;
- scanner exits 0;
- scanner may print warnings for existing business/section story backlog.

Commit:

```bash
git add scripts/component-governance-check.js tests/unit/scripts/component-governance-check.test.ts
git commit -m "test: add component governance scanner"
```

---

## Task 4: Command wiring

**Owner:** Main session or Worker 4.

**Write scope:**

- `package.json`

Modify scripts:

```json
"component:governance:test": "pnpm exec vitest run tests/architecture/component-governance.test.ts tests/unit/scripts/component-governance-check.test.ts",
"component:governance": "node scripts/component-governance-check.js",
"component:check": "pnpm component:governance:test && pnpm component:governance && pnpm storybook:build"
```

Do not modify `website:check`.

Validation:

```bash
pnpm component:governance:test
pnpm component:governance
pnpm component:check
```

Commit:

```bash
git add package.json
git commit -m "chore: wire component governance check"
```

---

## Task 5: Docs + redesign foundation

**Owner:** Worker 5.

**Write scope:**

- `docs/impeccable/system/COMPONENT-GOVERNANCE.md`
- `.claude/rules/ui.md`
- `docs/website/AI工作流.md`
- `docs/impeccable/README.md`
- `docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md`
- `docs/impeccable/system/STORYBOOK-COVERAGE-MAP.md`

Requirements:

- Document that all UI primitives require Storybook stories.
- Document registry + scanner + Storybook as the three governance layers.
- Document that scanner raw palette matching is an obvious text scan, not a full AST/CSS lint replacement.
- Document that business/section/page story coverage remains follow-up backlog.
- Add `.superpowers/` to non-committed local AI runtime guidance.
- Add section redesign checklist for future section work.
- Add Storybook coverage map:
  - Tier 0: UI primitives complete in this phase.
  - Tier 1+: business components, sections, page-level stories as follow-up.

Validation:

```bash
pnpm review:docs-truth
pnpm component:governance:test
```

Commit:

```bash
git add docs/impeccable/system/COMPONENT-GOVERNANCE.md .claude/rules/ui.md docs/website/AI工作流.md docs/impeccable/README.md docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md docs/impeccable/system/STORYBOOK-COVERAGE-MAP.md
git commit -m "docs: strengthen component governance rules"
```

---

## Task 6: Integration review and final proof

**Owner:** Main session.

Steps:

1. Confirm no unsafe deletion APIs in planned/test/script changes:

   ```bash
   node - <<'NODE'
   const fs = require("node:fs");
   const path = require("node:path");
   const roots = ["docs/superpowers/plans", "tests", "scripts"];
   const blocked = [
     ["fs", "rmSync"].join("."),
     [["fs", "un"].join("."), "linkSync"].join(""),
     ["fs", "rmdirSync"].join("."),
     ["find", "delete"].join(" -"),
   ];
   const matches = [];
   function walk(dir) {
     if (!fs.existsSync(dir)) return;
     for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
       const fullPath = path.join(dir, entry.name);
       if (entry.isDirectory()) {
         walk(fullPath);
         continue;
       }
       const source = fs.readFileSync(fullPath, "utf8");
       for (const pattern of blocked) {
         if (source.includes(pattern)) matches.push(`${fullPath}: ${pattern}`);
       }
     }
   }
   roots.forEach(walk);
   if (matches.length > 0) {
     console.error(matches.join("\n"));
     process.exit(1);
   }
   NODE
   ```

   Expected: no matches.

2. Confirm registry/story coverage:

   ```bash
   pnpm component:governance:test
   ```

3. Confirm scanner:

   ```bash
   pnpm component:governance
   ```

   Expected: hard fail count 0; warnings only for business/section story backlog.

4. Confirm full component gate:

   ```bash
   pnpm component:check
   ```

5. Confirm general quality:

   ```bash
   pnpm type-check
   pnpm lint:check
   pnpm test
   ```

6. Optional broad proof:

   ```bash
   pnpm website:check
   ```

7. Review diff:

   ```bash
   BASE_COMMIT=$(cat /tmp/showcase-component-governance-base.txt)
   git diff --stat "$BASE_COMMIT"..HEAD
   git diff --name-only "$BASE_COMMIT"..HEAD
   git status --short --branch --untracked-files=all
   ```

8. Prepare PR summary noting:
   - UI primitive Storybook coverage is now complete.
   - Component governance is wired only into `component:check`.
   - Business/section/page stories remain follow-up backlog.
