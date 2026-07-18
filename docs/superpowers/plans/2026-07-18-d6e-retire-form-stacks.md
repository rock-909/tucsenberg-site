# D6e Retire Duplicate Form Stacks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the obsolete Contact/RFQ form, schema, delivery, message, and governance stacks while preserving one three-field `InquiryForm -> /api/inquiry -> product/general owner email + Airtable` path.

**Architecture:** Contact renders the existing shared `InquiryForm` directly, exactly as Request Quote already does. The inquiry route accepts only current buyer fields plus validated handoff/attribution, validates once, and calls the single product/general pipeline. Legacy Contact, RFQ, confirmation-email, compatibility, and configuration branches are moved to Trash rather than wrapped.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.7, TypeScript 6.0.3 strict, Zod 4.4.3, next-intl 4.13.0, Resend HTTP adapter, Airtable SDK, Vitest, Playwright, Storybook 10.4.6, Cloudflare/OpenNext.

**Execution boundary:** Work only in `/Users/Data/code/tucsenberg-site/.worktrees/m3-d6e` on `feat/m3-d6e-retire-form-stacks`, stacked on D6d. Do not touch the main worktree or PR #102. Use `apply_patch` for manual edits. Move deleted files into a timestamped directory under `~/.Trash`; never use `rm`, `git rm`, `unlink`, `git clean`, or `find -delete`.

---

## Target file shape

### Keep as runtime owners

- `src/components/forms/inquiry-form.tsx`: the only buyer-visible live form.
- `src/components/forms/inquiry-form-static-fallback.tsx`: the no-JS/server fallback.
- `src/app/[locale]/request-quote/request-quote-inquiry-form.tsx`: validated Request Quote composition.
- `src/app/api/inquiry/route.ts`: the only lead-writing route.
- `src/lib/lead-pipeline/lead-schema.ts`: one `productLeadSchema` and `ProductLeadInput`.
- `src/lib/lead-pipeline/process-lead.ts`: one `processValidatedInquiry` delivery entry.
- `src/lib/resend-core.tsx`: one product/general owner-email method.
- `src/lib/airtable/service.ts` and `service-internal/lead-records.ts`: one Airtable create path.
- `src/components/forms/inquiry-response.ts`: one browser response model.

### Add

- `src/components/forms/inquiry-form.stories.tsx`: one small story using the real shared component.

### Move to Trash and stage as deleted

The implementation steps below list the exact legacy files by group. Preserve their relative paths inside a timestamped Trash directory so recovery remains possible.

---

## Task 1: Capture the current live delivery behavior in a green baseline

**Files:**
- Modify: `src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts`
- Modify: `tests/integration/api/lead-pipeline-real.test.ts`

- [ ] **Step 1: Strengthen the existing product/general delivery characterization**

Keep this task green on the current D6d baseline. Add or tighten tests that prove the already-live behavior:

```ts
expect(sendProductInquiryEmail).toHaveBeenCalledWith(
  expect.objectContaining({
    email: "jane@example.com",
    productName: expect.any(String),
    requirements: expect.stringContaining("Need flood protection"),
  }),
);

expect(createLead).toHaveBeenCalledWith(
  expect.any(String),
  expect.objectContaining({
    email: "jane@example.com",
    requirements: expect.stringContaining("Need flood protection"),
  }),
);
```

Cover both `general-rfq` and server-validated `catalog-product`, multiline canonical `message`, optional empty message, email-only success, Airtable-only success, and both-deliveries-fail. Do not change route/schema/message ownership in this task.

- [ ] **Step 2: Run the focused tests and confirm the characterization is GREEN**

Run:

```bash
pnpm exec vitest run \
  src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts \
  tests/integration/api/lead-pipeline-real.test.ts
```

Expected: PASS on D6d before any retirement. If it fails, diagnose the baseline before proceeding.

- [ ] **Step 3: Commit the green characterization**

```bash
git add src/lib/lead-pipeline/__tests__/canonical-inquiry-contract.test.ts tests/integration/api/lead-pipeline-real.test.ts
git commit -m "test: characterize the live inquiry delivery path"
```

---

## Task 2: Render the shared InquiryForm directly on Contact

**Files:**
- Modify: `src/app/[locale]/contact/contact-page-sections.tsx`
- Modify: `src/app/[locale]/contact/__tests__/page.test.tsx`
- Modify: `tests/architecture/contact-entry-boundary.test.ts`
- Modify: `tests/architecture/contact-page-boundary.test.ts`
- Move to Trash: `src/components/contact/contact-form-island.tsx`
- Move to Trash: `src/components/contact/contact-form-load-error.tsx`
- Move to Trash: `src/components/contact/__tests__/contact-form-island.test.tsx`

- [ ] **Step 1: Write the Contact composition RED tests**

Stop mocking `ContactFormIsland`. Mock or inspect the real `InquiryForm` boundary and assert `source="contact"`, `context={{kind: "general-context"}}`, the typed copy, and the existing `InquiryFormStaticFallback`. Keep all current assertions that protect Contact page content and public company phone behavior.

