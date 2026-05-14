# Component Governance Business Story Warning Retirement Design

## Context

The starter should keep Storybook and component governance as reusable website-building capability. The current strict part is valuable:

- every `src/components/ui/*.tsx` primitive must be listed in `src/components/component-governance.registry.json`;
- every registered UI primitive must have a matching Storybook story;
- production code must import Radix through `src/components/ui` wrappers;
- production UI must use design tokens instead of obvious raw Tailwind palette classes;
- browser UI must not import `src/config/static-theme-colors.ts`;
- project-local Storybook MCP wiring must stay out of `.storybook/main.ts` and `package.json`.

The remaining weak point is the script-level warning backlog for business/page stories. `scripts/starter-checks.js component-governance` still scans selected business folders and warns when components under contact, footer, forms, products, or sections do not have a matching `*.stories.tsx` file.

That warning is not a starter invariant. The repo rules already say reusable UI primitives need Storybook stories, while business/page-level Storybook coverage can grow over time and is not a blocker for unrelated starter reset work. Keeping a warning for business component story gaps makes derived projects look noisy even when the reusable UI layer is healthy.

## Goal

Retire the business component missing-story warning from the component governance script, while keeping strict Storybook coverage for UI primitives and keeping Storybook build proof in `pnpm component:check`.

## Non-goals

- Do not remove Storybook.
- Do not remove existing business/page stories.
- Do not loosen UI primitive registry or required story coverage.
- Do not remove Radix wrapper, raw Tailwind palette, or static theme color import checks.
- Do not add project-local Storybook MCP wiring.
- Do not change package scripts in this round.

## Design

### Behavior

`node scripts/starter-checks.js component-governance` should remain a strict reusable-component and design-boundary gate.

It should no longer warn when a business component, section, form, product component, contact component, or footer component lacks a matching Storybook story.

Business/page stories remain allowed and useful examples, but they are no longer represented as a governance backlog.

### Script shape

Remove the business story warning branch from `scripts/starter-checks.js`:

- `COMPONENT_GOVERNANCE_STORY_WARNING_ROOTS`
- `getMatchingStoryPath()`
- `isBusinessComponentOrSection()`
- `collectStoryWarnings()`
- the call to `collectStoryWarnings()`

Keep the returned payload shape:

```js
{
  status: errors.length === 0 ? "passed" : "failed",
  errors,
  warnings: [],
}
```

This avoids changing the CLI output contract while making warning output intentionally empty for this check.

### Documentation

Update `docs/website/quality-proof.md` to state what `pnpm component:check` proves:

- UI primitive registry and required Storybook stories are intact;
- component governance boundaries are intact;
- Storybook can build;
- it does not prove every business/page component has Storybook coverage.

## Acceptance criteria

Given a new business component without a matching story, when `collectComponentGovernanceFindings()` runs, then it should pass with no warnings.

Given a UI primitive missing from the registry, when component governance runs, then it should still fail.

Given a registered UI primitive missing its required story, when component governance runs, then it should still fail.

Given production code imports Radix outside `src/components/ui`, when component governance runs, then it should still fail.

Given production UI uses obvious raw Tailwind palette classes or imports static theme colors, when component governance runs, then it should still fail.

Given `pnpm component:check` runs, then it should still execute governance tests, the governance CLI, and Storybook build.

## Verification

Run focused proof:

```bash
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts tests/architecture/component-governance.test.ts
pnpm component:governance
pnpm component:check
```

Then run repo safety proof:

```bash
pnpm type-check
pnpm lint:check
```
