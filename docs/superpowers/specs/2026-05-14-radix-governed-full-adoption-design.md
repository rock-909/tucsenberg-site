# Radix Governed Full Adoption Design

## Goal

Maximize Radix ownership of standardized UI surfaces while keeping Tailwind and
project tokens responsible for brand expression, page layout, narrative rhythm,
hero sections, proof sections, and footer art direction.

This is not a light pilot. The default rule is:

- controls, interactions, state feedback, forms, and data/spec surfaces move to
  Radix-backed local wrappers;
- narrative/layout/brand-heavy surfaces stay Tailwind + project tokens;
- only an explicit stop-line can defer a standardizable surface.

## Current baseline evidence

Baseline captured on `2026-05-14` from branch
`radix-governed-full-adoption`.

- `f4c5faf` is not present in this derived repository history.
- `pnpm install --frozen-lockfile`: pass.
- `pnpm component:governance`: pass, 0 errors, 0 warnings.
- `node scripts/starter-checks.js client-boundary`: pass, 28 client boundary
  files.
- `pnpm lint:check`: pass.
- `pnpm type-check`: pass.
- `pnpm test`: pass, 304 files / 3217 tests.
- `pnpm build`: pass.

Known baseline build logs, not introduced by this work:

- Next.js `middleware` convention deprecation warning.
- local Resend API key missing, email service disabled.
- existing `DYNAMIC_SERVER_USAGE` digests during static generation, build exit
  code 0.

## Existing Radix boundary

Already compliant:

- `src/app/globals.css` imports `@radix-ui/themes/styles.css` once using
  `layer(components)`.
- `src/app/globals.css` maps the Contact form Radix pilot variables back to
  project-owned tokens under `.showcase-radix-theme-pilot.radix-themes`.
- `scripts/starter-checks.js` blocks:
  - direct `@radix-ui/themes` imports outside approved UI wrappers;
  - direct `@radix-ui/react-*` imports outside `src/components/ui/*`;
  - `.rt-*` internal class dependencies.
- Direct Radix imports currently exist only in approved local UI wrappers:
  - `src/components/ui/radix-theme.tsx`
  - `src/components/ui/contact-form-shell.tsx`
  - `src/components/ui/contact-form-control.tsx`
  - `src/components/ui/label.tsx`
  - `src/components/ui/sheet.tsx`
  - `src/components/ui/button.tsx` and `src/components/ui/breadcrumb.tsx`
    through `@radix-ui/react-slot`.

## Full UI surface inventory

Status meanings:

- `migrated now`: should be migrated in this adoption branch.
- `already compliant`: already behind local wrapper / correct boundary.
- `defer with stop-line reason`: standardizable in principle, but migration
  would currently hit a named stop-line.
- `not applicable because narrative/layout only`: intentionally Tailwind-owned.

