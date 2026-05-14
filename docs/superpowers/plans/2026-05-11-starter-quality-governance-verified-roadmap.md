# Starter Quality Governance Verified Roadmap Implementation Plan

> **Status update, 2026-05-12:** This roadmap predates the Phase 3 governance branch and is now partially superseded. In particular, Wave W3 / Task W3-1 must not be executed as written: Phase 3 intentionally keeps `src/config/website/*` as a replacement and compatibility surface, adds runtime-boundary guards, and derives only proven mirror fields. Treat W3-1 as a future breaking-design RFC that needs fresh approval, not as an approved implementation task.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the verified repo-quality findings into safe, isolated repair waves that reduce governance, config, docs, and test weight without touching the stable lead/API/runtime core.

**Architecture:** Execute this as a verified roadmap, not as one huge cleanup patch. W1 archives or retires low-risk clutter, W2 moves code without changing behavior, W3 changes starter truth-source design behind tests and docs, and W4 reduces component/test/documentation granularity. Each wave must run in an isolated worktree and be independently mergeable.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6 strict mode, pnpm, Vitest, ESLint, Storybook governance, React Doctor, Cloudflare/OpenNext, Superpowers workflow.

---

## Execution isolation

Current workspace is shared with other active sessions. Do not execute this roadmap directly in the dirty workspace.

- [ ] **Step 1: Confirm current workspace state before implementation**

Run:

```bash
git status --short --branch --untracked-files=all
```

Expected: command prints the current branch and any existing dirty files. Treat all pre-existing dirty files as owned by other sessions unless the current task explicitly claims them.

- [ ] **Step 2: Create an isolated implementation workspace**

Use `superpowers:using-git-worktrees`, or create an equivalent git worktree with a new branch:

```bash
git worktree add ../showcase-website-starter-quality-verified chore/starter-quality-governance-verified-roadmap
cd ../showcase-website-starter-quality-verified
```

Expected: implementation happens outside `/Users/Data/workspace/showcase-website-starter`, so existing untracked plans and docs are not overwritten.

- [ ] **Step 3: Re-check status in the isolated workspace**

Run:

```bash
git status --short --branch --untracked-files=all
```

Expected: clean worktree on `chore/starter-quality-governance-verified-roadmap`, unless the implementation branch intentionally contains carried changes.

## Global rules for every task

- Do not permanently delete files. Move tracked docs into an archive path with `git mv`; move retired code/assets to `.context/trash/starter-quality-governance-verified/<original-path>` before staging removal.
- Use `apply_patch` for manual edits.
- Do not run `pnpm build` and `pnpm website:build:cf` in parallel because both write `.next`.
- Before Next.js routing, metadata, font, layout, or head changes, read the relevant local Next docs under `node_modules/next/dist/docs/`.
- Before each implementation wave, read matching `.claude/rules/*` files from `AGENTS.md` routing table.
- Commit after each task or small task group passes focused validation.

## Evidence classification used by this plan

### Confirmed and actionable

- `src/config/website/*` is a replacement mirror, not the runtime truth source. It has heavy docs/tests/scripts references, so retirement must be staged.
- React Doctor has too much governance around a currently quiet gate: multiple package scripts, CI steps, classification scripts, raw baseline, and contract tests.
- Root audit handoff files belong in an audit archive, not repo root.
- `scripts/starter-checks.js` is a 4436-line multi-command script and should be split by command.
- `src/lib` top-level files are too flat; `src/services/url-generator.ts` is called from `src/lib/seo-metadata.ts`, creating an inverted layer.
- `eslint.config.mjs` contains glob entries for paths that do not exist.
- Route-local font assets include one loaded font and several unused `woff2` files.
- Brand facts appear in messages, content, generated manifest, scripts, and config; only factual site identity should be derived from `src/config/single-site.ts`.
- Adding a new public page touches too many separate surfaces.

### Actionable with caution

- `src/lib/actions/contact.ts` is a compatibility Server Action path, not the primary browser form path. Retire it only after tests/docs stop depending on it.
- `src/components/emails/` is not empty; it contains an orphan test for templates that live under `src/emails/`.
- `tsconfig.test.json` and `tsconfig.typecheck-source.json` have documentation references. Do not remove them without either wiring them into scripts or updating docs.
- `i18n-performance.ts` is still imported. Do not remove it in this roadmap.
- `footer-style-tokens.ts` already uses some CSS variables. The real cleanup is stale font token alignment, not blanket color rewrite.

### Explicitly rejected from the original issue list

Do not remove or rewrite these as part of this roadmap:

- `src/lib/contact/submit-canonical-contact.ts`
- `src/lib/blog/starter-blog.ts`
- production-used UI primitives: `label`, `textarea`, `badge`, `separator`
- `i18n.json`
- `src/middleware.ts` to `proxy.ts`
- lead pipeline core: `src/lib/lead-pipeline/**`
- thin API route handler pattern under `src/app/api/contact`, `src/app/api/inquiry`, `src/app/api/subscribe`
- `@storybook/addon-mcp`

---

## Wave W1: Low-risk slimming and archive

**Goal:** Remove obvious root clutter and self-maintaining governance weight while keeping runtime behavior stable.

**Commit boundary:** 4 to 6 small commits. Do not combine React Doctor removal with font/head cleanup.

### Task W1-1: Archive root audit handoff files

**Files:**
- Move: `audit-report-20260509.md` -> `docs/audits/archive/2026-05/audit-report-20260509.md`
- Move: `audit-owner-summary-20260509.md` -> `docs/audits/archive/2026-05/audit-owner-summary-20260509.md`
- Move: `HANDOFF.md` -> `docs/audits/archive/2026-05/HANDOFF.md`
- Modify if links fail: `docs/audits/README.md`

- [ ] **Step 1: Confirm files exist**

Run:

```bash
ls -1 audit-report-20260509.md audit-owner-summary-20260509.md HANDOFF.md
```

Expected:

```text
HANDOFF.md
audit-owner-summary-20260509.md
audit-report-20260509.md
```

- [ ] **Step 2: Create archive directory and move files**

Run:

```bash
mkdir -p docs/audits/archive/2026-05
git mv audit-report-20260509.md docs/audits/archive/2026-05/audit-report-20260509.md
git mv audit-owner-summary-20260509.md docs/audits/archive/2026-05/audit-owner-summary-20260509.md
git mv HANDOFF.md docs/audits/archive/2026-05/HANDOFF.md
```

Expected: root directory no longer contains these three files, and git status shows three renames.

- [ ] **Step 3: Verify no root references remain**

Run:

```bash
rg -n "audit-report-20260509|audit-owner-summary-20260509|HANDOFF.md" .
```

