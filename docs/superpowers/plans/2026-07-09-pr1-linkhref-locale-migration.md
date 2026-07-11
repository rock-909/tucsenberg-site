# PR1 — LinkHref / Locale Type-Migration Unblocker · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the `LinkHref` type out of the soon-to-be-deleted `route-parsing.ts`, and repoint every live `Locale` consumer that currently routes through a soon-to-be-deleted/shrunk module onto the canonical `@/i18n/routing` source — so later PRs can delete those modules without breaking live code.

**Architecture:** Pure type-level refactor, **zero runtime/behavior change**. `LinkHref` gets a dedicated 2-line home; all importers repoint to it. `Locale` gets a single source of truth (`@/i18n/routing-config`, surfaced via the `@/i18n/routing` barrel); the retiring re-export chain (`structured-data-types` → `structured-data` → `page-structured-data`, and `types/i18n`) is bypassed. Two architecture boundary tests encode the invariant as durable guards.

**Tech Stack:** TypeScript 6 (strict), Vitest (architecture tests read source via `node:fs`), next-intl routing types.

## Global Constraints

- **TypeScript strict** — no `any`; type-only imports use `import type`.
- **Zero behavior change** — this PR moves types and repoints imports only. No runtime logic, no JSX, no data changes. `Locale` resolves to the same `"en"` union everywhere (`routing.locales` is derived from `LOCALES_CONFIG.locales`, so `config/paths` Locale and `routing-config` Locale are the identical type).
- **Deletion discipline** — no files are deleted in this PR (route-parsing.ts et al. are deleted in later PRs). This PR only ensures they have no live importers.
- **Branch** — work on a fresh branch off `main` (e.g. `audit/01-linkhref-locale`). Do not merge; owner approves merge.
- **Verification per task** — `pnpm type-check` must stay green; the full `pnpm test` suite must stay green (behavior unchanged).
- **Commit messages** — commitlint enforces a **lower-case subject** (`subject-case`). No capitals in the subject line: write `link-href`/`locale`, not `LinkHref`/`Locale`. Pre-commit hooks (lefthook) run type-check + eslint + a fast test subset + config-check on every commit — expect ~7s per commit.

---

### Task 0: Branch setup

- [ ] **Step 1: Create the PR1 branch off main**

Run:
```bash
git switch main
git switch -c audit/01-linkhref-locale
```
Expected: `Switched to a new branch 'audit/01-linkhref-locale'`

(The spec + reports from PR0 live on `audit/00-spec-and-reports`; PR1 branches independently off `main`.)

---

### Task 1: Extract `LinkHref` to a dedicated module

**Files:**
- Create: `src/lib/i18n/link-href.ts`
- Create: `tests/architecture/linkhref-source-boundary.test.ts`
- Modify (repoint import): `src/components/products/catalog-breadcrumb-view.tsx:2`, `src/lib/contact/product-family-context.ts:6`, `src/components/sections/sample-cta-view.tsx:2`, `src/components/sections/final-cta-view.tsx:1`, `src/components/sections/resources-section-view.tsx:1`, `src/components/sections/products-section-view.tsx:1`, `src/components/sections/products-section.tsx:2`, `src/components/sections/starter-boundary-section-view.tsx:2`, `src/components/sections/homepage-section.fixtures.ts:1`

**Interfaces:**
- Produces: `export type LinkHref` from `@/lib/i18n/link-href` — identical definition to the current one: `ComponentProps<typeof Link>["href"]` where `Link` is `@/i18n/routing`'s Link.

- [ ] **Step 1: Write the failing guard test**

Create `tests/architecture/linkhref-source-boundary.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function productionSourceFiles(): string[] {
  return readdirSync("src", { recursive: true, encoding: "utf8" })
    .filter((entry) => /\.tsx?$/.test(entry) && !entry.includes("__tests__"))
    .map((entry) => join("src", entry));
}

describe("LinkHref lives in its own module, not the retiring route-parsing file", () => {
  it("no production source imports from @/lib/i18n/route-parsing", () => {
    const offenders = productionSourceFiles().filter(
      (file) =>
        !file.endsWith(join("lib", "i18n", "route-parsing.ts")) &&
        readFileSync(file, "utf8").includes('from "@/lib/i18n/route-parsing"'),
    );
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/architecture/linkhref-source-boundary.test.ts`
Expected: FAIL — `offenders` lists 9 files (2 live: catalog-breadcrumb-view, product-family-context; 7 in sections/).

