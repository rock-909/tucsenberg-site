# Radix Contact Form Pilot Result

Status: continue pilot, not approved for expansion
Date: 2026-05-14
Related decision: `docs/decisions/ADR-ui-foundation.md`

## Decision

The Contact / Inquiry form pilot may stay in this branch as a narrow Radix
Themes pilot.

Do not expand Radix Themes to badges, cards, specification tables, or other
surfaces yet.

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
- `react-scan@0.5.6` is pinned back to its previous `react-grab@0.1.33` and
  `bippy@0.5.39` dependency path, so this branch does not mix the Radix pilot
  with an unrelated tooling upgrade.

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
- Screenshot artifact:
  `/Users/Data/workspace/showcase-website-starter/reports/radix-contact-form-pilot-en-contact-2026-05-14.png`
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
  - `src/app/[locale]/layout.tsx` and `src/app/ops/layout.tsx` import
    `src/app/globals.css`.
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

The Contact form now proves the local Radix Themes wrapper boundary, scoped token
mapping, project-owned typography mapping, Radix-backed text input and textarea wrappers, native checkbox
preservation, governance checks, build proof, and browser proof.

This still does not approve a full-site Radix Themes migration. The next
possible pilot may be one bounded control/data surface such as form feedback,
status callouts, badges, or a single specification/data card wrapper. Hero,
footer, product storytelling, proof sections, and page narrative structure stay
outside Radix Themes.
