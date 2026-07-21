---
paths:
  - "src/app/**/*.{ts,tsx}"
  - "src/components/**/*.{ts,tsx}"
  - "src/lib/content/**"
  - "src/middleware.ts"
  - "next.config.ts"
---

# Next.js Runtime Rules

Read the installed Next.js docs under `node_modules/next/dist/docs/` before
changing routes, layouts, metadata, images, fonts, caching, Server Components,
middleware/proxy behavior, or Next config.

## App Router

- This repo uses Next.js 16 App Router.
- Page/layout `params` and `searchParams` use the installed async request API
  shape.
- Locale routes live under `/[locale]`; the current configured public locale is
  `en` only. Add future languages through `LOCALES_CONFIG`, not scattered
  route/header literals.
- Keep layouts and non-interactive sections as Server Components.
- Push `"use client"` down to interactive leaf components.

## Client boundaries and lazy loading

- Keep static marketing sections, page copy, proof sections, product narrative,
  and footers as Server Components by default.
- Push `"use client"` to the smallest interactive leaf. Do not make a whole
  section a Client Component only for minor animation or convenience.
- Use lazy loading for Client Components or browser-only libraries only when the
  delayed code is heavy, non-critical for first render, and not needed to
  understand the page.
- Do not add broad `next/dynamic` or `React.lazy()` wrappers as a default
  performance tactic.
- Before changing lazy-loading behavior, read the installed Next.js docs for the
  relevant API under `node_modules/next/dist/docs/`.

## Preserved route state

Shared Client Components under layouts, headers, navigation, progress bars,
cookie/attribution islands, or other persistent shells must not assume they
unmount on App Router navigation.

When a shared client island owns open, pending, expanded, selected, or progress
state:

- tie the state to the route identity when it should reset after navigation;
- derive closed or inactive state during render when possible instead of
  copying it through `useEffect`;
- use the real browser pathname from `next/navigation` when route identity
  matters;
- treat same pathname plus same search as the same route for route-progress UI;
- do not treat hash-only changes as route navigation.

For lazy client islands opened by user intent, do not pass stale `initialOpen`
or pending state after navigation. Store the pathname where activation happened
and only auto-open when the current pathname still matches.

## Error boundaries

Use route-level `error.tsx` for buyer-facing flows that depend on dynamic data,
form/runtime services, or route parameters. Current examples: `contact` and
`products`.

Static MDX/legal/about pages can rely on layout/global fallback until they gain
external fetches, user actions, or dynamic route params.

## Cache

- Use `React.cache()` for request-level dedupe only.
- The runtime uses `cacheComponents: false`, so do not add production
  `"use cache"` or `cacheLife()` boundaries without the Cloudflare/OpenNext
  concurrency proof required by `cloudflare.md`.
- Do not add runtime tag invalidation in production code; see
  `cloudflare.md`.
- Reserve `*Cached` suffix for exported helpers that actually define a cache
  boundary.
- Do not add new `unstable_cache` usage. If Cache Components are proved safe and
  re-enabled later, the installed docs
  (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/unstable_cache.md`)
  state: "This API has been replaced by `use cache` in Next.js 16." Prefer a
  narrow `"use cache"` boundary in that future lane.
- If Cache Components are re-enabled, do not place an empty or near-empty
  `<Suspense>` fallback at the body level of `[locale]/layout.tsx`. It can
  silently drop the whole site's static shell with no build error.

## Known dependency debt

- `eslint-plugin-import` 2.32.0 is a direct pinned devDependency and is also
  consumed by `eslint-config-next`. Its `peerDependencies` cap at ESLint `^9`,
  and it runs through the `@eslint/compat` bridge via `fixupConfigRules` (the
  official method for using older-style plugins under flat config). Do not treat
  it as transitive-only or forbid pinning without confirming the bridge still
  holds and that `eslint-config-next` has not moved to a different import plugin.

## Route deletion checklist

When removing a route:

1. Delete the route directory under `src/app/[locale]/`.
2. Remove path/config entries.
3. Remove sitemap generation for the route.
4. Remove navigation links.
5. Remove param helpers.
6. Remove or update tests.
7. Run `pnpm type-check`.
