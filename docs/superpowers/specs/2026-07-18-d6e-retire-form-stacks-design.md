# D6e Retire Duplicate Form Stacks Design

## Status and scope

D6e is the final task in Cluster 3B. It starts from D6d exact SHA
`8878ed3bb48e493dcd4d4397f8ec3e65138580f9` and must remain stacked on D6d.
D6b, D6c, and D6d stay unmerged until the Cluster 3B acceptance gate.

The buyer-facing behavior is already unified. Both `/contact` and
`/request-quote` render the shared `InquiryForm`, post to `/api/inquiry`, validate
with `productLeadSchema`, and call `processValidatedInquiry`. D6e removes the old
Contact and RFQ implementations that are now kept alive only by their own tests,
stories, compatibility messages, and legacy delivery branches.

This task does not change the approved public form contract:

- `fullName` and `email` are required;
- `message` is optional;
- buyer phone and WhatsApp are not collected;
- product and calculator context remain automatic;
- public company phone remains an owner-controlled Contact-page, JSON-LD, and
  production-gate field and must not be removed;
- the five R'12 owner-deferred launch inputs remain untouched.

## Approaches considered

### A. Keep compatibility facades

Leave the legacy Contact/RFQ types and files in place, but redirect them to the
shared inquiry path. This reduces deletion risk in the short term, but preserves
two public concepts, two message namespaces, and a fake configuration engine.
It also makes future agents believe both stacks are supported. Rejected.

### B. Delete only files reported unused by Knip

Remove files that static analysis marks unused and leave shared-file branches
alone. This is smaller operationally, but tests and Storybook are currently
self-contained consumers of the obsolete stack, so Knip cannot distinguish
governance value from dead implementation. It would leave the main duplicate
truths in email, Airtable, schema, messages, and documentation. Rejected.

### C. Vertical retirement while preserving the one live chain

First prove the current inquiry chain, connect Contact directly to the existing
`InquiryForm`, then remove the obsolete UI, route tombstone, config/schema,
messages, email/Airtable branches, tests, stories, and docs in one task. Keep no
compatibility facade and add no generic form engine. Selected.

This is the simplest long-term shape and should delete roughly 7,800 lines of
whole files plus legacy branches in retained delivery files.

## Target runtime architecture

```text
/contact -----------\
                     -> InquiryForm
/request-quote -----/      -> useLeadFormSubmission
                              -> POST /api/inquiry
                                  -> productLeadSchema
                                  -> processValidatedInquiry
                                      -> product owner email
                                      -> product Airtable record
```

The target has exactly one owner for each of these concepts:

1. buyer-visible form implementation: `InquiryForm`;
2. public write route: `/api/inquiry`;
3. canonical public inquiry schema: `productLeadSchema` / `ProductLeadInput`;
4. validated product/general context resolver;
5. owner-email delivery path;
6. Airtable delivery path;
7. browser response model: `InquirySubmitState`.

The proof must follow imports and behavior. It must not become a permanent list
of forbidden historical filenames.

## Contact page composition

`ContactFormWithFallback` will build the existing `InquiryFormCopy` and existing
`InquiryFormStaticFallback`, then render `InquiryForm` directly with
`source="contact"` and `general-context`.

The extra `ContactFormIsland` currently performs a second dynamic import around a
component that already owns its own hydration fallback and lazy Turnstile
boundary. Removing it deletes a reducer, retry UI, load-error copy, and a second
loading model without removing progressive enhancement. The server output still
contains `InquiryFormStaticFallback`; after hydration the live form replaces it.

The Contact page continues to render its page content, contact methods, public
email, optional public company phone, response expectations, and FAQ unchanged.

## Frontend retirement

Move to Trash, then stage their deletion, the complete old Contact implementation:

- `src/components/contact/contact-form-island.tsx` and its load-error component;
- legacy Contact form containers, views, fields, feedback, hooks, cooldown hook,
  fixtures, tests, and stories;
- `NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS` from the env schema, public runtime
  mapping, `.env.example`, and its dedicated tests; no replacement browser
  cooldown setting is introduced;
- the obsolete config-driven Contact static fallback;
- Contact config/schema builders and `submit-canonical-contact`;
- `ServerActionResult` and its utilities when their remaining consumers reach
  zero.

Move to Trash the complete pre-D6a Request Quote implementation:

- `request-quote-form.tsx`;
- its fields, submit controls, copy, payload, response, tests, and test-message
  helper.

Keep the current `request-quote-inquiry-form.tsx`, `InquiryForm` family,
`useLeadFormSubmission`, `lead-response`, `LazyTurnstile`, privacy notice, and
current product handoff tests.

## API and validation retirement

D6b deliberately left `/api/contact` as a temporary non-writing `410 Gone`
tombstone because historical access logs were unavailable. Its approved design
assigns final deletion to D6e. D6e removes the route, its test, the retired error
code/message, and tombstone-only documentation.

The active `/api/inquiry` route will stop adapting the pre-D6a `company`,
`quantity`, and `requirements` inputs. It will construct the canonical schema
input directly from the current form and validated handoff. The public buyer
input is only `fullName`, `email`, and optional `message`; product identity,
buyer interest, and calculator summary come from the already validated context.
The deprecated input members and adapter are removed.

This does not remove the downstream owner-facing `requirements` field. The
canonical buyer `message` must still map into the product email requirements and
Airtable Requirements/Description output.

The old Contact schema/type/guard and `processLead(rawInput)` compatibility entry
are removed after all legacy callers disappear. `processValidatedInquiry` remains
the only production processing entry.

