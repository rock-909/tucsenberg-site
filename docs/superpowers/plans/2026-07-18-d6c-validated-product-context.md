> Historical.
>
> This plan implements `docs/superpowers/specs/2026-07-18-d6c-validated-product-context-design.md`. Current product truth remains in stable project docs and runtime code.

# D6c Validated Product Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Route every known product-page and estimator quote handoff through one catalog-validated Request Quote context while keeping the public form at three fields.

**Architecture:** A small shared handoff module creates and parses the query contract. The Request Quote Server Component validates request-specific search params, then passes a `catalog-context | general-context` value to the shared Client Component. The API independently keeps its existing final schema validation.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.7, TypeScript 6 strict, next-intl 4.13, Vitest, Testing Library and Playwright.

---

## Task 1: Make the catalog facade the only product lookup truth

**Files:**
- Modify: `src/constants/product-catalog.ts`
- Modify: `src/lib/lead-pipeline/lead-schema.ts`
- Modify: `src/lib/lead-pipeline/product-identity.ts`
- Test: `src/constants/__tests__/product-catalog.test.ts`
- Create: `src/lib/lead-pipeline/__tests__/product-identity.test.ts`

- [x] **Step 1: Add failing facade and strict identity tests**

Add tests proving the facade type guard accepts `abs-flood-barriers`, rejects an invented slug, and `resolveProductIdentity` returns the catalog label. Add a controlled drift test that passes an otherwise typed catalog lead whose ID cannot resolve and expects an internal error rather than the raw ID as `productName`.

- [x] **Step 2: Run the focused tests and confirm RED**

```bash
pnpm exec vitest run src/constants/__tests__/product-catalog.test.ts src/lib/lead-pipeline/__tests__/product-identity.test.ts
```

Expected: fail because the type guard and strict identity behavior do not exist.

- [x] **Step 3: Implement the minimal facade**

Change `src/constants/product-catalog.ts` to import `singleSiteProductCatalog` and `ProductMarketSlug` directly. Export `isProductMarketSlug(value: string): value is ProductMarketSlug`. Reuse `getMarketBySlug` from `lead-schema.ts` and `product-identity.ts`; do not add a second repository or cache.

In `resolveProductIdentity`, throw an `Error` if a catalog lead cannot resolve. Never return `lead.catalogProductId` as the display label.

- [x] **Step 4: Run the tests and confirm GREEN**

```bash
pnpm exec vitest run src/constants/__tests__/product-catalog.test.ts src/lib/lead-pipeline/__tests__/product-identity.test.ts src/lib/lead-pipeline/__tests__/lead-schema.test.ts
```

- [x] **Step 5: Commit**

```bash
git add src/constants/product-catalog.ts src/constants/__tests__/product-catalog.test.ts src/lib/lead-pipeline/lead-schema.ts src/lib/lead-pipeline/product-identity.ts src/lib/lead-pipeline/__tests__/product-identity.test.ts
git commit -m "refactor: centralize catalog product lookup"
```

## Task 2: Define and test the validated handoff contract

**Files:**
- Create: `src/lib/lead-pipeline/inquiry-handoff.ts`
- Create: `src/lib/lead-pipeline/__tests__/inquiry-handoff.test.ts`

- [x] **Step 1: Write failing behavior tests**

Cover these inputs:

```ts
{ catalogProductId: "abs-flood-barriers" }
{ catalogProductId: "forged-product" }
{ catalogProductId: ["abs-flood-barriers", "frp-flood-barriers"] }
{ interest: "  reseller project  ", config: "  visible estimate  " }
```

Assert one valid scalar ID returns `catalog-context`; invalid/repeated/missing IDs return `general-context`; `interest` and `config` are trimmed and capped; a generated link contains the catalog ID and optional `config` but never invents `productInquiryKind`.

- [x] **Step 2: Run and confirm RED**

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/inquiry-handoff.test.ts
```

- [x] **Step 3: Implement the smallest shared module**

Export:

```ts
export type InquirySearchParams = Record<string, string | string[] | undefined>;
export type ValidatedInquiryContext =
  | {
      kind: "catalog-context";
      catalogProductId: ProductMarketSlug;
      displayLabel: string;
      buyerInterest?: string;
      initialMessage?: string;
    }
  | {
      kind: "general-context";
      buyerInterest?: string;
      initialMessage?: string;
    };

export function resolveInquiryContext(
  searchParams: InquirySearchParams,
): ValidatedInquiryContext;

export function createCatalogInquiryHref(
  catalogProductId: ProductMarketSlug,
  initialMessage?: string,
): `/request-quote${string}`;
```

Use `URLSearchParams` and the existing validation limits. Do not introduce a class, interface implementation, signing layer or general-purpose query builder.

- [x] **Step 4: Run and confirm GREEN**

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/inquiry-handoff.test.ts
```

- [x] **Step 5: Commit**

