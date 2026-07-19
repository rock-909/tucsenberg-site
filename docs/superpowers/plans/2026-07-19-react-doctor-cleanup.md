# react-doctor Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the confirmed real defects surfaced by `react-doctor` (async serialization, Zod 4 deprecated formats, render-time static rebuild, unstable list key, redundant re-export, loop-scan lookup), silence build-artifact false positives via config, then reclaim regenerable build caches — without touching governance-protected surfaces.

**Architecture:** All changes are behavior-preserving edits in `chore/react-doctor-cleanup`. No new runtime features. Verification leans on the repo's existing gates (`type-check`, `lint:check`, `test`, `build`) plus a before/after `react-doctor` report, per the CLAUDE.md "smallest validation that proves the change" rule — new tests are added only where behavior is worth pinning.

**Tech Stack:** Next.js 16 App Router (RSC), React 19, TypeScript strict, Zod ^4.4.3, next-intl, Vitest, pnpm, lefthook.

## Global Constraints

- Branch `chore/react-doctor-cleanup`; `main` is the only long-lived branch; merge via PR (owner merges — do not merge).
- TypeScript strict, no `any`; default `interface` for object shapes.
- Commit subjects: commitlint lowercase after type (e.g. `fix: ...`, `chore: ...`). lefthook pre-commit + commit-msg hooks run on every commit.
- Governance red lines are OUT OF SCOPE and must NOT be changed: `dropdown-menu` unused exports, `sharp` devDependency, `cookie-banner` `role="dialog"`, and the three `only-export-components` RSC files. See spec `docs/superpowers/specs/2026-07-19-react-doctor-cleanup-design.md` section C.
- Never permanently delete files; move to Trash (`trash` CLI).
- Do not run `pnpm build` and `pnpm website:build:cf` in parallel (shared `.next`).

---

### Task 1: Zod 4 top-level string formats in env.ts

**Files:**
- Modify: `src/lib/env.ts` (lines 50, 52, 85, 91, 92, 93, 94)

**Interfaces:**
- Consumes: nothing new.
- Produces: no signature change — `serverEnvSchema` / `clientEnvSchema` keep identical parsed types (`z.url()` returns the same `ZodString`-compatible URL validator as `z.string().url()` in Zod 4).

- [ ] **Step 1: Apply the 7 replacements.** Change each `z.string().url()` to `z.url()`, preserving the trailing `.optional()` / `.default(...)` chains verbatim:

```ts
UPSTASH_REDIS_REST_URL: z.url().optional(),
KV_REST_API_URL: z.url().optional(),
CSP_REPORT_URI: z.url().optional(),
NEXT_PUBLIC_BASE_URL: z.url().default("http://localhost:3000"),
NEXT_PUBLIC_SITE_URL: z.url().optional(),
NEXT_PUBLIC_WEBSITE_BASE_URL: z.url().optional(),
NEXT_PUBLIC_WEBSITE_SECONDARY_BASE_URL: z.url().optional(),
```

- [ ] **Step 2: Type-check.** Run: `pnpm type-check` — Expected: PASS (0 errors).
- [ ] **Step 3: Run env-related tests if present.** Run: `pnpm test -- env` — Expected: PASS, or "no tests" (then rely on type-check + build).
- [ ] **Step 4: Commit.**

```bash
git add src/lib/env.ts
git commit -m "fix: use zod 4 top-level url() format in env schema"
```

---

### Task 2: Parallelize independent getTranslations awaits

**Files:**
- Modify: `src/app/[locale]/request-quote/page.tsx:92-103`
- Modify: `src/components/content/trade-landing-shell.tsx:37-39`

**Interfaces:**
- Consumes: `getTranslations` from next-intl (already imported in both files).
- Produces: identical local bindings (`tPage`, `tMeta`, `tInquiryForm`; `t`, `tNav`, `tFaq`) — only their acquisition becomes concurrent.

- [ ] **Step 1: request-quote/page.tsx** — replace the three sequential awaits (keep `setRequestLocale(locale)` on the line above, untouched):

```ts
const [tPage, tMeta, tInquiryForm] = await Promise.all([
  getTranslations({ locale, namespace: "requestQuote.page" }),
  getTranslations({ locale, namespace: "requestQuote.metadata" }),
  getTranslations({ locale, namespace: "inquiry.form" }),
]);
```

- [ ] **Step 2: trade-landing-shell.tsx** — replace the three sequential awaits:

```ts
const [t, tNav, tFaq] = await Promise.all([
  getTranslations({ locale, namespace: "oemLanding" }),
  getTranslations({ locale, namespace: "navigation" }),
  getTranslations({ locale, namespace: "faq" }),
]);
```

- [ ] **Step 3: Type-check + lint.** Run: `pnpm type-check && pnpm lint:check` — Expected: PASS.
- [ ] **Step 4: Build (RSC render path).** Run: `pnpm build` — Expected: success, both routes render.
- [ ] **Step 5: Commit.**

```bash
git add "src/app/[locale]/request-quote/page.tsx" src/components/content/trade-landing-shell.tsx
git commit -m "perf: parallelize independent gettranslations awaits"
```

---

### Task 3: Hoist static plankBottoms out of render

**Files:**
- Modify: `src/components/products/product-diagrams.tsx` (around line 205, inside `GateDiagram`)

**Interfaces:**
- Consumes: nothing.
- Produces: no export change; a module-scope `const` replaces the in-render literal.

- [ ] **Step 1: Move the static array to module scope.** Delete `const plankBottoms = [222, 179, 136, 93];` from inside the component and add, near the top of the file (module scope, after imports):

```ts
const GATE_PLANK_BOTTOMS = [222, 179, 136, 93] as const;
```

Update the in-component reference to `GATE_PLANK_BOTTOMS`. Leave `plankHeight` / `plankGap` as-is unless they are also unused-static AND trivially hoistable in the same block; if either is referenced only as a static literal, hoist it too with a `GATE_` prefix. Do NOT change any rendered coordinates.

- [ ] **Step 2: Type-check + lint.** Run: `pnpm type-check && pnpm lint:check` — Expected: PASS.
- [ ] **Step 3: Commit.**

```bash
git add src/components/products/product-diagrams.tsx
git commit -m "perf: hoist static gate plank layout to module scope"
```

---

### Task 4: Stable key for hero proof items

**Files:**
- Modify: `src/components/sections/hero-section-view.tsx:78`

**Interfaces:**
- Consumes: `HeroSectionProofItem` (`{ value: string; label?: string }`).
- Produces: no signature change.

- [ ] **Step 1: Confirm value uniqueness.** Inspect the `proofItems` data source feeding `content.proofItems`. If every `item.value` is unique, key by value. If values can repeat, key by `value` + `label`. Do NOT introduce array index into the key.

```tsx
key={item.label !== undefined ? `${item.value}::${item.label}` : item.value}
```

(If the data source proves `value` alone is unique, `key={item.value}` is sufficient — prefer the simplest form the data supports.)

- [ ] **Step 2: Lint + type-check.** Run: `pnpm type-check && pnpm lint:check` — Expected: PASS.
- [ ] **Step 3: Commit.**

```bash
git add src/components/sections/hero-section-view.tsx
git commit -m "fix: use stable content key for hero proof items"
```

---

### Task 5: Drop redundant parseHeadingId re-export

**Files:**
- Modify: `src/lib/content/render-legal-content.tsx` (lines 1-7)

**Interfaces:**
- Consumes: `createStaticMarkdownContent` (still used by `createLegalContent`).
- Produces: `render-legal-content.tsx` no longer re-exports `parseHeadingId`. Verified no importer relies on that path — consumers (`legal-page.ts`, `render-static-markdown-content.tsx`) import `parseHeadingId` from `@/lib/content/render-static-markdown-content` directly.

- [ ] **Step 1: Remove the re-export and its now-unused import.** Result:

```ts
import type { ReactNode } from "react";
import { createStaticMarkdownContent } from "@/lib/content/render-static-markdown-content";

export function createLegalContent(content: string): ReactNode {
  return createStaticMarkdownContent(content);
}
```

- [ ] **Step 2: Confirm nothing imported parseHeadingId from this module.** Run: `grep -rn "parseHeadingId" src/ | grep "render-legal-content"` — Expected: no matches (the file no longer mentions it).
- [ ] **Step 3: Dead-export gate + type-check.** Run: `pnpm knip:check && pnpm type-check` — Expected: PASS (this export was the reported dead surface).
- [ ] **Step 4: Commit.**

```bash
git add src/lib/content/render-legal-content.tsx
git commit -m "chore: drop redundant parseheadingid re-export"
```

---

### Task 6: Set-based lookup in inquiry field error matcher

**Files:**
- Modify: `src/components/forms/inquiry-form-fields.tsx` (around line 37-39)