Canonical limits that still protect `fullName`, `email`, `message`, attribution,
product identity, and validated context remain in the current lead schema. They
must not be copied from `CONTACT_FORM_CONFIG` into a second constants module.

## Delivery retirement

Remove only the Contact-specific branches from retained delivery modules:

- Contact lead type and dispatch branch;
- Contact owner-email builder and sender;
- disabled buyer confirmation-email branch and its feature flag;
- Contact email data schema;
- Contact Airtable input type, `addContactFields()`, and the Contact dispatch
  branch inside record creation;
- Contact-only mocks and tests.

Keep the product/general inquiry path. A general inquiry is still represented by
the current product-lead pipeline with validated general context. Owner email and
Airtable must continue receiving the canonical buyer message, attribution, and
resolved product/general identity.

Keep `AirtableService.createLead()` and `createLeadRecord()` as the single live
write path. Their input narrows to the product/general inquiry model after the
Contact union member is deleted.

## Message ownership

Delete these physical message subtrees:

- `contact.form`;
- `requestQuote.form`;
- `emailTemplates.contact`;
- `emailTemplates.confirmation`;
- retired Contact API error messages.

Also shrink `emailTemplates.common` leaf-by-leaf to the fields consumed by the
live Product Inquiry email. Remove Contact/confirmation-only leaves such as
phone, subject, submitted time, and unknown submission time. If company and
quantity no longer exist in the canonical inquiry model, remove those email
leaves too. The remaining common leaves must be positively consumed by the live
email builder.

Keep `inquiry.form` as the single form namespace. Keep Contact page-specific
`contact.panel` and `contact.inquiryHandoff`. Keep `requestQuote.metadata` and
`requestQuote.page` as their page owners.

The message usage gate and i18n contract tests will derive inquiry validation
keys from `inquiry.form`, not from the deleted Contact namespace. D6d's temporary
`stripD6eRetiredInquiryCopySubtrees()` helper must be deleted together with the
dead message trees; no negative-space replacement guard is added.

## Storybook and component governance

Delete the six obsolete Contact form stories and their shared fixture. They show
components that no production page uses.

Add one small story for the real shared `InquiryForm`, using the composed
Storybook messages and production component. It may show the general Contact and
validated product-context variants. It must not add story-only production props
or re-create success/error state machinery. Success, error, retry, and reset stay
covered by behavior tests and browser journeys.

Do not add `InquiryForm` to the UI primitive Registry. The Registry owns only
`src/components/ui/*`. Update only stale Registry/playbook wording that still
refers to Contact privacy-consent checkboxes or deleted Contact components.

## Error and security behavior

D6e must preserve:

- body-size and malformed-JSON rejection;
- honeypot success-shaped short-circuit;
- Turnstile verification and fixed action;
- server-side inquiry rate limiting;
- attribution allowlisting and limits;
- structured field-detail mapping;
- buyer-safe error envelopes and sanitized logs;
- failure input preservation and success reset behavior from D6d.

No client cooldown, second rate limiter, alternate error model, redirect, or
legacy payload facade is introduced.

## Tests and governance

Testing is behavior-first:

1. Write red architecture/contract tests for the seven single owners and current
   message ownership.
2. Characterize canonical `message` delivery to owner email and Airtable before
   deleting legacy branches.
3. Prove Contact direct composition retains the no-JS fallback and the same
   three-field live form.
4. Delete legacy source and then remove tests that only asserted legacy internals.
5. Keep and update Contact, Request Quote, and product-handoff browser journeys.

Architecture tests should inspect a small set of live entrypoints or parse the
dependency graph. They must not permanently assert that old filenames or words
never reappear.

## Documentation updates

Update stable truth for:

- behavior contract;
- security and Cloudflare route boundaries;
- i18n/message ownership;
- component governance and playbook;
- client-boundary budget;
- maintenance/replacement docs;
- the public Privacy Policy so its direct collection statement names only
  `fullName`, `email`, and optional `message`, separately explains validated
  product/calculator context and permitted attribution, and removes the
  nonexistent photo/drawing upload claim;
- Cluster 3B execution status.

Do not touch D7a-owned component-level English fallback cleanup, locale coercion,
same-locale source retry, global-error English, Footer fallback, or SVG/Canvas
copy. Correcting the Privacy Policy's description of current data collection is
runtime-truth maintenance, not the deferred legal-signature action.

## Acceptance criteria

### Shared form

Given either Contact or Request Quote, when the page is rendered and hydrated,
then it presents the same `fullName`, `email`, and optional `message` form and
posts to `/api/inquiry`.

Given JavaScript is unavailable, when either page renders, then the existing
static explanation and direct-email path remain visible; no fake submit-capable
form is shown.

### Delivery

Given a valid general or catalog inquiry, when `/api/inquiry` accepts it, then the
single validated pipeline sends the product/general owner email and attempts the
single Airtable write with the canonical message and context.

Given a request to `/api/contact`, when routing is evaluated after D6e, then no
route exists; no tombstone or alternate writer remains.

### Ownership

Given the repository after D6e, when production imports and message consumers are
enumerated, then the seven owners listed above are unique and the deleted Contact
and RFQ message trees have no remaining compatibility consumers.

### Verification

The task is not `READY_FOR_CLUSTER` until focused tests, `content:check`,
`component:check`, Knip, dependency-cruiser, full Vitest, focused Playwright,
React Doctor, production build, and exact-SHA CI all pass.