Expected: either no output, or references only under `docs/audits/archive/2026-05/` and intentional archive index text.

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/audits/archive/2026-05
git commit -m "docs: archive root audit handoff files"
```

Expected: commit contains only audit archive moves.

### Task W1-2: Slim React Doctor governance to the useful gate

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/website/quality-proof.md`
- Modify: `docs/quality/react-doctor-baseline.md`
- Modify: `tests/unit/scripts/warning-baseline-contract.test.ts`
- Modify: `tests/unit/workflows/ci-preview-env.test.ts`
- Modify: `tests/unit/scripts/route-mode-snapshot.test.ts`
- Move to `.context/trash/starter-quality-governance-verified/`: `scripts/quality/react-doctor-raw-governance.mjs`
- Move to `.context/trash/starter-quality-governance-verified/`: `docs/quality/react-doctor-raw-baseline.json`
- Move to `.context/trash/starter-quality-governance-verified/`: `tests/unit/scripts/react-doctor-classify.test.ts`
- Keep initially: `react-doctor.config.json`
- Keep initially: `scripts/quality/react-doctor-classify.mjs` if `react:doctor:report` remains useful for manual inspection

- [ ] **Step 1: Prove the base gate works before slimming**

Run:

```bash
pnpm react:doctor
```

Expected: exit 0. If it fails, stop and fix the actual React Doctor error before removing governance layers.

- [ ] **Step 2: Remove CI raw governance steps**

In `.github/workflows/ci.yml`, remove CI steps whose `run` lines are:

```yaml
pnpm react:doctor:governance
pnpm react:doctor:raw-governance
```

Keep the step that runs:

```yaml
pnpm react:doctor
```

- [ ] **Step 3: Reduce package scripts**

In `package.json`, keep these scripts:

```json
"react:doctor": "react-doctor . --offline --fail-on error",
"react:doctor:report": "react-doctor . --offline --json --fail-on none"
```

Remove these scripts:

```json
"react:doctor:classify": "react-doctor . --offline --json --fail-on none > /tmp/showcase-react-doctor-current.json && node scripts/quality/react-doctor-classify.mjs /tmp/showcase-react-doctor-current.json reports/quality/react-doctor-classified.json",
"react:doctor:governance": "react-doctor . --offline --json --fail-on none > /tmp/showcase-react-doctor-current.json && node scripts/quality/react-doctor-classify.mjs /tmp/showcase-react-doctor-current.json reports/quality/react-doctor-classified.json --check",
"react:doctor:raw-governance": "node scripts/quality/react-doctor-raw-governance.mjs"
```

- [ ] **Step 4: Move raw governance artifacts to local trash**

Run:

```bash
mkdir -p .context/trash/starter-quality-governance-verified/scripts/quality
mkdir -p .context/trash/starter-quality-governance-verified/docs/quality
mkdir -p .context/trash/starter-quality-governance-verified/tests/unit/scripts
mv scripts/quality/react-doctor-raw-governance.mjs .context/trash/starter-quality-governance-verified/scripts/quality/react-doctor-raw-governance.mjs
mv docs/quality/react-doctor-raw-baseline.json .context/trash/starter-quality-governance-verified/docs/quality/react-doctor-raw-baseline.json
mv tests/unit/scripts/react-doctor-classify.test.ts .context/trash/starter-quality-governance-verified/tests/unit/scripts/react-doctor-classify.test.ts
git add -A scripts/quality/react-doctor-raw-governance.mjs docs/quality/react-doctor-raw-baseline.json tests/unit/scripts/react-doctor-classify.test.ts
```

Expected: tracked paths are staged as removed; local backup exists under `.context/trash/starter-quality-governance-verified/`.

- [ ] **Step 5: Update tests that asserted the removed governance**

Update these tests to assert only the retained base gate and report command:

```text
tests/unit/scripts/warning-baseline-contract.test.ts
tests/unit/workflows/ci-preview-env.test.ts
tests/unit/scripts/route-mode-snapshot.test.ts
```

The expected script keys should be:

```text
react:doctor
react:doctor:report
```

The expected CI step list should contain `pnpm react:doctor` and not contain `pnpm react:doctor:governance` or `pnpm react:doctor:raw-governance`.

- [ ] **Step 6: Update human docs**

In `docs/website/quality-proof.md` and `docs/quality/react-doctor-baseline.md`, describe React Doctor as:

```text
React Doctor is kept as an error-level CI gate. Warning classification is a human backlog reference, not a separate CI governance layer.
```

Do not claim the removed raw baseline is still enforced.

- [ ] **Step 7: Run focused validation**

Run:

```bash
pnpm test -- tests/unit/scripts/warning-baseline-contract.test.ts tests/unit/workflows/ci-preview-env.test.ts tests/unit/scripts/route-mode-snapshot.test.ts
pnpm react:doctor
```

Expected: Vitest exits 0 and `pnpm react:doctor` exits 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add package.json .github/workflows/ci.yml docs/website/quality-proof.md docs/quality/react-doctor-baseline.md tests/unit/scripts/warning-baseline-contract.test.ts tests/unit/workflows/ci-preview-env.test.ts tests/unit/scripts/route-mode-snapshot.test.ts
git commit -m "chore: slim react doctor governance"
```

Expected: commit removes raw governance and keeps the base React Doctor gate.

### Task W1-3: Clean impossible ESLint globs

**Files:**
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Confirm stale glob entries**

Run:

```bash
rg -n "tailwind.config.ts|src/scripts|src/components/dev-tools|src/app/\\*\\*/dev-tools|src/lib/dev-tools-positioning|src/lib/performance-monitoring-coordinator|src/constants/dev-tools|continue-eslint-fixes" eslint.config.mjs
```

Expected: output points to the `codex-scripts-and-dev-tools-config` file list.

- [ ] **Step 2: Remove only non-existing file patterns**

In `eslint.config.mjs`, remove these entries from the `files` array if the path does not exist:

```js
"src/scripts/**/*.{js,ts}",
"tailwind.config.ts",
"src/components/dev-tools/**/*.{ts,tsx}",
"src/app/**/dev-tools/**/*.{ts,tsx}",
"src/lib/dev-tools-positioning.ts",
"src/lib/performance-monitoring-coordinator.ts",
"src/constants/dev-tools.ts",
"continue-eslint-fixes.ts",
```

Keep these valid entries:

```js
"scripts/**/*.{js,ts}",
"config/**/*.{js,ts}",
".size-limit.js",
"next.config.ts",
"vitest.config.mts",
"playwright.config.ts",
"*.config.{js,ts,mjs}",
"src/app/**/diagnostics/**/*.{ts,tsx}",
"src/components/examples/ui-showcase/**/*.{ts,tsx}",
"src/constants/test-*.ts",
```

- [ ] **Step 3: Verify stale entries are gone**

Run:

```bash
rg -n "tailwind.config.ts|src/scripts|src/components/dev-tools|src/app/\\*\\*/dev-tools|src/lib/dev-tools-positioning|src/lib/performance-monitoring-coordinator|src/constants/dev-tools|continue-eslint-fixes" eslint.config.mjs
```

Expected: no output for removed entries.

- [ ] **Step 4: Run lint validation**

Run:

```bash
pnpm lint:check
```

Expected: exit 0.

- [ ] **Step 5: Commit**

Run:

```bash
git add eslint.config.mjs
git commit -m "chore: remove stale eslint override globs"
```

Expected: commit touches only `eslint.config.mjs`.

### Task W1-4: Move orphan email test to the real email module

**Files:**
- Move: `src/components/emails/__tests__/ProductInquiryEmail.test.tsx` -> `src/emails/__tests__/ProductInquiryEmail.test.tsx`
- Move to `.context/trash/starter-quality-governance-verified/`: empty `src/components/emails/` directory after tracked files are moved

- [ ] **Step 1: Confirm real template location**

Run:

```bash
find src/emails -maxdepth 2 -type f | sort
find src/components/emails -maxdepth 3 -type f | sort
```

Expected: `src/emails/ProductInquiryEmail.tsx` exists, and the only file under `src/components/emails` is the orphan test.

- [ ] **Step 2: Move the test next to real email templates**

Run:

```bash
git mv src/components/emails/__tests__/ProductInquiryEmail.test.tsx src/emails/__tests__/ProductInquiryEmail.test.tsx
```

Expected: git status shows a rename.

- [ ] **Step 3: Move now-empty directory to local trash**

Run:

```bash
mkdir -p .context/trash/starter-quality-governance-verified/src/components
mv src/components/emails .context/trash/starter-quality-governance-verified/src/components/emails
```

Expected: the empty shell is gone from `src/components/`, and backup exists in `.context/trash`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm test -- src/emails/__tests__/ProductInquiryEmail.test.tsx src/emails/__tests__/email-templates-render.test.tsx
```

