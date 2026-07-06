# RFQ Form Structure Design

## Source and approval

This spec implements S3 from `docs/audits/结构性修复计划-2026-07-05.md`.
The user asked to continue the structural repair goal after PR #23 was merged.

## Goal

Make the `/request-quote` form maintainable without changing buyer-visible RFQ
behavior or the `/api/inquiry` backend contract.

## Current problem

`src/app/[locale]/request-quote/request-quote-form.tsx` currently owns too many
responsibilities at once:

- buyer-visible copy and response messages;
- option lists for protection type, mounting surface, material, quantity, and
  timeline;
- RFQ requirements string creation;
- `/api/inquiry` payload creation;
- field rendering and status UI;
- Turnstile and fetch submission state.

`src/app/[locale]/request-quote/page.tsx` also hardcodes page headings, aside
copy, and metadata copy. This makes the RFQ page a second copy owner instead of
using the current message-pack and config ownership model.

## Design

- Keep `/request-quote` as the current buyer RFQ page.
- Keep `/api/inquiry`, `product_inquiry` Turnstile action, and lead pipeline
  behavior unchanged.
- Move RFQ page/form copy into the active `b2b-lead` message pack under a
  `requestQuote` namespace. The catalog profile already inherits `b2b-lead`,
  and RFQ is a lead surface rather than product-detail content.
- Keep option values in a small TypeScript config file and move their visible
  labels to messages.
- Extract requirements and payload builders into a route-local pure module with
  focused tests.
- Split the client form into small route-local view pieces:
  - form container / submission state;
  - project fields;
  - contact fields;
  - submit controls and status message.
- Keep RFQ form controls route-local and native on this conversion page. This
  preserves the structure split without pulling Radix Themes form/status
  wrappers into the RFQ client graph. Reuse project button styling via the
  existing button variant helper; keep native `<input>`, `<select>`, `<label>`,
  status message, and submit button elements.
- Keep the current RFQ fields, analytics markers, attribution capture,
  success copy meaning, and payload shape.

## Acceptance criteria

Given a buyer opens `/request-quote`,
when the page renders,
then headings, RFQ fields, aside copy, CTA button, Turnstile action, and visible
response behavior stay equivalent to the current page.

Given an agent needs to change RFQ wording,
when it searches the codebase,
then buyer-visible RFQ copy lives in message packs, not inline in the client
component.

Given an agent needs to change RFQ option values,
when it edits the codebase,
then option values live in a small config file and visible option labels live
in messages.

Given the RFQ form is submitted,
when payload creation runs,
then it still posts to `/api/inquiry` with `fullName`, `email`, optional
`company`, `productSlug`, `productName`, `quantity`, `requirements`,
`marketingConsent: false`, `turnstileToken`, and attribution fields.

Given a reviewer checks regression coverage,
when tests run,
then pure payload behavior, rendered fields/copy, submission, translations, and
content checks cover the refactor.

## Out of scope

- No change to `/api/inquiry`, lead schema, Airtable, Resend, or Turnstile
  backend behavior.
- No new generic form framework.
- No file upload support.
- No production-domain cutover.
- No Premium Engineering Procurement work.
- No RFQ visual redesign beyond wrapper reuse needed for maintainability.
