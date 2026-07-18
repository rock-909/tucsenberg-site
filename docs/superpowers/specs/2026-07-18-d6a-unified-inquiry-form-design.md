> Historical implementation design. Stable product truth remains in `docs/项目基础/**`, the current remediation plan, and runtime code.

# D6a Unified Three-Field Inquiry Form Design

## Status and boundary

- Base: `origin/main` at `747fd8d` after PR #130 merged.
- M3 accounting: C2 is complete, so M3 is `24/33`; D6a is the active task.
- This task changes the buyer-facing form only. D6b-D6e still own single-parse API cleanup, product identity cleanup, success/Turnstile consolidation, and retirement of the old Contact stack.
- D5a follows D6a and owns field-level `aria-invalid` / `aria-describedby` rendering and the broader accessibility batch.

## Product decision

Both `/contact` and `/request-quote` keep their own page copy, SEO, contact information, and buying guidance, but render the same fixed `InquiryForm`.

The visible buyer contract is exactly:

| Field | Required | Browser semantics |
| --- | --- | --- |
| `fullName` | yes | text input, `autocomplete="name"` |
| `email` | yes | email input, `autocomplete="email"` |
| `message` | no | textarea, clearly marked optional |

There is no buyer phone/WhatsApp field, `input[type="tel"]`, company, subject, quantity, dimensions, country, port, budget, upload, product selector, or multi-step flow.

## Behavior scenarios

### Same form on both pages

Given a buyer opens `/contact` or `/request-quote`, when the form becomes interactive, then both pages expose the same three field names, labels, required state, autocomplete behavior, submit lifecycle, and `/api/inquiry` endpoint.

Page headings and surrounding explanations remain outside the shared form so page-specific content does not fork form behavior.

### Low-friction submission

Given `fullName` and `email` are valid, when `message` is empty or whitespace-only and Turnstile succeeds, then the form submits successfully without inventing a required description.

Given the buyer presses Enter from a text control, when Turnstile is ready, then the normal form submit path runs once. Without a Turnstile token, the request is not sent and the buyer sees the verification-required state.

### Response classification

The shared decoder classifies failures into three buyer-safe groups:

1. field details returned by the inquiry API;
2. verification/security unavailable or rejected;
3. server/network processing failure.

D6a keeps one summary presentation for these classes. D5a will add field-level rendering without changing the decoder contract.

### Product and estimator context

- `?interest=` remains untrusted buyer-interest context, not product identity. It is capped at the canonical buyer-interest limit before display or submission.
- The capped interest value is visibly acknowledged near the form and carried without creating a product selector.
- `?config=` estimator output is capped, placed into the visible `message` textarea, and remains editable before submission.
- A normal Contact or Request Quote submission with neither parameter succeeds as a general inquiry.
- Catalog identity remains server-validated. D6a must not infer trusted product identity from arbitrary URL text; D6c owns the final product-context consolidation.

### No-JavaScript truth

Before hydration, or when JavaScript never runs, both pages render the same static fallback:

- explain that the secure form needs JavaScript because bot verification cannot run otherwise;
- provide the configured public email as the real alternative;
- do not render disabled fields or a disabled submit button that looks like a usable form.

## Architecture

### Fixed component, not an engine

Create one explicit `InquiryForm` with a narrow page-source union (`contact | request-quote`) and explicit optional URL context. Do not add field descriptors, schema-driven rendering, feature flags, a universal form configuration object, or another abstraction over the existing submission hook.

Reuse `useLeadFormSubmission` for the lifecycle it already owns: submit lock, attribution, fetch/decode, analytics, and Turnstile reset registration. The endpoint is fixed to `/api/inquiry`; it is not a configurable prop.

### Shared copy truth

Add one `inquiry.form` message owner in the physical `b2b-lead` pack. Both pages derive the same typed copy from that namespace. Keep old `contact.form` and `requestQuote.form` keys until D6e because the retired source/test stack is intentionally still present in this PR.

### Active-path migration without premature deletion

- Contact stops rendering the old `ContactFormContainer` path and renders `InquiryForm`.
- Request Quote stops rendering the old `RequestQuoteForm` path and renders the same `InquiryForm`.
- Old Contact/RFQ form implementation files may become unreferenced, but D6a does not move them to Trash. D6e performs the proof-backed retirement after D6b-D6d stabilize the final pipeline.
- Public company phone configuration, contact panel, JSON-LD, and launch gate remain unchanged.

## Non-goals

- No `/api/contact` removal yet.
- No deletion of the legacy Contact config/validators/messages/tests yet.
- No final Turnstile constant/env cleanup yet.
- No field-level accessibility error wiring beyond preserving semantic labels and the response data needed by D5a.
- No new product selector, upload, phone switch, CMS field model, dependency, or generic form framework.
- No M2/domain/PDF/public-phone-photo/MOQ/legal-signoff work.

## Acceptance evidence

1. Component tests prove both page modes have exactly the same three controls and no forbidden controls.
2. Submission tests prove both modes post `/api/inquiry`, optional message can be blank, Enter follows the same submit path, and attribution remains present.
3. URL-context tests prove capped `interest`, visible/editable capped `config`, and no product identity forged from arbitrary query text.
4. No-JS test proves the fallback has explanation + public email and no `form`/submit control.
5. Page and E2E tests prove Contact and Request Quote both use the shared form; product/estimator handoffs still work.
6. `pnpm component:check`, `pnpm content:check`, focused Vitest/E2E, `pnpm website:check`, and `pnpm build` pass. `pnpm build` and Cloudflare build are never run in parallel.