In the architecture tests, use the TypeScript compiler AST (`ts.createSourceFile`) to collect static imports and JSX identifiers. Prove that both Contact and Request Quote import `InquiryForm` from `@/components/forms/inquiry-form` and render that imported binding. Do not use `source.toContain("InquiryForm")`, because comments or unused imports must not satisfy the gate.

Run the three focused tests now. Expected: RED because Contact still renders `ContactFormIsland`.

- [ ] **Step 2: Replace the second island with direct composition**

The target body of `ContactFormWithFallback` is:

```tsx
const inquiryCopy = createInquiryFormCopyFromMessages(messages);
const inquiryFallback = <InquiryFormStaticFallback copy={inquiryCopy} />;

return (
  <div className="min-w-0 space-y-6" data-testid="contact-form-column">
    <InquiryForm
      source="contact"
      copy={inquiryCopy}
      context={{ kind: "general-context" }}
      fallback={inquiryFallback}
    />
  </div>
);
```

Import `InquiryForm` directly. Remove reads of `contact.form.loadError` and `contact.form.retryLoad`.

- [ ] **Step 3: Move the obsolete island files to Trash**

Create one Task-2-specific timestamped Trash root and preserve paths in the same shell block:

```bash
TRASH_ROOT="$HOME/.Trash/tucsenberg-d6e-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$TRASH_ROOT/src/components/contact/__tests__"
mv src/components/contact/contact-form-island.tsx "$TRASH_ROOT/src/components/contact/"
mv src/components/contact/contact-form-load-error.tsx "$TRASH_ROOT/src/components/contact/"
mv src/components/contact/__tests__/contact-form-island.test.tsx "$TRASH_ROOT/src/components/contact/__tests__/"
```

Before each `mv`, the block must execute `test -n "$TRASH_ROOT"` and `test -d "$TRASH_ROOT"`. Do not rely on this shell variable in later tasks.

- [ ] **Step 4: Verify direct render and no-JS behavior**

Run:

```bash
pnpm exec vitest run \
  'src/app/[locale]/contact/__tests__/page.test.tsx' \
  src/components/forms/__tests__/inquiry-form.test.tsx \
  tests/architecture/contact-entry-boundary.test.ts \
  tests/architecture/contact-page-boundary.test.ts
```

