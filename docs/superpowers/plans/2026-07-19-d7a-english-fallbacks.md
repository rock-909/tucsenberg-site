> Historical.

# D7a Component-level English Fallback Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove component-level English fallback behavior while preserving request-level locale recovery and the provider-free global error boundary.

**Architecture:** Required website copy comes from the existing physical message packs or the existing product-copy objects. Raw message models use `readRequiredMessagePath`; React components receive narrow copy props and keep no English defaults. Product diagrams keep geometry in components and move language-bearing annotations into typed diagram data.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.7, TypeScript 6 strict, next-intl 4.13, Vitest, Testing Library, Playwright, Cloudflare/OpenNext.

---

## 0. Execution contract

- Worktree: `/Users/Data/code/tucsenberg-site/.worktrees/m3-d7a`
- Branch: `refactor/m3-d7a-english-fallbacks`
- Exact implementation base: `9f17068e12e02cbdf7513caeff74b1c9c51a71bd`
- Design commit already present: `8480a98`
- Cluster: 4
- Direct successor: D7b must start from the final D7a head
- PR state after green exact-SHA CI: `READY_FOR_CLUSTER`
- Do not merge, mark `ACCEPTED`, or start C7 from this branch

Read before editing:

```text
docs/superpowers/specs/2026-07-19-d7a-english-fallbacks-design.md
docs/项目基础/内容.md
docs/项目基础/消息文案.md
.claude/rules/coding-standards.md
.claude/rules/code-quality.md
.claude/rules/i18n.md
.claude/rules/testing.md
.claude/rules/ui.md
.claude/rules/conventions.md
node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md
```

Hard boundaries:

- Keep invalid-locale coercion, same-locale source retry, and global-error English.
- Keep buyer phone and WhatsApp absent from the form.
- Keep the public company phone and the five owner-deferred launch inputs.
- Do not rename starter-era message keys; that is D7b.
- Do not design a full localized product-content system.
- Do not add a generic translator, message fallback map, dynamic-key allowlist,
  Turnstile context, or diagram registry layer.
- Do not touch the main worktree or PR #102.
- Do not use permanent deletion commands. This task should not remove files.
- Run `pnpm build` and `pnpm website:build:cf` serially if both are ever needed.

## 1. File map

### Required message failure

- Modify: `src/lib/contact/getContactCopy.ts`
- Modify: `src/lib/__tests__/contact-get-contact-copy.test.ts`
- Reuse unchanged unless a test proves otherwise: `src/lib/i18n/read-message-path.ts`
- Modify: `src/i18n/__tests__/request.test.ts`
- Modify: `src/app/__tests__/global-error.test.tsx`
- Modify: `scripts/quality/message-key-usage-baseline.js`

### Footer and typed translation boundaries