**Interfaces:**
- Consumes: `FIELD_ERROR_CODES[field]` (`readonly string[]`), `fieldDetails` (`readonly string[]`).
- Produces: identical return (`matchedCode: string | undefined`), same downstream `.split(".")` logic unchanged.

- [ ] **Step 1: Replace the nested includes-in-find with a Set membership test.**

```ts
const codes = FIELD_ERROR_CODES[field];
const codeSet = new Set<string>(codes as readonly string[]);
const matchedCode = fieldDetails.find((detail) => codeSet.has(detail));
```

- [ ] **Step 2: Type-check + lint.** Run: `pnpm type-check && pnpm lint:check` — Expected: PASS.
- [ ] **Step 3: Run form tests if present.** Run: `pnpm test -- inquiry` — Expected: PASS, or "no tests".
- [ ] **Step 4: Commit.**

```bash
git add src/components/forms/inquiry-form-fields.tsx
git commit -m "perf: use set lookup for inquiry field error matching"
```

---

### Task 7: react-doctor config to ignore build artifacts

**Files:**
- Create: react-doctor config file (exact name/format TBD in Step 1)

**Interfaces:**
- Consumes: nothing.
- Produces: local full-scan reports no longer flag `.open-next`/`.next` (removes 3× `insecure-crypto-risk` + 1× `unsafe-json-in-html` false positives). CI (`--base` diff scan) is unaffected — those dirs are gitignored.

- [ ] **Step 1: Discover the supported config mechanism.** Run: `npx --yes react-doctor@latest --help` and inspect for a config-file flag or ignore option. Confirm the exact config filename and schema (e.g. a `react-doctor.json` / `.reactdoctorrc` `ignore`/`exclude` array, or a CLI `--ignore` glob). Do NOT guess the format — use whatever the installed CLI documents.
- [ ] **Step 2: Add the ignore entry** for `.open-next/**` and `.next/**` (and `node_modules/**` if not already default-excluded), using the confirmed format.
- [ ] **Step 3: Verify the false positives are gone.** Run: `pnpm react:doctor:report > /tmp/rd-after.json` and confirm zero diagnostics with `filePath` under `.open-next` or `.next`.
- [ ] **Step 4: Confirm CI script still parses.** Run: `pnpm react:doctor` (no base) — Expected: runs without config errors.
- [ ] **Step 5: Commit.**

```bash
git add <config-file>
git commit -m "chore: ignore build artifacts in react-doctor scans"
```

---

### Task 8: Regenerable build-cache cleanup

**Files:** none (filesystem maintenance)

- [ ] **Step 1: Measure.** Run: `du -sh .next .open-next node_modules/.cache 2>/dev/null` and list Turbopack cache if separate.
- [ ] **Step 2: Move regenerable caches to Trash** (NOT `node_modules` itself). Use `trash` for each existing dir: `.next`, `.open-next`, `node_modules/.cache`. Skip any that don't exist.
- [ ] **Step 3: Prove rebuild works.** Run: `pnpm build` — Expected: success from a cold cache.
- [ ] **Step 4: No commit** (these dirs are gitignored; nothing to commit).

---

### Task 9: Final verification and report

- [ ] **Step 1: Full gate sweep.** Run: `pnpm type-check && pnpm lint:check && pnpm test` — Expected: all PASS.
- [ ] **Step 2: Before/after react-doctor.** Run: `pnpm react:doctor:report` and compare score + remaining diagnostics against the baseline (69/100, 24 findings). Confirm the only remaining findings are the documented governance-protected/false-positive items from spec section C.
- [ ] **Step 3: Push branch (do NOT merge).** Run: `git push -u origin chore/react-doctor-cleanup`. Wait for CI green, then hand to owner to merge (per memory `pr-merge-workflow`).
- [ ] **Step 4: Update spec** with the final score and residual-findings list if it differs from the prediction.

---

## Self-Review

**Spec coverage:** Every spec section-A/B fix maps to a task (A1→T1, A-async→T2, A-hoist→T3, A-herokey→T4, A-reexport→T5, A-setmap→T6, B-config→T7); cache cleanup→T8; verification→T9. Section-C items are explicitly OUT OF SCOPE per Global Constraints. No gaps.

**Placeholder scan:** Task 7 Step 1 intentionally defers the config filename to runtime discovery (the CLI is the source of truth) rather than guessing — this is a discovery step with a concrete command, not a placeholder. All code steps carry real code.

**Type consistency:** `GATE_PLANK_BOTTOMS` (T3), `codeSet` (T6), and the `Promise.all` destructurings (T2) preserve existing names/types; no cross-task signature drift.