Expected: PASS. The server snapshot/fallback still explains that JavaScript is required for security verification and provides direct email.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/[locale]/contact' src/components/contact tests/architecture/contact-entry-boundary.test.ts tests/architecture/contact-page-boundary.test.ts
git commit -m "refactor: render the shared inquiry form directly on contact"
```

---

## Task 3: Retire the legacy Contact and Request Quote frontend stacks

**Move to Trash — Contact production/config files:**
- `src/app/[locale]/contact/contact-form-static-fallback.tsx`
- `src/components/forms/contact-form-container.tsx`
- `src/components/forms/contact-form-container-view.tsx`
- `src/components/forms/contact-form-fields.tsx`
- `src/components/forms/contact-form-feedback.tsx`
- `src/components/forms/use-contact-form.ts`
- `src/components/forms/use-rate-limit.ts`
- `src/config/contact-form-config.ts`
- `src/config/contact-form-validation.ts`
- `src/lib/form-schema/contact-form-schema.ts`
- `src/lib/form-schema/contact-field-validators.ts`
- `src/lib/contact/submit-canonical-contact.ts`
- `src/lib/actions/server-action-utils.ts`

**Move to Trash — Contact-only tests/stories/fixtures:**
- `src/app/[locale]/contact/__tests__/contact-form-static-fallback.test.tsx`
- `src/components/forms/__tests__/contact-form-accessibility.test.tsx`
- `src/components/forms/__tests__/contact-form-container-core.test.tsx`
- `src/components/forms/__tests__/contact-form-container-wiring.test.tsx`
- `src/components/forms/__tests__/contact-form-container.test.tsx`
- `src/components/forms/__tests__/contact-form-fields.test.tsx`
- `src/components/forms/__tests__/contact-form-submission.test.tsx`
- `src/components/forms/__tests__/contact-form-validation.test.tsx`
- `src/components/forms/__tests__/use-contact-form.test.tsx`
- `src/config/__tests__/contact-form-config.test.ts`
- `src/lib/__tests__/contact-field-validators.test.ts`
- `src/lib/__tests__/contact-form-processing.test.ts`
- `src/lib/__tests__/validations.test.ts`
- `src/components/contact/contact-form.stories.tsx`
- `src/components/forms/contact-form-container-view.stories.tsx`
- `src/components/forms/contact-form-container.stories.tsx`
- `src/components/forms/contact-form-feedback.stories.tsx`
- `src/components/forms/contact-form-fields.stories.tsx`
- `src/components/forms/contact-form.stories.tsx`
- `src/components/forms/contact-form-story-fixtures.ts`

**Move to Trash — pre-D6a Request Quote stack:**
- `src/app/[locale]/request-quote/request-quote-form.tsx`
- `src/app/[locale]/request-quote/request-quote-form-fields.tsx`
- `src/app/[locale]/request-quote/request-quote-form-copy.ts`
- `src/app/[locale]/request-quote/request-quote-payload.ts`
- `src/app/[locale]/request-quote/request-quote-response.ts`
- `src/app/[locale]/request-quote/request-quote-submit-controls.tsx`
- `src/app/[locale]/request-quote/__tests__/request-quote-form.test.tsx`
- `src/app/[locale]/request-quote/__tests__/request-quote-payload.test.ts`
- `src/test/request-quote-test-messages.ts`
- `src/lib/lead-pipeline/__tests__/lead-field-limit-consistency.test.ts`

**Files to modify:**
- `src/app/[locale]/request-quote/__tests__/page.test.tsx`
- `src/lib/forms/use-lead-form-submission.ts`
- `src/lib/env.ts`
- `src/lib/public-runtime-env.ts`
- `.env.example`
- `src/lib/__tests__/env.real-contract.test.ts`
- `src/lib/__tests__/public-runtime-env.test.ts`
- `src/components/forms/inquiry-form.stories.tsx`

- [ ] **Step 1: Update the Request Quote and Storybook expectations first**

Remove the old `requestQuote.form` fixture and test-helper imports from the Request Quote page test. Keep `requestQuote.metadata`, `requestQuote.page`, `inquiry.form`, validated product context, fallback, and page-heading assertions. Add the real `InquiryForm` story described in Step 5, then run the page test and Storybook build before deleting the obsolete stories. Expected: the page test remains GREEN; Storybook may still contain both old and new stories at this point.

- [ ] **Step 2: Move the listed legacy files to a Task-3 Trash root**

In one shell block, create a new timestamped `TRASH_ROOT`, assert it is non-empty and exists, then for each listed path create its relative parent under Trash and use `mv`. Do not use a permanent deletion command. Do not reuse Task 2's shell variable. After moving, `git status --short` must show only expected deletions plus current modifications.

- [ ] **Step 3: Remove the retired browser cooldown configuration**

Delete `NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS` from:

- client env schema and runtime mapping in `src/lib/env.ts`;
- `PUBLIC_RUNTIME_ENV_READERS` in `src/lib/public-runtime-env.ts`;
- `.env.example`;
- dedicated env test fixtures and assertions.

Do not add a replacement setting.

- [ ] **Step 4: Remove historical result-model wording**

Rewrite `use-lead-form-submission.ts:10-28` to describe only the shared inquiry lifecycle. Remove the sentence claiming Contact keeps `ServerActionResult` and RFQ keeps `RequestQuoteSubmitState`. Keep the generic hook only because the active `InquiryForm` consumes it; do not add another response interface.

- [ ] **Step 5: Keep one real InquiryForm Storybook entry**

Create `src/components/forms/inquiry-form.stories.tsx` using the real component, `useMessages()`, `createInquiryFormCopyFromMessages()`, and `InquiryFormStaticFallback`. Export only:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useMessages } from "next-intl";
import {
  InquiryForm,
  type InquiryFormSource,
} from "@/components/forms/inquiry-form";
import { createInquiryFormCopyFromMessages } from "@/components/forms/inquiry-form-copy";
import { InquiryFormStaticFallback } from "@/components/forms/inquiry-form-static-fallback";
import type { ValidatedInquiryContext } from "@/lib/lead-pipeline/inquiry-handoff";

interface InquiryFormStoryProps {
  source: InquiryFormSource;
  context: ValidatedInquiryContext;
}

function InquiryFormStory({ source, context }: InquiryFormStoryProps) {
  const messages = useMessages() as Record<string, unknown>;
  const copy = createInquiryFormCopyFromMessages(messages);
  return (
    <InquiryForm
      source={source}
      copy={copy}
      context={context}
      fallback={<InquiryFormStaticFallback copy={copy} />}
    />
  );
}

const meta = {
  title: "Forms/InquiryForm",
  component: InquiryFormStory,
  tags: ["autodocs"],
} satisfies Meta<typeof InquiryFormStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GeneralContact: Story = {
  args: { source: "contact", context: { kind: "general-context" } },
};

export const CatalogContext: Story = {
  args: {
    source: "request-quote",
    context: {
      kind: "catalog-context",
      catalogProductId: "abs-flood-barriers",
      displayLabel: "ABS Flood Barriers",
    },
  },
};
```

Do not add story-only props to production code and do not recreate success/error state fixtures.

- [ ] **Step 6: Run focused frontend and Storybook proof**

```bash
pnpm exec vitest run \
  'src/app/[locale]/contact/__tests__/page.test.tsx' \
  'src/app/[locale]/request-quote/__tests__/page.test.tsx' \
  'src/app/[locale]/request-quote/__tests__/request-quote-inquiry-form.test.tsx' \
  src/components/forms/__tests__/inquiry-form.test.tsx \
  src/lib/__tests__/env.real-contract.test.ts \
  src/lib/__tests__/public-runtime-env.test.ts
pnpm exec storybook build
```

