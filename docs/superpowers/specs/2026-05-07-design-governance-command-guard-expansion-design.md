# Design Governance Command Guard Expansion Design

## Context

`docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md` is an active design governance document. It is read before redesigning sections and tells workers which proof commands to run.

It still mentions retired package scripts:

- `pnpm review:docs-truth`
- `pnpm storybook:build`

Current canonical replacements are:

- `node scripts/starter-checks.js truth-docs`
- `pnpm component:check`

The current stale-command guard now covers website/deployment starter docs, but it does not yet scan this active design-governance doc. That leaves a gap where old command names can reappear in day-to-day UI work instructions.

## Goal

Update the active section redesign checklist to use current commands, and expand the truth-doc command guard to scan it.

## Non-goals

- Do not change Storybook setup.
- Do not remove Storybook coverage expectations for UI primitives.
- Do not change package scripts.
- Do not scan historical Superpowers plans/specs or old audit reports.
- Do not change visual design guidance beyond command names and proof wording.

## Design

### Guard scope

Add this active governance doc to `CURRENT_TRUTH_COMMAND_DOCS`:

```js
"docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md"
```

### Checklist wording

Replace the command list:

```bash
pnpm review:docs-truth
pnpm component:governance:test
pnpm component:check
pnpm storybook:build
pnpm type-check
pnpm lint:check
```

with:

```bash
node scripts/starter-checks.js truth-docs
pnpm component:governance:test
pnpm component:check
pnpm type-check
pnpm lint:check
```

Replace the explanation:

- `pnpm review:docs-truth` -> `node scripts/starter-checks.js truth-docs`
- `pnpm storybook:build` -> covered by `pnpm component:check`, because that script already runs the governance tests, governance CLI, and Storybook build.

## Acceptance criteria

Given `SECTION-REDESIGN-CHECKLIST.md` mentions a retired package script, when `collectCurrentTruthDocFindings()` runs, then it reports an unknown package script command.

Given `SECTION-REDESIGN-CHECKLIST.md` uses current commands, when `node scripts/starter-checks.js truth-docs` runs, then it passes.

Given active docs are searched for retired command names, then no active doc hit remains except guard tests/constants that intentionally mention retired commands.

## Verification

Run:

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
node scripts/starter-checks.js truth-docs
pnpm lint:check
```
