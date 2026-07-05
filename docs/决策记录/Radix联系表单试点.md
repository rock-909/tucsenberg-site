# Radix Contact Form Pilot Result

Status: Contact pilot proven; staged stable takeover approved, not full-site expansion
Date: 2026-05-14
Related decision: `docs/决策记录/UI基础方案.md`

## Decision

The Contact / Inquiry form pilot is proven as the first Radix Themes wrapper
layer.

Do not approve a full-site Radix Themes migration. Staged stable takeover is
allowed only through local `src/components/ui/*` wrappers for form controls,
status callouts, badges, and data-control cards. Hero sections, product
storytelling, proof sections, footer art direction, grid systems, and page
layout stay project-owned and outside Radix Themes takeover.

## What this pilot proves

- `@radix-ui/themes` is installed as a pinned dependency.
- Radix Themes CSS is imported once through `src/app/globals.css`.
  Because that file is imported by shared layouts, the current CSS cost is
  global to routes under those layouts, not isolated to `/contact`.
- Radix theme variables are mapped back to project-owned brand, neutral,
  surface, focus, and typography tokens.
- React imports of `@radix-ui/themes` are limited to approved local UI wrappers:
  `RadixThemePilot`, `ContactFormShell`, `ContactFormTextInput`, and
  `ContactFormTextarea`.
- Contact form business code consumes local wrappers instead of importing Radix
  Themes directly.
- Labels, required fields, names, disabled state, Turnstile flow, and status
  messaging remain in place.
- Text input and textarea controls now use Contact-form-specific Radix-backed
  wrappers.
- Native checkbox behavior is deliberately preserved in this pass.
- Component governance blocks direct, dynamic, and CommonJS Radix Themes imports
  outside approved UI wrappers.
- Component governance blocks `.rt-*` internal class dependencies in production
  UI source.
- The former page-context and render-scanning development helpers have been
  retired from the starter.

## What this pilot does not prove yet

- Checkbox, alert, callout, and status feedback have not been replaced with
  Radix Themes wrappers.
- The route-level CSS/JS cost is recorded, but no before/after bundle delta has
  been captured in this branch.
- The current Radix Themes CSS import is globally shared through
  `src/app/globals.css`; this branch accepts that as a pilot constraint for now,
  not as proof that Radix Themes has route-local CSS cost.
- Dark mode is not part of this pilot decision.

## Controls-pilot baseline

Before the controls pass, the Contact form was wrapped in `RadixThemePilot`, but
the actual text input, textarea, and checkbox controls still used local/native
implementations. That baseline proved the wrapper and token boundary, not the
Radix Themes control ergonomics.

## CSS layer proof

The pilot tested and kept:

```css
@import "@radix-ui/themes/styles.css" layer(components);
```

Evidence:

- `pnpm lint:check`: pass.
- `pnpm type-check`: pass.
- `pnpm build`: pass.
- Browser proof for `/en/contact`: pass with no visible cascade blocker.
- No new cascade workaround using `.rt-*` selectors was added.
- No new `!important` was added for the Radix/Tailwind cascade. Existing
  `!important` rules in `src/app/globals.css` are pre-existing reduced-motion
  and high-contrast accessibility rules, not Radix conflict fixes.

## Browser proof

- Route checked: `/en/contact`.
- Browser: Codex in-app Browser, with a focused Playwright keyboard proof for
  tab order.
- Screenshot artifact: captured during the original pilot run, then left out of
  tracked proof because `reports/` is an ignored local report area.
- Result: Contact form rendered inside
  `data-ui-pilot="radix-themes-contact-form"`.
- Visual result: acceptable for a reusable buyer-facing inquiry/contact surface;
  no visual blocker found.
- Focus result: text fields and textarea show a visible focused border/focus
  state in browser proof.
- Checkbox result: privacy checkbox remains native and label-click toggles it.
- Submit result: submit button remains disabled without a Turnstile token.
- Local note: this dev environment has no Turnstile site key configured, so the
  Turnstile area renders the existing "security verification unavailable"
  fallback and the disabled submit button is skipped by normal Tab navigation.

Observed tab order from the first field:

```text
fullName -> email -> company -> subject -> message -> acceptPrivacy ->
marketingConsent
```

After those fields, focus moves to the next focusable FAQ summaries because the
Turnstile widget is unavailable locally and the submit button is disabled.

## Build and size proof

Historical route/build artifact note: this section preserves the 2026-05-14
starter-era build output. Current Tucsenberg is English-only; `/zh` is a retired
route and must stay 404. The old `/zh/contact` artifact below is historical
pilot evidence only, not a current route promise.

- Command: `pnpm build`
- Result: pass.
- Contact route line from build output:

```text
├ ◐ /[locale]/contact
│ ├ /[locale]/contact
│ ├ /en/contact
│ └ /zh/contact
```

- Route artifact evidence:
  - `.next/server/app/en/contact.html`: 36K
  - `.next/server/app/zh/contact.html`: 36K