Expected: PASS. No legacy Contact/RFQ source is needed to build Storybook.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/[locale]/contact' 'src/app/[locale]/request-quote' src/components src/config src/lib src/test .env.example
git commit -m "refactor: retire the duplicate inquiry frontends"
```

---

## Task 4: Collapse the API, schema, email, and Airtable pipeline to one model

**Files:**
- Modify: `src/app/api/inquiry/route.ts`
- Move to Trash: `src/lib/lead-pipeline/inquiry-payload-adapter.ts`
- Move to Trash: `src/lib/lead-pipeline/__tests__/inquiry-payload-adapter.test.ts`
- Modify: `src/lib/lead-pipeline/lead-schema.ts`
- Modify: `src/lib/lead-pipeline/process-lead.ts`
- Modify: `src/lib/lead-pipeline/utils.ts`
- Modify: `src/lib/email/email-data-schema.ts`
- Modify: `src/lib/email/runtime-email-content.ts`
- Modify: `src/emails/email-copy.ts`
- Modify: `src/lib/resend-core.tsx`
- Modify: `src/lib/resend-utils.ts`
- Modify: `src/lib/airtable/types.ts`
- Modify: `src/lib/airtable/service-internal/lead-records.ts`
- Modify: `src/lib/airtable/service.ts`
- Modify: `src/lib/airtable/service-internal/lead-records.test.ts`
- Modify: `src/lib/__tests__/airtable-operations.test.ts`
- Modify: `src/lib/__tests__/airtable-advanced.test.ts`
- Modify: `src/lib/__tests__/airtable-create-operations.test.ts`
- Modify: `src/lib/__tests__/airtable.test.ts`
- Modify: `src/lib/__tests__/airtable-error-handling.test.ts`
- Modify: `src/lib/__tests__/cloudflare-runtime-env.test.ts`
- Modify: `src/lib/api/__tests__/api-response.test.ts`
- Move to Trash: `src/app/api/contact/route.ts`
- Move to Trash: `src/app/api/contact/__tests__/route.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/lead-schema.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/lead-schema.property.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/process-lead.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/process-lead-observability.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/multiline-lead-fields.test.ts`
- Modify: `src/lib/email/__tests__/runtime-email-content.test.ts`
- Modify: `src/lib/__tests__/resend.test.ts`
- Modify: `src/emails/__tests__/email-copy-source.test.ts`
- Modify: `tests/architecture/lead-write-endpoint.test.ts`
- Modify: `src/app/api/inquiry/__tests__/route.test.ts`
- Modify: `src/app/api/inquiry/__tests__/inquiry-integration.test.ts`

- [ ] **Step 1: Write the API/schema/single-owner RED tests**

Update route/integration fixtures to use only `fullName`, `email`, optional `message`, validated product/general context, attribution, Turnstile token, and honeypot. Add a test that sends extra `company`, `quantity`, and `requirements` properties and proves the value passed to `processValidatedInquiry` contains none of them.

Rewrite `lead-write-endpoint.test.ts` with TypeScript AST helpers, not arbitrary substring checks:

- enumerate `src/app/api/**/route.ts` and collect actual call expressions whose resolved identifier is the imported `processValidatedInquiry` binding;
- assert only `src/app/api/inquiry/route.ts` calls it;
- resolve the import graph from that route and assert it reaches `lead-schema.ts`, `process-lead.ts`, the product email runtime, and the Airtable record creator;
- pair the graph proof with the real general/catalog delivery tests from Task 1.

Update product schema, process, email, Airtable, and API response tests to expect the target single model/signatures. Use `API_ERROR_CODES.INQUIRY_VALIDATION_FAILED` in the generic API response envelope test.

Run the focused Task 4 suite now. Expected: RED on legacy adapter fields, Contact union branches, old Airtable signature, Contact email methods, and tombstone.

- [ ] **Step 2: Make `/api/inquiry` build the current schema input directly**

Remove `adaptLegacyInquiryPayload`. The schema input must be:

```ts
const schemaInput = {
  type: PRODUCT_LEAD_TYPE,
  productInquiryKind: data.productInquiryKind,
  fullName: data.fullName,
  email: data.email,
  message: data.message,
  catalogProductId: data.catalogProductId,
  buyerInterest: data.buyerInterest,
  ...pickAttributionFields(data),
};
```

Use the existing domain literal/constant that remains after schema simplification. Do not pass company, quantity, requirements, phone, subject, or submittedAt.

- [ ] **Step 3: Reduce `lead-schema.ts` to one public inquiry schema**

Delete:

- Contact schema, type, subjects, type guard, and config import;
- quantity parser/schema;
- company and legacy requirements input fields;
- discriminated union and generic `LeadInput` if they have no remaining consumer.

Keep a single domain literal such as:

```ts
export const PRODUCT_LEAD_TYPE = "product" as const;
```

Keep `productLeadSchema`, `ProductLeadInput`, product inquiry kinds, validated catalog identity, canonical buyer fields, and attribution limits.

- [ ] **Step 4: Reduce `process-lead.ts` to the validated product/general pipeline**

Delete Contact processing, confirmation scheduling, raw `processLead`, second validation, and `VALIDATION_ERROR`. The public entry remains:

```ts
export function processValidatedInquiry(
  input: ProductLeadInput,
  options: ProcessInquiryOptions = {},
): Promise<LeadResult> {
  return deliverValidatedInquiry(input, options);
}
```

`createProductEmailData` returns only `firstName`, `lastName`, `email`, server-resolved `productName`, and optional description/requirements derived from `buyerInterest` plus canonical `message`.

`createProductLeadRecord` calls the single Airtable method with one data object; remove the lead-type argument, company, and quantity. Preserve product name, optional catalog ID, composed message, optional requirements, reference ID, and attribution.

- [ ] **Step 5: Simplify utilities after callers are gone**

Delete `createOptionalSubject`, `formatQuantity`, quantity-specific branches, and legacy fallback in `resolveProductBuyerText`. The target resolver is:

```ts
export function resolveProductBuyerText(parts: {
  message?: string | undefined;
}): string | undefined {
  const message = parts.message?.trim();
  return message ? message : undefined;
}
```

Keep `splitName`, reference generation, product/buyer-interest message composition, and multiline preservation.

- [ ] **Step 6: Keep only the product/general email model**

Delete `EmailTemplateData`, Contact and confirmation builders, Contact/confirmation Resend methods, validation/sanitization helpers used only by them, and their tests.

Target `ProductInquiryEmailData`:

```ts
export const productInquiryEmailDataSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  productName: z.string(),
  requirements: z.string().optional(),
});
```

The product email renders product, contact name, email, and optional requirements. Remove company and quantity rendering.

- [ ] **Step 7: Keep one Airtable create path**

Delete `ContactLeadData`, the Contact lead source, `addContactFields`, type unions, type branching, company, and quantity. Keep `ProductLeadData` with:

```ts
interface ProductLeadData extends BaseLeadData {
  firstName: string;
  lastName: string;
  message: string;
  productName: string;
  catalogProductId?: string;
  requirements?: string;
}
```

Simplify method signatures:

```ts
createLead(data: ProductLeadData): Promise<CreatedAirtableRecord>
createLeadRecord({ base, tableName, data }: { base: AirtableNS.Base; tableName: string; data: ProductLeadData }): Promise<CreatedAirtableRecord>
```

The Airtable source remains the fixed `"Product Inquiry"`. Keep `Company` and `Quantity` columns out of the constructed field object; do not alter the external Airtable schema.

- [ ] **Step 8: Remove the `/api/contact` Cluster 3B tombstone**

Create a new Task-4-specific timestamped Trash root in the same shell block, assert the path is non-empty and exists, then move the adapter, adapter test, route, and route test while preserving their relative paths. Delete `CONTACT_VALIDATION_FAILED`, `CONTACT_PROCESSING_ERROR`, `CONTACT_SUBMISSION_EXPIRED`, `CONTACT_ENDPOINT_RETIRED`, and `FORM_NETWORK_ERROR` only after `rg` confirms no active consumer.

- [ ] **Step 9: Rewrite retained tests around the one pipeline**

Delete Contact-only cases from:

- `src/lib/lead-pipeline/__tests__/lead-schema.test.ts`
- `src/lib/lead-pipeline/__tests__/lead-schema.property.test.ts`
- `src/lib/lead-pipeline/__tests__/process-lead.test.ts`
- `src/lib/lead-pipeline/__tests__/process-lead-observability.test.ts`
- `src/lib/lead-pipeline/__tests__/multiline-lead-fields.test.ts`
- `src/lib/email/__tests__/runtime-email-content.test.ts`
- `src/lib/airtable/service-internal/lead-records.test.ts`
- `src/lib/__tests__/resend.test.ts`
- `src/emails/__tests__/email-copy-source.test.ts`

Retain and rewrite `lead-records.test.ts`, product Resend tests in `resend.test.ts`, and `email-copy-source.test.ts`; remove only their Contact/confirmation cases. Retain the lead schema/process/observability/multiline files and remove Contact cases while keeping product/general success, both-deliveries-fail, one-delivery-succeeds, timeout, multiline message, catalog/general identity, reference ID, and sanitized logging tests.

Update every Airtable test listed in the Files section from `createLead(type, data)` to `createLead(data)`. Delete Contact-only cases; keep initialization, configuration, product write, error, timeout, and Cloudflare runtime coverage.

- [ ] **Step 10: Run the focused backend suite**

```bash
pnpm exec vitest run \
  src/app/api/inquiry/__tests__/route.test.ts \
  src/app/api/inquiry/__tests__/inquiry-integration.test.ts \
  src/lib/lead-pipeline/__tests__ \
  src/lib/email/__tests__ \
  src/lib/airtable/service-internal/lead-records.test.ts \
  src/lib/__tests__/airtable-operations.test.ts \
  src/lib/__tests__/airtable-advanced.test.ts \
  src/lib/__tests__/airtable-create-operations.test.ts \
  src/lib/__tests__/airtable.test.ts \
  src/lib/__tests__/airtable-error-handling.test.ts \
  src/lib/__tests__/cloudflare-runtime-env.test.ts \
  src/lib/api/__tests__/api-response.test.ts \
  src/lib/__tests__/resend.test.ts \
  src/emails/__tests__/email-copy-source.test.ts \
  tests/integration/api/lead-pipeline-real.test.ts