```bash
git add src/lib/lead-pipeline/inquiry-handoff.ts src/lib/lead-pipeline/__tests__/inquiry-handoff.test.ts
git commit -m "feat: validate request quote product handoff"
```

## Task 3: Make InquiryForm consume validated context

**Files:**
- Modify: `src/components/forms/inquiry-form.tsx`
- Modify: `src/components/forms/inquiry-payload.ts`
- Modify: `src/components/forms/inquiry-form-fields.tsx`
- Modify: `src/components/forms/__tests__/inquiry-form.test.tsx`
- Modify: `src/app/[locale]/contact/page.tsx`

- [x] **Step 1: Replace URL-driven tests with context-driven failing tests**

Test `InquiryForm` with explicit general and catalog contexts. Assert:

- catalog context renders the server-resolved display label and submits `catalog-product + catalogProductId`;
- general context with interest submits `general-rfq + buyerInterest` and no catalog ID;
- initial message is visible, editable and clearable;
- contact passes `general-context` and cannot inherit Request Quote query state;
- attribution, `website` honeypot and Turnstile token remain in the body.

- [x] **Step 2: Run and confirm RED**

```bash
pnpm exec vitest run src/components/forms/__tests__/inquiry-form.test.tsx
```

- [x] **Step 3: Implement the context prop**

Add `context: ValidatedInquiryContext` to `InquiryFormProps`. Remove `useMemo`, `readRequestQuoteUrlContext` and all reads of `window.location.search`. Build the payload from the typed context:

```ts
const identity =
  context.kind === "catalog-context"
    ? {
        productInquiryKind: PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT,
        catalogProductId: context.catalogProductId,
      }
    : { productInquiryKind: PRODUCT_INQUIRY_KINDS.GENERAL_RFQ };
```

Keep `buyerInterest` description-only. Use `displayLabel` for catalog visible context and `buyerInterest` for general visible context. Do not render hidden product fields.

- [x] **Step 4: Run and confirm GREEN**

```bash
pnpm exec vitest run src/components/forms/__tests__/inquiry-form.test.tsx src/app/[locale]/contact/__tests__/page-rendering-basic.test.tsx
```

- [x] **Step 5: Commit**

```bash
git add src/components/forms/inquiry-form.tsx src/components/forms/inquiry-payload.ts src/components/forms/inquiry-form-fields.tsx src/components/forms/__tests__/inquiry-form.test.tsx 'src/app/[locale]/contact/page.tsx'
git commit -m "refactor: pass validated inquiry context to the form"
```

## Task 4: Validate Request Quote search params on the server

**Files:**
- Modify: `src/app/[locale]/request-quote/page.tsx`
- Modify: `src/app/[locale]/request-quote/__tests__/page.test.tsx`

- [x] **Step 1: Add failing page behavior tests**

Call the page with async `searchParams` and prove:

- valid catalog ID produces a catalog-context form;
- invalid and repeated IDs produce a general-context form without displaying or submitting the forged value;
- estimator `config` appears in the textarea;
- missing search params still renders a general RFQ.

- [x] **Step 2: Run and confirm RED**

```bash
pnpm exec vitest run 'src/app/[locale]/request-quote/__tests__/page.test.tsx'
```

- [x] **Step 3: Implement Next.js 16 async search params**

Extend `RequestQuotePageProps` with:

```ts
searchParams?: Promise<Record<string, string | string[] | undefined>>;
```

Await it in the Server Component, call `resolveInquiryContext`, and pass the result to `InquiryForm`. Keep metadata independent of the query and preserve the existing JSON-LD canonical URL.

- [x] **Step 4: Run and confirm GREEN**

```bash
pnpm exec vitest run 'src/app/[locale]/request-quote/__tests__/page.test.tsx' src/components/forms/__tests__/inquiry-form.test.tsx
```

- [x] **Step 5: Commit**

```bash
git add 'src/app/[locale]/request-quote/page.tsx' 'src/app/[locale]/request-quote/__tests__/page.test.tsx'
git commit -m "feat: resolve request quote context on the server"
```

## Task 5: Derive product CTA and estimator links from catalog identity

**Files:**
- Modify: `src/constants/tucsenberg-product-page-types.ts`
- Modify: `src/constants/tucsenberg-product-page-abs-flood-barriers.ts`
- Modify: `src/constants/tucsenberg-product-page-aluminum-flood-gates.ts`
- Modify: `src/constants/tucsenberg-product-page-absorbent-flood-bags.ts`
- Modify: `src/constants/tucsenberg-product-page-flood-tube-dams.ts`
- Modify: `src/constants/tucsenberg-product-page-frp-flood-barriers.ts`
- Modify: `src/constants/tucsenberg-product-pages.ts`
- Modify: `src/app/[locale]/products/[market]/page.tsx`
- Modify: `src/components/products/product-run-calculator.tsx`
- Modify: `src/components/products/__tests__/product-run-calculator.test.tsx`
- Modify: `src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx`

