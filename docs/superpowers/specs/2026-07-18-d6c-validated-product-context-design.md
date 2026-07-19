> Historical.
>
> This design records the D6c implementation decision. Current product truth remains in stable project docs and runtime code.

# D6c Validated Product Context Design

**Date:** 2026-07-18
**Status:** Approved for implementation under the owner-authorized continuous M3 workflow
**Cluster:** 3B (`D6b -> D6c -> D6d -> D6e`)

## Goal

Make product-page and estimator quote handoffs produce a catalog product identity only after the Request Quote page validates the supplied product ID against the server-owned catalog. Keep the public form at three fields and keep estimator text visible and editable.

## Current problem

The shared `InquiryForm` currently reads `interest` and `config` directly from `window.location.search`. Every submission is then sent as `general-rfq`; even a buyer arriving from a known product page never receives a catalog identity. Product CTAs also encode three different handoff shapes: plain `/request-quote`, the FRP-only `?interest=frp-planks`, and estimator-specific `interest + config` links.

The API schema already rejects an invented `catalogProductId`, but the page handoff never uses that capability. The owner-facing identity resolver also contains a fallback that turns a missing catalog entry into the client string. That fallback weakens the otherwise server-owned identity contract.

## Considered approaches

### 1. Keep client-side URL parsing and validate only in `/api/inquiry`

This is the smallest local edit, but it leaves the form responsible for interpreting untrusted URL state and makes the visible context disagree with the eventual server decision. Rejected.

### 2. Add a signed handoff token

A signed token could prove that a link originated from the site, but the catalog is already the authority and the product ID is not secret. Signing adds keys, expiry, rotation and error states without improving the required catalog validation. Rejected as unnecessary.

### 3. Validate on the Request Quote Server Component and pass a typed context

The page reads the promised `searchParams`, validates the catalog ID through the existing catalog facade, caps descriptive query text, and passes a `catalog-context | general-context` value to the Client Component. The API remains the final trust boundary and validates the submitted ID again. Selected.

## Architecture

### Catalog facade is the single lookup truth

`src/constants/product-catalog.ts` remains the public query facade, but it reads directly from `src/config/single-site-product-catalog.ts` rather than the aggregated site config. It owns:

- `PRODUCT_CATALOG`
- `getMarketBySlug(slug)`
- `getAllMarketSlugs()`
- a type guard for `ProductMarketSlug`

Lead schema validation, Request Quote handoff parsing and owner-facing identity resolution use this facade instead of repeating `markets.find(...)` or rebuilding sets.

### One handoff module

`src/lib/lead-pipeline/inquiry-handoff.ts` owns the public query contract and returns:

```ts
export type ValidatedInquiryContext =
  | {
      kind: "catalog-context";
      catalogProductId: ProductMarketSlug;
      displayLabel: string;
      initialMessage?: string;
    }
  | {
      kind: "general-context";
      buyerInterest?: string;
      initialMessage?: string;
    };
```

The discriminant is an internal prop only. It is never rendered as a form control and never trusted from a buyer payload.

The same module creates catalog Request Quote links. The public query uses `catalogProductId` for the product and keeps `config` for the visible editable message. A legacy or manually supplied `interest` is capped and kept only after the handoff downgrades to `general-context`; when a valid catalog ID resolves to `catalog-context`, `interest` is discarded.

### Request Quote page validates first

`src/app/[locale]/request-quote/page.tsx` accepts the Next.js 16 async `searchParams` prop. It resolves the context before rendering `InquiryForm`:

- valid catalog ID -> `catalog-context`; `interest` is discarded
- missing catalog ID -> `general-context`
- invalid, repeated or forged catalog ID -> `general-context`, with the forged value discarded; capped `interest` may become `buyerInterest`
- `config` -> optional capped initial message, visible in the textarea and editable/clearable in either context

Reading `searchParams` makes this page request-rendered. That is an accepted consequence of validating request-specific handoff state on the server.

### Inquiry form consumes validated state

`InquiryForm` receives `context` as a prop and stops reading `window.location.search`.

- `catalog-context` submits `productInquiryKind: "catalog-product"` plus the validated `catalogProductId`; it does not submit `buyerInterest` even if `interest` was in the URL
- `general-context` submits `productInquiryKind: "general-rfq"` and no catalog ID; optional capped `interest` becomes description-only `buyerInterest`
- `initialMessage` is rendered in the existing visible textarea and can be edited or cleared
- attribution, honeypot and Turnstile behavior remain unchanged

Contact always passes `general-context` and ignores Request Quote URL state.

### Product page and estimator links derive from product identity

`TucsenbergProductPage.slug` and calculator product identity use `ProductMarketSlug`. The content objects stop storing a hand-written CTA `href`; the product route derives it from `productPage.slug` through the handoff helper. Calculators replace their free-form `interest` property with `catalogProductId` and use the same helper, optionally adding the estimator message.

Two product-copy footers currently contain separate plain Request Quote links. They become plain guidance to use the page's canonical Quote button rather than introducing another hand-written query URL.

### Strict owner-facing identity

`resolveProductIdentity` must resolve a catalog lead through the facade. If a value passed schema validation but no longer exists in the catalog, it throws an internal consistency error. It must never use the client ID as the display product name.

## Error and fallback behavior

| Input | Page context | Submitted identity |
| --- | --- | --- |
| No product query | `general-context` | general RFQ |
| Valid `catalogProductId` | `catalog-context` | catalog product; `interest` dropped |
| Valid product plus `interest` | `catalog-context` | catalog product; `interest` dropped |
| Unknown product ID | `general-context` | general RFQ; forged value dropped; capped `interest` may become `buyerInterest` |
| Repeated product ID | `general-context` | general RFQ; capped `interest` may become `buyerInterest` |
| Valid product plus estimator `config` | `catalog-context` | catalog product; config remains editable message |
| Direct API request with invalid catalog ID | n/a | 400 validation error |

## Testing contract

Behavior-first tests must prove:

1. the catalog facade recognizes only current catalog slugs;
2. handoff parsing accepts one valid product ID and downgrades invalid/repeated IDs;
3. link generation uses one query contract for product CTAs and calculators;
4. Request Quote passes server-validated context to the shared form;
5. catalog context produces a catalog payload without `buyerInterest`, while general context may carry description-only `buyerInterest` and cannot carry a catalog ID;
6. estimator text is visible, editable and clearable;
7. contact remains a general inquiry;
8. attribution and honeypot fields survive the new payload branch;
9. the product E2E journey reaches `/api/inquiry` with the validated catalog identity;
10. the owner-facing resolver never falls back to a client string;
11. `SPECIALTY_MARKET_SLUG` and its impossible grouping branch are removed without changing the products page list.

## Explicit non-goals

- no product dropdown or hidden buyer-controlled identity input;
- no signed tokens;
- no generic query builder, repository interface, service layer or form engine;
- no D6d success/Turnstile/cooldown work;
- no D6e legacy Contact stack retirement;
- no phone/WhatsApp buyer field;
- no work on the five owner-deferred launch items.
