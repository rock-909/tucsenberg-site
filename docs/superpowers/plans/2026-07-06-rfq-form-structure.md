> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# RFQ Form Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move RFQ copy/options/payload logic out of the monolithic client component while preserving the current `/request-quote` buyer flow.

**Architecture:** The route keeps one small client form container, route-local presentational field components, a route-local pure payload module, and a small config file for option values. Buyer-visible copy moves to the active `b2b-lead` message pack under `requestQuote`, with generated compat messages synced after edits.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl, TypeScript, Vitest, Testing Library, local UI wrappers.

---

## Files

- Create: `src/config/request-quote-form-config.ts`
- Create: `src/app/[locale]/request-quote/request-quote-payload.ts`
- Create: `src/app/[locale]/request-quote/request-quote-form-copy.ts`
- Create: `src/app/[locale]/request-quote/request-quote-form-fields.tsx`
- Create: `src/app/[locale]/request-quote/request-quote-submit-controls.tsx`
- Create: `src/app/[locale]/request-quote/__tests__/request-quote-payload.test.ts`
- Create: `src/test/request-quote-test-messages.ts`
- Modify: `src/app/[locale]/request-quote/request-quote-form.tsx`
- Modify: `src/app/[locale]/request-quote/page.tsx`
- Modify: `src/app/[locale]/request-quote/__tests__/request-quote-form.test.tsx`
- Modify: `src/app/[locale]/request-quote/__tests__/page.test.tsx`
- Modify: `messages/profiles/b2b-lead/en/deferred.json`
- Generated: `messages/en/deferred.json`

## Task 1: Message owner and config boundary

- [x] Add failing message/config tests to `src/app/[locale]/request-quote/__tests__/page.test.tsx` and `src/app/[locale]/request-quote/__tests__/request-quote-form.test.tsx` that expect the page and form to render through next-intl messages.

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/request-quote/__tests__/page.test.tsx' 'src/app/[locale]/request-quote/__tests__/request-quote-form.test.tsx'
```

Expected before implementation: FAIL because the form does not have a
`NextIntlClientProvider` message boundary and the page/form still hardcode RFQ
copy.

- [x] Add `requestQuote` copy to `messages/profiles/b2b-lead/en/deferred.json`.

Use this namespace shape:

```json
{
  "requestQuote": {
    "metadata": {
      "title": "Request a Quote — 12-Hour Response on Standard Items | Tucsenberg",
      "description": "Send dimensions, quantities, market and timeline. Standard flood barrier items quoted within 12 hours; custom configurations within 48."
    },
    "page": {
      "heading": "Get real numbers, fast",
      "intro": "Send what you know — photos and rough dimensions are enough to start. Standard items quoted within {standardHours} hours, custom configurations within {customHours}.",
      "afterSubmitTitle": "After you submit",
      "confidenceTitle": "Quote confidence",
      "confidenceWarranty": "3-year warranty",
      "confidenceSamples": "Sample fees credited",
      "confidencePricing": "No published-price games — the quote is the price conversation"
    },
    "form": {
      "title": "Request a quote",
      "ariaLabel": "Request a quote",
      "selectOne": "Select one",
      "submit": "Send RFQ",
      "submitting": "Sending RFQ...",
      "success": "Received. Standard items: quote within 12 hours. Custom: within 48. You'll hear from a person, not a sequence.",
      "genericError": "We could not send your RFQ. Please review the fields.",
      "networkError": "Network error. Please try again or email sales@tucsenberg.com.",
      "turnstilePending": "Security verification is still loading. Please try again.",
      "referenceLabel": "Reference",
      "tradeEnquiry": "This is a wholesale / OEM / private label enquiry",
      "assetHint": "Optional. Paste Drive, Dropbox, OneDrive or PDF links here; do not upload files on this page.",
      "fields": {
        "protection": "What are you protecting?",
        "dimensions": "Opening width × height / run length",
        "mounting": "Mounting surface / ground type",
        "material": "Material preference",
        "quantity": "Quantity",
        "delivery": "Market & delivery port",
        "timeline": "Timeline",
        "assetLinks": "Photos / drawings links",
        "fullName": "Name",
        "email": "Email",
        "company": "Company",
        "whatsApp": "WhatsApp"
      },
      "requirements": {
        "source": "RFQ source: /request-quote",
        "notSpecified": "Not specified",
        "yes": "Yes",
        "no": "No",
        "productNamePrefix": "RFQ",
        "protection": "What are you protecting",
        "dimensions": "Opening width x height / run length",
        "mounting": "Mounting surface / ground type",
        "material": "Material preference",
        "quantity": "Quantity",
        "delivery": "Market & delivery port",
        "timeline": "Timeline",
        "assetLinks": "Photos / drawings links",
        "whatsApp": "WhatsApp",
        "tradeEnquiry": "Wholesale / OEM / private label"
      },
      "options": {
        "protection": {
          "door": "Door",
          "garage": "Garage",
          "driveway": "Driveway",
          "loadingDock": "Loading dock",
          "perimeter": "Perimeter",
          "stockResaleOrder": "Stock / resale order",
          "other": "Other"
        },
        "mounting": {
          "concrete": "Concrete",
          "masonry": "Masonry",
          "steel": "Steel",
          "timber": "Timber",
          "groundSoil": "Ground / soil",
          "other": "Other"
        },
        "material": {
          "adviseMe": "Advise me",
          "absFloodBarriers": "ABS flood barriers",
          "aluminumFloodGates": "Aluminum flood gates",
          "absorbentFloodBags": "Absorbent flood bags",
          "floodTubeDams": "Flood tube dams",
          "frpFloodBarriers": "FRP flood barriers"
        },
        "quantity": {
          "sampleCarton": "Sample carton",
          "cartons": "Cartons",
          "pallet": "Pallet",
          "lcl": "LCL",
          "container": "Container",
          "projectSchedule": "Project schedule"
        },
        "timeline": {
          "urgent": "Urgent",
          "thisSeason": "This season",
          "planning": "Planning"
        }
      }
    }
  }
}
```

- [x] Create `src/config/request-quote-form-config.ts` with the option values
  and label keys. Do not put buyer-visible labels in this TypeScript file.

- [x] Run message sync:

```bash
tsx scripts/starter-profile/sync-message-compat.ts --write
```

- [x] Run:

```bash
node scripts/starter-checks.js translations
```

Expected: PASS.

## Task 2: Payload pure module

- [x] Write `src/app/[locale]/request-quote/__tests__/request-quote-payload.test.ts` first. Cover:
  - selected values become translated requirement labels;
  - empty optional lines are omitted;
  - company is omitted when blank;
  - `productSlug` defaults to `advise-me`;
  - attribution fields are preserved.

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/request-quote/__tests__/request-quote-payload.test.ts'
```