Expected: exit 0.

- [ ] **Step 5: Commit**

Run:

```bash
git add -A src/components/emails src/emails/__tests__/ProductInquiryEmail.test.tsx
git commit -m "test: move product inquiry email test to email module"
```

Expected: commit records the test move and no production code change.

### Task W1-5: Remove unused route-local font assets after Next docs check

**Files:**
- Keep: `src/app/[locale]/Figtree-Latin.woff2`
- Keep: `src/app/[locale]/layout-fonts.ts`
- Move to `.context/trash/starter-quality-governance-verified/`: unused route-local `woff2` files under `src/app/[locale]/`
- Modify only if required: `src/app/[locale]/__tests__/layout-fonts.test.ts`

- [ ] **Step 1: Read local Next font docs before touching fonts**

Run:

```bash
rg -n "next/font|localFont|preload|font" node_modules/next/dist/docs | sed -n '1,80p'
```

Expected: output identifies the installed Next.js docs that explain `next/font/local`.

- [ ] **Step 2: Prove only Figtree is loaded by code**

Run:

```bash
rg -n "Figtree-Latin|GeistSans-Latin|open-sans-latin|localFont|--font-figtree|--font-geist" src/app src/components src/lib src/styles
```

Expected: `src/app/[locale]/layout-fonts.ts` references `Figtree-Latin.woff2`; unused `GeistSans-Latin.woff2` and `open-sans-*` files do not appear as loaded font sources.

- [ ] **Step 3: Move unused font files to local trash**

Run:

```bash
mkdir -p .context/trash/starter-quality-governance-verified/src/app/[locale]
mv 'src/app/[locale]/GeistSans-Latin.woff2' '.context/trash/starter-quality-governance-verified/src/app/[locale]/GeistSans-Latin.woff2'
mv 'src/app/[locale]/open-sans-latin-400-normal.woff2' '.context/trash/starter-quality-governance-verified/src/app/[locale]/open-sans-latin-400-normal.woff2'
mv 'src/app/[locale]/open-sans-latin-500-normal.woff2' '.context/trash/starter-quality-governance-verified/src/app/[locale]/open-sans-latin-500-normal.woff2'
mv 'src/app/[locale]/open-sans-latin-600-normal.woff2' '.context/trash/starter-quality-governance-verified/src/app/[locale]/open-sans-latin-600-normal.woff2'
mv 'src/app/[locale]/open-sans-latin-700-normal.woff2' '.context/trash/starter-quality-governance-verified/src/app/[locale]/open-sans-latin-700-normal.woff2'
git add -A 'src/app/[locale]'
```

Expected: git status stages removal of five unused fonts; backup exists in `.context/trash`.

- [ ] **Step 4: Run focused font validation**

Run:

```bash
pnpm test -- 'src/app/[locale]/__tests__/layout-fonts.test.ts'
pnpm type-check
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

Run:

```bash
git commit -m "chore: retire unused route-local font assets"
```

Expected: commit removes only unused font assets unless test assertions required a small update.

### Task W1-6: Decide head.tsx with Next metadata proof, not as a blind delete

**Files:**
- Candidate move to `.context/trash/starter-quality-governance-verified/`: `src/app/[locale]/head.tsx`
- Candidate move to `.context/trash/starter-quality-governance-verified/`: `src/app/[locale]/__tests__/head.test.tsx`
- Modify if needed: `src/app/[locale]/layout.tsx`
- Modify if needed: `src/app/[locale]/__tests__/layout.test.tsx`

- [ ] **Step 1: Read installed Next docs for metadata/head behavior**

Run:

```bash
rg -n "head\\.tsx|metadata|viewport|preload" node_modules/next/dist/docs | sed -n '1,120p'
```

Expected: output identifies installed docs explaining current App Router head and metadata behavior.

- [ ] **Step 2: Inspect what head.tsx currently emits**

Run:

```bash
sed -n '1,220p' 'src/app/[locale]/head.tsx'
sed -n '1,220p' 'src/app/[locale]/__tests__/head.test.tsx'
```

Expected: current behavior is understood before any move. Do not move the file if it owns a runtime-critical preload not covered elsewhere.

- [ ] **Step 3: If head.tsx is redundant, move it to local trash**

Run only after Step 2 proves no runtime-critical output is lost:

```bash
mkdir -p .context/trash/starter-quality-governance-verified/src/app/[locale]
mkdir -p .context/trash/starter-quality-governance-verified/src/app/[locale]/__tests__
mv 'src/app/[locale]/head.tsx' '.context/trash/starter-quality-governance-verified/src/app/[locale]/head.tsx'
mv 'src/app/[locale]/__tests__/head.test.tsx' '.context/trash/starter-quality-governance-verified/src/app/[locale]/__tests__/head.test.tsx'
git add -A 'src/app/[locale]/head.tsx' 'src/app/[locale]/__tests__/head.test.tsx'
```

Expected: tracked files are staged as removed; local backup exists.

- [ ] **Step 4: Run runtime validation**

Run:

```bash
pnpm test -- 'src/app/[locale]/__tests__/layout.test.tsx' tests/architecture/cache-components-page-boundary.test.ts
pnpm build
```

Expected: tests and build exit 0. Build output must not show a new metadata/head error.

- [ ] **Step 5: Commit or stop**

If validation passes:

```bash
git add -A 'src/app/[locale]/head.tsx' 'src/app/[locale]/__tests__/head.test.tsx' 'src/app/[locale]/layout.tsx' 'src/app/[locale]/__tests__/layout.test.tsx'
git commit -m "chore: retire redundant app router head file"
```

If validation fails, restore from `.context/trash/starter-quality-governance-verified/`, keep the file, and write the reason into the wave summary.

---

## Wave W2: Behavior-preserving structure moves

**Goal:** Make the codebase easier to reason about without changing public commands or runtime behavior.

**Commit boundary:** one extraction or one family move per commit.

### Task W2-1: Split `scripts/starter-checks.js` first wave

**Files:**
- Modify: `scripts/starter-checks.js`
- Create: `scripts/quality/checks/brand.js`
- Create: `scripts/quality/checks/content-slugs.js`
- Create: `scripts/quality/checks/eslint-disable.js`
- Create: `scripts/quality/checks/client-boundary.js`
- Modify focused tests under `tests/unit/scripts/`
- Modify: `docs/website/starter-checks-split-plan.md`

- [ ] **Step 1: Characterize the four public commands before extraction**

Run:

```bash
node scripts/starter-checks.js brand
node scripts/starter-checks.js content-slugs
node scripts/starter-checks.js eslint-disable
node scripts/starter-checks.js client-boundary
```

Expected: each command exits 0. Save any current stdout shape in the task notes before moving code.

- [ ] **Step 2: Extract one command at a time**

Order:

```text
content-slugs
eslint-disable
client-boundary
brand
```

For each command:

1. Add or update a focused test that proves `node scripts/starter-checks.js <command>` still works.
2. Move helper functions into `scripts/quality/checks/<command>.js`.
3. Keep `scripts/starter-checks.js` as the compatibility router.
4. Re-export legacy helpers from `scripts/starter-checks.js` only when existing tests still import them.

- [ ] **Step 3: Run focused tests after each extraction**

Run after each moved command:

```bash
pnpm test -- tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts tests/unit/scripts/check-eslint-disable-usage.test.ts tests/unit/scripts/client-boundary-budget.test.ts
node scripts/starter-checks.js brand
node scripts/starter-checks.js content-slugs
node scripts/starter-checks.js eslint-disable
node scripts/starter-checks.js client-boundary
```

Expected: all commands and focused tests exit 0.

- [ ] **Step 4: Record completed extraction**

Update `docs/website/starter-checks-split-plan.md` with:

```text
Phase 2 extracted commands: content-slugs, eslint-disable, client-boundary, brand.
Public command compatibility remains node scripts/starter-checks.js <command>.
```

- [ ] **Step 5: Commit**

Run:

```bash
git add scripts/starter-checks.js scripts/quality/checks tests/unit/scripts docs/website/starter-checks-split-plan.md
git commit -m "chore: extract starter check command modules"
```

Expected: public command names are unchanged.

### Task W2-2: Move obvious `src/lib` top-level families into existing subfolders

**Files:**
- Move: `src/lib/security-crypto.ts` -> `src/lib/security/crypto.ts`
- Move: `src/lib/security-validation.ts` -> `src/lib/security/validation.ts`
- Move: `src/lib/turnstile.ts` -> `src/lib/security/turnstile.ts`
- Move: `src/lib/load-messages.ts` -> `src/lib/i18n/load-messages.ts`
- Move: `src/lib/i18n-performance.ts` -> `src/lib/i18n/performance.ts`
- Move: `src/lib/spec-table-translator.ts` -> `src/lib/i18n/spec-table-translator.ts`
- Move: `src/lib/utm.ts` -> `src/lib/marketing/utm.ts`
- Move: `src/lib/server-action-utils.ts` -> `src/lib/actions/server-action-utils.ts`
- Modify imports across `src/` and tests.

- [ ] **Step 1: Verify current import graph**

Run:

```bash
rg -n "@/lib/(security-crypto|security-validation|turnstile|load-messages|i18n-performance|spec-table-translator|utm|server-action-utils)|\\.\\./(security-crypto|security-validation|turnstile|load-messages|i18n-performance|spec-table-translator|utm|server-action-utils)" src tests
```

Expected: output lists every import to update.

- [ ] **Step 2: Create missing target folders**

Run:

```bash
mkdir -p src/lib/marketing
```

Expected: `src/lib/security`, `src/lib/i18n`, and `src/lib/actions` already exist; `src/lib/marketing` now exists.

- [ ] **Step 3: Move files with git tracking**

Run:

```bash
git mv src/lib/security-crypto.ts src/lib/security/crypto.ts
git mv src/lib/security-validation.ts src/lib/security/validation.ts
git mv src/lib/turnstile.ts src/lib/security/turnstile.ts
git mv src/lib/load-messages.ts src/lib/i18n/load-messages.ts
git mv src/lib/i18n-performance.ts src/lib/i18n/performance.ts
git mv src/lib/spec-table-translator.ts src/lib/i18n/spec-table-translator.ts
git mv src/lib/utm.ts src/lib/marketing/utm.ts
git mv src/lib/server-action-utils.ts src/lib/actions/server-action-utils.ts
```

Expected: git status shows renames.

- [ ] **Step 4: Update imports only**

Update imports to the new paths:

```text
@/lib/security-crypto -> @/lib/security/crypto
@/lib/security-validation -> @/lib/security/validation
@/lib/turnstile -> @/lib/security/turnstile
@/lib/load-messages -> @/lib/i18n/load-messages
@/lib/i18n-performance -> @/lib/i18n/performance
@/lib/spec-table-translator -> @/lib/i18n/spec-table-translator
@/lib/utm -> @/lib/marketing/utm
@/lib/server-action-utils -> @/lib/actions/server-action-utils
```

Do not change function names or runtime behavior in this task.

- [ ] **Step 5: Run focused validation**

Run:

```bash
pnpm test -- src/lib/__tests__/security-crypto.test.ts src/lib/__tests__/security-validation.test.ts src/lib/__tests__/i18n-performance.test.ts src/lib/__tests__/load-messages-runtime.test.ts src/lib/__tests__/utm.test.ts src/lib/__tests__/server-action-utils.test.ts
pnpm type-check
```

Expected: exit 0. If test file paths still use old names, rename tests in a separate commit after imports pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add -A src/lib src tests
git commit -m "refactor: group lib top-level utility families"
```

