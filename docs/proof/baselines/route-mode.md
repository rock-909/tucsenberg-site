# Route Mode Baseline

This is a proof note, not a hard gate.

## Expected shape

- `○` static: static assets and health checks.
- `◐` Partial Prerender: localized marketing pages under Cache Components.
- `ƒ` dynamic: API routes, owner access, sitemap, and catch-all routes.

## Known warning

`pnpm build` may emit non-blocking `DYNAMIC_SERVER_USAGE` logs. Do not claim route-mode boundaries are fully attributed until the warning is mapped or gone.

When investigating route mode drift, read the current `pnpm build` route
summary directly from the build log.

Do not rename `src/middleware.ts` to `src/proxy.ts` just to silence a framework warning. Cloudflare/OpenNext support is not acceptable for a blind migration. Proxy migration is a separate runtime lane; see `../../ref/tech.md`.
