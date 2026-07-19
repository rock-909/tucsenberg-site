> Historical.

# D7a Component-level English Fallback Retirement Design

## Status

- Date: 2026-07-19
- Cluster: M3 Cluster 4
- Base: `origin/main` at `9f17068e12e02cbdf7513caeff74b1c9c51a71bd`
- Worktree: `/Users/Data/code/tucsenberg-site/.worktrees/m3-d7a`
- Branch: `refactor/m3-d7a-english-fallbacks`
- Delivery state: stop at `READY_FOR_CLUSTER`; do not merge before Cluster 4 acceptance

The owner has already approved the Cluster 4 workflow and asked for continuous
execution. This design records the live D7a scope before implementation. It does
not reopen the approved multilingual architecture or the D7a -> D7b -> C7 order.

## Goal

Remove buyer-visible English that components silently invent when required locale
copy is missing. Missing required messages must fail with the exact message path.
The change must keep request-level locale recovery, same-locale physical-pack
retry, and the provider-free English global error boundary.

## Live inventory

The old audit counts have drifted. Current production code contains:

- Footer fallback logic in `src/components/footer/Footer.tsx`;
- a complete Contact fallback map in `src/lib/contact/getContactCopy.ts`;
- translation type escapes in Footer, localized layout, mobile navigation,
  Request Quote, Contact error, and Products error code;
- language-bearing text inside the factory SVG, product SVGs, and boxwall Canvas;
- Turnstile unavailable/load-failure/rescue copy that defaults to English;
- an English `Close` label inside the production mobile Sheet;
- English defaults on Header props even though the localized layout always passes
  translated values.

The exact number of casts or literals is not a permanent contract. Acceptance
uses the final production inventory and behavior tests, not a pinned count.

## Approaches considered

### Keep defaults but log missing messages

This preserves rendering when a pack is incomplete, but it hides the defect from
CI and lets a new locale ship mixed-language UI. Rejected.

### Add one generic safe translator

A shared `translate(key: string, fallback: string)` would reduce repeated code,
but it would preserve arbitrary keys, embedded English, and runtime type escapes.
It moves the problem instead of removing it. Rejected.

### Make localized copy required at the existing component boundaries

Use `readRequiredMessagePath` for raw message objects, pass small typed copy
objects into visual and client components, and remove defaults that have no valid
production caller. Keep product facts in their current content owner rather than
moving all product copy into message JSON. Selected.

## Required failure behavior

### Contact copy

`getContactCopyFromMessages` will read every required `contact.*` path through
`readRequiredMessagePath`.

Delete the fallback map, duplicate path reader, warning branch, and legacy-root
search. A pack that only contains `underConstruction.contact` must fail with the
missing `contact.*` path. The function must never search legacy namespaces.

### Footer copy

The formal site Footer has one production configuration. Remove the optional
custom-column fallback contract and the duplicate English `title` / `label`
values that exist only to rescue missing translations.

Footer message keys must be typed at the configuration boundary. The component
will call next-intl with required keys; it will not catch errors, compare the
returned value to the key, or render config English on failure.

`Footer` already owns the default columns, while the localized layout passes the
same value back into it. Keep one owner and remove the repeated prop. Theme slot,
class name, and explicit theme test support remain.

The existing copyright placeholder stays in its current message path for D7a,
but missing `footer.copyright` must throw. D7b will re-inventory the copyright
key and semantic name; D7a does not rename it.

## Translation type boundaries

No new translator may accept arbitrary `string` keys.

- Request Quote will use direct literal calls or a small translated copy object.
  `RequestQuoteAside` does not need a generic translation callback.
- `createInquiryFormCopy` will accept only the keys it actually reads.
- `RouteErrorView` will receive four translated strings (`title`, `description`,
  `tryAgain`, `goHome`) instead of a `(key: string) => string` function.
- Navigation key normalization will happen once at its configuration boundary.
  Layout and mobile navigation will receive a namespace-relative typed key and
  will not repeat `replace(...) as Parameters<...>`.
- Footer keys will be narrow message keys, not root-level arbitrary strings.

A small assertion at a proven configuration boundary is acceptable only when the
runtime source is already restricted to the same finite set. Consumer-side
`as Parameters<typeof t>[0]` casts and universal wrappers are not acceptable.

## Inquiry and Turnstile copy

The live inquiry form does not pass Turnstile labels, so production currently
uses English defaults from both `LazyTurnstile` and `TurnstileWidget`. The rescue
line also embeds English text and an English email subject.

Add one Turnstile copy section to the existing `InquiryFormCopy`. It owns:

- unavailable status;
- lazy-load failure status;
- development bypass status;
- test-mode status;
- rescue-line text before and after the email address;
- rescue email subject.

`InquiryForm` passes the complete object. `LazyTurnstile`, `TurnstileWidget`, and
`TurnstileRescueLine` require the relevant copy and keep no English defaults.
The sales email address remains a product fact, not a translated message.

Do not add a Turnstile context, another message loader, or a second form-copy
model.

## Mobile navigation and Header

`SheetContent` will accept a close label, and the mobile navigation will pass its
existing translated `closeMenuLabel`. No new message key is needed.