Expected: behavior-preserving move commit.

### Task W2-3: Move `src/services/url-generator.ts` into SEO family

**Files:**
- Move: `src/services/url-generator.ts` -> `src/lib/seo/url-generator.ts`
- Move: `src/services/__tests__/url-generator.test.ts` -> `src/lib/seo/__tests__/url-generator.test.ts`
- Modify: `src/lib/seo-metadata.ts`
- Candidate archive after empty: `src/services/`

- [ ] **Step 1: Confirm only SEO uses the service**

Run:

```bash
rg -n "@/services/url-generator|src/services/url-generator|\\.\\./services/url-generator|url-generator" src tests
```

Expected: production usage points to SEO metadata code and the service test.

- [ ] **Step 2: Move file into SEO folder**

Run:

```bash
mkdir -p src/lib/seo/__tests__
git mv src/services/url-generator.ts src/lib/seo/url-generator.ts
git mv src/services/__tests__/url-generator.test.ts src/lib/seo/__tests__/url-generator.test.ts
```

Expected: git status shows renames.

- [ ] **Step 3: Update imports**

Update imports from:

```text
@/services/url-generator
```

to:

```text
@/lib/seo/url-generator
```

- [ ] **Step 4: Move empty `src/services` shell to local trash**

Run if `find src/services -type f` prints no files:

```bash
mkdir -p .context/trash/starter-quality-governance-verified/src
mv src/services .context/trash/starter-quality-governance-verified/src/services
```

Expected: no tracked production code remains under `src/services`.

- [ ] **Step 5: Run focused validation**

Run:

```bash
pnpm test -- src/lib/seo/__tests__/url-generator.test.ts src/lib/__tests__/seo-metadata.test.ts
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 6: Commit**

Run:

```bash
git add -A src/services src/lib/seo src/lib/seo-metadata.ts
git commit -m "refactor: move url generator into seo module"
```

Expected: `src/services` is gone or empty only in local trash, and SEO behavior is unchanged.

### Task W2-4: Merge `src/testing` into `src/test`

**Files:**
- Move: `src/testing/render-async-page.tsx` -> `src/test/render-async-page.tsx`
- Move: `src/testing/icon-mock-best-practices.md` -> `docs/quality/testing/icon-mock-best-practices.md`
- Move: `src/testing/mock-config-standard.md` -> `docs/quality/testing/mock-config-standard.md`
- Modify imports that point to `src/testing/render-async-page`

- [ ] **Step 1: Inspect current consumers**

Run:

```bash
rg -n "@/testing/render-async-page|src/testing/render-async-page|\\.\\./testing/render-async-page|\\.\\./\\.\\./testing/render-async-page" src tests
```

Expected: output lists all imports to update.

- [ ] **Step 2: Move files**

Run:

```bash
mkdir -p docs/quality/testing
git mv src/testing/render-async-page.tsx src/test/render-async-page.tsx
git mv src/testing/icon-mock-best-practices.md docs/quality/testing/icon-mock-best-practices.md
git mv src/testing/mock-config-standard.md docs/quality/testing/mock-config-standard.md
```

Expected: git status shows renames.

- [ ] **Step 3: Update imports**

Update imports to:

```text
@/test/render-async-page
```

- [ ] **Step 4: Move empty `src/testing` shell to local trash**

Run:

```bash
mkdir -p .context/trash/starter-quality-governance-verified/src
mv src/testing .context/trash/starter-quality-governance-verified/src/testing
```

Expected: `src/testing` no longer appears in source tree; backup exists.

- [ ] **Step 5: Validate**

Run:

```bash
pnpm test -- src/test/__tests__/setup-env-runtime.test.ts
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 6: Commit**

Run:

```bash
git add -A src/testing src/test docs/quality/testing
git commit -m "refactor: consolidate test helpers under src test"
```

Expected: one test-helper consolidation commit.

---

## Wave W3: Replacement surface and truth-source design

**Goal:** Reduce adopter confusion by making runtime truth and replacement docs match what code actually reads.

**Commit boundary:** one design change per commit. This wave can change starter contracts, so each task needs docs and tests.

### Task W3-1: Retire `src/config/website/*` as runtime-adjacent mirror

> **Superseded by Phase 3:** Do not execute this task as written. The current approved direction is to keep `src/config/website/*` as a replacement and compatibility surface, prove runtime code does not depend on it, and derive only fields with proven drift risk. Revisit full retirement only as a separate breaking-design RFC.

**Files:**
- Modify: `docs/website/README.md`
- Modify: `docs/website/新项目替换清单.md`
- Modify: `docs/website/品牌设置.md`
- Modify: `docs/website/内容设置.md`
- Modify: `docs/website/配置真相源.md`
- Modify: `docs/website/quality-proof.md`
- Modify: `scripts/starter-checks.js`
- Modify tests that reference `src/config/website/*`
- Move to `.context/trash/starter-quality-governance-verified/`: `src/config/website/**`

- [ ] **Step 1: List all non-runtime references**

Run:

```bash
rg -n "@/config/website|src/config/website|config/website" src content scripts tests docs messages package.json -g '!src/config/website/**'
```

Expected: output is mostly docs, tests, and starter-check references. Do not move `src/config/website` until these references are intentionally changed.

- [ ] **Step 2: Update replacement docs to canonical sources**

Replace user-facing references so the first replacement entry points to:

```text
src/config/single-site.ts
src/config/single-site-seo.ts
src/config/single-site-navigation.ts
src/config/single-site-links.ts
src/config/single-site-page-expression.ts
src/config/single-site-product-catalog.ts
src/constants/product-specs/**
messages/{locale}/critical.json
messages/{locale}/deferred.json
content/pages/{locale}/*.mdx
public/images/**
```

Remove wording that tells adopters to sync `src/config/website/*`.

- [ ] **Step 3: Update starter checks to scan canonical replacement surfaces**

In `scripts/starter-checks.js`, update any content-readiness or proof-lane path list that points at `src/config/website/**` so it points to the canonical sources listed in Step 2.

Keep command names unchanged:

```bash
node scripts/starter-checks.js content-readiness
node scripts/starter-checks.js brand
```

- [ ] **Step 4: Update tests that lock old docs**

Update tests under `tests/unit/scripts/` so they no longer expect `src/config/website/profile.ts`, `src/config/website/seo.ts`, or `src/config/website/products.ts` as adopter-facing truth.

The new expected docs should mention:

```text
src/config/single-site.ts
src/config/single-site-seo.ts
src/config/single-site-product-catalog.ts
src/constants/product-specs/**
```

- [ ] **Step 5: Move website config directory to local trash**

Run after docs, scripts, and tests are updated:

```bash
mkdir -p .context/trash/starter-quality-governance-verified/src/config
mv src/config/website .context/trash/starter-quality-governance-verified/src/config/website
git add -A src/config/website
```