- Contact page client manifest after build:
  - JS files for `[project]/src/app/[locale]/contact/page`: 104,920 bytes
  - CSS files for `[project]/src/app/[locale]/contact/page`: 786,348 bytes
- Global CSS scope note:
  - `src/app/[locale]/layout.tsx` imports `src/app/globals.css`.
  - The built locale homepage, about page, and contact page all reference the
    shared CSS chunk that contains Radix Themes styles.
  - `.next/static/chunks/0ikjb5g-ck431.css`: 785,868 bytes.
  - `.next/static/chunks/159yetp2nk93l.css`: 480 bytes.
  - Combined shared CSS evidence: 786,348 bytes.
  - This means the pilot's CSS cost is currently accepted as a global shared
    layout cost, not a Contact-only route cost.
- Noted warnings are unchanged by this pilot:
  - Next.js middleware convention deprecation warning.
  - Local Resend API key missing, email service disabled.
  - Existing `DYNAMIC_SERVER_USAGE` digest during static generation.

## Gate result

Result: Continue pilot; not approved for broad expansion.

Stable takeover follow-up:

The Contact form controls pilot is the first proof layer. It proves that Radix
Themes can stay behind local wrappers without leaking direct imports into
business, page, or section code.

The next step is a staged stable takeover, not a full-site Radix Themes
migration. Approved stable surfaces are limited to local `src/components/ui/*`
wrappers for form controls, status callouts, badges, and data-control cards.

This does not approve Radix Themes ownership of hero sections, product
storytelling, proof sections, footer art direction, grid systems, or page
layout. Those surfaces stay project-owned and Tailwind/layout-driven.

The Contact form now proves the local Radix Themes wrapper boundary, scoped token
mapping, project-owned typography mapping, Radix-backed text input and textarea wrappers, native checkbox
preservation, governance checks, build proof, and browser proof.

This still does not approve a full-site Radix Themes migration. The next
possible pilot may be one bounded control/data surface such as form feedback,
status callouts, badges, or a single specification/data card wrapper. Hero,
footer, product storytelling, proof sections, and page narrative structure stay
outside Radix Themes.

## Stable takeover exception log

This stable takeover round deliberately did not migrate checkbox controls, FAQ
disclosure, or narrative cards. Treat these as recorded risk exceptions, not as
missed work.

- Contact checkboxes remain native because a Radix-backed checkbox still needs a
  dedicated proof for FormData submission, no-JS fallback behavior, label-click
  toggling, and stable E2E locators.
- FAQ disclosure remains native `<details>/<summary>` because the current
  route-level performance boundary requires no client JavaScript for the FAQ
  section.
- Narrative card usage remains local because those cards are layout and
  storytelling surfaces. Radix-backed `DataCard` is reserved for data/control
  surfaces.
- Hero sections, product story sections, proof sections, footer art direction,
  grids, and page layout remain Tailwind/project-token owned. Moving them to
  Radix Themes would be a separate design decision, not part of this stable
  takeover.

## Stable takeover result

Result: stable limited expansion.

Expanded Radix ownership:

- textual form controls;
- textarea controls;
- status callouts;
- badges;
- data/control cards;
- dropdown menu primitive for the language menu.

Intentionally local:

- contact checkboxes;
- FAQ disclosure;
- narrative cards;
- hero, product storytelling, proof sections, footer art direction, grid, and
  page layout.

Final validation:

- `pnpm component:governance:test`: pass.
- `pnpm component:governance`: pass.
- `pnpm component:check`: pass.
- `pnpm type-check`: pass.
- `pnpm lint:check`: pass.
- `pnpm build`: pass.

Build notes recorded during final validation:

- `pnpm build` printed the existing Next.js middleware convention deprecation
  warning: `"middleware" file convention is deprecated. Please use "proxy"
  instead.`
- `pnpm build` printed the existing local email note: `Resend API key missing -
  email service will be disabled`.
- `pnpm build` printed existing `DYNAMIC_SERVER_USAGE` digests during static
  generation.
- None of those build notes point to a file changed by this Radix stable
  takeover.

Boundary proof:

- Direct Radix imports remain inside `src/components/ui/*` wrappers, plus the
  single `src/app/globals.css` Radix Themes stylesheet import.
- `@radix-ui/themes` imports are limited to approved local UI wrappers.
- Production implementation code has no `.rt-*` class dependency. The only
  precise `.rt-*` matches are test-only badge wrapper assertions in
  `src/components/ui/__tests__/badge.test.tsx`, used to verify Radix prop
  mapping.

Browser proof artifacts were captured during the original decision run, then
removed from tracked `reports/` during the R4 repo-governance cleanup because
`reports/` is ignored and should not hold long-term proof assets. Regenerate
fresh screenshots from the decision steps if this visual proof needs to be
rechecked.

The browser proof used the current workspace dev server on port 3002 because
port 3000 was already occupied by an unrelated local Next.js process. The
verified buyer-facing routes were still `/en/contact`, `/en/products`, and
`/en`.
