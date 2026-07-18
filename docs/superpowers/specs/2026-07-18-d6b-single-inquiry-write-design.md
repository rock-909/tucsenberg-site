> Historical implementation design.
>
> Stable product truth remains in current project docs and runtime code.

# D6b Single Inquiry Write Path Design

## Status and boundary

- Base: `origin/main` at `96af3549` after D5a PR #137 merged.
- M3 accounting: Cluster 3A is closed, M3 is `26/33`, and D6b opens Cluster 3B.
- D6b owns the server write boundary: one public lead-writing endpoint, one JSON parse, one Zod validation, and one typed delivery call.
- D6c still owns final product-context derivation, D6d owns shared success/Turnstile cleanup, and D6e owns retirement of the duplicate Contact frontend/config stack.

## Runtime truth found before implementation

The current Contact page does not use the old `useContactForm` path. It loads the shared `InquiryForm`, which posts to `/api/inquiry`. The remaining `useContactForm -> /api/contact` chain is legacy source/test surface reserved for D6e.

The current `/api/inquiry` path validates twice:

1. `productLeadSchema.safeParse(...)` in the route;
2. `leadSchema.safeParse(...)` again inside `processLead(...)`.

The second parse can turn an already accepted boundary value into a downstream `VALIDATION_ERROR`, which the route can misclassify. The fix is a typed internal entry, not another adapter layer.

The old `/api/contact` route still contains a separate body parse, schema/Turnstile flow, rate-limit preset, error branch, and delivery path. It is not an active browser route, but historical Cloudflare request logs are not available from `wrangler deployments list` or `wrangler tail`. D6b therefore must not pretend that third-party usage was positively disproved.

## Approved behavior

### One public writer

- `/api/inquiry` is the only endpoint that can create a lead, send the owner email, or write Airtable.
- The production Contact and Request Quote journeys continue posting only to `/api/inquiry`.
- The legacy `/api/contact` business implementation and Contact-specific rate-limit preset are retired.
- Because historical access logs are unavailable, `/api/contact` may remain during Cluster 3B only as a tiny non-writing `410 Gone` tombstone with a stable machine error code. It must not parse a lead payload, verify Turnstile, rate-limit as a lead writer, call the pipeline, redirect, or duplicate business behavior. D6e removes the tombstone after the legacy stack is retired.

### Parse and validate once

- The route calls `safeParseJson` once.
- The adapted inquiry value is validated by `productLeadSchema.safeParse` once.
- A successful typed `ProductLeadInput` is passed to `processValidatedInquiry(...)` without another Zod call.
- Raw/untrusted callers may continue using `processLead(rawInput)` only where legacy internal code still requires it; D6b does not widen that API or add a generic service framework.

### Security behavior stays intact

The surviving route preserves:

- request body-size and malformed-JSON rejection through `safeParseJson`;
- a visually hidden, keyboard-inert `website` honeypot owned by the shared InquiryForm; a filled value returns the same success-shaped response without Turnstile or delivery;
- Turnstile verification for real submissions;
- the inquiry distributed rate-limit preset and fail-closed behavior;
- attribution allowlisting and length validation;
- buyer-safe error envelopes and sanitized logs.

`submittedAt` freshness is not part of the active shared InquiryForm payload and is not reintroduced as a second anti-abuse system. The retained protections are body size, honeypot, Turnstile, and server rate limiting.

### Validation details do not depend on English prose

The validation mapper must classify issues from structured data: issue code/path/limits plus an explicit structured reason added at the boundary when Zod does not expose the missing input. It must not inspect `issue.message`.

Equivalent issues with different human messages produce the same detail key. Unknown fields stay on `errors.generic`. The emitted detail contract is checked bidirectionally against the declared inquiry detail keys and the `inquiry.form` message namespace.

### Public buyer contract remains three fields

The public payload remains `fullName` and `email` required, `message` optional. Buyer phone/WhatsApp is not part of the canonical contract. D6b must not revive `phone`, `input[type=tel]`, or phone delivery plumbing.

## Behavior scenarios

### Valid general inquiry

Given valid name/email, optional message, valid Turnstile, and attribution, when the browser posts `/api/inquiry`, then the body is parsed once, the schema is evaluated once, and the typed lead is delivered once with a success reference ID.

### Invalid inquiry

Given an invalid field, when the browser posts, then the route returns `INQUIRY_VALIDATION_FAILED` with stable detail keys, does not verify Turnstile, and does not call delivery. Changing the Zod English message does not change the detail keys.

### Honeypot

Given a non-empty `website`, when a bot posts an otherwise plausible payload, then the route returns a normal success-shaped reference response and does not call Turnstile, email, Airtable, or the delivery pipeline.

### Delivery failure

Given a validated inquiry whose email and storage delivery both fail, when the typed pipeline completes, then the route returns the stable processing error. It is not reclassified as a validation error.

### Retired endpoint

Given any request to `/api/contact`, when the temporary Cluster 3B tombstone exists, then it returns `410` and performs no lead-writing work. No production source may post to it.

## Simpler architecture

- Add one typed `processValidatedInquiry(input: ProductLeadInput, options?)` entry beside the existing pipeline implementation.
- Share the existing processing core rather than copying product delivery code.
- Keep `processLead(rawInput)` only as a temporary legacy boundary for D6e-owned callers/tests.
- Do not create repositories, service interfaces, handler registries, route adapters, or configurable endpoint abstractions.

## Acceptance evidence

1. Focused tests prove one JSON parse, one product-schema parse, no downstream parse, and validation failure never reaches delivery.
2. Real route tests prove body-size/malformed JSON, honeypot, Turnstile, rate limit, attribution, success, and delivery-failure envelopes.
3. Mapper tests prove message-independent structural classification and exact inquiry message-key parity.
4. Architecture tests prove production lead forms name only `/api/inquiry` and `/api/contact` has no lead-writing imports.
5. Focused browser journeys prove Contact and Request Quote still submit successfully through `/api/inquiry`.
6. `pnpm website:check` passes before the task is marked `READY_FOR_CLUSTER`.
