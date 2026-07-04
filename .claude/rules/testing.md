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
| Schema validation | real `zod` by default; avoid mocking validation unless a test is explicitly about adapter wiring |
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
default proof for ordinary starter work.

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

## Performance proof

- Performance changes need before/after evidence. Do not keep a performance
  patch only because it seems faster.
- For Lighthouse or payload work, run a fresh production build before measuring.
  `pnpm website:lighthouse` must measure the current `.next`, not a stale build.
- Use the smallest proof that matches the risk: route bundle or transfer size
  for payload changes, Lighthouse for page experience, and React Doctor or
  Profiler for Client Component render behavior.
- Do not relax thresholds, remove business content, or add broad lazy loading
  only to make a metric look better.
- If the measured gain is too small to justify added complexity, revert the
  optimization and keep the simpler implementation.

## Behavior contracts

The repo-level user-facing behavior anchor is:

```text
docs/项目基础/行为合约.md
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
- Console warning/error suppression must include a narrow reason.

## Preserved-state navigation proof

For shared client islands rendered from layouts, headers, navigation, or other
persistent shells, unit tests are not enough when behavior depends on route
navigation.

When changing open, pending, expanded, selected, locale-switching, drawer,
dropdown, or progress state in these surfaces, add or update browser proof that:

- creates the state before navigation;
- navigates to another route;
- checks browser back/forward when state could be preserved;
- checks locale switching when locale affects the surface;
- checks hash-only links when route progress or scroll navigation is involved.

Assert user-visible state such as `aria-expanded`, visible dialog or menu
content, URL, `html[lang]`, or progress-bar presence.

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

Vitest uses real `zod` by default. Tests that assert schema rejection should not
mock `zod`; if a narrow adapter-wiring test must mock a schema object, state
that it is not validation proof in the test description or file comment.

## Mocks

Use shared test utilities instead of duplicating mock systems:

- `@/test/utils`
- `src/test/constants/mock-messages.ts`

## Skips

Permanent skips are not acceptable. Temporary skips need a clear reason, owner,
tracking link, and expiry date. Prefer `test.todo` for planned behavior.
