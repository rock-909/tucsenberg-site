# ADR: Hybrid / Governed Radix UI Foundation

Status: accepted
Date: 2026-05-13
Owner: project maintainers
Applies to: reusable showcase websites built from this starter

## Decision

This project does not use a full-site Radix Themes-first migration.

The accepted UI foundation is a hybrid, governed Radix control layer:

- Radix Primitives are the default foundation for complex interactions.
- Radix-style 1-12 color scales are the long-term color discipline.
- Tailwind continues to own page layout, responsive structure, and brand expression.
- Project tokens in `src/app/globals.css` remain the runtime color truth source.
- Radix Themes may be used only inside approved local UI wrappers.
- The Contact / Inquiry form pilot has passed and is now part of the stable limited control set.
- The stable limited control set currently covers textual form controls, textarea controls, status callouts, badges, data/control cards, dialog and sheet interaction wrappers, and the dropdown menu primitive.
- New Radix Themes surfaces must be added through `src/components/ui/*` wrappers, documented in `docs/ref/ui-components.md`, covered by Storybook/tests, and kept behind component governance.
- Radix Themes must not take over hero sections, product storytelling, proof sections, footer art direction, grid systems, or page narrative structure.

## Why this is the right split

The starter is a marketing and conversion website starter, not a dashboard kit.
It needs reliable controls and accessible interaction patterns, but it must keep
brand and narrative freedom for different derived projects.

Radix should solve hard interaction details such as focus management, keyboard
behavior, ARIA wiring, overlays, menus, tabs, labels, and disclosure patterns.
Tailwind and project tokens should keep owning page composition and brand tone.

## Control vs narrative boundary

Do not decide by section name alone. Decide by behavior.

Use Radix-backed wrappers when an element has interaction, state, or repeated
control logic:

- hover, focus, disabled, selected, loading, pending, success, warning, or error states;
- inputs, labels, textareas, checkboxes, radio controls, validation, and form feedback;
- dialog, sheet, popover, tooltip, dropdown, accordion, tabs, navigation menu, and similar UI;
- data/control components such as badge, callout, table, card, and specification blocks when they carry state or repeated control semantics.

Use Tailwind plus project tokens when an element is mainly narrative or brand
expression:

- hero layout and page composition;
- product storytelling;
- factory or capability proof;
- footer art direction;
- static cards whose job is typography, imagery, and layout only.

Edge case: a hero CTA button may use the project Button wrapper because it is a
control. The hero layout itself should not become Radix Themes layout by
default.

## Stable limited control set

The phrase "stable limited control set" means Radix is approved for repeatable
controls and data/control surfaces, not for whole-page visual ownership.

Current stable wrappers:

- `Button` for button/CTA behavior through the local wrapper contract.
- `Label` for form label behavior.
- `Input` for textual inputs, while `file` and `hidden` keep native behavior.
- `Textarea` for multiline text entry.
- `Badge` for small status markers.
- `StatusCallout` for info, success, warning, and error panels.
- `DataCard` for data/control cards such as specifications, trade terms, and form fallback surfaces.
- `DropdownMenu` for menu interactions.
- `Dialog` for modal decisions, confirmations, and focused blocking interactions.
- `Sheet` for drawer-style interactions.

Current Contact-form-only exception:

- `ContactFormTextInput` and `ContactFormTextarea` remain scoped by
  `ContactFormShell` in this P0. They are not general-purpose form controls.
  Use `Input` and `Textarea` for ordinary reusable fields.

Agents should start UI selection from
`docs/ref/ui-components.md`. If a needed control is missing there,
add a local wrapper first instead of hand-writing one-off business UI.

## Wrapper rule

Business code must not import Radix Themes directly.

Allowed:

- `@radix-ui/react-*` inside `src/components/ui/*` wrappers for approved primitives.
- `@radix-ui/themes` only inside approved stable or pilot `src/components/ui/*` wrappers.
- tests that verify wrapper behavior.

Forbidden:

- app pages importing `@radix-ui/themes`;
- sections, product blocks, layout components, forms, or contact/business components importing `@radix-ui/themes` directly;
- styling `.rt-*` classes or depending on Radix Themes internal DOM;
- adding `!important` to win Radix/Tailwind cascade conflicts;
- letting Radix default colors become the project brand by accident.

The wrapper rule preserves reversibility. If a Radix Themes wrapper fails in
production, that wrapper can return to a local implementation without rewriting
page code.

## Contact form pilot outcome

