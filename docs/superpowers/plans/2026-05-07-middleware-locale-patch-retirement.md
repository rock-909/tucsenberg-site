# Middleware Locale Patch Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire custom no-JS locale fallback and unsupported-locale redirect patches from middleware while preserving next-intl routing and hardened locale cookies.

**Architecture:** Keep `src/middleware.ts` as a thin wrapper around next-intl plus locale-cookie normalization. Move no-JS fallback behavior to simple root links in `src/components/layout/header-client.tsx`. Update tests and behavior contracts to match the simpler starter default.

**Tech Stack:** Next.js 16.2.4 App Router, next-intl 4.11, TypeScript, Vitest, Playwright no-JS contract tests.

---

## File structure

- Modify `tests/architecture/middleware-boundary.test.ts`
  - Add source-level guards against retired locale patch helpers.
- Modify `src/components/layout/header-client.tsx`
  - Change no-JS fallback links from `/{locale}?fromLocaleFallback=1` to `/{locale}`.
- Modify `src/middleware.ts`
  - Delete no-JS fallback and unsupported-locale redirect helpers.
  - Keep next-intl call, locale extraction, cookie normalization, leaked-header cleanup, matcher.
- Modify `tests/unit/middleware.test.ts`
  - Remove tests that expect custom no-JS path preservation and custom unsupported-locale redirects.
  - Add tests proving those paths fall through to next-intl.
- Modify `src/__tests__/middleware-locale-cookie.test.ts`
  - Replace invalid-locale redirect assertions with fall-through assertions.
- Modify `tests/e2e/no-js-html-contract.spec.ts`
  - Expect `/en` and `/zh` no-JS fallback links and locale-root navigation.
- Modify `src/components/layout/__tests__/header-client.test.tsx`
  - Expect `/en` and `/zh` in fallback HTML.
- Modify `docs/specs/behavioral-contracts.md`
  - Update BC-003 note.

## Task 1: Add failing architecture guard

**Files:**
- Modify: `tests/architecture/middleware-boundary.test.ts`

- [ ] **Step 1: Add the failing test**

```ts
it("keeps retired custom locale patch routing out of middleware", () => {
  const middlewareSource = read("src/middleware.ts");
  const headerClientSource = read("src/components/layout/header-client.tsx");

  expect(middlewareSource).not.toContain("fromLocaleFallback");
  expect(middlewareSource).not.toContain("getRoutingPathPatterns");
  expect(middlewareSource).not.toContain("matchesRoutePattern");
  expect(middlewareSource).not.toContain("isKnownLocalizedPath");
  expect(middlewareSource).not.toContain("tryHandleInvalidLocalePrefix");
  expect(headerClientSource).not.toContain("fromLocaleFallback");
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm exec vitest run tests/architecture/middleware-boundary.test.ts
```

Expected: FAIL because `src/middleware.ts` and `src/components/layout/header-client.tsx` still contain `fromLocaleFallback`.

## Task 2: Simplify no-JS fallback links

**Files:**
- Modify: `src/components/layout/header-client.tsx`
- Modify: `src/components/layout/__tests__/header-client.test.tsx`
- Modify: `tests/e2e/no-js-html-contract.spec.ts`

- [ ] **Step 1: Update fallback links**

Change both fallback `Link` components in `MobileLanguageFallback` from:

```tsx
href={{ pathname: "/", query: { fromLocaleFallback: "1" } }}
```

to:

```tsx
href="/"
```

Keep `locale="en"` and `locale="zh"` so next-intl emits `/en` and `/zh`.

- [ ] **Step 2: Update HTML/component tests**

In `src/components/layout/__tests__/header-client.test.tsx`, replace expectations for:

```ts
"/en?fromLocaleFallback=1"
"/zh?fromLocaleFallback=1"
```

with:

```ts
"/en"
"/zh"
```

In `tests/e2e/no-js-html-contract.spec.ts`, change `targetFallbackHref` values to `/zh` and `/en`, and update the fallback path preservation test so it expects `/${targetLocale}` rather than `/${targetLocale}/contact`.

