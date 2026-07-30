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

The most common test defect in this repo is an assertion that passes without
proving anything. Before keeping a new or changed assertion, break the thing it
claims to protect and confirm the assertion goes red. An assertion that cannot
be made to fail is not proof — replace it or delete it.

Shapes that keep recurring in review here:

- `toContain("some/path.md")` also passes on prose, a code sample, or a dead
  link. Assert that the reference resolves, not that the string appears.
- A positive assertion whose expected value is a substring of the wrong value:
  `=en` matches `=en,zh` too. Anchor the match or assert the exact line.
- Asserting a heading exists without asserting what has to be under it.
- Covering only the JavaScript path when a no-JS or responsive branch carries
  the behavior.
- Asserting a deleted name stays absent. That guards a past refactor, not live
  behavior.
- Asserting that outputs differ instead of what each one is. `Set(classNames)`
  having six entries, or three variants producing three different strings, holds
  when every variant is mapped to the wrong style. So does checking only
  `allowed` on a limiter whose ceiling is a hundred. The expected value has to be
  written out.
- Pinning the first few steps of a sequence and then the end state. Ten requests
  where only the first three returns are read, or a `.env` key matched as "this
  line exists" while a second declaration of the same key sits below it, leave
  the middle unwatched. Collect the whole sequence and compare it in one go, and
  parse key-value files into pairs instead of matching lines.
- Coercing before pinning the type. `String(["host"]).split(",")` yields the same
  one-element list a real string would, so a config value written as an array
  passes a check the runtime would fail. Assert the type, then read the value.
- Deriving the expected value from the thing under test. `toEqual(PATHNAMES)`
  where both sides come from the same `createPathnames()` call, or a failure
  matrix whose expected mode is read out of the preset's own `failureMode`,
  follows the config instead of checking it — flip the config and the test flips
  with it. Either hand-write the expected value, or pair the derived check with a
  hand-written pin somewhere else and say in a comment which one is the truth.
- Not proving the test reaches the real subject. Three tests here asserted
  against something other than the code they named: an "i18n integration" test
  called a mock it defined itself, a routing test imported the global mock rather
  than the routing module, and a rate-limit atomicity stub answered `GET`/`SET`
  while the store sent `INCR`, so every request became a storage failure and the
  count stayed at zero. Before trusting a green, break the real subject and watch
  the test go red; when a test speaks a wire protocol, read what the
  implementation actually sends instead of the branch names in the stub.

## "Another test covers it" has to be proved, not asserted

This is the single most frequent way a real regression got through review in this
repo. Four separate rounds deleted an assertion on the belief that a neighbour
covered it, and in each case the neighbour did not:

- a layout contract was handed to an E2E spec that only saves screenshots and
  never compares them;
- `checkDistributedRateLimit` called exactly once was handed to a test that only
  checks the call arguments, so double-charging a buyer's quota passed;
- success-path `retryAfter` and `resetTime` were handed to a blocked-path test
  that only ever inspects the blocked response;
- a starter-string blacklist was handed to a gate that runs on production deploy
  only, at warning severity, so what used to fail a pull request now fails
  nothing until launch.

Before writing "X covers this" in a comment, commit message, or review reply:
open X, break the source so only X could catch it, run X alone, and see it red.
If X is a script or CI gate rather than a test, also check its severity and which
pipeline runs it — coverage that moves from every pull request to a release-only
gate is a narrowing and has to be described as one.

## Claims about coverage have to be re-measured

Case counts, line counts, "this used to be N tests", and "nothing that could
catch a regression was removed" are all checkable, and they are where review
found the most errors in this repo. Three branches in the trim round each needed
their commit message rewritten more than once because a checkable statement in it
was false. Rules that follow from that:

- Measure after the last edit, not before. Adding two comment lines invalidates
  a line count already written into the commit message.
- To measure a baseline, `git checkout main -- <file>` then restore with
  `git checkout HEAD -- <file>`. `git stash` is a no-op when everything is
  committed and will silently measure the branch twice.
- Do not write an absolute claim about mutations unless each one was applied and
  re-run. If they were, say how many and what they were; if they were not, say
  that the assertion path exists rather than that it was verified.
- A blacklist entry, gate, or assertion is only "dead" after grepping for it.
  Pipe to `head` and the occurrence that disproves you gets truncated away.

Gates here have failed open more often than they have failed wrong. A check that
hangs, retries until green, or has no assertion at all is not a check. Shapes
already fixed in this repo:

- A smoke request with no timeout hangs instead of failing.
- Playwright retries turn a real first-attempt failure green.
- An unsafe production switch with nothing asserting against it passes by
  default.
- A size gate that runs before a fresh build measures a stale artifact.
- A byte budget read as JS string `.length` undercounts UTF-8 multibyte content.

Prefer the failing default: set timeouts, disable retries in runs that exist to
detect flakiness, assert the unsafe value is absent rather than assuming it is,
and confirm what you measure is freshly built.

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

`@/test/i18n-messages` reads `getComposedMessages("en")` — the same composed
message graph production loads — and is the only place allowed to define what a
test translation is. Three surfaces go through it: `@/test/utils`, and the
global `next-intl` and `next-intl/server` mocks in
`src/test/setup.constants-and-i18n.ts`. Do not hand-write a message catalog for
tests. Three used to exist here: one drifted to 153 of its 172 leaf keys naming
nothing real, the client-side one in the global setup invented
`navigation.services` and `navigation.contact`, and the server-side one returned
the key name for everything, so Server Component tests asserted `hero.title`
rather than the shipped headline. Assertions written against any of them proved
invented copy, and editing the shipped copy turned nothing red.

Two component tests still build their own small table —
`src/components/cookie/__tests__/cookie-banner.test.tsx` and
`src/components/ui/__tests__/theme-switcher.test.tsx`, both of which mock
`useTranslations` locally rather than using the global mock. They are the
remaining exceptions, not the pattern; do not add a fourth.

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
