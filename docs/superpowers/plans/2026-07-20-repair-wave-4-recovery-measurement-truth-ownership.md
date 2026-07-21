> Historical.
>
> Planning artifact. Provider recovery, Lighthouse coverage, and product-fact ownership remain unverified until execution.

# Repair Wave 4 Recovery Measurement Truth Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every partial-success inquiry one recoverable reference, measure all 16 canonical public routes, and remove the most dangerous duplicate product facts without building a new data platform.

**Architecture:** The existing `referenceId` becomes the single correlation key from pipeline through owner email and provider logs; the unused test-only `requestId` seam is removed. Lighthouse keeps an explicit executable URL list but gains a parity test against the current static-page registry plus product registry. Product-count wording is deleted, while one narrow typed TB-BW height value feeds page, SEO, and diagram surfaces.

**Tech Stack:** TypeScript, Zod, Resend, Airtable, Vitest, Lighthouse CI, React SVG, next-intl message packs, MDX.

---

## Task 1: FPH-008 specify one end-to-end reference contract

**Files:**
- Modify: `src/lib/lead-pipeline/__tests__/process-lead-observability.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/process-lead.test.ts`
- Modify: `src/lib/email/__tests__/runtime-email-content.test.ts`
- Modify: `src/lib/__tests__/resend.test.ts`

- [ ] **Step 1: Add a failing pipeline correlation test**

Capture the generated `referenceId` from the result and assert the same value is in the owner-email payload and Airtable payload:

```ts
const result = await processValidatedInquiry(LEAD);
const referenceId = result.referenceId;

expect(referenceId).toMatch(/^PRO-/u);
expect(mockSendProductInquiryEmail).toHaveBeenCalledWith(
  expect.objectContaining({ referenceId }),
);
expect(mockCreateLead).toHaveBeenCalledWith(
  expect.objectContaining({ referenceId }),
);
```

Add failure-log assertions for both providers using the same value.

- [ ] **Step 2: Add owner-email content and Resend metadata tests**

For `ProductInquiryEmailData`, require `referenceId`. Assert:

```ts
expect(content.text).toContain(`Reference: ${referenceId}`);
expect(content.html).toContain(referenceId);
expect(sentPayload.subject).toContain(referenceId);
expect(sentPayload.tags).toContainEqual({
  name: "reference-id",
  value: referenceId,
});
```

- [ ] **Step 3: Run and confirm current tests fail**

```bash
pnpm exec vitest run src/lib/lead-pipeline/__tests__/process-lead-observability.test.ts src/lib/lead-pipeline/__tests__/process-lead.test.ts src/lib/email/__tests__/runtime-email-content.test.ts src/lib/__tests__/resend.test.ts
```

Expected: FAIL because email data, content, subject, tags, and success logs do not own `referenceId`.

## Task 2: FPH-008 carry `referenceId` and remove the unused `requestId`

**Files:**
- Modify: `src/lib/lead-pipeline/process-lead.ts`
- Modify: `src/lib/email/email-data-schema.ts`
- Modify: `src/lib/email/runtime-email-content.ts`
- Modify: `src/lib/resend-utils.ts`
- Modify: `src/lib/resend-core.tsx`
- Modify: `src/emails/email-copy.ts`
- Modify: `messages/base/en/messages.json`
- Modify: the tests from Task 1

- [ ] **Step 1: Make `referenceId` required email data**

```ts
export const productInquiryEmailDataSchema = z.object({
  referenceId: z.string().trim().min(1),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  productName: z.string(),
  requirements: z.string().optional(),
});
```

Preserve `referenceId` in `sanitizeProductInquiryData`.

- [ ] **Step 2: Pass the context into email data once**

Change `createProductEmailData(lead)` to `createProductEmailData(lead, referenceId)` and return the ID. `sendProductOwnerEmail` calls it with `context.referenceId`.

- [ ] **Step 3: Put the reference in subject, body, and tags**

Add `"reference": "Reference"` to `emailTemplates.common.fields`. Include the field in `buildProductInquiryEmailContent`.

Use:

```ts
subject: (data) =>
  `[${data.referenceId}] ${formatTemplate(emailTemplateCopy.productInquiry.subject, {
    productName: data.productName,
  })}`
```