Header and HeaderClient already receive translated labels from the localized
layout. Make those buyer-visible labels required rather than defaulting to
English. Tests and stories must pass explicit fixtures.

Do not expand this task to the unused Dialog close label. Do not change the Logo
alt strategy unless a focused accessibility test proves a current defect.

## Diagram copy ownership

### Factory pool SVG

Pass six translated labels from `oemLanding` into `FactoryPoolDiagram`:

- extrusion;
- moulding;
- welding;
- sewing;
- one spec / one QC;
- one mixed container.

The SVG owns geometry only.

### Product SVGs

Move language-bearing annotations out of `product-diagrams.tsx` and into the
existing `TucsenbergProductDiagram` content object. Product specifications and
product copy already belong to `src/constants/tucsenberg-product-page-*.ts`, so
D7a will not create a second product-i18n directory or move the full product page
into messages.

The following pure specification literals may stay in the drawing code:

- `50-85 cm`;
- `180 mm`;
- `1 m`.

Text such as `water side`, `load seals the base`, `EPDM seal`, `+ water`,
`skirt + pins`, and the FRP material description must come from typed diagram
data. Strings that contain numbers plus language, such as `ships flat - 0.23 kg`
or `180 mm class`, are still copy and must move out of the component.

Home, product overview, product detail, and Hero consumers must pass the same
typed label data. Do not keep component defaults as a second truth.

### Boxwall Canvas

Pass `load`, `floodSide`, and `drySide` into the Canvas draw function. `TB-BW` is
a model code and stays literal. The Canvas is hidden from assistive technology,
but its painted words are visible and must match the page locale/content source.

## Recovery behavior that must remain

Three existing behaviors are correct and outside the retirement target:

1. invalid or absent request locale is coerced to the configured default locale;
2. cached message loading failure retries the physical source for the same
   locale, and a second failure remains visible;
3. `src/app/global-error.tsx` renders fixed English outside the next-intl provider
   and keeps `<html lang="en">`.

The request retry test will directly assert that the source loader receives the
same locale. The global-error test will explicitly assert the English `lang`
attribute.

## Tests

Behavior tests replace tests that currently approve fallback behavior.

### Message failures

Given a composed message object missing `contact.title` or any required panel
leaf, when Contact copy is built, then it throws `Missing required message:` with
the full path.

Given the formal Footer messages are incomplete, when Footer renders, then the
strict translator throws. It must not render `title` or `label` from config.

Footer tests must use composed messages or a strict local translator. The global
test mock returns unknown keys unchanged and cannot prove this behavior.

### Typed consumers

Request Quote, localized layout, mobile navigation, Contact error, and Products
error tests use non-default sentinel copy where practical. `pnpm type-check` is
the main proof that translation key escapes are removed.

### Visual copy

SVG tests pass sentinel label objects and assert rendered text comes from props.
They also prove the approved pure dimensions remain.

The Canvas test captures `fillText` calls. It proves translated `load`,
`floodSide`, and `drySide` values are painted and `TB-BW` remains literal.

### Turnstile and mobile close

Inquiry and LazyTurnstile tests pass sentinel copy and prove unavailable,
load-failure, and rescue UI use it. Mobile navigation tests prove the Sheet close
button uses the existing localized close-menu label.

## Gates and workflow

Delete the obsolete `CONTACT_COPY_FALLBACKS` and `translateWithFallback`
consumer registrations from `scripts/quality/message-key-usage-baseline.js`.
Do not replace them with a dynamic-prefix allowlist.

D7a runs focused tests, `pnpm type-check`, `pnpm content:check`, message-usage
tests, `pnpm website:check`, and targeted Playwright for the changed buyer flows.
The complete Playwright suite runs once on the final C7 cluster tip, together
with the existing Cluster 4 gates.

After exact-SHA GitHub CI is green, D7a stops at `READY_FOR_CLUSTER`. D7b starts
from the D7a head. C7 starts from the green D7b head. No task in this cluster is
merged before the final cluster review.

## Out of scope

- D7b message-key renames and locale residue cleanup;
- full product-page localization architecture;
- unused Dialog or Storybook-only close-label cleanup;
- buyer phone or WhatsApp fields;
- public company phone removal;
- domain, PDF, product-photo, tube-dam MOQ, or legal-signature decisions;
- the non-blocking Cluster 3B quote-time scanner simplification;
- M2 or public-launch approval.

## Acceptance criteria

- Contact and Footer missing required copy fail with an exact path or strict
  translator error; no embedded English rescue is used.
- The active Inquiry Turnstile path has no English default copy.
- The production mobile Sheet close control uses translated copy.
- Production translation consumers no longer use arbitrary-string wrappers or
  `as Parameters<typeof t>[0]` escapes.
- Factory SVG, product SVG, and Canvas language text comes from passed data;
  approved units and `TB-BW` remain literal.
- invalid-locale recovery, same-locale physical-source retry, and the English
  global-error exception remain covered and pass.
- message usage gates have no stale fallback consumers and no new broad
  allowlist.
- D7a PR is green and marked `READY_FOR_CLUSTER`, not `ACCEPTED` or merged.