- [ ] **Step 3: Create the dedicated `LinkHref` module**

Create `src/lib/i18n/link-href.ts`:
```ts
import type { ComponentProps } from "react";
import type { Link } from "@/i18n/routing";

/**
 * Type for next-intl's Link `href` prop. Supports both string paths and
 * `{ pathname, params }` objects for dynamic routes.
 */
export type LinkHref = ComponentProps<typeof Link>["href"];
```

- [ ] **Step 4: Repoint all 9 importers**

In each of the following files, change the import specifier from `@/lib/i18n/route-parsing` to `@/lib/i18n/link-href` (the imported name `LinkHref` is unchanged):
- `src/components/products/catalog-breadcrumb-view.tsx:2`
- `src/lib/contact/product-family-context.ts:6`
- `src/components/sections/sample-cta-view.tsx:2`
- `src/components/sections/final-cta-view.tsx:1`
- `src/components/sections/resources-section-view.tsx:1`
- `src/components/sections/products-section-view.tsx:1`
- `src/components/sections/products-section.tsx:2`
- `src/components/sections/starter-boundary-section-view.tsx:2`
- `src/components/sections/homepage-section.fixtures.ts:1`

Each line becomes exactly:
```ts
import type { LinkHref } from "@/lib/i18n/link-href";
```

Note: `products-section.tsx:36` uses `... as LinkHref` — that stays; only its import line changes.
Note: `route-parsing.ts` keeps its own internal `LinkHref` definition (it is deleted in a later PR); do not touch it.

- [ ] **Step 5: Run the guard test + type-check to verify green**

Run: `pnpm exec vitest run tests/architecture/linkhref-source-boundary.test.ts && pnpm type-check`
Expected: PASS (test), and type-check clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/i18n/link-href.ts tests/architecture/linkhref-source-boundary.test.ts \
  src/components/products/catalog-breadcrumb-view.tsx src/lib/contact/product-family-context.ts \
  src/components/sections/sample-cta-view.tsx src/components/sections/final-cta-view.tsx \
  src/components/sections/resources-section-view.tsx src/components/sections/products-section-view.tsx \
  src/components/sections/products-section.tsx src/components/sections/starter-boundary-section-view.tsx \
  src/components/sections/homepage-section.fixtures.ts
git commit -m "refactor: move link-href type out of retiring route-parsing module"
```

---

### Task 2: Unify `Locale` source and bypass the retiring re-export chain

**Files:**
- Create: `tests/architecture/locale-source-boundary.test.ts`
- Modify: `src/config/paths/types.ts:5-7` (single source), `src/lib/structured-data.ts:10,13` (repoint import, drop re-export), `src/lib/page-structured-data.ts:6` (repoint), `src/lib/navigation.ts:7` (repoint), `src/lib/contact/getContactCopy.ts:1` (repoint), `src/lib/__tests__/contact-get-contact-copy.test.ts:2` (repoint)

**Interfaces:**
- Consumes: canonical `Locale` from `@/i18n/routing` (which re-exports `type Locale` from `@/i18n/routing-config`).
- Produces: `config/paths` continues to export `Locale` (now re-exported from `routing-config`, not independently derived) — no consumer of `@/config/paths` changes.

- [ ] **Step 1: Write the failing guard test**

Create `tests/architecture/locale-source-boundary.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function productionSourceFiles(): string[] {
  return readdirSync("src", { recursive: true, encoding: "utf8" })
    .filter((entry) => /\.tsx?$/.test(entry) && !entry.includes("__tests__"))
    .map((entry) => join("src", entry));
}

// Modules staged for retirement in later PRs must not be a `Locale` source.
const RETIRING_LOCALE_SOURCES = [
  'from "@/lib/structured-data-types"',
  'from "@/lib/structured-data"',
  'from "@/types/i18n"',
];