| Surface | Files | Classification | Evidence / decision |
| --- | --- | --- | --- |
| Radix import governance | `scripts/starter-checks.js`, `tests/unit/scripts/component-governance-check.test.ts` | already compliant | Direct Radix imports outside UI wrappers and `.rt-*` dependencies are blocked. |
| Radix CSS and token mapping | `src/app/globals.css` | already compliant | CSS imported once; token mapping exists under scoped pilot class. |
| Theme wrapper | `src/components/ui/radix-theme.tsx` | migrated now | Needs generalized named surfaces, not only contact form. |
| Contact form shell | `src/components/ui/contact-form-shell.tsx`, `src/components/forms/contact-form-container-view.tsx` | already compliant | Radix Themes Card is behind local wrapper and used only for Contact form pilot. |
| Contact text inputs/textarea | `src/components/ui/contact-form-control.tsx`, `src/components/forms/contact-form-fields.tsx` | already compliant | Radix-backed Contact controls preserve names, required, disabled, and FormData tests. |
| Generic Input | `src/components/ui/input.tsx` | migrated now | Currently native; standardized textual input should use Radix-backed wrapper while file/hidden/native exceptions preserve FormData. |
| Generic Textarea | `src/components/ui/textarea.tsx` | migrated now | Currently native; should use Radix-backed wrapper with FormData/defaultValue/ref/focus tests. |
| Label | `src/components/ui/label.tsx` | already compliant | Uses `@radix-ui/react-label` behind local wrapper. |
| Field / hint / error / error summary | `src/components/forms/contact-form-fields.tsx`, `src/components/forms/fields/*`, `src/components/forms/contact-form-feedback.tsx` | migrated now | Field composition is repeated in business form files; needs UI wrapper contract for label/control/hint/error/summary. |
| Contact native checkbox | `src/components/forms/contact-form-fields.tsx`, `src/components/forms/fields/checkbox-fields.tsx` | migrated now, with TDD stop guard | Default target is Radix checkbox wrapper. Must prove FormData, label-click, disabled, required, and existing E2E locator compatibility before replacing. |
| Static Contact fallback controls | `src/app/[locale]/contact/contact-form-static-fallback.tsx` | defer with stop-line reason | No-JS/native fallback surface. May align local classes later, but cannot add client JS or break disabled/native semantics. |
| Submit loading state | `src/components/forms/contact-form-container-view.tsx` | already compliant | Uses local `Button`, `useFormStatus`, `aria-busy`, disabled state. |
| Contact status/error feedback | `src/components/forms/contact-form-feedback.tsx` | migrated now | Handwritten `role`/`aria-live` blocks; needs `StatusCallout` with static/live distinction. |
| Product family context notice | `src/components/contact/product-family-context-notice.tsx` | migrated now | Static notice should use `StatusCallout live={false}` to avoid unnecessary live region. |
| Turnstile fallback statuses | `src/components/security/turnstile.tsx`, `src/components/forms/lazy-turnstile.tsx` | migrated now | Repeated state surfaces should use `StatusCallout`; unavailable states stay polite/status unless tests require alert. |
| Lazy contact form island error | `src/components/contact/contact-form-island.tsx` | migrated now | Error retry state is a status/error surface; migrate to local callout without changing lazy-load behavior. |
| Badge | `src/components/ui/badge.tsx`, `src/components/products/product-specs.tsx` | migrated now | Current CVA div should wrap Radix Themes Badge and expose only project variants/data markers. |
| Card | `src/components/ui/card.tsx` | already compliant for narrative card | Generic card is project/Tailwind narrative shell; do not globally replace because it is used in hero/about/contact narrative sections. |
| Data/spec card | `src/components/products/product-specs.tsx`, `src/components/products/spec-table.tsx`, `src/app/ops/traffic/page.tsx`, contact response data cards | migrated now | Data/spec surfaces need `DataCard`, `SpecCard`, and table-like wrappers. |
| Product specs / trade info | `src/components/products/product-specs.tsx` | migrated now | Explicit product data/spec surface, not narrative card. |
| Spec table | `src/components/products/spec-table.tsx` | migrated now | Table semantics must remain native; wrapper owns shell/marker only. |
| Market series card | `src/components/products/market-series-card.tsx` | migrated now | Product attribute/metadata card; should use data/spec card wrapper while preserving link/image semantics. |
| Contact methods / response expectations | `src/app/[locale]/contact/contact-page-sections.tsx` | migrated now | Contact methods and response expectations are data/metadata cards; use data wrapper. |
| About value cards | `src/components/content/about-page-shell.tsx` | not applicable because narrative/layout only | Values are company narrative, not data/spec. |
| About stats | `src/components/content/about-page-shell.tsx` | migrated now | Repeated metrics; use MetricCard/DataCard. |
| Ops traffic form and metrics | `src/app/ops/traffic/page.tsx` | migrated now | Raw label/input/button and metric `dl`; use Field/Input/Button/MetricCard. |
| Header desktop language menu | `src/components/layout/header-language-menu.tsx` | migrated now | Handwritten menu/open/escape/outside click; should use `DropdownMenu` local wrapper. |
| Mobile menu sheet | `src/components/layout/mobile-navigation-interactive.tsx`, `src/components/ui/sheet.tsx` | already compliant | Uses Radix Dialog primitive through local Sheet wrapper. |
| Mobile language disclosure inside sheet | `src/components/layout/mobile-navigation-interactive.tsx` | migrated now | Interactive language disclosure should move to local Accordion/Collapsible wrapper if it does not add new boundary beyond existing client component. |
| Header no-JS/mobile fallback `details` | `src/components/layout/header-client.tsx` | defer with stop-line reason | Native fallback before lazy client activation; migration would add unnecessary JS to fallback path. |
| FAQ accordion | `src/components/sections/faq-accordion.tsx` | defer with stop-line reason | Native `details/summary` supports no-client route behavior; Radix Accordion would add client JS. |
| Cookie banner dialog and preferences | `src/components/cookie/cookie-banner.tsx` | migrated now, later slice | Complex focus trap + checkbox surface. Needs Dialog/Checkbox TDD and cookie behavior proof before replacement. |
| Theme switcher | `src/components/ui/theme-switcher.tsx` | migrated now, later slice | Three-option segmented control. Candidate for Tabs/RadioGroup/ToggleGroup wrapper; lower priority than form/menu/status/spec surfaces. |
| Global error action buttons | `src/app/global-error.tsx` | migrated now | Raw buttons should use local Button; dev `details` stays native. |
| Global error dev details | `src/app/global-error.tsx` | defer with stop-line reason | Error boundary debug disclosure should remain minimal/native. |
| Route error view | `src/components/errors/route-error-view.tsx` | already compliant | Uses local Button. |
| Sheet/Dialog primitive | `src/components/ui/sheet.tsx` | already compliant | Radix Dialog primitive behind wrapper with tests. |
| DropdownMenu primitive | `src/components/layout/header-language-menu.tsx` | migrated now | Wrapper missing; add `src/components/ui/dropdown-menu.tsx`. |
| Dialog wrapper | `src/components/cookie/cookie-banner.tsx` | migrated now, later slice | Sheet exists, generic Dialog missing; needed for cookie preferences if migration proves behavior. |
| Popover / Tooltip / Tabs / HoverCard / Select / Radio / Switch | none active in production source | already compliant | No production consumer found. Add wrappers only when a real surface appears; do not add unused primitives. |
| Separator | `src/components/ui/separator.tsx` | migrated now, low risk | Current local div can move to Radix Separator primitive if dependency is added and tests keep public contract. |
| Breadcrumb | `src/components/ui/breadcrumb.tsx` | already compliant | Local wrapper with Radix Slot only; breadcrumb semantics stay project-owned. |
| Buttons / CTAs | `src/components/ui/button.tsx`, pages/sections | already compliant | Local Button wrapper owns project brand CTA styling. Do not migrate all buttons to Radix Themes because hero/CTA tone is brand expression. |
| Hero / homepage preview / problem cards / answer cards | `src/app/[locale]/page.tsx`, `src/components/sections/hero-section-view.tsx` | not applicable because narrative/layout only | Marketing composition and brand-heavy narrative. |
| Product/story/proof/resource scenario cards | `src/components/sections/*-view.tsx` | not applicable because narrative/layout only | Marketing and proof sections, not control/spec surfaces. |
| Footer art direction | `src/components/footer/Footer.tsx` | not applicable because narrative/layout only | Footer composition and art direction remain Tailwind/project tokens. |
| Grid system / guide overlays | `src/components/grid/*` | not applicable because narrative/layout only | Page layout scaffolding, not Radix UI control surface. |
| MDX/legal content | `src/components/mdx/*`, `src/components/content/legal-page-shell.tsx` | not applicable because narrative/layout only | Content rendering and table-of-contents layout. |