- [ ] **Step 3: Run focused no-JS/component tests**

```bash
pnpm exec vitest run src/components/layout/__tests__/header-client.test.tsx
```

Expected: PASS after update.

## Task 3: Remove middleware custom locale patch helpers

**Files:**
- Modify: `src/middleware.ts`
- Modify: `tests/unit/middleware.test.ts`
- Modify: `src/__tests__/middleware-locale-cookie.test.ts`

- [ ] **Step 1: Delete custom helper code**

From `src/middleware.ts`, delete:

- `LOCALE_FALLBACK_QUERY_PARAM`
- `splitPathSegments`
- `getRoutingPathPatterns`
- `isOptionalCatchAllPattern`
- `isCatchAllPattern`
- `isDynamicPattern`
- `matchesRoutePattern`
- `isKnownLocalizedPath`
- `stripLocalePrefix`
- `isNoJsLocaleFallbackRequest`
- `getSameOriginRefererUrl`
- `getKnownRefererPath`
- `getCleanRefererSearch`
- `getNoJsLocaleFallbackTarget`
- `tryHandleNoJsLocaleFallback`
- `tryHandleInvalidLocalePrefix`
- `tryHandlePreIntlRedirect`

Keep:

- `isValidLocale`
- `extractLocaleCandidate`
- `setLocaleCookie`
- `removeLeakedMiddlewareCookieHeader`
- `extractLocaleFromLocationHeader`
- default `middleware`
- `config`

Default `middleware()` should start directly with:

```ts
const response = intlMiddleware(request);
```

- [ ] **Step 2: Update middleware tests**

In `tests/unit/middleware.test.ts`:

- delete tests that expect no-JS same-path redirects;
- delete tests that expect invalid locale redirect to `/en/...`;
- add a test that `/fr/about` calls `intlMock` and has no custom `location` header when the mock returns `NextResponse.next()`;
- keep matcher, cookie, leaked-header, and no-override tests.

In `src/__tests__/middleware-locale-cookie.test.ts`:

- replace invalid-locale redirect tests with fall-through tests that assert `intlMiddlewareMock` was called and no custom `location` header is set.

- [ ] **Step 3: Run middleware tests**

```bash
pnpm exec vitest run tests/unit/middleware.test.ts src/__tests__/middleware-locale-cookie.test.ts
```

Expected: PASS.

## Task 4: Update behavior contract

**Files:**
- Modify: `docs/specs/behavioral-contracts.md`

- [ ] **Step 1: Update BC-003 note**

Replace the old no-JS note with:

```text
Notes: The JavaScript language switchers preserve the current path directly. The mobile no-JS fallback is intentionally simpler and links to the selected locale root (`/en` or `/zh`) instead of guessing the previous page from request headers.
```

- [ ] **Step 2: Run source scan**

```bash
rg -n "fromLocaleFallback|same-origin Referer|invalid locale prefix|tryHandleInvalidLocalePrefix|matchesRoutePattern" src tests docs/specs/behavioral-contracts.md
```

Expected: no active source/test/docs contract requiring the retired custom patch. Historical superpowers docs may still mention the prior plan.

## Task 5: Final verification

**Files:**
- No extra production files unless earlier tasks require small fixes.

- [ ] **Step 1: Run focused tests**

```bash
pnpm exec vitest run \
  tests/architecture/middleware-boundary.test.ts \
  tests/unit/middleware.test.ts \
  src/__tests__/middleware-locale-cookie.test.ts \
  src/components/layout/__tests__/header-client.test.tsx
```

Expected: all pass.

- [ ] **Step 2: Run type and lint**

```bash
pnpm type-check
pnpm lint:check
```

Expected: both exit 0.

- [ ] **Step 3: Run build proof serially**

```bash
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: all exit 0. Do not run `pnpm build` and `pnpm website:build:cf` in parallel.

## Self-review

- Spec coverage: all acceptance criteria map to Tasks 1-5.
- Placeholder scan: no placeholder text remains.
- Type consistency: no new exported runtime API is introduced.