Change `getProductInquiryTags(referenceId)` to append the `reference-id` tag, and pass it from `resend-core.tsx`.

- [ ] **Step 4: Add reference IDs to provider success logs**

The Resend success and failure logs include `referenceId`; Airtable already logs it. Do not log raw message content or buyer email.

- [ ] **Step 5: Delete the test-only request seam**

Remove `ProcessInquiryOptions`, `LeadProcessingContext.requestId`, `withRequestId`, and the second parameter of `processValidatedInquiry`. Update the observability tests to assert `referenceId` only. Current production callers never supply `requestId`, so do not invent a new source.

- [ ] **Step 6: Run, sync, and commit**

```bash
pnpm content:check
pnpm exec vitest run src/lib/lead-pipeline/__tests__/process-lead-observability.test.ts src/lib/lead-pipeline/__tests__/process-lead.test.ts src/lib/email/__tests__/runtime-email-content.test.ts src/lib/__tests__/resend.test.ts src/emails/__tests__/email-copy-source.test.ts
pnpm type-check
git add src/lib/lead-pipeline/process-lead.ts src/lib/lead-pipeline/__tests__ src/lib/email src/lib/resend-utils.ts src/lib/resend-core.tsx src/lib/__tests__/resend.test.ts src/emails messages/base/en/messages.json
git commit -m "fix: carry inquiry reference through owner recovery"
```

## Task 3: FPH-009 lock Lighthouse to all canonical routes

**Files:**
- Modify: `lighthouserc.js`
- Create: `tests/unit/scripts/lighthouse-route-contract.test.ts`
- Read: `src/config/pages.config.ts`
- Read: `src/config/single-site-seo.ts`
- Read: `src/constants/tucsenberg-product-pages.ts`

- [ ] **Step 1: Add the failing parity test**

Load `lighthouserc.js`, normalize each URL to its pathname, and compare it with:

```ts
const expectedPaths = [
  ...getSingleSitePublicStaticPages().map((path) => path || "/"),
  ...Object.keys(TUCSENBERG_PRODUCT_PAGES).map(
    (slug) => `/products/${slug}`,
  ),
];
```

Assert 16 unique canonical paths, no `/en`, and no redirect target duplication.

- [ ] **Step 2: Confirm the current five-URL list fails**

```bash
pnpm exec vitest run tests/unit/scripts/lighthouse-route-contract.test.ts
```

Expected: FAIL with 5 actual versus 16 expected paths.

- [ ] **Step 3: Replace the stale URL list and comments**

Keep `numberOfRuns: 3` and existing thresholds. Set `criticalUrls` to `/` and `allUrls` to the 11 static routes plus all five product routes, all without `/en`.

Update `assertMatrix` so product-detail routes receive the intended product assertion set without hard-coding only `abs-flood-barriers`.

- [ ] **Step 4: Run the contract and full Lighthouse proof**

```bash
pnpm exec vitest run tests/unit/scripts/lighthouse-route-contract.test.ts
CI_DAILY=true pnpm website:lighthouse
```

Expected: 16 canonical URLs are requested directly and all current assertions pass. If runner performance fails, record the real route/metric; do not drop routes or lower thresholds in this finding.

- [ ] **Step 5: Commit**

```bash
git add lighthouserc.js tests/unit/scripts/lighthouse-route-contract.test.ts
git commit -m "fix: audit every canonical route with lighthouse"
```

## Task 4: FPH-014 remove fixed product-count copy

**Files:**
- Modify: `messages/profiles/catalog/en/messages.json`
- Modify: `content/pages/en/oem-wholesale.mdx`
- Modify: `content/pages/en/flood-barrier-materials-guide.mdx`
- Modify: `tests/architecture/tucsenberg-product-pages.test.ts`

- [ ] **Step 1: Add a failing active-copy scan**

Build one string from the three active authoring files and assert it does not match count-bound catalog phrases:

```ts
expect(activeCatalogCopy).not.toMatch(/\bfive\b|all five|five lines/iu);
```

The test may allow model numbers and other factual numbers; it targets catalog-count prose only.

- [ ] **Step 2: Replace count-bound wording**

