> Historical.
>
> Planning artifact. No asset or production symbol is removed by this file.

# Repair Wave 5 Dead Surface Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove five stale public assets and two retired production symbols after proving their live consumers are zero.

**Architecture:** Asset removal uses production-reference evidence, a dated macOS Trash backup, and Git deletion tracking; no permanent deletion command is used. Contact copy tests move to the live message-based function, and the product-name limit directly owns its numeric value instead of borrowing a retired company limit.

**Tech Stack:** Git, Node.js content checks, Vitest, Knip, TypeScript, macOS Trash.

---

## Task 1: FPH-015 re-prove the five assets are dead

**Files:**
- Candidate removals:
  - `public/images/about-og.jpg`
  - `public/images/hero/showcase-hero.svg`
  - `public/images/og-image.jpg`
  - `public/images/og-image.svg`
  - `public/next.svg`
- Preserve:
  - `public/images/tucsenberg-logo-square.png`
  - `public/images/tucsenberg-logo.png`
  - `public/images/tucsenberg-og.png`
- Modify later: `public/images/README.md`
- Modify later: `scripts/quality/checks/content-slugs.js`
- Modify later: `tests/unit/scripts/content-slug-sync.test.ts`
- Modify later: `tests/unit/scripts/mdx-slug-sync.test.ts`

- [ ] **Step 1: Run a production-reference scan from the repair SHA**

```bash
rg -n "about-og\.jpg|showcase-hero\.svg|og-image\.jpg|og-image\.svg|/next\.svg" src content messages scripts .github public --glob '!public/images/README.md'
```

Classify every hit as runtime consumer, validation fixture, documentation, or candidate file content. Any runtime consumer is a stop condition for that asset.

- [ ] **Step 2: Check current SEO truth**

```bash
rg -n "brandAssets\.ogImage|tucsenberg-og\.png|openGraph.*images" src/config src/lib
```

Expected: the live OG owner points to `/images/tucsenberg-og.png`; live logo paths remain present.

- [ ] **Step 3: Check external direct-link evidence if available**

Inspect Cloudflare analytics/logs for requests to the five exact paths over the owner-approved observation window. If credentials are unavailable, record `BLOCKED_EXTERNAL: direct-link traffic evidence` and require owner confirmation before merge; local zero references alone do not prove zero external bookmarks.

- [ ] **Step 4: Add a failing repository asset contract**

Add a focused test in the nearest asset/content contract suite:

```ts
const retiredPublicAssets = [
  "public/images/about-og.jpg",
  "public/images/hero/showcase-hero.svg",
  "public/images/og-image.jpg",
  "public/images/og-image.svg",
  "public/next.svg",
];

for (const asset of retiredPublicAssets) {
  expect(existsSync(asset), asset).toBe(false);
}

for (const asset of [
  "public/images/tucsenberg-logo-square.png",
  "public/images/tucsenberg-logo.png",
  "public/images/tucsenberg-og.png",
]) {
  expect(existsSync(asset), asset).toBe(true);
}
```

- [ ] **Step 5: Run and confirm the retirement test fails**

```bash
pnpm exec vitest run tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts
```

Expected: FAIL because the five files still exist or old fixtures still treat them as active starter OG paths.

## Task 2: FPH-015 move the assets to Trash and remove stale validation truth

**Files:**
- Remove through Trash: the five candidates from Task 1
- Modify: `public/images/README.md`
- Modify: `scripts/quality/checks/content-slugs.js`
- Modify: `tests/unit/scripts/content-slug-sync.test.ts`
- Modify: `tests/unit/scripts/mdx-slug-sync.test.ts`

- [ ] **Step 1: Create a reversible backup directory**

```bash
mkdir -p "$HOME/.Trash/tucsenberg-full-audit-wave-5-2026-07-20/public/images/hero"
```

- [ ] **Step 2: Move each file, never permanently delete it**

```bash
mv public/images/about-og.jpg "$HOME/.Trash/tucsenberg-full-audit-wave-5-2026-07-20/public/images/about-og.jpg"
mv public/images/hero/showcase-hero.svg "$HOME/.Trash/tucsenberg-full-audit-wave-5-2026-07-20/public/images/hero/showcase-hero.svg"
mv public/images/og-image.jpg "$HOME/.Trash/tucsenberg-full-audit-wave-5-2026-07-20/public/images/og-image.jpg"
mv public/images/og-image.svg "$HOME/.Trash/tucsenberg-full-audit-wave-5-2026-07-20/public/images/og-image.svg"
mv public/next.svg "$HOME/.Trash/tucsenberg-full-audit-wave-5-2026-07-20/public/next.svg"
```

- [ ] **Step 3: Replace starter-era image validation**

In `content-slugs.js`, replace `STRICT_STARTER_OG_IMAGES` with the live derived-site image set containing `/images/tucsenberg-og.png`, or remove the special set if current general public-file validation already proves existence and format. Choose the shorter path after reading the surrounding function; do not retain dead filenames for compatibility.

- [ ] **Step 4: Update fixtures and README**

