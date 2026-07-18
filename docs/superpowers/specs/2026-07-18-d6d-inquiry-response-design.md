> Historical.
>
> This design records the D6d implementation decision. Current product truth remains in stable project docs and runtime code.

# D6d Inquiry Response Design

**Date:** 2026-07-18
**Status:** Approved under the owner-authorized continuous M3 workflow
**Cluster:** 3B (`D6b -> D6c -> D6d -> D6e`)
**Base:** D6c exact SHA `e67fb86a4ed8fcdbe50fa15ae313883506dc61cd`

## Goal

Finish the active three-field inquiry experience: clear buyer inputs after a confirmed success, make one Turnstile action the only runtime truth, keep production validation aligned with the always-protected form, and replace unconditional quote-time promises with one honest 12-hour reply promise.

## Runtime truth

Contact and Request Quote already share:

```text
InquiryForm
-> InquiryFormStatus
-> useLeadFormSubmission
-> /api/inquiry
```

D6d must not add another success panel, response facade, form wrapper or generic form engine.

The active `InquiryForm` has no client cooldown. The five-minute cooldown exists only in the legacy `useContactForm -> useRateLimit` stack that D6e will retire. D6d proves the active behavior and does not refactor code that the next task deletes.

The active form always renders Turnstile, but the production configuration gate still conditionally requires its keys through the legacy `CONTACT_FORM_CONFIG.features.enableTurnstile` switch. That switch is not runtime truth.

## Considered approaches

### Add reset and security behavior to the shared submission hook

Rejected. The hook correctly owns request, status, analytics and Turnstile lifecycle. Giving it DOM field names would couple a reusable request kernel to one form layout.

### Build a new shared success controller

Rejected. Both pages already render the same `InquiryFormStatus`; another layer would only forward state.

### Keep DOM reset in `InquiryForm` and delete duplicated Turnstile configuration

Selected. `InquiryForm` owns its DOM and uses the hook's existing `onSuccess` callback. Turnstile uses one leaf constant from widget creation through server verification. The production gate unconditionally checks the keys required by the live form.

## Behavior design

### Successful submission

After the API returns a decoded success:

- keep the shared success callout and reference ID;
- clear `fullName`, `email` and `message`;
- reset the form so the hidden honeypot is also cleared;
- explicitly blank the three visible controls after reset, because an estimator message supplied through `defaultValue` would otherwise return;
- keep the existing Turnstile token and widget reset owned by `useLeadFormSubmission`.

On validation failure, security failure, server failure or HTTP 429, preserve the buyer-entered fields. After the buyer completes the reset Turnstile challenge, the active form may retry immediately. Server-side rate limiting remains authoritative.

### Turnstile action

Add one exported constant:

```ts
export const INQUIRY_TURNSTILE_ACTION = "product_inquiry";
```

The browser widget and server verifier import it. Remove per-call action arguments and the action configuration surface:

- `NEXT_PUBLIC_TURNSTILE_ACTION`
- `TURNSTILE_ALLOWED_ACTIONS`
- `TURNSTILE_EXPECTED_ACTION`
- the `contact_form` fallback and duplicate `product_inquiry` literals
- the optional wrapper `action` prop when it has no remaining business use

Hostname allowlisting, secret/site keys, bypass behavior and service-failure handling stay unchanged.

The legacy Contact validator may remain until D6e, but while present it must call the same verifier and therefore use the same action. It does not retain a second action contract.

### Production configuration

Production validation always requires:

- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

The check no longer imports or branches on `CONTACT_FORM_CONFIG`. D6d does not reshape the legacy config object only to delete it in D6e; D6e removes `enableTurnstile` with the rest of that config engine.

### Response promise

The canonical meaning is:

> We reply within 12 hours. If the details are sufficient, the reply includes a quote. Otherwise, we ask only for the missing essentials.

Short labels may say `Reply within 12 hours`. No public copy may promise:

- a quote within 12 hours regardless of supplied detail;
- a separate 48-hour custom quote SLA;
- accurate or exact pricing from an empty optional description.

This applies to the live `inquiry.form.success`, Contact panel, homepage/catalog messages, product metadata and product-page copy, active MDX pages and the Turnstile rescue line. Generated content manifest output is refreshed from MDX sources and is never hand-edited.

The disabled confirmation-email copy and the unreferenced pre-D6a `requestQuote.form` subtree are D6e retirement assets. D6d does not rewrite dead copy only to delete it in the next task. Copy proof is limited to current owners and runtime message paths; D6e performs the final whole-pack cleanup after removing those old namespaces.

## Testing contract

Behavior-first proof must show:

1. successful Contact and catalog Request Quote submissions keep the reference ID and clear all three visible fields;
2. estimator-prefilled `message` is empty after success rather than restored from `defaultValue`;
3. validation failure and 429 preserve the entered fields;
4. a second attempt is possible after a fresh Turnstile token, without a browser cooldown;
5. widget and server verification use `INQUIRY_TURNSTILE_ACTION`;
6. the removed action env names are absent from env schemas, public allowlists, workflows, Wrangler, Playwright and live deployment docs;
7. production config validation requires both Turnstile keys without consulting the legacy form feature switch;
8. live public source has no unconditional 12/48-hour quote promise and key buyer surfaces carry the approved reply meaning;
9. Contact and Request Quote still submit through `/api/inquiry` with attribution, honeypot and D6c product context intact.

## Scope boundaries

- no new form or status abstraction;
- no buyer phone/WhatsApp;
- no client cooldown or retry timer;
- no change to server rate limiting;
- no physical retirement of the legacy Contact component/config stack before D6e;
- no temporary rewrite of disabled confirmation-email copy or the old `requestQuote.form` subtree;
- no change to analytics event vocabulary beyond the existing `contact` and `rfq` methods;
- no work on the five owner-deferred launch items;
- no claim that M2 or public launch readiness is complete.
