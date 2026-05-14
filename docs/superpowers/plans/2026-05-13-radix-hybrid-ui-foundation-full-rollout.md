# Radix Hybrid UI Foundation Full Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry the accepted Radix hybrid / pilot-first decision through governance, Contact / Inquiry form pilot, and an explicit expand/freeze/rollback gate.

**Architecture:** Keep Tailwind and project tokens as the website foundation. Keep Radix Primitives in local UI wrappers. Add Radix Themes only through approved `src/components/ui/*` wrappers for the Contact / Inquiry form pilot, then make a documented gate decision before any expansion.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Radix Primitives, optional Radix Themes 3.3.0, next-intl, Vitest, Storybook, component governance scanner.

---

## Phase summary

- Phase 0: Governance foundation. Status: implemented in this branch.
- Phase 1: Contact / Inquiry Form Radix Themes pilot. Status: planned next.
- Phase 2: Gate decision. Status: pending pilot evidence.
- Phase 3: Optional bounded expansion. Status: blocked until Phase 2 chooses Expand.

## Task 1: Preserve governance foundation

**Files:**
- Already created/modified in the governance phase.

- [x] **Step 1: Keep ADR and rules in place**

Verify these files exist or were updated:

```text
docs/decisions/ADR-ui-foundation.md
docs/design-truth.md
docs/impeccable/system/COLOR-SYSTEM.md
docs/impeccable/system/COMPONENT-GOVERNANCE.md
.claude/rules/ui.md
AGENTS.md
CLAUDE.md
src/components/ui/README.md
scripts/starter-checks.js
tests/unit/scripts/component-governance-check.test.ts
```

- [x] **Step 2: Verify governance checks**

Run:

```bash
pnpm component:governance:test
pnpm component:governance
pnpm lint:check
```

Expected: all pass.

## Task 2: Prepare Contact / Inquiry Form pilot design surface

**Files:**
- Read: `src/components/forms/contact-form-container-view.tsx`
- Read: `src/components/forms/contact-form-fields.tsx`
- Read: `src/components/forms/contact-form-feedback.tsx`
- Read: `src/components/forms/form-status-styles.ts`
- Read: `src/components/ui/input.tsx`
- Read: `src/components/ui/textarea.tsx`
- Read: `src/components/ui/label.tsx`
- Read: `src/app/[locale]/layout.tsx`
- Read: `src/app/globals.css`

- [x] **Step 1: Confirm current form structure**

The contact form already composes local UI wrappers:

- `Button`
- `Card`
- `Input`
- `Label`
- `Textarea`

Checkboxes currently use a native `<input type="checkbox">`.

- [x] **Step 2: Confirm Next.js CSS boundary**

Installed Next.js docs say global CSS can be imported in App Router layouts,
CSS order depends on import order, and production CSS order should be verified
with `next build`.

- [x] **Step 3: Confirm Radix Themes current package**

`pnpm view @radix-ui/themes version` reports `3.3.0`.

## Task 3: Add failing pilot tests before implementation

**Files:**
- Modify: `tests/unit/scripts/component-governance-check.test.ts`
- Modify or create focused tests under `src/components/forms/__tests__/`

- [ ] **Step 1: Add test that allows Radix Themes only in UI wrappers**

Add a fixture importing `@radix-ui/themes` inside `src/components/ui/radix-theme.tsx`
and assert component governance passes.

- [ ] **Step 2: Add contact form tests for pilot wrapper usage**

Add focused tests that assert Contact Form fields keep:

- labels;
- placeholders;
- required attributes;
- disabled state;
- form field names;
- checkbox semantics.

- [ ] **Step 3: Run focused tests and confirm RED where behavior is not yet implemented**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts src/components/forms/__tests__/contact-form-fields.test.tsx src/components/forms/__tests__/contact-form-accessibility.test.tsx
```

Expected: any new pilot-specific expectation fails before wrapper implementation.

## Task 4: Install and isolate Radix Themes

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/app/[locale]/layout.tsx` or a local app wrapper if needed
- Modify: `src/app/globals.css`
- Create: `src/components/ui/radix-theme.tsx`

- [ ] **Step 1: Add dependency**

Run:

```bash
pnpm add @radix-ui/themes@3.3.0
```

- [ ] **Step 2: Import Radix Themes CSS intentionally**

Add the CSS import in the single global CSS entry path with a comment explaining
CSS ownership and why `src/app/globals.css` remains the truth source.

- [ ] **Step 3: Add token mapping**

Map Radix Themes CSS variables back to project-owned roles in
`src/app/globals.css`. Do not use `!important`.

- [ ] **Step 4: Add local Theme wrapper**

Create a wrapper in `src/components/ui/radix-theme.tsx` that imports Radix
Themes components and exports only project-approved wrapper APIs.

## Task 5: Implement Contact / Inquiry Form pilot wrappers

**Files:**
- Create or modify UI wrappers under `src/components/ui/*`
- Modify: `src/components/forms/contact-form-container-view.tsx`
- Modify: `src/components/forms/contact-form-fields.tsx`
- Modify: `src/components/forms/contact-form-feedback.tsx`
- Possibly modify: `src/components/forms/form-status-styles.ts`

- [ ] **Step 1: Wrap the pilot surface**

Apply the local Radix Theme wrapper only around the contact form pilot surface,
not around the full website.

- [ ] **Step 2: Use local wrappers for text inputs and textareas**

Use project-owned wrapper exports. Do not import `@radix-ui/themes` in form
business code.

- [ ] **Step 3: Preserve checkbox native semantics or move through wrapper**

If using Radix Themes checkbox, preserve form submission names and required
semantics. If that becomes complex, keep the native checkbox and record why.

- [ ] **Step 4: Preserve status and error behavior**

Success, error, submitting, validation, network, and rate-limit messaging must
remain accessible and translated.

## Task 6: Verify pilot and make gate decision

**Files:**
- Modify: `docs/decisions/ADR-ui-foundation.md`
- Optionally create: `docs/decisions/radix-contact-form-pilot-result.md`

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts src/components/forms/__tests__/contact-form-fields.test.tsx src/components/forms/__tests__/contact-form-accessibility.test.tsx src/components/forms/__tests__/contact-form-container.test.tsx
```

- [ ] **Step 2: Run governance and lint**

Run:

```bash
pnpm component:governance
pnpm lint:check
```

- [ ] **Step 3: Run build proof if CSS order changed**

Run:

```bash
pnpm build
```

Expected: build succeeds and no CSS-order issue appears.

- [ ] **Step 4: Search forbidden imports/selectors**

Run:

```bash
rg -n "@radix-ui/themes|rt-" src/app src/components scripts tests docs
```

Expected:

- `@radix-ui/themes` appears only in approved UI wrappers, lockfiles, docs, or tests;
- no production code depends on `.rt-*` internal classes.

- [ ] **Step 5: Make explicit gate decision**

Update ADR or write a pilot result note with one of:

- Expand;
- Freeze;
- Rollback.

Do not proceed to specs, badges, cards, or other surfaces unless the decision is
Expand and the evidence is fresh.

## Task 7: Finish branch

**Files:**
- No new implementation files.

- [ ] **Step 1: Use verification-before-completion**

Run the final verification commands fresh before claiming completion.

- [ ] **Step 2: Use finishing-a-development-branch**

Present the standard branch completion options after tests pass.
