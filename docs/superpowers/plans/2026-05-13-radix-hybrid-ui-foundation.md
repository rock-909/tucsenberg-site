# Radix Hybrid UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved hybrid / pilot-first Radix UI decision into durable project rules and automated guardrails without changing the live UI.

**Architecture:** Keep project-owned tokens and Tailwind as the page/brand foundation. Keep Radix Primitives inside `src/components/ui/*` wrappers. Permit Radix Themes only for documented pilot wrappers and enforce that business code cannot import it directly.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Radix Primitives, Vitest, `scripts/starter-checks.js` component governance.

---

## File structure

- Create `docs/decisions/ADR-ui-foundation.md`: durable ADR for the UI foundation decision.
- Create `src/components/ui/README.md`: local wrapper contract for UI contributors.
- Create `docs/superpowers/specs/2026-05-13-radix-hybrid-ui-foundation-design.md`: Superpowers design spec.
- Create `docs/superpowers/plans/2026-05-13-radix-hybrid-ui-foundation.md`: this implementation plan.
- Modify `docs/design-truth.md`: add the current UI foundation truth.
- Modify `docs/impeccable/system/COLOR-SYSTEM.md`: replace the old Radix Themes prohibition with pilot-only wrapper language and token mapping rules.
- Modify `docs/impeccable/system/COMPONENT-GOVERNANCE.md`: document the Radix Themes wrapper boundary and scanner behavior.
- Modify `.claude/rules/ui.md`: route future UI work through the ADR and wrapper contract.
- Modify `AGENTS.md` and `CLAUDE.md`: put the cross-tool UI foundation summary at the project entry points.
- Modify `scripts/starter-checks.js`: add scanner rules for Radix Themes imports and `.rt-*` internal classes.
- Modify `tests/unit/scripts/component-governance-check.test.ts`: add regression tests for the new scanner rules.

## Task 1: Prove current scanner gap with failing tests

**Files:**
- Modify: `tests/unit/scripts/component-governance-check.test.ts`

- [x] **Step 1: Add a failing test for direct Radix Themes imports outside UI wrappers**

Add a fixture under `src/components/forms/contact-form.tsx` that imports
`@radix-ui/themes` directly and assert a
`radix-themes-import-outside-ui-wrapper` finding.

- [x] **Step 2: Add a failing test for `.rt-*` internal class dependencies**

Add fixtures that use `rt-Button` and `[&_.rt-Card]` in production UI code and
assert `radix-themes-internal-class` findings.

- [x] **Step 3: Run the focused test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts
```

Expected: the two new tests fail before scanner implementation.

## Task 2: Implement scanner guardrails

**Files:**
- Modify: `scripts/starter-checks.js`

- [x] **Step 1: Add Radix Themes import detection**

Add a pattern for `from "@radix-ui/themes"` and report
`radix-themes-import-outside-ui-wrapper` when it appears outside
`src/components/ui/*`.

- [x] **Step 2: Preserve the existing generic Radix import boundary**

Keep the existing `radix-import-outside-ui` finding for other
`@radix-ui/react-*` imports outside UI wrappers.

- [x] **Step 3: Add `.rt-*` detection**

Add a pattern that catches obvious `.rt-*`, `rt-*`, and Tailwind arbitrary
selector dependencies in production UI source.

- [x] **Step 4: Run focused tests and confirm GREEN**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts
```

Expected: all component governance unit tests pass.

## Task 3: Write durable decision and rule surfaces

**Files:**
- Create: `docs/decisions/ADR-ui-foundation.md`
- Create: `src/components/ui/README.md`
- Modify: `docs/design-truth.md`
- Modify: `docs/impeccable/system/COLOR-SYSTEM.md`
- Modify: `docs/impeccable/system/COMPONENT-GOVERNANCE.md`
- Modify: `.claude/rules/ui.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

- [x] **Step 1: Create the ADR**

Write the accepted decision:

- no full-site Radix Themes-first migration;
- Radix Primitives as complex interaction default;
- Radix-style 1-12 color discipline;
- Tailwind for layout/responsiveness/brand expression;
- project tokens as runtime color truth;
- Radix Themes only through local UI wrappers;
- first pilot is Contact / Inquiry form;
- no Radix Themes takeover of hero/story/proof/footer/narrative sections.

- [x] **Step 2: Include pass/fail and rollback terms**

Add pass criteria for CSS cleanliness, wrapper boundary, accessibility, visual
tone, performance impact, and maintainability. Add failure and rollback rules.

- [x] **Step 3: Remove contradictory color guidance**

Replace the old blanket Radix Themes prohibition with pilot-only wrapper
language and token mapping requirements.

- [x] **Step 4: Add the wrapper contract**

Create `src/components/ui/README.md` so contributors know this folder is the
only approved vendor UI entry point.

- [x] **Step 5: Update cross-tool entry points**

Add a concise UI Foundation section to `AGENTS.md` and `CLAUDE.md`.

## Task 4: Verify governance phase

**Files:**
- No implementation files beyond prior tasks.

- [x] **Step 1: Run component governance scanner**

Run:

```bash
pnpm component:governance
```

Expected: `[component-governance] passed: 0 error(s), 0 warning(s)`.

- [x] **Step 2: Run component governance tests**

Run:

```bash
pnpm component:governance:test
```

Expected: `2 passed`, `21 passed`.

- [x] **Step 3: Run lint**

Run:

```bash
pnpm lint:check
```

Expected: eslint and `eslint-disable` checks pass.

- [x] **Step 4: Search for contradictory old guidance**

Run:

```bash
rg -n "explicitly revisited" AGENTS.md CLAUDE.md .claude/rules docs src scripts tests
```

Expected: no matches.

## Current status

All planned governance tasks have been implemented in the current branch. The
next separate phase, if approved, is the Contact / Inquiry form Radix Themes
pilot. That phase must create its own design, plan, dependency change, CSS layer
proof, visual proof, accessibility proof, and performance proof.