Expected: tracked `src/config/website/**` paths are staged as removed; backup exists.

- [ ] **Step 6: Validate**

Run:

```bash
pnpm test -- tests/unit/scripts/content-readiness-check.test.ts tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/current-truth-docs.test.ts src/config/__tests__/site-facts.test.ts src/config/__tests__/single-site-seo.test.ts
node scripts/starter-checks.js brand
node scripts/starter-checks.js content-readiness
pnpm type-check
```

Expected: all commands exit 0, and no source import references `@/config/website`.

- [ ] **Step 7: Commit**

Run:

```bash
git add -A docs/website scripts/starter-checks.js tests/unit/scripts src/config/website
git commit -m "refactor: retire website config mirror surface"
```

Expected: the replacement surface is canonical-source based.

### Task W3-2: Derive factual brand values from `src/config/single-site.ts`

**Files:**
- Create: `src/lib/i18n/site-message-values.ts`
- Modify: `src/lib/i18n/load-messages.ts` or existing current path if W2 has not moved it
- Modify: `messages/en/critical.json`
- Modify: `messages/zh/critical.json`
- Modify: `messages/en/deferred.json`
- Modify: `messages/zh/deferred.json`
- Modify tests for message loading and structured data

- [ ] **Step 1: Characterize current hard-coded factual strings**

Run:

```bash
rg -n "Showcase Website Starter|© 2024 Showcase Website Starter|\\(c\\) \\{year\\} Showcase Website Starter" messages content src/lib src/app scripts | sed -n '1,220p'
```

Expected: output shows messages, MDX content, generated manifests, and script sample config. This task only changes factual UI/SEO/message fields, not every demo sentence in MDX.

- [ ] **Step 2: Add site message value helper**

Create `src/lib/i18n/site-message-values.ts` with a helper that reads from `SINGLE_SITE_FACTS` and exposes:

```ts
export interface SiteMessageValues {
  siteName: string;
  companyName: string;
  currentYear: string;
  copyright: {
    en: string;
    zh: string;
  };
}
```

Values must come from `src/config/single-site.ts` and the current year. Do not read `process.env` here.

- [ ] **Step 3: Interpolate only factual placeholders**

In the message loader, replace placeholders after JSON load:

```text
{siteName}
{companyName}
{currentYear}
{copyright}
```

Do not interpolate ordinary content paragraphs or product copy.

- [ ] **Step 4: Replace factual message values**

Update these message fields to placeholders:

```text
navigation.siteName
footer.brand.title
footer.copyright
seo.organization.name
seo.website.name
seo.defaultAuthor
```

Use `{siteName}` and `{copyright}`. Keep MDX legal/demo body text unchanged unless it is generated into SEO fields.

- [ ] **Step 5: Validate**

Run:

```bash
pnpm test -- src/lib/__tests__/load-messages-runtime.test.ts src/lib/__tests__/structured-data.test.ts tests/unit/scripts/content-readiness-check.test.ts
node scripts/starter-checks.js translations
pnpm type-check
```