```

Expected: PASS. `rg -n "processLead\\(|contactLeadSchema|ContactLeadData|sendContactFormEmail|sendConfirmationEmail|adaptLegacyInquiryPayload" src tests` should return no active references outside historical docs.

- [ ] **Step 11: Commit**

```bash
git add src/app/api src/lib src/emails src/constants tests/integration/api
git commit -m "refactor: collapse inquiry delivery to one model"
```

---

## Task 5: Consolidate messages, Storybook governance, and public privacy truth

**Files:**
- Modify: `messages/base/en/messages.json`
- Modify: `messages/profiles/b2b-lead/en/messages.json`
- Modify: `scripts/quality/message-key-usage-baseline.js`
- Modify: `src/lib/api/inquiry-validation-details.ts`
- Modify: `src/lib/i18n/client-messages.ts`
- Modify: `src/lib/i18n/__tests__/client-messages.test.ts`
- Modify: `tests/unit/i18n-message-contract.test.ts`
- Modify: `tests/architecture/tucsenberg-site-contract.test.ts`
- Modify: `src/components/component-governance.registry.json`
- Modify: `docs/design/组件治理.md`
- Modify: `docs/design/组件使用手册.md`
- Modify: `.claude/rules/ui.md`
- Modify: `docs/技术难题/客户端边界预算.json`
- Modify: `content/pages/en/privacy.mdx`

- [ ] **Step 1: Write the message/governance RED tests**

Update `i18n-message-contract.test.ts` to require the complete `inquiry.form` leaf set used by `InquiryFormCopy`, plus `requestQuote.metadata`, `requestQuote.page`, `contact.panel`, and `contact.inquiryHandoff`. Remove tests that treat `contact.form` or `requestQuote.form` as owners.

Add a positive email-copy test that enumerates the remaining `EMAIL_COPY.common.fields` property accesses from the live product email builder and compares them with the physical `emailTemplates.common.fields` keys. This proves every remaining leaf has a live consumer without a forbidden historical-name list.

Update client-message and component-governance tests to the target wording, then run the focused Task 5 tests. Expected: RED on the still-present legacy message subtrees/leaves, D6d filter helper, client namespace, and stale governance copy.

- [ ] **Step 2: Delete obsolete physical message subtrees and leaves**

From `b2b-lead/en/messages.json`, delete `contact.form` and `requestQuote.form`; keep Contact panel/handoff and Request Quote metadata/page.

From `base/en/messages.json`, delete Contact API errors, `emailTemplates.contact`, `emailTemplates.confirmation`, and product-email-unused common leaves. The remaining email common fields should be only those reached by the live product email, expected to be:

```json
{
  "contactName": "Contact Name",
  "email": "Email",
  "product": "Product",
  "requirements": "Requirements"
}
```

If runtime code proves one more leaf is required, keep it and add the live consumer; do not retain an unused compatibility leaf.

- [ ] **Step 3: Align message usage with the inquiry namespace**

Delete legacy Contact/RFQ translator overrides, dynamic prefix, derived consumers, and `CONTACT_CLIENT_MESSAGE_NAMESPACES`. Change `PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS` binding from `contact.form.` to `inquiry.form.` and update the misleading comment in `inquiry-validation-details.ts`.

Delete D6d's temporary `stripD6eRetiredInquiryCopySubtrees()` helper and call site from `tests/architecture/tucsenberg-site-contract.test.ts`; the removed message trees no longer need filtering.

- [ ] **Step 4: Update component governance wording**

Change the Checkbox Registry `avoidWhen` to cover cookie/no-JS critical consent generally, without claiming a Contact privacy checkbox exists. Replace `ContactFormFeedback` with `InquiryForm` as the composed-business example. Remove the Contact checkbox migration rule. Describe Contact and Request Quote as sharing the same `InquiryForm`, `Input`, `Textarea`, `Card`, and static fallback.

Do not add `InquiryForm` to `component-governance.registry.json`; it is not a UI primitive.

- [ ] **Step 5: Update the client boundary budget**

Remove entries for old Request Quote form, Contact container, and Contact island. Keep the current `src/components/forms/inquiry-form.tsx` budget and current Turnstile boundary.

- [ ] **Step 6: Correct the public Privacy Policy**

Replace the collection statement with current facts:

```md
When you send an enquiry, we collect the name, email address and optional message you provide. If you arrive from a product page or calculator, the site may attach the validated product context or calculator summary so you do not have to enter it again. If available for the current visit, permitted campaign attribution such as UTM values or ad click IDs may also accompany the enquiry.
```

Delete the nonexistent “Files and drawings” upload section. Keep the operator identity, contact email, cookie/analytics, retention, and updates sections. Do not mark legal review signed or change the R'12 owner gate.

- [ ] **Step 7: Run message and component gates**

```bash
pnpm content:check
pnpm component:check
pnpm exec vitest run \
  tests/unit/i18n-message-contract.test.ts \
  src/lib/i18n/__tests__/client-messages.test.ts \
  tests/architecture/tucsenberg-site-contract.test.ts \
  tests/architecture/ui-component-playbook.test.ts \
  tests/architecture/component-governance.test.ts
