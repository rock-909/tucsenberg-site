# Radix Hybrid UI Foundation Full Rollout Design

## Summary

This design carries the accepted Radix hybrid / pilot-first decision from
governance into complete staged rollout.

The decision is not "use Radix everywhere." The rollout keeps the website
starter's page layout and brand expression in Tailwind plus project tokens,
while using Radix where it improves interaction, state handling, accessibility,
and agent consistency.

## Current state

Completed governance phase:

- `docs/decisions/ADR-ui-foundation.md` records the accepted decision.
- `docs/design-truth.md`, `.claude/rules/ui.md`, `AGENTS.md`, and `CLAUDE.md`
  route future UI work to the hybrid decision.
- `docs/impeccable/system/COLOR-SYSTEM.md` no longer has the old blanket
  Radix Themes prohibition.
- `docs/impeccable/system/COMPONENT-GOVERNANCE.md` documents wrapper-only
  Radix Themes usage.
- `scripts/starter-checks.js` blocks direct `@radix-ui/themes` imports outside
  UI wrappers and blocks `.rt-*` internal class dependencies.

## Rollout phases

### Phase 0: Governance foundation

Status: implemented.

This phase makes the decision durable and enforceable. It does not install
Radix Themes and does not change visible UI.

### Phase 1: Contact / Inquiry Form pilot

Status: next.

This phase introduces Radix Themes only for the Contact / Inquiry form control
surface through local wrappers.

The pilot may touch:

- `package.json` and `pnpm-lock.yaml` to add `@radix-ui/themes`;
- `src/app/globals.css` for intentional Radix Themes CSS import and token
  mapping;
- `src/components/ui/*` for approved Radix-backed wrappers;
- `src/components/forms/*` only to consume local wrappers;
- contact form tests and stories that prove behavior and visible states.

The pilot must not touch:

- hero layout;
- product storytelling;
- factory/capability proof sections;
- footer art direction;
- page narrative structure;
- unrelated product/spec/card/badge surfaces.

### Phase 2: Gate decision

After the Contact / Inquiry form pilot, choose exactly one:

1. **Expand**: pilot passes all criteria; next bounded pilot may target another
   control/data surface.
2. **Freeze**: pilot is technically acceptable but visually not worth expanding;
   keep it isolated and do not broaden usage.
3. **Rollback**: pilot fails technically or harms maintainability; remove Radix
   Themes and keep Radix Primitives plus the color discipline.

### Phase 3: Optional bounded expansion

Only if Phase 2 chooses Expand.

Allowed surfaces:

- forms;
- state feedback;
- technical specification tables;
- badges;
- cards when used as control/data surfaces.

Still forbidden:

- hero;
- product story sections;
- factory proof;
- footer;
- full page narrative structure.

## Phase 1 technical design

### CSS and Theme boundary

Radix Themes needs CSS and a Theme provider. The pilot will keep both explicit:

- global CSS order and token mapping live in `src/app/globals.css`;
- React Theme usage lives behind a local wrapper in `src/components/ui/*`;
- business form components do not import `@radix-ui/themes` directly.

`src/app/globals.css` remains the runtime token truth source. Radix variables
used by the pilot must map back to project tokens, especially brand, neutral,
surface, focus, and radius values.

### Wrapper boundary

New Radix-backed wrappers must live under `src/components/ui/*`.

Business code may import:

- a local pilot Theme wrapper;
- local form control wrappers;
- local status/callout wrappers.

Business code must not import:

- `@radix-ui/themes`;
- Radix internal `.rt-*` classes;
- Radix DOM structure.

### Contact form behavior

The existing contact form behavior must remain intact:

- field labels and placeholders still come from the translation function;
- required fields still use native form semantics where possible;
- disabled and pending states remain visible and testable;
- error summary remains focusable and announced;
- Turnstile and rate-limit states remain unchanged;
- form submission data names remain stable.

### Accessibility and i18n

The pilot must keep:

- keyboard traversal through all fields and submit button;
- visible focus states;
- accessible error summary;
- localized labels, aria text, status messages, and fallback messages.

No hard-coded English should be added to reusable UI wrappers.

### Performance proof

The pilot must record dependency and route-level impact before it can be called
passed. If full route metrics are too expensive in this phase, the gate must
mark performance as "not yet proven" and the decision cannot be Expand.

## Acceptance criteria

Phase 1 is complete only when all are true:

- `pnpm component:governance:test` passes.
- `pnpm component:governance` passes with 0 errors and 0 warnings.
- Focused contact form tests pass.
- `pnpm lint:check` passes.
- No direct `@radix-ui/themes` import exists outside approved UI wrappers.
- No `.rt-*` dependency exists in source.
- The ADR is updated with the actual pilot result: Expand, Freeze, or Rollback.

If any criterion fails and cannot be repaired cleanly, choose Freeze or Rollback
instead of expanding.