Expected: messages load with concrete site values at runtime, translation check exits 0, and content-readiness does not report placeholder leakage.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/lib/i18n messages tests src/lib/__tests__ tests/unit/scripts
git commit -m "refactor: derive factual brand messages from site config"
```

Expected: factual site identity has one runtime source.

### Task W3-3: Add market slug contract docs and guard test

**Files:**
- Modify: `docs/website/新项目替换清单.md`
- Modify: `docs/website/内容设置.md`
- Create: `tests/architecture/product-market-slug-contract.test.ts`

- [ ] **Step 1: Document market slug coupling**

Add a section explaining that a market slug change must update this full set:

```text
src/config/single-site-product-catalog.ts
src/constants/product-specs/{market-slug}.ts
src/constants/product-specs/market-spec-registry.ts
messages/{locale}/critical.json catalog.markets.*
messages/{locale}/critical.json catalog.families.*
src/config/single-site-page-expression.ts if the special market changes
```

- [ ] **Step 2: Add architecture guard**

Create `tests/architecture/product-market-slug-contract.test.ts` that imports:

```ts
import { PRODUCT_CATALOG } from "@/config/single-site-product-catalog";
import { MARKET_SPECS_BY_SLUG } from "@/constants/product-specs/market-spec-registry";
```

The test must assert:

```text
catalog market slugs equal market spec registry keys
each market has i18n label and description in en critical messages
each market family has matching spec family slug
each market family has en and zh i18n label and description
```

- [ ] **Step 3: Validate**

Run:

```bash
pnpm test -- tests/architecture/product-market-slug-contract.test.ts src/constants/product-specs/__tests__/market-spec-registry.test.ts src/constants/product-specs/__tests__/i18n-parity.test.ts
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/website/新项目替换清单.md docs/website/内容设置.md tests/architecture/product-market-slug-contract.test.ts
git commit -m "test: document and guard product market slug contract"
```

Expected: slug coupling is explicit and protected.

### Task W3-4: Write a separate RFC plan for `pages.config.ts`

**Files:**
- Create: `docs/superpowers/specs/2026-05-11-pages-config-truth-source-design.md`
- Create: `docs/superpowers/plans/2026-05-11-pages-config-truth-source.md`

- [ ] **Step 1: Map current page surfaces**

Run:

```bash
rg -n "PageType|PATHS_CONFIG|SINGLE_SITE_PUBLIC_STATIC_PAGES|SINGLE_SITE_STATIC_PAGE_LASTMOD|baseConfigs|content/pages|generateMetadata" src tests messages content | sed -n '1,260p'
```

Expected: output proves current page truth spans paths, SEO, sitemap, messages, MDX, route pages, and tests.

- [ ] **Step 2: Write the spec**

Create `docs/superpowers/specs/2026-05-11-pages-config-truth-source-design.md` with these decisions:

```text
Purpose: reduce new public page setup from many scattered edits to one page definition plus content/messages.
Proposed file: src/config/pages.config.ts.
Fields: pageType, localizedPaths, navigationKey, seoKey, sitemap, lastmod, mdxCollection, routeOwner.
First migration target: static public pages only.
Out of scope: dynamic product market pages and blog article pages in the first implementation.
```

- [ ] **Step 3: Write the detailed implementation plan**

Create `docs/superpowers/plans/2026-05-11-pages-config-truth-source.md` with the required writing-plans header and concrete migration steps for only static public pages.

- [ ] **Step 4: Validate docs**

Run:

```bash
rg -n "pages.config.ts|static public pages|PageType|SINGLE_SITE_PUBLIC_STATIC_PAGES" docs/superpowers/specs/2026-05-11-pages-config-truth-source-design.md docs/superpowers/plans/2026-05-11-pages-config-truth-source.md
```

Expected: both files mention the proposed file and first migration scope.

- [ ] **Step 5: Commit**

Run:

```bash
git add docs/superpowers/specs/2026-05-11-pages-config-truth-source-design.md docs/superpowers/plans/2026-05-11-pages-config-truth-source.md
git commit -m "docs: plan pages config truth source"
```

Expected: no implementation code is changed in this task.

---

## Wave W4: Component, test, and AI-doc granularity

**Goal:** Reduce maintenance noise after the main truth-source and structure work is stable.

### Task W4-1: Retire only unused UI primitives

**Files:**
- Candidate move to `.context/trash/starter-quality-governance-verified/`: `src/components/ui/accordion.tsx`
- Candidate move to `.context/trash/starter-quality-governance-verified/`: `src/components/ui/accordion.stories.tsx`
- Candidate move to `.context/trash/starter-quality-governance-verified/`: `src/components/ui/__tests__/accordion-basic.test.tsx`
- Candidate move to `.context/trash/starter-quality-governance-verified/`: `src/components/ui/dropdown-menu.tsx`
- Candidate move to `.context/trash/starter-quality-governance-verified/`: `src/components/ui/dropdown-menu.stories.tsx`
- Candidate move to `.context/trash/starter-quality-governance-verified/`: `src/components/ui/__tests__/dropdown-menu-*.test.tsx`
- Modify: component governance registry if it lists adopted primitives

- [ ] **Step 1: Verify zero production usage**

Run:

```bash
rg -n "@/components/ui/(accordion|dropdown-menu)" src tests -g '!src/components/ui/**'
```

Expected: no production or non-primitive test consumers. If output appears outside primitive stories/tests, stop and keep the primitive.

- [ ] **Step 2: Move unused primitive files to local trash**

Run only after Step 1 proves zero production usage:

```bash
mkdir -p .context/trash/starter-quality-governance-verified/src/components/ui/__tests__
mv src/components/ui/accordion.tsx .context/trash/starter-quality-governance-verified/src/components/ui/accordion.tsx
mv src/components/ui/accordion.stories.tsx .context/trash/starter-quality-governance-verified/src/components/ui/accordion.stories.tsx
mv src/components/ui/__tests__/accordion-basic.test.tsx .context/trash/starter-quality-governance-verified/src/components/ui/__tests__/accordion-basic.test.tsx
mv src/components/ui/dropdown-menu.tsx .context/trash/starter-quality-governance-verified/src/components/ui/dropdown-menu.tsx
mv src/components/ui/dropdown-menu.stories.tsx .context/trash/starter-quality-governance-verified/src/components/ui/dropdown-menu.stories.tsx
mv src/components/ui/__tests__/dropdown-menu-accessibility.test.tsx .context/trash/starter-quality-governance-verified/src/components/ui/__tests__/dropdown-menu-accessibility.test.tsx
mv src/components/ui/__tests__/dropdown-menu-advanced.test.tsx .context/trash/starter-quality-governance-verified/src/components/ui/__tests__/dropdown-menu-advanced.test.tsx
mv src/components/ui/__tests__/dropdown-menu-basic.test.tsx .context/trash/starter-quality-governance-verified/src/components/ui/__tests__/dropdown-menu-basic.test.tsx
mv src/components/ui/__tests__/dropdown-menu-complex.test.tsx .context/trash/starter-quality-governance-verified/src/components/ui/__tests__/dropdown-menu-complex.test.tsx
mv src/components/ui/__tests__/dropdown-menu-layout.test.tsx .context/trash/starter-quality-governance-verified/src/components/ui/__tests__/dropdown-menu-layout.test.tsx
mv src/components/ui/__tests__/dropdown-menu-radio.test.tsx .context/trash/starter-quality-governance-verified/src/components/ui/__tests__/dropdown-menu-radio.test.tsx
git add -A src/components/ui
```

Expected: unused primitives are removed from tracked source and backed up locally.

- [ ] **Step 3: Validate component governance**

Run:

```bash
pnpm component:governance:test
pnpm component:governance
pnpm type-check
```

Expected: governance agrees with retired primitives.

- [ ] **Step 4: Commit**

Run:

```bash
git add -A src/components/ui tests/architecture tests/unit/scripts
git commit -m "chore: retire unused ui primitives"
```

Expected: production-used primitives remain untouched.

### Task W4-2: Compress UI primitive over-testing

**Files:**
- Modify tests under `src/components/ui/__tests__/`

- [ ] **Step 1: Count current primitive tests**

Run:

```bash
find src/components/ui/__tests__ -maxdepth 1 -type f | sort
```

Expected: output shows many small files, especially for `label`, `badge`, `card`, and `social-icons`.

- [ ] **Step 2: Merge tests by primitive behavior**

Keep at most three test files per primitive:

```text
<primitive>.test.tsx
<primitive>-accessibility.test.tsx
<primitive>-integration.test.tsx
```

Move retired duplicate test files to `.context/trash/starter-quality-governance-verified/src/components/ui/__tests__/` before staging their removal.

- [ ] **Step 3: Validate**

Run:

```bash
pnpm test -- src/components/ui/__tests__
pnpm component:governance:test
```

Expected: exit 0 and no behavior coverage loss for production-used primitives.

- [ ] **Step 4: Commit**

Run:

```bash
git add -A src/components/ui/__tests__
git commit -m "test: consolidate ui primitive coverage"
```

Expected: fewer UI test files with the same externally visible assertions.

### Task W4-3: Flatten contact form wrapper layers only after behavior tests

**Files:**
- Modify: `src/components/contact/contact-form-island.tsx`
- Modify: `src/components/contact/contact-form-island-view.tsx`
- Modify: `src/components/forms/contact-form-container.tsx`
- Modify: `src/components/forms/contact-form-container-view.tsx`
- Modify focused tests under `src/components/contact/__tests__` and `src/components/forms/__tests__`

- [ ] **Step 1: Capture current visible behavior**

Run:

```bash
pnpm test -- src/components/contact/__tests__/contact-form-island.test.tsx src/components/forms/__tests__/contact-form-container-core.test.tsx src/components/forms/__tests__/contact-form-submission.test.tsx tests/e2e/contact-form-smoke.spec.ts
```

Expected: unit tests exit 0. If e2e requires a running dev server, run it during the task checkpoint with the documented project e2e setup.

- [ ] **Step 2: Merge only one redundant wrapper**

First target: merge `ContactFormIslandView` behavior into `ContactFormIsland` if tests show the view has no independent production value.

Do not change:

```text
src/components/forms/use-contact-form.ts
src/lib/contact/submit-canonical-contact.ts
src/app/api/contact/route.ts
```

- [ ] **Step 3: Validate behavior**

Run:

```bash
pnpm test -- src/components/contact/__tests__/contact-form-island.test.tsx src/components/forms/__tests__/contact-form-container-core.test.tsx src/components/forms/__tests__/contact-form-submission.test.tsx tests/architecture/contact-page-boundary.test.ts
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 4: Commit**