```

Expected: PASS, with three physical packs and no unused legacy form/email keys.

- [ ] **Step 8: Commit**

```bash
git add messages scripts/quality src/lib/api src/lib/i18n src/components/component-governance.registry.json docs/design .claude/rules/ui.md docs/技术难题/客户端边界预算.json content/pages/en/privacy.mdx tests
git commit -m "refactor: make inquiry messages and governance single-owner"
```

---

## Task 6: Update stable architecture truth and remove stale gates

**Files:**
- Modify: `docs/项目基础/行为合约.md`
- Modify: `docs/项目基础/维护规则.md`
- Modify: `docs/项目基础/替换边界.md`
- Modify: `docs/项目基础/替换顺序.md`
- Modify: `docs/项目基础/技术栈.md`
- Modify: `.claude/rules/security.md`
- Modify: `.claude/rules/cloudflare.md`
- Modify: `src/lib/security/turnstile.ts`
- Modify: `tests/architecture/lib-facade-boundary.test.ts`
- Modify: `tests/architecture/design-token-contract.test.ts`
- Modify: `tests/architecture/lead-write-endpoint.test.ts`
- Modify: `tests/e2e/contact-submit-journey.spec.ts`
- Modify: `tests/e2e/contact-form-smoke.spec.ts`
- Modify: `docs/技术难题/整库审查2026-07/执行计划.md`
- Modify: `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md`

- [ ] **Step 1: Rewrite stable route and pipeline truth**

State only:

- Contact and Request Quote share `InquiryForm`;
- `/api/inquiry` is the only public write route;
- the route validates once and calls `processValidatedInquiry`;
- owner email and Airtable use one product/general model;
- no live Contact Server Action or compatibility entry exists.

Delete tombstone, Contact cooldown, Contact Server Action, and legacy requirements-adapter wording. Keep generic security guidance for future Server Actions and keep Semgrep rules that protect them.

- [ ] **Step 2: Remove stale source-path gates**

Delete tombstone-only assertions from `lib-facade-boundary.test.ts`. Remove deleted Contact component paths from `design-token-contract.test.ts`. Keep positive inquiry ownership in `lead-write-endpoint.test.ts`.

- [ ] **Step 3: Update browser fixtures without reviving retired concepts**

In `contact-submit-journey.spec.ts`, replace mocked `errors.phone.invalid` or `errors.company.tooLong` unknown-details fixtures with a neutral unknown key such as `errors.unregistered.invalid`. Keep the assertion that unknown server details do not leak raw keys to the buyer.

Keep three visible fields, `/api/inquiry`, failure input preservation, success reset/reference, and product-handoff assertions.

- [ ] **Step 4: Update execution status without claiming cluster acceptance**

Record D6d as `READY_FOR_CLUSTER`, D6e as `ACTIVE` during implementation, and then as `READY_FOR_CLUSTER` only after all verification and exact-SHA CI pass. M3 remains `26/33` merged until Cluster 3B is accepted and merged. Do not claim public launch readiness.

- [ ] **Step 5: Run truth-doc and focused E2E tests**

```bash
pnpm exec vitest run \
  tests/unit/scripts/current-truth-docs.test.ts \
  tests/unit/scripts/current-truth-docs-glob-guard.test.ts \
  tests/architecture/lib-facade-boundary.test.ts \
  tests/architecture/design-token-contract.test.ts \
  tests/architecture/lead-write-endpoint.test.ts