Use `/images/tucsenberg-og.png` in content-slug and MDX fixtures. Rewrite `public/images/README.md` as a short inventory of the three retained Tucsenberg assets and their current owners. Remove starter social-image instructions and false status claims.

- [ ] **Step 5: Stage Git deletions and verify**

```bash
git add -A public scripts/quality/checks/content-slugs.js tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts
pnpm exec vitest run tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts
pnpm content:check
```

Expected: tests pass, five paths are staged as deleted, retained logo/OG assets still exist.

- [ ] **Step 6: Commit**

```bash
git commit -m "chore: remove stale public image surfaces"
```

## Task 3: FPH-016 move Contact copy tests to the live function

**Files:**
- Modify: `src/lib/contact/getContactCopy.ts`
- Modify: `src/lib/__tests__/contact-get-contact-copy.test.ts`
- Verify: `src/app/[locale]/contact/contact-page-data.ts`
- Verify: `src/app/[locale]/contact/__tests__/page.test.tsx`

- [ ] **Step 1: Prove the async helper has no production caller**

```bash
rg -n "getContactCopy\(" src tests
```

Expected: the only caller is its own unit test; production uses `getContactCopyFromMessages()`.

- [ ] **Step 2: Remove the mock-backed compatibility test**

Delete the `loadCompleteMessages` mock, `Locale` import, `beforeEach`, and the test that calls `getContactCopy(locale)`. Keep and strengthen tests for `getContactCopyFromMessages()` using the same complete message fixture and missing-path cases.

- [ ] **Step 3: Remove the dead helper and import**

Delete:

```ts
import type { Locale } from "@/i18n/routing";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
```

and delete the exported async `getContactCopy()` function. Keep `ContactCopyModel` and `getContactCopyFromMessages()` unchanged.

- [ ] **Step 4: Run focused tests**

```bash
pnpm exec vitest run src/lib/__tests__/contact-get-contact-copy.test.ts 'src/app/[locale]/contact/__tests__/page.test.tsx'
```

Expected: live message extraction and page data remain green without the compatibility helper.

## Task 4: FPH-016 make the product-name limit own its value

**Files:**
- Modify: `src/constants/validation-limits.ts`
- Modify: `src/constants/index.ts`
- Verify: `src/lib/lead-pipeline/lead-schema.ts`
- Verify: `src/lib/lead-pipeline/inquiry-handoff.ts`
- Verify: `src/components/forms/__tests__/inquiry-form.test.tsx`
- Verify: `src/lib/lead-pipeline/__tests__/inquiry-handoff.test.ts`

- [ ] **Step 1: Add a direct-value assertion**

In the nearest validation-limit or lead-schema test, assert:

```ts
expect(MAX_LEAD_PRODUCT_NAME_LENGTH).toBe(200);
```

The implementation source must no longer export `MAX_LEAD_COMPANY_LENGTH`.

- [ ] **Step 2: Replace the alias with the owned value**

Use:

```ts
/** Max product-interest length for canonical inquiry leads. */
export const MAX_LEAD_PRODUCT_NAME_LENGTH = 200 as const;
```

Delete `MAX_LEAD_COMPANY_LENGTH` and remove it from `src/constants/index.ts`. Do not rename the live product-name constant in this Wave.

- [ ] **Step 3: Run all length-boundary tests**

```bash
pnpm exec vitest run src/components/forms/__tests__/inquiry-form.test.tsx src/lib/lead-pipeline/__tests__/inquiry-handoff.test.ts src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts
pnpm type-check
```

Expected: 200-character values still pass and over-limit values still truncate or fail according to the existing contract.

- [ ] **Step 4: Prove both retired symbols are gone and commit**

```bash
rg -n "getContactCopy\(|MAX_LEAD_COMPANY_LENGTH" src tests
git add src/lib/contact/getContactCopy.ts src/lib/__tests__/contact-get-contact-copy.test.ts src/constants/validation-limits.ts src/constants/index.ts
git commit -m "refactor: remove retired contact and lead aliases"
```

Expected search result: zero live hits.

## Task 5: Wave 5 verification and proof boundary

- [ ] Run the production-reference scan again; only historical audit/plan references may name retired assets.
- [ ] Run:

```bash
pnpm content:check
pnpm type-check
pnpm lint:check
pnpm knip:check
pnpm test
pnpm build
```

- [ ] Start a preview and verify the five old URLs no longer return stale assets, while the three retained images return 200 and render correctly.
- [ ] If direct-link traffic evidence was unavailable, keep FPH-015 merge approval blocked on owner confirmation even when local code proof is green.
- [ ] Confirm the Trash backup paths exist and record them in the PR evidence packet; do not commit files from Trash.
- [ ] Run `git diff --check`, inspect staged deletions, use `superpowers:verification-before-completion`, push, wait for exact-SHA CI, mark `READY_FOR_ACCEPTANCE`, and stop.

## Self-Review

- No permanent deletion command is used.
- The live Tucsenberg logo and OG files are preserved.
- Tests now exercise `getContactCopyFromMessages()`, the actual production path.
- The live product-interest limit directly owns `200`; no compatibility alias replaces the removed company constant.
