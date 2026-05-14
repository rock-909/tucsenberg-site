# Radix Hybrid UI Foundation Design

## Summary

The project will adopt a hybrid / pilot-first UI foundation instead of a
full-site Radix Themes-first migration.

This design turns the owner-approved direction into a project contract for all
future AI and human contributors. The first phase is governance only: document
the decision, remove contradictory guidance, and enforce the wrapper boundary
with automated checks. It does not install `@radix-ui/themes` and does not
redesign the Contact / Inquiry form yet.

## Goals

- Preserve the starter's current marketing-site flexibility.
- Use Radix Primitives as the default base for complex interactions.
- Keep Radix-style 1-12 color roles as the long-term color discipline.
- Keep Tailwind responsible for page layout, responsive structure, and brand
  expression.
- Keep runtime color truth in `src/app/globals.css`.
- Allow Radix Themes only through approved local UI wrappers during documented
  pilot work.
- Make the first Radix Themes pilot explicitly target the Contact / Inquiry
  form.
- Keep hero, product storytelling, proof sections, footer art direction, and
  page narrative structure outside Radix Themes control.

## Non-goals

- No full-site Radix Themes migration.
- No package installation in this phase.
- No Contact / Inquiry form visual rewrite in this phase.
- No dark-mode redesign.
- No replacement of the existing Tailwind token architecture.

## Architecture

The architecture has four layers:

1. Project-owned tokens in `src/app/globals.css`.
2. Tailwind for page layout, responsive structure, and brand expression.
3. Radix Primitives inside `src/components/ui/*` wrappers for complex
   interactions.
4. Radix Themes only inside approved `src/components/ui/*` pilot wrappers.

Business code consumes local UI wrappers. It does not import Radix Themes
directly.

## Behavior contract

The decision boundary is behavior-based, not section-based.

Radix-backed wrappers are allowed when UI has:

- hover, focus, disabled, selected, loading, pending, success, warning, or error
  states;
- input, label, textarea, checkbox, radio, validation, or feedback behavior;
- dialog, sheet, popover, tooltip, dropdown, accordion, tabs, navigation menu,
  or similar interaction behavior;
- repeated data/control semantics such as badge, callout, table, card, or
  specification blocks with state.

Tailwind plus project tokens remain the default for:

- hero layout and page composition;
- product storytelling;
- factory/capability proof sections;
- footer art direction;
- static cards that mainly carry typography, imagery, and layout.

A hero CTA may use the local Button wrapper because it is a control. The hero
layout itself should not become Radix Themes layout.

## Pilot pass criteria

The Contact / Inquiry form pilot can pass only if all criteria are true:

1. CSS stays clean: no new Radix/Tailwind conflict fixes using `!important`, no
   `.rt-*` selectors, and development/production rendering stays aligned.
2. Wrapper boundary holds: no direct `@radix-ui/themes` imports outside approved
   wrappers and business behavior remains intact.
3. Accessibility is no worse: keyboard order, focus visibility, error summary,
   and field-level errors remain usable.
4. Visual tone fits the business: the result looks like a procurement inquiry
   surface, not a generic SaaS signup card.
5. Performance impact is measured: route-level JS/CSS impact and layout shift
   risk are known.
6. Maintenance gets simpler: wrapper APIs become easier to reuse and the code is
   not larger or harder to understand than the local components it replaces.

## Failure and rollback

If the pilot fails technically, remove Radix Themes from the pilot and keep
Radix Primitives plus the color discipline.

If the pilot passes technically but fails visually, freeze Radix Themes inside
the existing wrapper scope and do not expand it into brand-heavy or narrative
surfaces.

If business code imports Radix Themes directly, stop expansion and repair the
wrapper boundary before any further visual work.

## Enforcement

The first phase adds or updates these durable truth surfaces:

- `docs/decisions/ADR-ui-foundation.md`
- `docs/design-truth.md`
- `docs/impeccable/system/COLOR-SYSTEM.md`
- `docs/impeccable/system/COMPONENT-GOVERNANCE.md`
- `.claude/rules/ui.md`
- `AGENTS.md`
- `CLAUDE.md`
- `src/components/ui/README.md`

The component governance scanner must block:

- direct `@radix-ui/themes` imports outside approved UI wrappers;
- `.rt-*` internal class dependencies;
- direct Radix primitive imports outside `src/components/ui/*`;
- obvious raw Tailwind production palette classes;
- browser UI imports of non-CSS static theme colors.

## Verification

Minimum proof for the governance phase:

```bash
pnpm component:governance:test
pnpm component:governance
pnpm lint:check
```

The first command proves the new scanner behavior with tests. The second proves
the current repository passes the new guardrails. The third proves the changed
JavaScript and TypeScript files remain lint-clean.