pnpm exec playwright test \
  tests/e2e/contact-form-smoke.spec.ts \
  tests/e2e/contact-submit-journey.spec.ts \
  tests/e2e/product-interest-rfq-handoff.spec.ts
```

Expected: PASS. If the Playwright server uses a stale production build, rebuild once with the test-mode env used by the repository before retrying.

- [ ] **Step 6: Commit**

```bash
git add docs .claude/rules src/lib/security tests
git commit -m "docs: record the single inquiry runtime truth"
```

---

## Task 7: Full verification, exact-SHA CI, and READY_FOR_CLUSTER handoff

**Files:**
- Modify only if verification exposes a D6e regression.
- Modify: `docs/技术难题/整库审查2026-07/执行计划.md` for final D6e task status and exact evidence.

- [ ] **Step 1: Prove the deletion is complete without a permanent negative-space gate**

Run focused inventory commands and inspect every hit:

```bash
rg -n "ContactFormContainer|ContactFormIsland|RequestQuoteForm|ServerActionResult|CONTACT_FORM_CONFIG|contactLeadSchema|processLead\\(|sendContactFormEmail|sendConfirmationEmail|adaptLegacyInquiryPayload|NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS" src tests scripts messages .claude docs/项目基础 docs/design
rg -n '"contact"\s*:\s*\{|"requestQuote"\s*:\s*\{|"emailTemplates"\s*:\s*\{' messages/base/en/messages.json messages/profiles/b2b-lead/en/messages.json
```

Historical audit/spec/plan hits are allowed when clearly marked history. Active runtime, rule, stable-doc, message, and test hits must match the target owners only.

- [ ] **Step 2: Run static quality gates**

```bash
pnpm type-check
pnpm lint:check
pnpm content:check
pnpm component:check
pnpm knip:check
pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err
pnpm react:doctor
git diff --check 8878ed3bb48e493dcd4d4397f8ec3e65138580f9...HEAD
```

Expected: all commands pass. React Doctor must have zero errors; the three known base warnings may remain only if unchanged.

- [ ] **Step 3: Run full tests and production build**

```bash
pnpm test
pnpm build
```

Expected: all Vitest files pass and the production build completes. Do not run `pnpm website:build:cf` in parallel with `pnpm build`.

- [ ] **Step 4: Run the focused browser journeys against the fresh build**

```bash
pnpm exec playwright test \
  tests/e2e/contact-form-smoke.spec.ts \
  tests/e2e/contact-submit-journey.spec.ts \
  tests/e2e/product-interest-rfq-handoff.spec.ts