Run:

```bash
git add -A src/components/contact src/components/forms tests/architecture/contact-page-boundary.test.ts
git commit -m "refactor: flatten contact form island wrapper"
```

Expected: one wrapper layer is removed without changing form submission behavior.

### Task W4-4: Merge AGENTS and CLAUDE project entrypoints

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Compare files**

Run:

```bash
diff -u AGENTS.md CLAUDE.md | sed -n '1,220p'
```

Expected: files are mostly duplicated.

- [ ] **Step 2: Keep AGENTS as canonical entry**

Keep `AGENTS.md` as the full cross-tool project entry. Replace `CLAUDE.md` body with:

```md
# CLAUDE.md

Claude Code should follow `AGENTS.md` for project rules.

Local personal preferences, if any, belong in `CLAUDE.local.md` and must not contradict `AGENTS.md`.
```

- [ ] **Step 3: Remove stale `src/templates/` reference from AGENTS**

In `AGENTS.md`, remove the structure line:

```text
- templates/          # Reusable templates
```

unless a real `src/templates/` directory is restored by a separate task.

- [ ] **Step 4: Validate**

Run:

```bash
rg -n "src/templates|templates/          # Reusable templates" AGENTS.md CLAUDE.md
```

Expected: no stale structure entry.

- [ ] **Step 5: Commit**

Run:

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs: make agents entrypoint canonical"
```

Expected: duplicate AI entrypoint content is gone.

---

## Wave W5: Tooling decisions after slimming

**Goal:** Make installed tools honest: either wired into a proof lane or removed from starter commitments.

### Task W5-1: Classify tsconfig files as retained or retired

**Files:**
- Review: `tsconfig.test.json`
- Review: `tsconfig.typecheck-source.json`
- Review: `tsconfig.knip.json`
- Modify: `docs/technical/dependency-upgrade-policy.md`
- Modify: `package.json` only if choosing to wire commands

- [ ] **Step 1: Confirm references**

Run:

```bash
find . -maxdepth 2 -name 'tsconfig*.json' -print | sort
rg -n "tsconfig\\.test|tsconfig\\.typecheck-source|tsconfig\\.knip" . -g '!node_modules'
```

Expected: `tsconfig.test.json` and `tsconfig.typecheck-source.json` have docs references; `tsconfig.knip.json` must be classified from current usage.

- [ ] **Step 2: Choose one explicit path per file**

Use this decision table:

```text
tsconfig.test.json: retain if dependency policy keeps test-only typecheck command.
tsconfig.typecheck-source.json: retain if source-only proof remains useful.
tsconfig.knip.json: wire into a package script or move to local trash.
```

- [ ] **Step 3: Validate retained configs**

Run retained commands:

```bash
pnpm exec next typegen
pnpm exec tsc --noEmit -p tsconfig.test.json
pnpm exec tsc --noEmit -p tsconfig.typecheck-source.json
```

Expected: retained configs exit 0. If a config is not retained, update docs before moving it to local trash.

- [ ] **Step 4: Commit**

Run:

```bash
git add -A package.json tsconfig*.json docs/technical/dependency-upgrade-policy.md
git commit -m "chore: clarify secondary tsconfig ownership"
```

Expected: each secondary tsconfig has a reason to exist or is backed up and removed.

### Task W5-2: Decide knip, Stryker, and Lighthouse proof ownership

**Files:**
- Modify: `package.json`
- Modify if retained: `.github/workflows/ci.yml`
- Modify if retained: docs under `docs/website/quality-proof.md` or `docs/technical/`

- [ ] **Step 1: Inventory installed but weakly wired tools**

Run:

```bash
node -e "const p=require('./package.json'); for (const section of ['dependencies','devDependencies']) for (const [k,v] of Object.entries(p[section]||{})) if (/knip|stryker|lighthouse/.test(k)) console.log(section+': '+k+'@'+v)"
rg -n "knip|stryker|lighthouse" package.json .github docs lefthook.yml
```

Expected: current package and docs references are visible.

- [ ] **Step 2: Pick a proof lane**

Use this rule:

```text
Keep tool if it has a package script and either CI, scheduled CI, or documented manual release proof.
Remove tool commitment if it is installed but not part of any proof lane.
```

- [ ] **Step 3: Validate selected lane**

If retained, run the smallest command that proves the tool works. If removed, run:

```bash
pnpm install --lockfile-only
pnpm type-check
pnpm lint:check
```

Expected: lockfile and project checks remain valid.

- [ ] **Step 4: Commit**

Run:

```bash
git add package.json pnpm-lock.yaml .github docs lefthook.yml
git commit -m "chore: clarify optional quality tool ownership"
```

Expected: tool commitments are honest and documented.

---

## Final validation gate for the whole roadmap branch

Run these after the selected waves are complete:

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm react:doctor
pnpm component:governance:test
pnpm component:governance
pnpm build
```

Expected: all commands exit 0.

Run Cloudflare build only after `pnpm build` has completed and no other task is writing `.next`:

```bash
pnpm website:build:cf
```

Expected: Cloudflare/OpenNext build exits 0.

## Completion checklist

- [ ] Root audit files are archived, not lost.
- [ ] React Doctor still gates errors, but raw/classification governance is not self-maintaining in CI.
- [ ] ESLint override file list no longer points at non-existing paths.
- [ ] Email tests live next to real email templates.
- [ ] Unused route-local fonts are backed up and removed from tracked source.
- [ ] `scripts/starter-checks.js` keeps public command compatibility while delegating first-wave checks.
- [ ] `src/lib` top-level utility sprawl is reduced without behavior changes.
- [ ] `src/services/url-generator.ts` no longer creates a lib-to-services dependency inversion.
- [ ] `src/config/website/*` is retired only after docs/tests/scripts stop treating it as truth.
- [ ] Brand facts that are real site identity derive from `src/config/single-site.ts`.
- [ ] Product market slug coupling is documented and guarded.
- [ ] `pages.config.ts` has its own RFC plan before implementation.
- [ ] Production-used primitives remain untouched.
- [ ] `AGENTS.md` is the canonical cross-tool entrypoint.

## Stop lines

Stop and ask for review if any of these happen:

- `pnpm react:doctor` fails before React Doctor governance is slimmed.
- Any task requires changing `src/lib/contact/submit-canonical-contact.ts`.
- Any task requires changing lead pipeline behavior.
- Any task requires migrating `src/middleware.ts` to `proxy.ts`.
- Removing `src/config/website/*` requires changing runtime behavior rather than docs/tests/check surfaces.
- `pnpm build` fails after a font or head change.
- Component governance says a production-used primitive is missing.
