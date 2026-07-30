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

## Assertions must be able to fail

An assertion must protect observable behavior or a live risk. Prefer the
smallest assertion whose failure explains what broke.

- Exercise the real subject rather than a mock that recreates its behavior.
- Use an expected value independent from the value under test. It may come from
  a stable contract or fixture; it does not always need to be copied inline.
- Parse structured input as structured data instead of relying on substring
  matches.
- Cover no-JS, responsive, or failure branches only when they carry distinct
  required behavior.
- Do not preserve assertions whose only purpose is keeping a deleted name,
  exact prose, file layout, or historical refactor absent.

Use a deliberate negative check when an assertion is new, surprising, or
replacing another protection. Full mutation testing is optional, not the
default requirement for ordinary test changes.

## Replacing or removing proof

Before saying another test or gate covers a removed check, confirm that it:

- reaches the same behavior and failure mode;
- runs in the intended pipeline;
- fails that pipeline with blocking severity.

Use `git show <ref>:<path>` or a temporary worktree to inspect a baseline. Do
not rewrite the active worktree to measure it. Report counts and mutation
results only when they were freshly measured; do not turn snapshots into
permanent rules.

Checks that can hang or silently pass are not gates. Give network checks a
timeout, measure fresh artifacts, and make unsafe production defaults fail.

## Default commands

```bash
pnpm test
pnpm exec playwright test
```

Use narrower Vitest/Playwright commands while developing, then run the command
that proves the changed behavior.

Heavy mutation or broad review lanes are opt-in only. Do not treat them as
default proof for ordinary changes.

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
  `pnpm website:lighthouse` builds and measures its isolated `.next-lighthouse`
  output; do not replace it with the shared `.next` directory.
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
docs/架构与行为.md
```

Read it before changing routing, navigation, locale switching, 404 behavior,
contact/inquiry flows, product discovery, or critical CTA paths.

If behavior changes, update the contract and proving tests in the same branch.

## Reliability

- Avoid wall-clock thresholds in normal unit/integration tests.
- Existing E2E wall-clock waits are a tolerated test-exemption zone (owner
  decision); this is not a hard ban. But new E2E should prefer Playwright
  web-first assertions (`expect(locator).toBeVisible()` and friends, which
  auto-retry) and must avoid new `waitForTimeout` unless there is a documented
  reason no assertion can express the wait.
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

`@/test/i18n-messages` reads the same composed messages as production and is the
shared translation source for tests. Do not maintain a second hand-written
message catalog. A focused component test may mock only the keys it consumes
when message loading itself is not under test.

Two properties that must hold, and are pinned by
`src/test/__tests__/mock-translations.test.ts`:

- A key whose real value is the empty string returns the empty string, not the
  key name. `next-intl` returns the stored value; a `|| key` fallback treats a
  deliberately blank message as missing and makes the test environment disagree
  with production.
- Overriding a key that does not exist in the real packs throws. An override is
  for changing real copy, not for inventing it.

## Skips

Permanent skips are not acceptable. Temporary skips need a clear reason, owner,
tracking link, and expiry date. Prefer `test.todo` for planned behavior.