- [x] **Step 1: Add failing CTA and calculator tests**

Assert every known product page CTA contains its catalog slug through the shared query contract. Assert both calculators use `catalogProductId`, preserve the editable estimator message, and never emit the old `interest=` identity link.

- [x] **Step 2: Run and confirm RED**

```bash
pnpm exec vitest run src/components/products/__tests__/product-run-calculator.test.tsx 'src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx'
```

- [x] **Step 3: Remove duplicated URL truth**

- change `TucsenbergProductPage.slug` and calculator identity to `ProductMarketSlug`;
- remove `href` from `TucsenbergProductCta` and all five content objects;
- remove calculator `interest` and replace it with `catalogProductId`;
- derive route CTA hrefs and calculator hrefs with `createCatalogInquiryHref`;
- rewrite the two inline product-copy Request Quote links as non-link guidance to use the page Quote button.

Do not build a markdown URL rewriting layer.

- [x] **Step 4: Run and confirm GREEN**

```bash
pnpm exec vitest run src/components/products/__tests__/product-run-calculator.test.tsx 'src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx' tests/architecture/tucsenberg-product-pages.test.ts
```

- [x] **Step 5: Commit**

```bash
git add src/constants/tucsenberg-product-page-types.ts src/constants/tucsenberg-product-page-*.ts src/constants/tucsenberg-product-pages.ts 'src/app/[locale]/products/[market]/page.tsx' src/components/products/product-run-calculator.tsx src/components/products/__tests__/product-run-calculator.test.tsx 'src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx'
git commit -m "refactor: derive product quote links from catalog ids"
```

## Task 6: Remove the dead specialty branch and prove the complete handoff

**Files:**
- Modify: `src/config/single-site-page-expression.ts`
- Modify: `src/config/__tests__/single-site-page-expression.test.ts`
- Modify: `tests/e2e/product-interest-rfq-handoff.spec.ts`
- Modify: `docs/项目基础/行为合约.md`
- Modify: `docs/技术难题/整库审查2026-07/执行计划.md`
- Modify: `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md`

- [x] **Step 1: Add the failing end-to-end contract**

Update the product journey to expect a catalog query from the FRP product page, a visible server-resolved product context on Request Quote, and this `/api/inquiry` body:

```ts
{
  productInquiryKind: "catalog-product",
  catalogProductId: "frp-flood-barriers",
  message: "Need FRP barrier details."
}
```

Add a general Request Quote assertion that no catalog ID appears without a valid product handoff.

- [x] **Step 2: Run and confirm RED**

```bash
CI=1 pnpm exec playwright test tests/e2e/product-interest-rfq-handoff.spec.ts --project=chromium
```

- [x] **Step 3: Remove the impossible catalog grouping branch**

Delete `SPECIALTY_MARKET_SLUG`, `specialtyMarketSlug` and the filtering branch. Set `standardMarketSlugs` directly from the catalog and update the test to assert the products page list matches the catalog. Do not add a guard that merely bans the old constant name.

Update BC-009/BC-013 and the lead-pipeline details to describe server-validated catalog handoff. Record D6b as `READY_FOR_CLUSTER` on PR #138 exact SHA `fe2019d976df937ab9525aab10ba10776bfb5e38`; keep M3 merged at 26/33 and mark D6c active until its PR is ready.

- [x] **Step 4: Run focused and broad verification**

```bash
pnpm content:check
pnpm exec vitest run src/lib/lead-pipeline/__tests__/inquiry-handoff.test.ts src/lib/lead-pipeline/__tests__/product-identity.test.ts src/lib/lead-pipeline/__tests__/lead-schema.test.ts src/components/forms/__tests__/inquiry-form.test.tsx src/components/products/__tests__/product-run-calculator.test.tsx 'src/app/[locale]/request-quote/__tests__/page.test.tsx' 'src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx' src/config/__tests__/single-site-page-expression.test.ts
CI=1 pnpm exec playwright test tests/e2e/product-interest-rfq-handoff.spec.ts tests/e2e/contact-submit-journey.spec.ts --project=chromium
pnpm website:check
pnpm react:doctor
git diff --check
```

- [x] **Step 5: Commit the D6c implementation result**

```bash
git add src tests docs
git commit -m "refactor: derive inquiry product context from validated page handoff"
```

Do not amend earlier commits. Do not start D6d, push, open a PR or merge; return control to Codex for local review.

## Plan self-review

- [x] Every design requirement maps to a task and a behavior test.
- [x] The plan preserves the three-field public form, attribution, honeypot and Turnstile.
- [x] The page and API each validate at their own trust boundary without sharing buyer-controlled discriminants.
- [x] Product CTAs and calculators derive from one helper; inline product copy does not create a second URL truth.
- [x] No new dependency, service interface, repository class, signing layer or generic form/query framework is introduced.
- [x] D6d and D6e work remains out of scope.
