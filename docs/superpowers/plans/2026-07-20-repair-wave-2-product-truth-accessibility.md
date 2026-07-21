> Historical.
>
> Planning artifact. The copy and accessibility defects remain open until this plan is executed and accepted.

# Repair Wave 2 Product Truth Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the false warranty and Aluminum capability claims, then make every real mobile table scroll owner keyboard reachable and visibly focused.

**Architecture:** Product-copy fixes stay at the current authoring surfaces and avoid new factories or schemas. Accessibility changes target the existing overflow containers; labels come from the section title, translated heading, or table headers already owned by each surface. One Playwright contract proves focus, ArrowRight scrolling, and Axe behavior at Pixel 5 width.

**Tech Stack:** next-intl message packs, MDX content, React Server Components, Tailwind CSS, Vitest, Playwright, Axe.

---

## Task 1: FPH-002 lock the TB-FB warranty boundary with failing content tests

**Files:**
- Modify: `src/config/__tests__/single-site-page-expression.test.ts`
- Modify: `tests/architecture/tucsenberg-site-contract.test.ts`
- Read: `content/pages/en/warranty.mdx`

- [ ] **Step 1: Add a behavior-level warranty assertion**

Read the authoring files in the test and assert these contracts:

```ts
expect(requestQuoteCopy).not.toContain("3-year warranty");
expect(aboutContent).toContain("standard durable product lines");
expect(oemContent).toContain("standard durable product lines");
expect(warrantyContent).toContain(
  "Standard product lines (TB-BW, TB-AG, TB-TD, TB-CP)",
);
expect(warrantyContent).toContain("Consumables (TB-FB absorbent bags");
expect(warrantyContent).toContain("Shelf-life for unused bags: 3 years");
```

The test must read `messages/profiles/b2b-lead/en/messages.json`, `content/pages/en/about.mdx`, `content/pages/en/oem-wholesale.mdx`, and `content/pages/en/warranty.mdx`. There is no generated compatibility pack; the three physical message layers are the authoring truth.

- [ ] **Step 2: Run and confirm the current claim fails**

```bash
pnpm exec vitest run src/config/__tests__/single-site-page-expression.test.ts tests/architecture/tucsenberg-site-contract.test.ts -t "warranty"
```

Expected: FAIL because RFQ, About, and OEM currently imply one three-year materials/workmanship warranty across the whole catalog.

## Task 2: FPH-002 correct only the false warranty wording

**Files:**
- Modify: `messages/profiles/b2b-lead/en/messages.json`
- Modify: `content/pages/en/about.mdx`
- Modify: `content/pages/en/oem-wholesale.mdx`
- Verify unchanged meaning: `content/pages/en/warranty.mdx`

- [ ] **Step 1: Replace the RFQ confidence line**

Change:

```json
"confidenceWarranty": "3-year warranty"
```

to:

```json
"confidenceWarranty": "Written product-specific warranty terms"
```

- [ ] **Step 2: Narrow About and OEM claims**

Use this scope in both pages:

```markdown
**A written warranty** - 3 years on materials and workmanship for standard durable product lines; consumables and custom items follow the product-specific terms in the [Warranty Policy](/warranty).
```

Keep TB-FB as specification conformity plus three-year shelf life in unopened storage. Do not add conditional rendering or a warranty registry.

- [ ] **Step 3: Sync and prove content**

```bash
pnpm content:check
pnpm exec vitest run src/config/__tests__/single-site-page-expression.test.ts tests/architecture/tucsenberg-site-contract.test.ts
```

Expected: generated packs are fresh and all warranty assertions pass.

- [ ] **Step 4: Commit**

```bash
git add messages/profiles/b2b-lead/en/messages.json content/pages/en/about.mdx content/pages/en/oem-wholesale.mdx src/config/__tests__/single-site-page-expression.test.ts tests/architecture/tucsenberg-site-contract.test.ts
git commit -m "fix: scope warranty claims by product type"
```

## Task 3: FPH-003 correct the Aluminum homepage capability

**Files:**
- Modify: `messages/profiles/catalog/en/messages.json`
- Modify: `src/config/__tests__/single-site-page-expression.test.ts`
- Verify: `src/constants/tucsenberg-product-page-aluminum-flood-gates.ts`
- Verify: `src/constants/tucsenberg-product-page-abs-flood-barriers.ts`

- [ ] **Step 1: Add the failing product-capability contract**

Assert the homepage Aluminum description contains Aluminum-owned concepts and does not contain ABS-only configuration terms:

```ts
expect(aluminumDescription).toMatch(/stacked planks|wall channels|posts/iu);
expect(aluminumDescription).not.toMatch(/curved|gable-end/iu);
expect(absProductPayload).toMatch(/curve|gable-end/iu);
```

- [ ] **Step 2: Confirm the current homepage copy fails**

```bash
pnpm exec vitest run src/config/__tests__/single-site-page-expression.test.ts -t "Aluminum"
```

Expected: FAIL because the current description says `gable-end and curved configurations`.

- [ ] **Step 3: Replace one message value**

Use:

```json
"description": "Demountable stacked-plank systems for doors, garages and loading docks, with wall channels or removable posts custom-cut to your opening schedule."
```

Do not change the Aluminum product-page structure or add a product-capability abstraction.

- [ ] **Step 4: Sync, search, test, and commit**

```bash
rg -n "curve|curved|gable-end" messages content src/constants src/app
pnpm exec vitest run src/config/__tests__/single-site-page-expression.test.ts tests/architecture/tucsenberg-site-contract.test.ts
git add messages/profiles/catalog/en/messages.json src/config/__tests__/single-site-page-expression.test.ts
git commit -m "fix: correct aluminum homepage capability copy"
```

Expected search result: positive capability claims using curve/gable-end point to ABS, not Aluminum.