Expected before implementation: FAIL because the module does not exist.

- [x] Create `request-quote-payload.ts` exporting:
  - `RequestQuotePayloadCopy`;
  - `createRequestQuotePayloadCopy(t)`;
  - `createRequestQuoteRequirements(formData, copy)`;
  - `createRequestQuotePayload(formData, turnstileToken, copy)`.

Keep returned payload shape compatible with `/api/inquiry`.

- [x] Run:

```bash
pnpm exec vitest run 'src/app/[locale]/request-quote/__tests__/request-quote-payload.test.ts'
```

Expected: PASS.

## Task 3: Route-local field and submit components

- [x] Create `request-quote-form-fields.tsx` and move only field rendering into it.
  Keep native `<input>`, `<select>`, and `<label>` controls on the RFQ route so
  the structure split does not pull Radix Themes form wrappers into this
  conversion-page client graph.

- [x] Create `request-quote-submit-controls.tsx` and move Turnstile, status
  message, and submit button into it. Use `LazyTurnstile`, a route-local native
  status message, and project button variant classes without importing Radix
  Themes wrappers.

- [x] Modify `request-quote-form.tsx` so it only owns:
  - the server-provided `RequestQuoteFormCopy` strings;
  - Turnstile token state;
  - submit state;
  - `fetch("/api/inquiry")`;
  - analytics and attribution.

- [x] Run:

```bash
pnpm exec vitest run 'src/app/[locale]/request-quote/__tests__/request-quote-form.test.tsx'
```

Expected: PASS.

## Task 4: Page copy and metadata owner

- [x] Modify `page.tsx` to use `getTranslations({ locale, namespace: "requestQuote" })`.
  Use message keys for metadata title/description, heading, intro, aside headings,
  quote-confidence items, and the server-created form copy passed into the
  client form.

- [x] Update `page.test.tsx` to assert metadata and rendered text still match the
  current English RFQ page.

- [x] Run:

```bash
pnpm exec vitest run 'src/app/[locale]/request-quote/__tests__/page.test.tsx'
```

Expected: PASS.

## Task 5: Focused and branch verification

- [x] Run focused S3 tests:

```bash
pnpm exec vitest run \
  'src/app/[locale]/request-quote/__tests__/request-quote-payload.test.ts' \
  'src/app/[locale]/request-quote/__tests__/request-quote-form.test.tsx' \
  'src/app/[locale]/request-quote/__tests__/page.test.tsx' \
  src/app/api/inquiry/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts
```

- [x] Run message/content proof:

```bash
node scripts/starter-checks.js translations
pnpm content:check
```

- [x] Run component and broad proof:

```bash
pnpm component:check
pnpm lint:check
pnpm type-check
pnpm test
pnpm build
```

- [ ] Commit:

```bash
git add .
git commit -m "fix: simplify rfq form ownership"
```

- [ ] Push, open PR against `main`, watch CI, and merge when checks pass.
