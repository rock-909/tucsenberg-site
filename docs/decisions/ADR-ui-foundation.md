# ADR: Hybrid / Pilot-First UI Foundation

Status: accepted
Date: 2026-05-13
Owner: project maintainers
Applies to: reusable showcase websites built from this starter

## Decision

This project does not use a full-site Radix Themes-first migration.

The accepted UI foundation is hybrid and pilot-first:

- Radix Primitives are the default foundation for complex interactions.
- Radix-style 1-12 color scales are the long-term color discipline.
- Tailwind continues to own page layout, responsive structure, and brand expression.
- Project tokens in `src/app/globals.css` remain the runtime color truth source.
- Radix Themes may be used only inside approved local UI wrappers.
- The first Radix Themes pilot surface is the Contact / Inquiry form.
- If the first pilot passes, Radix Themes may expand only to form, state, specification, badge, card, and data/control surfaces.
- Radix Themes must not take over hero sections, product storytelling, proof sections, footer art direction, or page narrative structure.

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

## Wrapper rule

Business code must not import Radix Themes directly.

Allowed:

- `@radix-ui/react-*` inside `src/components/ui/*` wrappers for approved primitives.
- `@radix-ui/themes` only inside approved `src/components/ui/*` wrappers during a documented pilot.
- tests that verify wrapper behavior.

Forbidden:

- app pages importing `@radix-ui/themes`;
- sections, product blocks, layout components, forms, or contact/business components importing `@radix-ui/themes` directly;
- styling `.rt-*` classes or depending on Radix Themes internal DOM;
- adding `!important` to win Radix/Tailwind cascade conflicts;
- letting Radix default colors become the project brand by accident.

The wrapper rule preserves reversibility. If Radix Themes fails the pilot, the
wrapper can return to a local implementation without rewriting page code.

## Pilot pass criteria

The Contact / Inquiry form pilot passes only if all criteria below are true.

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

Passing the first pilot does not approve a full-site Radix Themes migration. It
only allows the next bounded pilot.

## CSS layer ownership

`src/app/globals.css` owns global CSS order and runtime color tokens.

Any Radix Themes pilot must document:

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

If Radix Themes is installed for a pilot, its `--accent-*`, `--gray-*`,
`--color-background`, `--color-surface`, focus variables, and typography
variables must map back to project-owned roles. Radix default palettes or font
choices must not silently become brand identity.

## Dark mode and i18n scope

The first pilot does not expand into a dark-mode redesign. Existing theme
behavior must not regress.

All visible copy, labels, aria labels, validation messages, close labels, empty
states, and fallback text must remain localizable through the project i18n
system. Do not accept hard-coded English from a vendor component when the
project already has a translation path.

## Rollback rule

If the pilot fails technically, remove Radix Themes from the pilot and keep
Radix Primitives plus the color discipline.

If the pilot passes technically but fails visually, freeze Radix Themes inside
the existing wrapper scope and do not expand it into brand-heavy or narrative
surfaces.

If the pilot creates direct business-code dependency on Radix Themes, stop and
repair the wrapper boundary before doing any visual expansion.

## Automated enforcement

`pnpm component:governance` enforces the cheap guardrails:

- block direct `@radix-ui/themes` imports outside approved UI wrapper paths;
- block styling or depending on `.rt-*` internal classes;
- block direct Radix primitive imports outside `src/components/ui/*`;
- block obvious raw Tailwind production palette classes;
- block browser UI imports of non-CSS static theme colors.

Documentation alone is not enough. This ADR depends on the automated check
staying active in the component governance gate.
