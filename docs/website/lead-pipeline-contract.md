# Lead pipeline contract

This document records the current lead pipeline contract for Tucsenberg site.
Phase 3 keeps this contract explicit instead of rewriting working lead code by default.

## Purpose

The site currently has three public lead entry points:

- Contact form lead
- Product inquiry lead
- Newsletter subscription lead

They share the same downstream processor, but they are not the same form. Shared helpers are allowed, but the fields, validation messages, Turnstile actions, and response codes must continue to match each lead type's public contract.

## Entry points

| Public route | Lead type | Input contract | Processor |
| --- | --- | --- | --- |
| `src/app/api/contact/route.ts` | `contact` | Canonical contact validation and contact lead input through `src/lib/contact/submit-canonical-contact.ts` and the contact lead shape in `src/lib/lead-pipeline/lead-schema.ts` | `src/lib/lead-pipeline/process-lead.ts` |
| `src/app/api/inquiry/route.ts` | `product` | `productLeadSchema` in `src/lib/lead-pipeline/lead-schema.ts` | `src/lib/lead-pipeline/process-lead.ts` |
| `src/app/api/subscribe/route.ts` | `newsletter` | `newsletterLeadSchema` in `src/lib/lead-pipeline/lead-schema.ts` | `src/lib/lead-pipeline/process-lead.ts` |

### Contact

`src/app/api/contact/route.ts` owns the public `/api/contact` HTTP behavior. It parses the request, applies the `contact` rate limit, uses canonical contact validation, maps validation details to the public API response, and delegates successful submissions to the canonical contact submission path.

The canonical contact submission path is expected to produce a `contact` lead input for the shared lead pipeline. Contact leads include contact-specific fields such as name, message, optional subject, consent, and Turnstile-related validation. Do not simplify this into the product or newsletter shape.

### Product inquiry

`src/app/api/inquiry/route.ts` owns the public `/api/inquiry` HTTP behavior. It parses the request, applies the `inquiry` rate limit, validates Turnstile with the product inquiry action, validates the payload with `productLeadSchema`, and delegates the accepted `product` lead to `processLead`.

Product leads include product-specific fields such as `productSlug`, `productName`, `quantity`, and optional `requirements`. These fields are part of the product inquiry contract and should not be hidden behind a generic contact-only shape.

### Newsletter subscription

`src/app/api/subscribe/route.ts` owns the public `/api/subscribe` HTTP behavior. It parses the request, applies the `subscribe` rate limit, validates the email with `newsletterLeadSchema`, validates Turnstile with the newsletter action, and delegates the accepted `newsletter` lead to `processLead`.

Newsletter leads are intentionally smaller than contact and product leads. The contract is an email subscription lead, not a generic contact message.

## Shared rules

### Route handlers

Each route handler is responsible for the public HTTP edge:

- JSON parsing and malformed body handling.
- Route-specific rate limiting.
- Route-specific Turnstile requirement and failure mapping where applicable.
- Mapping validation, security, service, and processing failures to public HTTP responses.
- Adding the route's CORS behavior.

The route handlers may log internal details, but public responses must not leak internal downstream errors, stack traces, provider errors, CRM details, email provider details, or private observability fields.

### Lead schema

`src/lib/lead-pipeline/lead-schema.ts` owns lead input shapes and runtime type guards:

- `contactLeadSchema` for `contact`.
- `productLeadSchema` for `product`.
- `newsletterLeadSchema` for `newsletter`.
- `leadSchema` as the discriminated union.
- `isContactLead`, `isProductLead`, and `isNewsletterLead` for processor routing.

Schema helpers can be shared where the fields really are shared. Do not pretend the three lead types have identical fields.

### Lead processor

`src/lib/lead-pipeline/process-lead.ts` owns downstream lead processing after an input has become a valid lead:

- Re-validating unknown raw input against `leadSchema`.
- Generating the lead reference ID.
- Routing by lead type.
- Creating downstream CRM or lead records.
- Sending owner notification where that lead type requires it.
- Returning a `LeadResult` that route handlers can map to public responses.

The processor is not the public HTTP API. It can return processing status for route handlers, but route handlers decide which public response shape and public error code the buyer sees.

## Public API response boundary

The public API contract is intentionally narrower than internal logs and downstream provider state.

Allowed public success surface:

- A successful response may include a `referenceId`.

Allowed public failure surface:

- A stable public error code.
- A route-appropriate HTTP status.
- Validation `details` only when they are safe field-level validation keys intended for the client.

Not allowed in public responses:

- Internal exception messages.
- Stack traces.
- Airtable, email provider, CRM, or observability payloads.
- Whether an owner email failed when the route has already chosen a generic processing error.
- Private request metadata.

## Proof surface

When changing lead routes, lead schemas, or `processLead`, run the focused lead proof first:

```bash
pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts tests/integration/api/subscribe.test.ts src/lib/lead-pipeline/__tests__/lead-schema.test.ts src/lib/lead-pipeline/__tests__/process-lead.test.ts src/app/api/contact/__tests__/route.test.ts src/app/api/inquiry/__tests__/route.test.ts src/app/api/subscribe/__tests__/route.test.ts
```

The focused proof includes:

- `tests/integration/api/lead-family-contract.test.ts`
- `tests/integration/api/lead-family-protection.test.ts`
- `tests/integration/api/subscribe.test.ts`
- `src/lib/lead-pipeline/__tests__/lead-schema.test.ts`
- `src/lib/lead-pipeline/__tests__/process-lead.test.ts`
- `src/app/api/contact/__tests__/route.test.ts`
- `src/app/api/inquiry/__tests__/route.test.ts`
- `src/app/api/subscribe/__tests__/route.test.ts`

Run broader checks only when the change touches broader behavior. For example, a route handler response contract change may also need API response helper tests; a Turnstile behavior change may need Turnstile-specific tests.

## Phase 3 decision

Phase 3 default decision: do not rewrite the lead pipeline just because the three routes share similar ideas.

Only change code after a fresh drift audit finds a real problem. The audit should compare live route behavior, schemas, processor routing, and existing tests before proposing a rewrite.

Real drift triggers include:

- The same lead type is validated differently in different places without a documented reason.
- A route bypasses `processLead` for a valid lead that should enter the shared processor.
- Public response shape drifts without a documented route contract change.
- Public responses leak internal observability data, downstream provider errors, stack traces, or private processing details.

If none of those triggers are confirmed, keep the current route/schema/processor split and improve documentation or tests instead of rewriting working code.
