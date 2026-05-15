---
paths:
  - "src/app/**/*.{ts,tsx}"
  - "src/components/**/*.{ts,tsx}"
  - "src/lib/cache/**"
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
- Locale routes live under `/[locale]` for runtime locales `en`, `es`, and
  `zh`; public SEO surfaces expose `en` and `es` only.
- Keep layouts and non-interactive sections as Server Components.
- Push `"use client"` down to interactive leaf components.

## Error boundaries

Use route-level `error.tsx` for buyer-facing flows that depend on dynamic data,
form/runtime services, or route parameters. Current examples: `contact` and
`products`.

Static MDX/legal/about pages can rely on layout/global fallback until they gain
external fetches, user actions, or dynamic route params.

## Cache

- Use `React.cache()` for request-level dedupe only.
- Non-conversion pages may use a narrow `"use cache"` + `cacheLife()` boundary
  when Next.js build behavior needs it.
- Do not add runtime tag invalidation in production code; see
  `cloudflare.md`.
- Reserve `*Cached` suffix for exported helpers that actually define a cache
  boundary.

## Route deletion checklist

When removing a route:

1. Delete the route directory under `src/app/[locale]/`.
2. Remove path/config entries.
3. Remove sitemap generation for the route.
4. Remove navigation links.
5. Remove param helpers.
6. Remove or update tests.
7. Run `pnpm type-check`.
