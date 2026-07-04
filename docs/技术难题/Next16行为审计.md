# Next.js 16 Activity State Audit

Historical starter proof. This file records a pre-Tucsenberg shared-navigation
lane. This file is not current Tucsenberg launch proof.

## Scope

This audit checks the practical risk behind the common Next.js App Router pitfall:

- broad Client Component spread
- client-side data loading in `useEffect`
- over-globalized state
- route state leaking across navigation after `cacheComponents` enables React Activity preservation

The focus of this proof is the last item. This starter already uses Next.js 16
App Router with `cacheComponents: true`, so route state reset behavior must be
proved with current code and fresh browser evidence.

## Current repo facts

### 1. `cacheComponents` is enabled

- `next.config.ts` sets `cacheComponents: true`.
- That means client-side navigation may preserve hidden route state instead of
  always unmounting the previous route tree.

### 2. The layout still keeps most page structure on the server

- `src/app/[locale]/layout.tsx` loads translations and client messages on the
  server, then renders client islands only for shared interactive surfaces such
  as theme, motion, progress, attribution, and cookie consent.
- `src/components/layout/header.tsx` is still a server header shell. Desktop
  language switching and mobile menu behavior are pushed down into client
  islands instead of converting the whole header into a Client Component.

### 3. The repo already has narrow state-reset guards

#### Mobile menu

- `src/components/layout/mobile-navigation-interactive.tsx` stores both
  `pathname` and menu state.
- Open state is derived from `menuState.pathname === pathname &&
  menuState.isOpen`.
- Result: if the component instance survives navigation, the old open state does
  not automatically remain open on the new pathname.

#### Mobile language expander

- The same file stores `isLanguageExpanded` inside the menu state.
- Navigation closes the sheet through `onNavigate`, and reopening on a different
  route starts from the current pathname-derived menu state.

#### Desktop language menu

- `src/components/layout/header-language-menu.tsx` owns its own `isOpen` state.
- Clicking a language item explicitly calls `setIsOpen(false)`.
- Route pathname changes now also close the menu and refresh locale links from
  the real browser pathname.
- The lazy loader in `src/components/layout/header-client.tsx` gates the
  language menu behind user activation. It now records the pathname where the
  activation happened, so a lazy-load race cannot open the menu on a later
  route after the user has already navigated away.

## What was audited against the Reddit-style pitfalls

### A. Server / Client boundary

Verdict: mostly clean.

- App pages and layout remain server-first.
- Interactive leaf behavior stays in small client islands.
- Client-boundary governance is explicitly tracked in
  `docs/技术难题/客户端边界预算.json`.

### B. `useEffect` data fetching for page content

Verdict: not present as a page-data pattern.

- No evidence of homepage or route content loading through `useEffect`.
- The obvious client `fetch("/api/contact")` path is form submission behavior,
  not page data fetching.

### C. Over-globalized state

Verdict: not a current repo problem.

- No Redux/Zustand-style app-wide state layer is present.
- Shared state is limited to bounded cases such as cookie consent and UTM
  attribution.

### D. Activity state preservation risk

Verdict: real framework-level risk. This run found two concrete leaks and fixed
them with narrow state guards.

This is the part that needed explicit verification because static code review
alone cannot prove that preserved route trees behave correctly after navigation.

## Findings from this run

### Fixed: desktop language menu could stay open after route navigation

The first two desktop tests exposed a real leak:

- If the user activated the lazy desktop language island and navigated quickly,
  the deferred `HeaderLanguageMenu` could mount on `/en/about` with stale
  `initialOpen=true`.
- Once mounted, the menu also needed a route-pathname guard so preserved client
  state closes on future route changes.

Fix:

- `LanguageToggleIsland` stores the pathname that triggered activation and only
  passes `initialOpen=true` when that activation still belongs to the current
  route.
- `HeaderLanguageMenu` listens to `next/navigation` `usePathname()` and closes
  when the browser route pathname changes.

### Fixed: same-page hash navigation could show route progress

The hash test exposed a real progress-bar false positive:

- A same-page `#main-content` jump can emit browser history activity without a
  route change.
- `NavigationProgressBar` already ignored hash-only link clicks, but its
  `popstate` branch started progress unconditionally.

Fix:

- Link classification now treats same pathname + same search as same-page,
  regardless of hash.
- The `popstate` branch stores a route key of `pathname + search` and ignores
  hash-only history changes.

## Fresh proof added in this run

Chromium Playwright tests were added to `tests/e2e/navigation.spec.ts`:

1. `should reset desktop language menu state after navigation`
2. `should keep desktop language menu closed across back and forward`
3. `should keep language switcher closed after locale switch and browser back`
4. `should reset mobile menu language expander after navigation`
5. `should keep mobile menu closed across browser back and forward`
6. `should not show navigation progress for same-page hash links`

These tests prove:

- opening the desktop language dropdown does not leave it open after navigating
  to `/en/about`
- a lazy-load race does not reopen the desktop language dropdown on the next
  route
- desktop language menu state stays closed across browser back/forward
- locale switching closes the desktop language menu and browser back does not
  reopen it
- opening the mobile sheet, expanding the language row, and then navigating to
  `/en/about` does not keep that language row expanded when the sheet is opened
  again on the new route
- mobile sheet state stays closed across browser back/forward
- same-page hash links do not show the route navigation progress bar

## Commands run

```bash
pnpm exec vitest run src/components/layout/__tests__/header-client.test.tsx src/components/layout/__tests__/header-language-menu.test.tsx src/components/navigation/__tests__/navigation-progress-bar.test.tsx --reporter=verbose
pnpm exec playwright test tests/e2e/navigation.spec.ts --project=chromium --grep "keep desktop language menu closed|same-page hash links"
pnpm exec vitest run src/components/layout/__tests__/header-client.test.tsx src/components/layout/__tests__/header-language-menu.test.tsx src/components/navigation/__tests__/navigation-progress-bar.test.tsx src/lib/cookie-consent/__tests__/context.test.tsx tests/architecture/homepage-lcp-motion-boundary.test.ts
pnpm react:doctor
pnpm exec playwright test tests/e2e/navigation.spec.ts --project=chromium
```

## Outcome

- Implementation changes were required and applied.
- Current focused and full navigation proof is green for the concrete bugs found
  in this lane.
- React Doctor changed-file gate reports no issues.
- Remaining risk is not “these controls are still broken now”, but “future
  shared client islands could add new preserved-state surfaces without
  equivalent route-level proof”.