## Direct violations found

None at inventory time:

- no business/page/section/product/layout direct imports from Radix packages;
- no production `.rt-*` dependency;
- no known CSS workaround using `.rt-*`;
- current client boundary budget is green.

## Required wrappers

Create or adjust:

- `src/components/ui/radix-theme.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/field.tsx`
- `src/components/ui/status-callout.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/data-card.tsx`
- `src/components/ui/metric-card.tsx`
- `src/components/ui/spec-card.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/checkbox.tsx` only after FormData proof
- `src/components/ui/dialog.tsx` / `src/components/ui/collapsible.tsx` in later
  interaction slices if cookie/mobile/theme migration proves clean.

## Test requirements

Every migrated surface needs behavior/public-contract tests:

- Input/Textarea: hidden/file native exceptions, typed/default FormData, refs,
  disabled, focus/blur/keyboard/change.
- Checkbox: FormData, label-click, required, disabled, no locator breakage.
- DropdownMenu/language: open, item activation, close behavior, Escape,
  outside click, keyboard/focus, real href.
- StatusCallout: live vs static notice; no per-instance Theme scope.
- Badge/DataCard/SpecCard: public markers, slots, semantic variants, forwarded
  attributes, refs; never `.rt-*`.
- Static fallback: no-JS/native fallback contract remains intact.
- Governance: direct Radix imports and `.rt-*` remain blocked.

## Stop-line policy

Stop or defer a component only with concrete evidence that migration would:

1. break native FormData or submit semantics;
2. add unnecessary client JS to static narrative/no-JS fallback surfaces;
3. force business code to import Radix directly;
4. require `.rt-*` styling to preserve visual intent;
5. hard-code i18n text;
6. degrade accessibility;
7. make Next.js/Cloudflare build or server/client boundary unexplained.

## Final coverage snapshot

Updated after implementation on `2026-05-15`.

### Adopted in this branch

- `src/components/ui/radix-theme.tsx`: named Radix Themes surfaces.
- `src/components/ui/input.tsx`: Radix Themes textual input, with native
  exceptions for hidden/file/checkbox/radio/button-like input types.
- `src/components/ui/textarea.tsx`: Radix Themes textarea with FormData tests.
- `src/components/ui/field.tsx`: local field, hint, error, and summary
  contracts.
- `src/components/ui/status-callout.tsx`: Radix Themes callout with live/static
  semantics.
- `src/components/ui/badge.tsx`: Radix Themes badge behind local semantic
  variants.