- Modify: `src/components/footer/Footer.tsx`
- Modify: `src/components/footer/__tests__/Footer.test.tsx`
- Modify: `src/config/single-site.ts`
- Modify: `src/config/site-types.ts`
- Modify: `src/config/footer-links.ts`
- Modify: `src/config/__tests__/footer-links.test.ts`
- Modify: `src/config/pages.config.ts`
- Modify: `src/config/single-site-navigation.ts`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/app/[locale]/__tests__/layout.test.tsx`
- Modify: `src/components/layout/mobile-navigation.tsx`
- Modify paired mobile navigation tests under `src/components/layout/__tests__/`
- Modify: `src/app/[locale]/request-quote/page.tsx`
- Modify: `src/app/[locale]/request-quote/__tests__/page.test.tsx`
- Modify: `src/components/errors/route-error-view.tsx`
- Modify: `src/app/[locale]/contact/error.tsx`
- Modify: `src/app/[locale]/products/error.tsx`
- Modify: `src/app/[locale]/contact/__tests__/error.test.tsx`

### Inquiry, Turnstile, Sheet, and Header

- Modify: `messages/profiles/b2b-lead/en/messages.json`
- Modify: `src/components/forms/inquiry-form-copy.ts`
- Modify: `src/test/inquiry-test-messages.ts`
- Modify paired inquiry-copy and inquiry-form tests
- Modify: `src/components/forms/inquiry-form.tsx`
- Modify: `src/components/forms/lazy-turnstile.tsx`
- Modify: `src/components/forms/__tests__/lazy-turnstile.test.tsx`
- Modify: `src/components/security/turnstile.tsx`
- Modify: `src/components/security/__tests__/turnstile.test.tsx`
- Modify: `src/components/security/turnstile-rescue-line.tsx`
- Modify: `src/components/ui/sheet.tsx`
- Modify: `src/components/layout/mobile-navigation-interactive.tsx`
- Modify: `src/components/layout/header.tsx`
- Modify: `src/components/layout/header-client.tsx`
- Modify paired Header/mobile tests and stories that instantiate these components

### Diagram copy

- Modify: `messages/profiles/catalog/en/messages.json`
- Modify: `src/components/products/factory-pool-diagram.tsx`
- Modify: `src/components/content/trade-landing-shell.tsx`
- Modify: `src/components/content/__tests__/trade-landing-shell.test.tsx`
- Modify: `src/constants/tucsenberg-product-page-types.ts`
- Modify all five `src/constants/tucsenberg-product-page-*.ts` product files
- Modify: `src/constants/tucsenberg-product-pages.ts`
- Modify: `src/components/products/product-diagrams.tsx`
- Modify: `src/components/products/boxwall-cross-section.tsx`
- Create: `src/components/products/__tests__/product-diagrams.test.tsx`
- Modify: `src/components/sections/hero-section.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/products/products-overview-sections.tsx`
- Modify paired page/hero/product tests and fixtures affected by the required labels

## 2. Task 1: lock required-message and recovery behavior with failing tests

- [ ] **Step 1: Reverse the Contact fallback tests**

Keep the complete-message success case. Replace the legacy/fallback assertions
with tests shaped like:

```ts
it("throws the exact path when contact title is missing", () => {
  const messages = createCompleteContactMessages();
  delete (messages.contact as Record<string, unknown>).title;

  expect(() => getContactCopyFromMessages(messages)).toThrow(
    "Missing required message: contact.title",
  );
});