describe("Locale is sourced from the canonical i18n module, not retiring ones", () => {
  it("no production source imports Locale from a retiring module", () => {
    const offenders = productionSourceFiles().filter((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .some(
          (line) =>
            line.includes("Locale") &&
            RETIRING_LOCALE_SOURCES.some((source) => line.includes(source)),
        ),
    );
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/architecture/locale-source-boundary.test.ts`
Expected: FAIL — offenders include `src/lib/structured-data.ts`, `src/lib/page-structured-data.ts`, `src/lib/navigation.ts`, `src/lib/contact/getContactCopy.ts`.

- [ ] **Step 3: Make `config/paths/types.ts` re-export the canonical Locale (single source)**

In `src/config/paths/types.ts`, replace lines 5-7:
```ts
import { LOCALES_CONFIG } from "@/config/paths/locales-config";

export type Locale = (typeof LOCALES_CONFIG.locales)[number];
```
with:
```ts
import type { Locale } from "@/i18n/routing-config";

export type { Locale };
```
(If `LOCALES_CONFIG` is now unused elsewhere in the file, remove its import — lint will flag it. `Locale` remains locally usable at `LocalizedPath`'s `[locale in Locale]`.)

- [ ] **Step 4: Repoint `structured-data.ts` and drop its Locale re-export**

In `src/lib/structured-data.ts`:
- Line 10: change `import type { Locale } from "@/lib/structured-data-types";` → `import type { Locale } from "@/i18n/routing";`
- Line 13: delete `export type { Locale } from "@/lib/structured-data-types";` entirely.

(`generateJSONLD` and the `Locale` params at lines 45/49/67 keep working; the retiring `structured-data-types`/`structured-data-helpers` imports at lines 4-9/15 are untouched — those are handled in PR5.)

- [ ] **Step 5: Repoint the remaining live Locale consumers**

- `src/lib/page-structured-data.ts:6`: `import type { Locale } from "@/lib/structured-data";` → `import type { Locale } from "@/i18n/routing";`
- `src/lib/navigation.ts:7`: `import type { Locale } from "@/types/i18n";` → `import type { Locale } from "@/i18n/routing";`
- `src/lib/contact/getContactCopy.ts:1`: `import type { Locale } from "@/types/i18n";` → `import type { Locale } from "@/i18n/routing";`
- `src/lib/__tests__/contact-get-contact-copy.test.ts:2`: `import type { Locale } from "@/types/i18n";` → `import type { Locale } from "@/i18n/routing";`

- [ ] **Step 6: Run guard test + type-check + full suite to verify green and behavior-unchanged**

Run: `pnpm exec vitest run tests/architecture/locale-source-boundary.test.ts && pnpm type-check`
Expected: PASS (test), type-check clean.

Then run the full suite to confirm zero behavior change:
Run: `pnpm test`
Expected: all pass (same as before this PR).

- [ ] **Step 7: Commit**

```bash
git add tests/architecture/locale-source-boundary.test.ts src/config/paths/types.ts \
  src/lib/structured-data.ts src/lib/page-structured-data.ts src/lib/navigation.ts \
  src/lib/contact/getContactCopy.ts src/lib/__tests__/contact-get-contact-copy.test.ts
git commit -m "refactor: unify locale type source on i18n routing, bypass retiring re-exports"
```

---

### Task 3: Final verification (build)

- [ ] **Step 1: Production build stays green**

Run: `pnpm build`
Expected: successful build (this catches any Next.js/type-resolution regression from the moved types).

- [ ] **Step 2: Confirm the unblock invariant holds**

Run:
```bash
grep -rn 'from "@/lib/i18n/route-parsing"' src --include='*.ts' --include='*.tsx' | grep -v route-parsing.ts | grep -v __tests__ || echo "CLEAN: no production importers of route-parsing"
```
Expected: `CLEAN: no production importers of route-parsing`

PR1 done. `route-parsing.ts` (PR5), `structured-data-types.ts` (PR5), and `types/i18n.ts` (PR8) now have no live importers blocking their deletion.

---

## Self-Review

- **Spec coverage:** PR1 row of the design doc = "LinkHref 迁出被判死的 route-parsing.ts、Locale 归一到 routing-config 并删多层 re-export——解除删除陷阱。纯类型移动零行为变化." → Task 1 (LinkHref), Task 2 (Locale single-source + bypass retiring re-export chain), Tasks verify zero behavior change. Covered. (Note: the ~15 `locale as Locale` assertions in pages are consistency cleanup, NOT delete-blockers — deferred; `@/types/content.types` keeps its Locale re-export because that file survives, so its ~14 consumers are intentionally left untouched to keep PR1 minimal.)
- **Placeholder scan:** none — every step has exact paths, code, and commands.
- **Type consistency:** `LinkHref` name unchanged across Task 1; `Locale` canonical path `@/i18n/routing` consistent across Task 2; `config/paths` continues to export `Locale`. `routing.locales` ⊇ `LOCALES_CONFIG.locales` confirmed identical, so the unification is type-safe.