- `src/components/ui/data-card.tsx`, `metric-card.tsx`, `spec-card.tsx`:
  Radix-backed data/spec surfaces.
- `src/components/ui/dropdown-menu.tsx`: Radix DropdownMenu primitive for the
  desktop language menu.
- `src/components/ui/checkbox.tsx`: Radix Checkbox primitive for client-side
  contact/cookie controls with FormData and label-click proof.
- `src/components/ui/separator.tsx`: Radix Separator primitive.
- `src/components/ui/collapsible.tsx`: Radix Collapsible primitive for mobile
  language disclosure.
- `src/components/ui/radio-group.tsx`: Radix RadioGroup primitive for theme
  selection and future radio controls.
- `src/components/contact/contact-form-island.tsx`: load-error state uses
  `StatusCallout`.
- `src/app/[locale]/contact/contact-page-sections.tsx`: contact methods and
  response expectations use `DataCard`.
- `src/components/products/product-specs.tsx`, `spec-table.tsx`,
  `market-series-card.tsx`: product data/spec/metadata surfaces use
  DataCard/SpecCard/Badge wrappers.
- `src/app/ops/traffic/page.tsx`: ops control/data surface uses local UI
  wrappers.
- `src/components/content/about-page-shell.tsx`: repeated metrics use
  `MetricCard`; narrative value cards remain Tailwind.
- `src/components/cookie/cookie-banner.tsx`: category toggles use local Radix
  `Checkbox`.
- `src/components/layout/header-language-menu.tsx`: desktop language menu uses
  local `DropdownMenu`.
- `src/components/layout/mobile-navigation-interactive.tsx`: mobile language
  disclosure uses local `Collapsible`.
- `src/components/ui/theme-switcher.tsx`: theme selector uses local
  `RadioGroup`.
- `src/app/global-error.tsx`: action buttons use local `Button`.

### Already compliant

- `src/components/ui/contact-form-shell.tsx`: Radix Themes Card remains behind a
  local wrapper.
- `src/components/ui/contact-form-control.tsx`: existing Contact form text
  controls remain behind local wrappers.
- `src/components/ui/label.tsx`: Radix Label primitive behind local wrapper.
- `src/components/ui/sheet.tsx`: Radix Dialog primitive behind local Sheet
  wrapper.
- `src/components/ui/button.tsx` and `breadcrumb.tsx`: use Radix Slot only
  inside local UI wrappers.
- Governance blocks direct Radix imports outside UI wrappers and `.rt-*`
  dependencies.

### Deferred with stop-line evidence

- `src/app/[locale]/contact/contact-form-static-fallback.tsx`: native no-JS
  fallback remains native. Tests now lock disabled/native input, textarea,
  checkbox, required, label association, and submit semantics. Migrating this to
  Radix would add client UI assumptions to a server fallback surface.
- `src/components/sections/faq-accordion.tsx`: native `details/summary`
  remains because route-level no-client behavior is required.
- `src/components/layout/header-client.tsx` no-JS details/summary fallback:
  remains native for pre-hydration fallback behavior.
- `src/components/cookie/cookie-banner.tsx` outer banner/dialog shell: remains
  a non-modal bottom banner with `aria-modal="false"` and custom focus return.
  A direct Radix Dialog migration risks changing page-interaction semantics and
  focus locking. Checkbox controls inside the banner were migrated.
- `src/app/global-error.tsx` development `details`: remains native debug
  disclosure inside an error boundary.

### Not applicable because narrative/layout only

- Hero layout, homepage marketing sections, product storytelling, proof/factory
  narrative sections, footer art direction, page grids, MDX/legal content, and
  static narrative value cards remain Tailwind + project tokens.

### Governance and boundary updates

- `src/components/component-governance.registry.json` now registers every new
  wrapper story.
- `docs/quality/client-boundary-budget.json` is updated to 40 boundaries to
  account for new Radix primitive wrappers:
  `src/components/ui/checkbox.tsx`,
  `src/components/ui/dropdown-menu.tsx`,
  `src/components/ui/collapsible.tsx` and
  `src/components/ui/radio-group.tsx`, plus Radix Themes wrappers:
  `src/components/ui/radix-theme.tsx`,
  `src/components/ui/contact-form-shell.tsx`,
  `src/components/ui/contact-form-control.tsx`,
  `src/components/ui/input.tsx`,
  `src/components/ui/textarea.tsx`,
  `src/components/ui/status-callout.tsx`,
  `src/components/ui/badge.tsx`, and
  `src/components/ui/data-card.tsx`.
- The increase is intentional: these wrappers encapsulate browser-only Radix
  primitive behavior or client-only Radix Themes components. Counting them
  explicitly prevents third-party client JS cost from being hidden behind
  server-looking local wrappers.
