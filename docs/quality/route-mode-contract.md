# Route Mode Contract

This document records expected route modes for the starter. It is a proof note, not a hard gate yet.

## Current policy

- `○` static routes are expected for static assets and health checks.
- `◐` Partial Prerender routes are expected for localized marketing pages that stream dynamic server content under Cache Components.
- `ƒ` dynamic routes are expected for API routes, owner access, sitemap, and catch-all routes.

## Known build warning

`DYNAMIC_SERVER_USAGE` appears during `pnpm build`. Until this is fully attributed, do not claim static/dynamic boundaries are fully closed. Record route summary after each release-facing build.

## 2026-05-09 evidence note

Fresh `pnpm build` evidence still emits `DYNAMIC_SERVER_USAGE`. The build exits
0, so this is not a compile failure, but route-mode proof remains not fully
closed. The route summary should be captured with:

```bash
pnpm route-mode:snapshot /tmp/showcase-website-starter-20260509-build.log
```

Do not report static/dynamic boundaries as fully attributed until the warning is
mapped to exact route/helper behavior or removed.

## Deferred

Do not rename `src/middleware.ts` to `src/proxy.ts`.

Next.js reports a `middleware` deprecation warning, but Cloudflare/OpenNext support is not acceptable for a blind migration in this starter.
Current decision record: `docs/website/proxy-migration-official-doc-check.md`
(`official-doc-only check`). Keep `src/middleware.ts` until a future dedicated
migration lane proves the renamed runtime entrypoint is worth the risk.