Use stable phrases such as `the product range`, `the lines below`, `across the catalog`, and `one coordinated factory pool`. Keep the actual five product entries and comparison columns; remove claims that would become false when a sixth item is added.

- [ ] **Step 3: Sync and prove**

```bash
pnpm content:check
pnpm exec vitest run tests/architecture/tucsenberg-product-pages.test.ts
```

Expected: adding a sixth test-local catalog slug cannot leave an active `five` claim.

## Task 5: FPH-014 give TB-BW height one narrow typed owner

**Files:**
- Create: `src/constants/tucsenberg-product-spec-values.ts`
- Modify: `src/constants/tucsenberg-product-page-abs-flood-barriers.ts`
- Modify: `src/constants/tucsenberg-product-meta.ts`
- Modify: `src/constants/tucsenberg-product-page-types.ts`
- Modify: `src/components/products/product-diagrams.tsx`
- Modify: `src/components/products/__tests__/product-diagrams.test.tsx`
- Modify: `tests/architecture/tucsenberg-product-pages.test.ts`

- [ ] **Step 1: Add failing parity assertions**

Assert page proof-strip text, SEO description, and rendered diagram all contain the same exported label. Add one mutation-style fixture that substitutes `40-90 cm` into the formatter and proves all derived presenters receive it.

- [ ] **Step 2: Create only the shared value that is actually duplicated**

```ts
export const TB_BW_HEIGHT_RANGE = {
  minimumCm: 50,
  maximumCm: 85,
  label: "50–85 cm",
} as const;
```

- [ ] **Step 3: Feed page, metadata, and diagram from the value**

- Use the range in the ABS lead/proof strip and metadata template.
- Add `heightRange: string` to `BoxwallDiagramLabels`.
- Set `diagram.labels.heightRange` from the shared value.
- Replace the literal diagram dimension label with `labels.heightRange`.

Do not move unrelated product prose or tables into the shared value file.

- [ ] **Step 4: Run and commit the narrow owner change**

```bash
pnpm exec vitest run tests/architecture/tucsenberg-product-pages.test.ts src/components/products/__tests__/product-diagrams.test.tsx src/app/__tests__/source-title-suffix.test.ts
pnpm type-check
git add src/constants/tucsenberg-product-spec-values.ts src/constants/tucsenberg-product-page-abs-flood-barriers.ts src/constants/tucsenberg-product-meta.ts src/constants/tucsenberg-product-page-types.ts src/components/products/product-diagrams.tsx src/components/products/__tests__/product-diagrams.test.tsx tests/architecture/tucsenberg-product-pages.test.ts messages/profiles/catalog/en/messages.json content/pages/en/oem-wholesale.mdx content/pages/en/flood-barrier-materials-guide.mdx
git commit -m "refactor: narrow product fact ownership"
```

## Task 6: Wave 4 verification and proof boundary

- [ ] Run focused lead, email, Lighthouse, product, and diagram suites.
- [ ] Run `pnpm content:check`, `pnpm component:check`, `pnpm type-check`, `pnpm lint:check`, `pnpm test`, and `pnpm build`.
- [ ] Run `CI_DAILY=true pnpm website:lighthouse` and record all 16 requested paths.
- [ ] Run a partial-success deployed canary only with real credentials. Match buyer response, owner email subject/body, Resend tag/log, and Airtable failure/success log by the same `referenceId`. Otherwise mark the provider checks `BLOCKED_EXTERNAL`.
- [ ] Search for the removed `requestId` seam and active count-bound copy:

```bash
rg -n "ProcessInquiryOptions|withRequestId|requestId" src/lib/lead-pipeline
rg -n "\bfive\b|all five|five lines" messages/profiles/catalog/en content/pages/en src
```

- [ ] Run `git diff --check`, use `superpowers:verification-before-completion`, push, wait for exact-SHA CI, mark `READY_FOR_ACCEPTANCE`, and stop.

## Self-Review

- One `referenceId` reaches the buyer, owner, Resend metadata, and logs.
- `requestId` is removed rather than promoted without a producer.
- Lighthouse covers 11 static and 5 product routes without `/en` redirects.
- Product-count prose is deleted; only the proven duplicated TB-BW range gets a shared typed owner.
