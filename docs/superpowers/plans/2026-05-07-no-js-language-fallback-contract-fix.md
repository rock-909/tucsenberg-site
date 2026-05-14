# No-JS Language Fallback Contract Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix stale Playwright no-JS assertions so `release:verify` checks the actual documented no-JS language fallback behavior.

**Architecture:** Update only the E2E spec selectors and expected post-click page assertion. Use unique `hreflang` language-link selectors scoped to the fallback panel and assert the target locale root homepage heading.

**Tech Stack:** Playwright, Next.js localized routes, existing no-JS HTML contract test.

---

## File structure

- Modify: `tests/e2e/no-js-html-contract.spec.ts`
  - Add target homepage heading expectations.
  - Replace ambiguous `a[href]` locators with `a[hreflang][href]` locators.
  - Assert target root homepage heading after no-JS language fallback navigation.

## Task 1: Update the no-JS contract assertions

**Files:**
- Modify: `tests/e2e/no-js-html-contract.spec.ts`

- [ ] **Step 1: Add target homepage heading data**

Add `targetHomeHeading` to each `localeCases` entry:

```ts
targetHomeHeading: /还没有网站？先从可部署的展示型网站基础开始。/i,
```

for English-to-Chinese, and:

```ts
targetHomeHeading: /No website yet\\? Start with a deployable showcase-site foundation\\./i,
```

for Chinese-to-English.

- [ ] **Step 2: Replace ambiguous language link locators**

Change:

```ts
fallbackPanel.locator('a[href="/en"]')
fallbackPanel.locator('a[href="/zh"]')
```

to:

```ts
fallbackPanel.locator('a[hreflang="en"][href="/en"]')
fallbackPanel.locator('a[hreflang="zh"][href="/zh"]')
```

Change the target locator similarly.

- [ ] **Step 3: Assert target root heading**

Replace the final Contact heading assertion with:

```ts
await expect(
  page.getByRole("heading", { level: 1, name: localeCase.targetHomeHeading }),
).toBeVisible();
```

## Task 2: Verify the fix

**Files:**
- No additional files.

- [ ] **Step 1: Run focused Playwright proof**

Run:

```bash
CI=1 pnpm exec playwright test tests/e2e/no-js-html-contract.spec.ts --project=chromium
```

Expected: all no-JS HTML contract tests pass.

- [ ] **Step 2: Re-run release proof**

Run:

```bash
pnpm release:verify
```

Expected: full release verification exits 0.