it("does not read legacy underConstruction contact copy", () => {
  expect(() =>
    getContactCopyFromMessages({
      underConstruction: { contact: createCompleteContactMessages().contact },
    }),
  ).toThrow("Missing required message: contact.title");
});
```

Add one table-driven panel-leaf case so the test proves a nested full path, for
example `contact.panel.responseTimeValue`.

- [ ] **Step 2: Replace the Footer custom-fallback test**

Use a file-local strict `useTranslations` mock backed by composed English
messages. Unknown paths must throw instead of returning the key.

```ts
function readStrictMessage(
  messages: Record<string, unknown>,
  path: string,
): string {
  const value = path.split(".").reduce<unknown>((current, segment) => {
    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, messages);

  if (typeof value !== "string") {
    throw new Error(`Missing test message: ${path}`);
  }
  return value;
}
```

Delete the test that treats nonexistent `footer.custom.*` keys plus English
`title` / `label` as supported behavior. Add a test that removes one formal
Footer message and expects rendering to throw.

- [ ] **Step 3: Strengthen the two correct recovery tests**

In `src/i18n/__tests__/request.test.ts`, retain the invalid/null locale cases and
assert the uncached loader receives the same locale:

```ts
expect(loadCompleteMessagesFromSource).toHaveBeenCalledWith(
  LOCALES_CONFIG.defaultLocale,
);
```

Expose the mock from the existing test setup rather than adding a second request
loader fixture.

In `src/app/__tests__/global-error.test.tsx`, add:

```ts
expect(document.documentElement).toHaveAttribute("lang", "en");
```

- [ ] **Step 4: Run RED**

```bash
pnpm exec vitest run \
  src/lib/__tests__/contact-get-contact-copy.test.ts \
  src/components/footer/__tests__/Footer.test.tsx \
  src/i18n/__tests__/request.test.ts \
  src/app/__tests__/global-error.test.tsx
```

Expected: Contact/Footer behavior tests fail because fallback behavior still
exists. Recovery tests must either pass or fail only because the mock is not yet
exposed correctly.

## 3. Task 2: remove Contact and Footer fallback structures

- [ ] **Step 1: Make Contact use the existing required reader**

Reduce `getContactCopyFromMessages` to direct reads:

```ts
const readContact = (path: readonly string[]) =>
  readRequiredMessagePath(messages, ["contact", ...path]);

return {
  title: readContact(["title"]),
  description: readContact(["description"]),
  panel: {
    contactTitle: readContact(["panel", "contactTitle"]),
    // Continue with every existing required field, one literal path each.
  },
};
```

Delete `CONTACT_COPY_FALLBACKS`, `CONTACT_MESSAGE_ROOTS`, the local path reader,
the warning fallback, and the logger import.

- [ ] **Step 2: Remove stale message-usage registrations**

From `scripts/quality/message-key-usage-baseline.js`, delete only:

```text
MESSAGE_OBJECT_KEY_CONSUMERS entry for CONTACT_COPY_FALLBACKS
MESSAGE_DERIVED_KEY_CONSUMERS entry for translateWithFallback
```

Keep fixed-prefix `contact.*`, Footer collection-value consumers, and the
hardening fixture that tests the generic checker itself.

- [ ] **Step 3: Collapse the Footer to one formal configuration**

Remove `FooterProps.columns` and the duplicate layout prop. Preserve literal key
types by avoiding widening exports such as `: FooterColumnConfig[]` where the
source already uses `as const satisfies`.

Remove `title` and `label` from the Footer config/type only after `rg` proves they
have no remaining production consumer. The target link shape is:

```ts
export interface SiteFooterLinkItem {
  key: string;
  href: string;
  external?: boolean;
  translationKey: string;
}

export interface SiteFooterColumnConfig {
  key: string;
  translationKey: string;
  links: readonly SiteFooterLinkItem[];
}
```

Keep the actual exported constants narrow. `FooterSection` receives a translator
whose accepted key type is derived from `FOOTER_COLUMNS`, not `string`.

The component must directly call next-intl for:

```text
footer.copyright
footer.description
accessibility.footerNavigation
formal section title keys
formal link keys
```

Do not catch translation errors. Keep the current snapshot-year calculation and
placeholder interpolation until D7b re-inventories copyright semantics.

- [ ] **Step 4: Run GREEN for Contact/Footer and usage gates**

```bash
pnpm exec vitest run \
  src/lib/__tests__/contact-get-contact-copy.test.ts \
  src/components/footer/__tests__/Footer.test.tsx \
  src/config/__tests__/footer-links.test.ts \
  tests/unit/scripts/message-key-usage.test.ts \
  tests/unit/scripts/message-key-binding-hardening.test.ts \
  src/i18n/__tests__/request.test.ts \
  src/app/__tests__/global-error.test.tsx
pnpm content:check
```

- [ ] **Step 5: Commit the slice**

```bash
git add \
  src/lib/contact/getContactCopy.ts \
  src/lib/__tests__/contact-get-contact-copy.test.ts \
  src/components/footer/Footer.tsx \
  src/components/footer/__tests__/Footer.test.tsx \
  src/config/single-site.ts \
  src/config/site-types.ts \
  src/config/footer-links.ts \
  src/config/__tests__/footer-links.test.ts \
  src/app/[locale]/layout.tsx \
  src/i18n/__tests__/request.test.ts \
  src/app/__tests__/global-error.test.tsx \
  scripts/quality/message-key-usage-baseline.js
git commit -m "refactor: fail on missing localized shell copy"
```

## 4. Task 3: remove translation key escapes and English component defaults

- [ ] **Step 1: Add RED tests for narrow translated copy**

Use sentinel strings that differ from English defaults. Cover:

- Request Quote heading, intro, and five aside fields;
- Contact route error four labels;
- localized layout desktop navigation labels;
- mobile navigation link labels;
- mobile Sheet close control;
- Header/MobileNavigationIsland construction with explicit labels.

Do not add a second Products error suite if the shared `RouteErrorView` behavior,
Contact error test, and `pnpm type-check` prove the same contract.

- [ ] **Step 2: Replace `RouteErrorView.translationFn` with data**

Use this exact public shape:

```ts
export interface RouteErrorCopy {
  title: string;
  description: string;
  tryAgain: string;
  goHome: string;
}

export interface RouteErrorViewProps {
  error: Error & { digest?: string };
  reset: () => void;
  logContext: string;
  copy: RouteErrorCopy;
}
```

Each route error calls next-intl with four literal keys and passes the object.

- [ ] **Step 3: Replace Request Quote translator callbacks with data**

`RequestQuoteAside` receives:

```ts
interface RequestQuoteAsideCopy {
  afterSubmitTitle: string;
  confidenceTitle: string;
  confidenceWarranty: string;
  confidenceSamples: string;
  confidencePricing: string;
}
```

The page calls `tPage` directly for heading/intro and builds the aside object
with literal calls. Narrow `InquiryTranslate` in `inquiry-form-copy.ts` to the
finite keys used by `createInquiryFormCopy`; do not add a new key-registry file.

- [ ] **Step 4: Normalize navigation keys once**

Give `PublicStaticPageDefinition.navigationKey` and
`SiteNavigationItem.translationKey` a finite navigation key type. Add one helper
at the configuration boundary that returns the namespace-relative key used by
`useTranslations("navigation")`.

The two consumers become:

```ts
label: tNavigation(item.messageKey)
```

and:

```tsx
{t(item.messageKey)}
```

No consumer may call `replace(/^navigation\./, "")` or cast to translator
parameters.

- [ ] **Step 5: Require Header and Sheet labels**

Remove English defaults from `Header` and `MobileNavigationIsland`. Make the
buyer-visible label props required and update tests/stories with explicit
fixtures.

Extend `SheetContentProps`:

```ts
interface SheetContentProps extends React.ComponentProps<
  typeof SheetPrimitive.Content
> {
  side?: "top" | "right" | "bottom" | "left";
  closeLabel: string;
}
```

Render `{closeLabel}` in the sr-only span. The production mobile navigation passes
its existing `closeMenuLabel`.

- [ ] **Step 6: Run focused GREEN and type proof**

```bash
pnpm exec vitest run \
  'src/app/[locale]/request-quote/__tests__/page.test.tsx' \
  'src/app/[locale]/contact/__tests__/error.test.tsx' \
  'src/app/[locale]/__tests__/layout.test.tsx' \
  src/components/layout/__tests__/mobile-navigation.test.tsx \
  src/components/layout/__tests__/mobile-navigation-links.test.tsx \
  src/components/layout/__tests__/header.test.tsx \
  src/components/layout/__tests__/header-client.test.tsx
pnpm type-check
```

- [ ] **Step 7: Commit the slice**

```bash
git add \
  src/config/pages.config.ts \
  src/config/single-site-navigation.ts \
  src/config/site-types.ts \
  src/app/[locale]/layout.tsx \
  src/app/[locale]/__tests__/layout.test.tsx \
  src/components/layout \
  src/app/[locale]/request-quote \
  src/components/forms/inquiry-form-copy.ts \
  src/components/errors/route-error-view.tsx \
  src/app/[locale]/contact/error.tsx \
  src/app/[locale]/products/error.tsx
git commit -m "refactor: require typed localized component copy"
```

## 5. Task 4: make the Inquiry Turnstile copy required

- [ ] **Step 1: Add the message contract and RED tests first**

Under `inquiry.form`, add one `turnstile` object with these leaves:

```json
{
  "unavailable": "Security verification is temporarily unavailable.",
  "loadFailed": "Security verification failed to load.",
  "devBypass": "Dev mode: Turnstile verification bypassed",
  "testMode": "Bot protection disabled in test mode",
  "rescueBeforeEmail": "Email us instead -",
  "rescueAfterEmail": "Reply within 12 hours.",
  "rescueSubject": "Quote request"
}
```

Use the owner-approved punctuation already used by the UI if Prettier or content
style requires a different dash. Do not add the email address to messages.

Extend `InquiryFormCopy`:

```ts
readonly turnstile: {
  readonly unavailable: string;
  readonly loadFailed: string;
  readonly devBypass: string;
  readonly testMode: string;
  readonly rescueBeforeEmail: string;
  readonly rescueAfterEmail: string;
  readonly rescueSubject: string;
};
```

Add RED tests using non-English sentinel values. Prove the lazy failure fallback,
widget unavailable state, and rescue mailto subject use passed copy.

- [ ] **Step 2: Remove both default maps**

Make `labels` required on production `LazyTurnstile` and `TurnstileWidget` props.
Delete `resolveLazyTurnstileLabels` and `DEFAULT_TURNSTILE_LABELS`.

Make `TurnstileRescueLine` accept:

```ts
interface TurnstileRescueLineProps {
  beforeEmail: string;
  afterEmail: string;
  subject: string;
}
```

Build the mailto with `encodeURIComponent(subject)`. Keep the existing factual
sales email literal unless an already client-safe factual export is proven.

- [ ] **Step 3: Pass copy from InquiryForm**

`InquiryForm` passes the complete labels object to `LazyTurnstile`. LazyTurnstile
passes the widget subset and rescue subset to its children. Stories and direct
unit tests pass explicit fixture labels; no production component may rely on a
default.

- [ ] **Step 4: Run focused GREEN**

```bash
pnpm exec vitest run \
  src/components/forms/__tests__/inquiry-form-copy.test.ts \
  src/components/forms/__tests__/inquiry-form.test.tsx \
  src/components/forms/__tests__/lazy-turnstile.test.tsx \
  src/components/security/__tests__/turnstile.test.tsx
pnpm content:check
pnpm type-check
```

- [ ] **Step 5: Commit the slice**

```bash
git add \
  messages/profiles/b2b-lead/en/messages.json \
  src/components/forms/inquiry-form-copy.ts \
  src/components/forms/inquiry-form.tsx \
  src/components/forms/lazy-turnstile.tsx \
  src/components/forms/__tests__ \
  src/components/security/turnstile.tsx \
  src/components/security/turnstile-rescue-line.tsx \
  src/components/security/__tests__/turnstile.test.tsx \
  src/test/inquiry-test-messages.ts
git commit -m "refactor: require localized turnstile copy"
```

## 6. Task 5: pass language-bearing diagram text through typed data

- [ ] **Step 1: Define per-kind diagram label types and RED tests**

Add per-kind copy interfaces to `tucsenberg-product-page-types.ts`:

```ts
export interface BoxwallDiagramLabels {
  waterSide: string;
  loadSealsBase: string;
  profile: string;
  load: string;
  floodSide: string;
  drySide: string;
}

export interface GateDiagramLabels {
  planks: string;
  seal: string;
  post: string;
}

export interface BagDiagramLabels {
  shipsFlat: string;
  addWater: string;
  activatedWeight: string;
  stacking: string;
}

export interface TubeDiagramLabels {
  waterSide: string;
  skirtAndPins: string;
  tubeConstruction: string;
}

export interface FrpDiagramLabels {
  heightClass: string;
  profile: string;
  properties: string;
}
```

Make `TucsenbergProductDiagram` a discriminated union so each `kind` requires its
matching labels. Keep the shared `ariaLabel`, `caption`, `panelLabel`, and
`animated` fields.

Create one SVG behavior test file. Pass sentinel labels to every kind and prove:

- sentinel language appears;
- old embedded English does not appear when a different sentinel is passed;
- `50-85 cm`, `180 mm`, and `1 m` remain;
- panel/caption/aria behavior remains.

- [ ] **Step 2: Add Canvas RED proof**

Mock a 2D canvas context with `fillText: vi.fn()`, a non-zero bounding rect, and
reduced motion. Render the animated boxwall with sentinel labels.

Assert:

```ts
expect(fillText).toHaveBeenCalledWith("SENTINEL LOAD", expect.any(Number), expect.any(Number));
expect(fillText).toHaveBeenCalledWith("SENTINEL FLOOD", expect.any(Number), expect.any(Number));
expect(fillText).toHaveBeenCalledWith("SENTINEL DRY", expect.any(Number), expect.any(Number));
expect(fillText).toHaveBeenCalledWith("TB-BW", expect.any(Number), expect.any(Number));
```

- [ ] **Step 3: Move product annotations into the five product objects**

Populate the matching label object in each product page constant. Keep pure
dimensions in the SVG component. Strings containing language plus dimensions
move into data.

Replace the untyped `DIAGRAMS` function registry with the smallest exhaustive
renderer that preserves the discriminated union. A direct `switch (diagram.kind)`
is acceptable and preferable to casts or optional label bags.

`ProductLineDiagram` receives enough typed data to render the same labels as
`ProductDiagramPanel`; it must not look up an English fallback inside the
component.

Expose one existing-data helper in `tucsenberg-product-pages.ts` only if Home
needs to map a kind to the already-authored diagram. Do not create another
diagram config file.

- [ ] **Step 4: Pass the same data through all consumers**

- Hero uses the boxwall product diagram labels while keeping its translated
  panel label, aria label, and caption.
- Home product cards map their existing kind to the corresponding product
  diagram data.
- Product overview passes the `diagram` it already loads.
- Product detail passes its existing full diagram object.
- Animated boxwall passes `load`, `floodSide`, and `drySide` into the Canvas.

- [ ] **Step 5: Move factory-pool labels into OEM messages**

Add six leaves beside the existing `oemLanding.diagramLabel` /
`diagramAriaLabel` / `diagramCaption`. `TradeLandingShell` builds:

```ts
const diagramLabels = {
  extrusion: t("diagramLabels.extrusion"),
  moulding: t("diagramLabels.moulding"),
  welding: t("diagramLabels.welding"),
  sewing: t("diagramLabels.sewing"),
  specAndQc: t("diagramLabels.specAndQc"),
  mixedContainer: t("diagramLabels.mixedContainer"),
};
```

`FactoryPoolDiagram` requires this object and keeps no text defaults.

- [ ] **Step 6: Run focused GREEN**

```bash
pnpm exec vitest run \
  src/components/products/__tests__/product-diagrams.test.tsx \
  src/components/content/__tests__/trade-landing-shell.test.tsx \
  src/components/sections/__tests__/hero-section.test.tsx \
  'src/app/[locale]/__tests__/page.test.tsx' \
  'src/app/[locale]/products/__tests__/products-page.test.tsx' \
  'src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx'
pnpm content:check
pnpm type-check
```

- [ ] **Step 7: Commit the slice**

```bash
git add \
  messages/profiles/catalog/en/messages.json \
  src/components/products \
  src/components/content/trade-landing-shell.tsx \
  src/components/content/__tests__/trade-landing-shell.test.tsx \
  src/components/sections/hero-section.tsx \
  src/app/[locale]/page.tsx \
  src/app/[locale]/products/products-overview-sections.tsx \
  src/constants/tucsenberg-product-page-types.ts \
  src/constants/tucsenberg-product-page-*.ts \
  src/constants/tucsenberg-product-pages.ts
git commit -m "refactor: pass diagram copy through typed product data"
```

## 7. Task 6: final D7a proof and PR

- [ ] **Step 1: Scan the live production surface**

Run focused searches, then inspect each result rather than asserting a fixed
count:

```bash
rg -n "CONTACT_COPY_FALLBACKS|translateWithFallback|DEFAULT_TURNSTILE_LABELS|resolveLazyTurnstileLabels" src scripts
rg -n "as Parameters<typeof t|as unknown as \(.*key: string|t\(key as" src \
  --glob '!**/__tests__/**' --glob '!**/*.stories.*'
rg -n '"Close"|Footer navigation|Security verification is temporarily unavailable|Email us instead' \
  src/components src/app \
  --glob '!**/__tests__/**' --glob '!**/*.stories.*'
```

Allowed results must have a documented reason, such as the provider-free global
error or a test fixture. Do not add a forbidden-name guard for deleted internals.

- [ ] **Step 2: Run the focused D7a suite**

```bash
pnpm exec vitest run \
  src/lib/__tests__/contact-get-contact-copy.test.ts \
  src/components/footer/__tests__/Footer.test.tsx \
  src/i18n/__tests__/request.test.ts \
  src/app/__tests__/global-error.test.tsx \
  'src/app/[locale]/request-quote/__tests__/page.test.tsx' \
  'src/app/[locale]/contact/__tests__/error.test.tsx' \
  'src/app/[locale]/__tests__/layout.test.tsx' \
  src/components/forms/__tests__/inquiry-form-copy.test.ts \
  src/components/forms/__tests__/inquiry-form.test.tsx \
  src/components/forms/__tests__/lazy-turnstile.test.tsx \
  src/components/security/__tests__/turnstile.test.tsx \
  src/components/products/__tests__/product-diagrams.test.tsx \
  src/components/content/__tests__/trade-landing-shell.test.tsx \
  tests/unit/i18n-message-contract.test.ts \
  src/lib/i18n/__tests__/message-pack-loader.test.ts \
  tests/unit/scripts/message-key-usage.test.ts \
  tests/unit/scripts/message-key-binding-hardening.test.ts
```

- [ ] **Step 3: Run broad local gates**

```bash
pnpm content:check
pnpm type-check
pnpm component:check
pnpm website:check
pnpm exec playwright test \
  tests/e2e/navigation.spec.ts \
  tests/e2e/contact-form-smoke.spec.ts \
  tests/e2e/core-page-visual-calibration.spec.ts \
  tests/e2e/tucsenberg-site-smoke.spec.ts
pnpm knip:check
git diff --check
```

Do not run `pnpm website:build:cf` for this task unless a changed runtime boundary
or CI failure makes it necessary. The Cluster 4 tip will run the Cloudflare build.

- [ ] **Step 4: Run React Doctor because React/UI code changed**

Use the repository's documented React Doctor command from
`docs/项目基础/ReactDoctor政策.md`. Record the exact command and result in the PR
evidence packet. Do not substitute an old global command from memory.

- [ ] **Step 5: Self-review the complete diff**

Check all of the following:

```text
required messages fail visibly
no fallback map or universal translator was reintroduced
three system recovery behaviors remain
Turnstile and Sheet use passed copy
SVG and Canvas tests prove prop consumption
pure dimensions and TB-BW remain literal
no D7b key rename or full product-i18n design entered the diff
no phone/WhatsApp or owner-deferred launch input changed
```

- [ ] **Step 6: Push and open the stacked task PR**

Use PR title:

```text
refactor: remove component-level english fallbacks without weakening locale recovery
```

The PR base is `main` for D7a. Include the design and plan commits plus the three
implementation commits. Wait for the latest exact head SHA to complete every
GitHub check.

- [ ] **Step 7: Post the evidence packet**

```text
Task: D7a
Cluster: 4
PR:
Head SHA:
Base branch / base SHA: main / 9f17068e12e02cbdf7513caeff74b1c9c51a71bd
Behavior changed: required localized component copy; no component English rescue
Recovery retained: invalid locale; same-locale source retry; global-error English
Focused tests:
Broad checks:
Targeted Playwright:
React Doctor:
GitHub CI:
Production scan findings and allowed exceptions:
Self-review findings and disposition:
Scope deviations: none, or exact evidence
State: READY_FOR_CLUSTER
```

Do not ask for single-PR acceptance. Return control so D7b can start from the
green D7a head.