The Contact / Inquiry form pilot passed on 2026-05-14. Its acceptance criteria
below are now the historical proof for the first stable wrapper expansion, not
an active gate for the current control set.

1. CSS stays clean:
   - no new Radix/Tailwind conflict fixes using `!important`;
   - no `.rt-*` selectors or dependencies on Radix internal DOM;
   - local development and production build render the same.
2. Wrapper boundary holds:
   - no direct `@radix-ui/themes` imports outside approved UI wrappers;
   - business code imports UI through local wrapper paths;
   - existing form behavior remains intact.
3. Accessibility is no worse:
   - keyboard tab order works through every field and submit state;
   - focus ring remains visible;
   - error summary and field errors remain accessible;
   - no new serious automated accessibility issues.
4. Visual tone still fits the business:
   - the form looks like a procurement/inquiry surface, not a generic SaaS signup card;
   - radius, shadow, spacing, and panel treatment match the starter's clear and credible tone;
   - error and success states are clearer than before.
5. Performance impact is measured:
   - route-level JS and CSS impact is known;
   - no meaningful layout shift regression;
   - the pilot does not push client boundaries into static narrative sections.
6. Maintenance gets simpler:
   - wrapper APIs are easier for agents to reuse;
   - variants become fewer and more semantic;
   - wrapper code is not larger and harder to understand than the local components it replaces.

Passing the Contact form pilot did not approve a full-site Radix Themes
migration. It only unlocked the current stable limited control set and future
bounded wrapper additions documented in `docs/ref/ui-components.md`.

## CSS layer ownership

`src/app/globals.css` owns global CSS order and runtime color tokens.

Any new Radix Themes wrapper must document:

- where Radix Themes CSS is imported;
- which cascade layer it uses;
- how Tailwind base, component, and utility styles interact with it;
- what development and production rendering proof was captured.

Agents must not fix cascade problems locally with stronger selectors. If cascade
order is wrong, fix the layer strategy instead of patching the symptom.

## Token mapping

Project-owned tokens remain the source of truth:

- `--brand-1` through `--brand-12`;
- `--neutral-1` through `--neutral-12`;
- semantic roles such as `--background`, `--foreground`, `--card`, `--primary`, `--border`, `--ring`, `--success-*`, `--warning-*`, and `--error-*`.

If Radix Themes is used inside an approved wrapper, its `--accent-*`, `--gray-*`,
`--color-background`, `--color-surface`, focus variables, and typography
variables must map back to project-owned roles. Radix default palettes or font
choices must not silently become brand identity.

## Dark mode and i18n scope

Stable wrapper work does not expand into a dark-mode redesign. Existing theme
behavior must not regress.

All visible copy, labels, aria labels, validation messages, close labels, empty
states, and fallback text must remain localizable through the project i18n
system. Do not accept hard-coded English from a vendor component when the
project already has a translation path.

## Rollback and expansion rule

If a new Radix Themes wrapper fails technically, remove Radix Themes from that
wrapper and keep Radix Primitives plus the color discipline.

If a wrapper passes technically but fails visually, freeze Radix Themes inside
the existing wrapper scope and do not expand it into brand-heavy or narrative
surfaces.

If any change creates direct business-code dependency on Radix Themes, stop and
repair the wrapper boundary before doing any visual expansion.

Removing an approved stable wrapper requires the same proof bar as adding one:
Storybook, tests, governance, and `docs/ref/ui-components.md` updates must move
together.

## Automated enforcement

`pnpm component:governance` enforces the cheap guardrails:

- block direct `@radix-ui/themes` imports outside approved UI wrapper paths;
- block styling or depending on `.rt-*` internal classes;
- block direct Radix primitive imports outside `src/components/ui/*`;
- block obvious raw Tailwind production palette classes;
- block browser UI imports of non-CSS static theme colors.

Documentation alone is not enough. This ADR depends on the automated check
staying active in the component governance gate.

## Stable takeover exceptions

The stable takeover keeps these local implementations intentionally. These are
not missed migration items.

- Contact checkboxes stay native until a dedicated checkbox spike proves
  FormData submission, no-JS fallback behavior, label-click toggling, and stable
  E2E locators.
- FAQ disclosure stays native `<details>/<summary>` while the route-level test
  requires the FAQ section to add no client JavaScript.
- Narrative `Card` usage stays local. Radix-backed `DataCard` is limited to
  data/control surfaces where repeated state, structure, or control semantics
  matter.
- Hero sections, product story sections, proof sections, footer art direction,
  grid systems, and page layout stay owned by Tailwind and project tokens.