## Task 4: FPH-006 add one browser contract for all scroll owners

**Files:**
- Create: `tests/e2e/table-keyboard-scroll.spec.ts`
- Reuse: `tests/e2e/helpers/axe.ts`

- [ ] **Step 1: Write the failing Pixel 5 test**

```ts
import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";

const routes = [
  "/",
  "/products/abs-flood-barriers",
  "/guides/flood-barrier-materials-guide",
] as const;

test.use({ viewport: { width: 393, height: 851 } });

test("wide tables are focusable and keyboard-scrollable", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    const regions = page.locator('[data-scrollable-table="true"]');

    for (let index = 0; index < (await regions.count()); index += 1) {
      const region = regions.nth(index);
      await region.focus();
      await expect(region).toBeFocused();
      const before = await region.evaluate((element) => element.scrollLeft);
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => region.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(before);
    }

    await checkA11y(page, "main#main-content", {
      includedImpacts: ["critical", "serious"],
    });
  }
});
```

The final route list must cover every overflow table found by:

```bash
rg -n "overflow-x-auto" src/app src/lib/content
```

- [ ] **Step 2: Run and confirm focus fails on current containers**

```bash
pnpm exec playwright test tests/e2e/table-keyboard-scroll.spec.ts --project=chromium
```

Expected: FAIL because the actual scroll owners are not sequentially focusable and have no test selector.

## Task 5: FPH-006 make product and homepage table containers keyboard reachable

**Files:**
- Modify: `src/app/[locale]/products/[market]/page.tsx`
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Pass the product section title to the scroll owner**

Change the table component contract to:

```tsx
function ProductContentTable({
  table,
  fade,
  label,
}: {
  table: TucsenbergProductTable;
  fade: "background" | "card";
  label: string;
}) {
  return (
    <div className="relative">
      <div
        aria-label={label}
        className="[scrollbar-width:thin] overflow-x-auto rounded-2xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        data-scrollable-table="true"
        role="region"
        tabIndex={0}
      >
        {/* existing table */}
      </div>
      {/* existing fade */}
    </div>
  );
}
```

Pass `label={section.title}` at both call sites. Do not create a new shared component for these two local calls.

- [ ] **Step 2: Update the homepage scroll owner**

Add the same focus treatment and:

```tsx
aria-label={t("howToChoose.title")}
data-scrollable-table="true"
role="region"
tabIndex={0}
```

The visible heading remains the source of wording through the existing translation key.

- [ ] **Step 3: Run type and focused browser proof**

```bash
pnpm type-check
pnpm exec playwright test tests/e2e/table-keyboard-scroll.spec.ts --project=chromium
```

Expected: product and homepage regions focus and scroll.

## Task 6: FPH-006 make Markdown tables keyboard reachable

**Files:**
- Modify: `src/lib/content/render-static-markdown-content.tsx`
- Modify or create the nearest renderer unit test if present after implementation-time search
- Verify: `content/pages/en/flood-barrier-materials-guide.mdx`

- [ ] **Step 1: Add focus behavior to the real Markdown scroll owner**

Use the current headers as the accessible name:

```tsx
<div
  aria-label={state.tableHeaders.join(", ")}
  className="overflow-x-auto [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  data-scrollable-table="true"
  role="region"
  tabIndex={0}
>
```

Keep the table markup and mobile fade unchanged.

- [ ] **Step 2: Add a renderer assertion**

Render Markdown containing a wide table and assert the region has `tabIndex="0"`, `role="region"`, and a name built from the column headers. If no focused renderer test exists, create `src/lib/content/__tests__/render-static-markdown-content.test.tsx` rather than placing the assertion in an unrelated page suite.

- [ ] **Step 3: Run focused tests and browser proof**

```bash
pnpm exec vitest run src/lib/content
pnpm exec playwright test tests/e2e/table-keyboard-scroll.spec.ts --project=chromium
```

Expected: every discovered mobile overflow table passes focus, ArrowRight, and Axe checks.

- [ ] **Step 4: Commit accessibility changes**

```bash
git add 'src/app/[locale]/products/[market]/page.tsx' 'src/app/[locale]/page.tsx' src/lib/content/render-static-markdown-content.tsx src/lib/content/__tests__ tests/e2e/table-keyboard-scroll.spec.ts
git commit -m "fix: make wide tables keyboard scrollable"
```

## Task 7: Wave 2 verification and proof boundary

- [ ] Run authoring and generated-content proof:

```bash
pnpm content:check
pnpm brand:check
```

- [ ] Run focused tests:

```bash
pnpm exec vitest run src/config/__tests__/single-site-page-expression.test.ts tests/architecture/tucsenberg-site-contract.test.ts src/lib/content
pnpm exec playwright test tests/e2e/table-keyboard-scroll.spec.ts tests/e2e/product-interest-rfq-handoff.spec.ts --project=chromium
```

- [ ] Run the 16-page mobile sweep used by the project and confirm no `scrollable-region-focusable` violation.
- [ ] Run `pnpm component:check`, `pnpm type-check`, `pnpm lint:check`, and `pnpm build`.
- [ ] Inspect rendered `/`, `/request-quote`, `/about`, `/oem-wholesale`, `/warranty`, the TB-FB product page, and the Aluminum card.
- [ ] Run `git diff --check`; confirm no new warranty framework, schema, or product capability registry was added.
- [ ] Use `superpowers:verification-before-completion`, push, wait for exact-SHA CI, mark `READY_FOR_ACCEPTANCE`, and stop.

## Self-Review

- TB-FB keeps specification conformity and shelf-life language without receiving the durable-product warranty.
- Aluminum loses only the false ABS configuration claim.
- All focus labels come from current content or translations.
- The browser test proves behavior, not only `tabIndex` source shape.