```

Expected: all Contact, general RFQ, catalog-product, failure preservation, success reset/reference, and product-context journeys pass.

- [ ] **Step 5: Run the broad repository gate**

```bash
pnpm website:check
```

Expected: type-check, lint, full Vitest, and production build all pass from the final working tree.

- [ ] **Step 6: Ask Cursor for an exact-diff self-review**

Run `cursor-agent --model composer-2.5-fast` in read-only review mode against `8878ed3...HEAD`. Require `NO_MATERIAL_FINDINGS` or file:line findings. Verify each finding against runtime truth before accepting it; do not blindly implement review suggestions.

If review causes any code change, repeat Steps 1-6 before continuing.

- [ ] **Step 7: Write and commit the final pre-CI status**

Update the execution plan to say D6e implementation and local verification are complete, the final exact-SHA CI is pending, Cluster 3B acceptance is still pending, and M3 merged progress remains `26/33`. Do not record commit hashes, check counts, or workflow snapshots as stable required assertions.

```bash
git add docs/技术难题/整库审查2026-07/执行计划.md
git commit -m "docs: record d6e verification pending ci"
git status --short
```

Expected: clean working tree after the commit. Run `git diff --check 8878ed3bb48e493dcd4d4397f8ec3e65138580f9...HEAD` once more.

- [ ] **Step 8: Push and dispatch CI for the final stacked SHA**

```bash
git push -u origin feat/m3-d6e-retire-form-stacks
gh pr create \
  --base feat/m3-d6d-inquiry-response \
  --head feat/m3-d6e-retire-form-stacks \
  --title "refactor: retire duplicate inquiry form stacks" \
  --body "$(cat <<'EOF'
## Summary

- retire the duplicate Contact and pre-D6a Request Quote form stacks
- keep one three-field InquiryForm, one /api/inquiry writer, and one validated delivery model
- remove legacy Contact/RFQ messages, email/Airtable branches, config, stories, tests, and route tombstone

## Verification

- local focused and full gates recorded in the READY_FOR_CLUSTER comment
- stacked on D6d; Cluster 3B acceptance and merge are still pending
EOF
)"
gh workflow run .github/workflows/ci.yml --ref feat/m3-d6e-retire-form-stacks
```

Because the stacked branch name is not `pr/**`, bind readiness to the workflow-dispatch run whose `headSha` equals the current `git rev-parse HEAD`. Six required jobs must be green.

- [ ] **Step 9: Mark READY_FOR_CLUSTER, not ACCEPTED**

Post a PR comment containing:

- exact head SHA;
- six green CI jobs and workflow run ID;
- local verification commands/results;
- deleted concepts and preserved single owners;
- public company phone and R'12 boundaries preserved;
- `Cluster 3B acceptance still pending; do not merge any member PR`.

Do not merge D6e or any earlier Cluster 3B PR at this point.
After this comment, do not commit again. Any new commit invalidates the comment and requires a fresh exact-SHA workflow-dispatch run and a replacement readiness comment.

---

## Cluster 3B handoff after D6e

After D6e reaches `READY_FOR_CLUSTER`, stop task-level implementation and perform one independent Cluster 3B acceptance review at the D6e tip. The review must cover D6b through D6e together: Turnstile, honeypot, rate limiting, general inquiry, catalog inquiry, validated context, owner email, Airtable, success/failure behavior, Contact, Request Quote, and product CTA journeys.

Required cluster commands include:

```bash
pnpm website:check
pnpm component:check
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run
```

Run `pnpm website:build:cf` only after `pnpm website:check`/`pnpm build` has completed; never share `.next` concurrently.

Only after the cluster is independently `ACCEPTED` may the owner-delegated merge flow rebase, exact-SHA reverify, and merge in dependency order:

```text
#138 D6b -> #139 D6c -> #140 D6d -> D6e PR
```

Any semantic change during rebase stops batch merging and reopens review.
