---
paths:
  - "**/*.{test,spec}.{ts,tsx}"
  - "tests/**/*"
---

# Testing Rules

Use this file when adding or changing Vitest, Playwright, mocks, fixtures, test
commands, or behavior proof.

## Proof selection

| Change type | Preferred proof |
| --- | --- |
| User-visible behavior | behavior contract + focused integration/E2E/component test |
| Pure utility logic | unit test |
| Public form submission | validation rejection + happy path + anti-abuse proof |
| Route/navigation/locale behavior | route-level integration or Playwright |
| Schema validation | `vi.unmock("zod")` before assertions |
| Component DOM/prop change | update paired test first |
| Client Component, hook, or React behavior change | focused test + React Doctor when relevant |

## Default commands

```bash
pnpm test
pnpm exec playwright test
```

Use narrower Vitest/Playwright commands while developing, then run the command
that proves the changed behavior.

Heavy mutation or broad review lanes are opt-in only. Do not treat them as
default proof for ordinary site work.

## React quality gates

React Doctor is part of the React quality signal, not a replacement for tests.

- Use `pnpm react:doctor` for Client Component, hook, form interaction, and
  render-flow changes when the change could affect React behavior.
- Use `pnpm react:doctor` when changing React Doctor policy or known
  exception files; the old classify/raw-governance layer has been retired.
- React Doctor errors block the branch. Warnings are backlog unless the change
  introduces or reclassifies them.
- Do not hide warnings by broad exception rules; record narrow, named exceptions
  in the policy files.

## Behavior contracts

The repo-level user-facing behavior anchor is:

```text
docs/specs/behavioral-contracts.md
```

Read it before changing routing, navigation, locale switching, 404 behavior,
contact/inquiry/subscribe flows, product discovery, or critical CTA paths.

If behavior changes, update the contract and proving tests in the same branch.

## Reliability

- Avoid wall-clock thresholds in normal unit/integration tests.
- UI tests must create the state they assert against.
- Critical smoke/E2E tests must fail on runtime errors.
- Tests named integration, contract, or protection must not mock away the core
  proof path while presenting themselves as primary proof.
- If a test mocks service boundaries, name and document the exact boundary it
  still proves, for example route ordering rather than full external
  integration.
- Console warning/error suppression must include a narrow reason.

## Playwright selectors

Use user-facing locators first:

1. `getByRole()`
2. `getByLabel()`
3. `getByPlaceholder()`
4. `getByText()`
5. `getByAltText()` / `getByTitle()`
6. `getByTestId()` only when user-facing locators are not practical

Avoid CSS class selectors for user flows.

## Zod validation tests

The test setup globally mocks `zod` for speed. Any test that asserts schema
rejection must call `vi.unmock("zod")` at top level before `describe()`.

## Mocks

Use shared test utilities instead of duplicating mock systems:

- `@/test/utils`
- `src/test/constants/mock-messages.ts`
- `src/test/render-async-page.tsx`
- focused setup helpers under `src/test/setup.*.ts`

## Skips

Permanent skips are not acceptable. Temporary skips need a clear reason, owner,
tracking link, and expiry date. Prefer `test.todo` for planned behavior.
