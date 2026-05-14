# No-JS Language Fallback Contract Fix Design

Date: 2026-05-07

## Outcome

The no-JS mobile language fallback test should verify the current user-facing contract precisely: the fallback language links are collapsed by default, expand through native `<details>`, and navigate to the selected locale root.

## Problem

`pnpm release:verify` fails only in `tests/e2e/no-js-html-contract.spec.ts`.

Root causes:

- The test locates `a[href="/en"]` and `a[href="/zh"]` inside the mobile fallback panel. Those selectors also match the Home navigation links, so Playwright strict mode sees two elements.
- The test name and URL assertion say the no-JS language fallback lands on the selected locale root, but the final assertion waits for the Contact page heading. The behavior contract says the no-JS fallback intentionally links to `/en` or `/zh`, not to the previous page.

## Design

- Keep production HTML unchanged.
- Locate fallback language links by both `href` and `hreflang`.
- After clicking a no-JS language link, assert the selected locale root path and that locale root homepage heading.
- Keep JavaScript language-switching behavior unchanged; this patch only fixes the no-JS contract test.

## Acceptance criteria

- Given JavaScript is disabled and the mobile fallback panel is open, when the language `<details>` row is collapsed, then the `hreflang` language links are hidden.
- Given the user expands the no-JS language fallback, when they choose the other language, then the page navigates to `/en` or `/zh`.
- Given the page reaches the target locale root, then the target locale homepage heading is visible.

## Verification

Run:

```bash
CI=1 pnpm exec playwright test tests/e2e/no-js-html-contract.spec.ts --project=chromium
pnpm release:verify
```
