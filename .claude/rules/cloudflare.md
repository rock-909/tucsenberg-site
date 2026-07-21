---
paths:
  - "src/middleware.ts"
  - "open-next.config.ts"
  - "wrangler.jsonc"
  - "scripts/starter-checks.js"
  - "src/lib/security/**"
---

# Cloudflare / OpenNext Rules

Use this file when changing Cloudflare/OpenNext build, preview, deploy,
middleware, worker config, or Cloudflare-only runtime behavior.

For generic Next.js APIs, read the installed docs under
`node_modules/next/dist/docs/`.

## Public command surface

The public story is Cloudflare/OpenNext through stable commands:

```bash
pnpm build
pnpm website:build:cf
pnpm website:build:cf && pnpm exec opennextjs-cloudflare preview --env preview
node scripts/starter-checks.js cf-preview-smoke
pnpm exec wrangler deploy --dry-run --env preview
pnpm exec opennextjs-cloudflare deploy --env production
node scripts/starter-checks.js deployed-smoke --base-url "$DEPLOYED_BASE_URL"
```

Do not introduce phase-named Cloudflare commands or private topology wrappers.
This starter uses the native OpenNext Cloudflare CLI plus Wrangler dry-run for
local deploy-artifact proof.

## Proof table

| Change touches | Minimum proof |
| --- | --- |
| Standard Next.js runtime behavior | `pnpm build` |
| Cloudflare/OpenNext build path | `pnpm build` then `pnpm website:build:cf` |
| Local Cloudflare preview behavior | `pnpm exec opennextjs-cloudflare preview --env preview` + `node scripts/starter-checks.js cf-preview-smoke` |
| Cloudflare deploy-artifact proof | `pnpm exec wrangler deploy --dry-run --env preview` after `pnpm website:build:cf` |
| Deployed Cloudflare behavior | `node scripts/starter-checks.js deployed-smoke --base-url <url>` |
| Public submission routes or compatibility actions | related route/action/IP tests + `pnpm build` + `pnpm website:build:cf` |

Never run `pnpm build` and `pnpm website:build:cf` in parallel. They both write to
`.next`.

## Build ownership

- `pnpm website:build:cf` is the public Cloudflare build command. It minifies
  the production worker by default (owner 2026-07-12 decision): `--noMinify` is
  an OpenNext CPU-profiling debug aid, not a production default, and shipping it
  bloated the worker toward the free-tier limit.
- `pnpm website:build:cf:debug` retains the `--noMinify` unminified variant for
  CPU profiling only. Do not point the deploy chain at it.
- The `open-next.config.ts` aws-layer `default.minify` flag is a separate,
  build-and-preview-gated setting. The shipped Cloudflare worker minification is
  driven by the build command above, not by that lower-layer flag.
- Wrangler-level minification in `wrangler.jsonc` may stay enabled; do not
  treat it as proof that OpenNext split-function minification is safe.
- Use `DEPLOYMENT_PLATFORM=cloudflare` as the canonical Cloudflare signal.
  `DEPLOY_TARGET=cloudflare` is legacy compatibility only.

## Runtime entry

Keep `src/middleware.ts` as the runtime entrypoint.

Do not introduce `src/proxy.ts` in this starter. <!-- truth-docs:allow-missing -->
Cloudflare/OpenNext support is not acceptable for a blind migration.
Next.js warns that `middleware` is deprecated, but this repo treats that as a known
platform-transition warning, not as a reason to risk the locale-routing entrypoint.
Current decision record:
`docs/项目基础/技术栈.md` (`official-doc-only check`).
No runtime migration test was run for that decision.

For reference only (the migration itself stays shelved): next-intl 4.x official
docs already use `proxy.ts` with the same API surface, and Next.js ships a
codemod `npx @next/codemod@canary middleware-to-proxy .` for the rename. The
natural trigger to revisit this proof lane is the next `@opennextjs/cloudflare`
upgrade — evaluate the migration then, not as ad-hoc cleanup.

The matcher must remain static string literals.

If a future branch revisits the migration, it must be a dedicated proof lane
with at least:

```bash
pnpm build
pnpm website:build:cf
node scripts/starter-checks.js cf-preview-smoke
```

If a deployed preview URL exists, also run:

```bash
node scripts/starter-checks.js deployed-smoke --base-url "$DEPLOYED_BASE_URL"
```

## Public submission identity

Browser lead submissions go through the `/api/inquiry` route handler only.
Middleware must not inject internal client-IP headers for public form flows.

There is no live `'use server'` Server Action contact path. Any server-side
submission code must validate internally and fail closed when request identity
is unavailable rather than relying on middleware-provided trusted IP headers.

## Cache and runtime bindings

- Do not add `cacheTag()`, `revalidateTag()`, `revalidatePath()`, or
  `updateTag()` to production code without a new Cloudflare proof plan.
- Do not add `cacheHandlers`, `cacheHandler`, R2-backed cache, or external
  cache storage as a starter default.
- `unstable_cache` on the Cloudflare/OpenNext runtime behaves as no-cache: the
  runtime's dummy cache throws an `IgnorableError`, so nothing is stored. Any
  new `unstable_cache` use must either carry an explicit bypass rationale or
  come with Cloudflare proof that it actually caches.
- The runtime uses `cacheComponents: false`, so PPR is inactive. The flag was
  disabled because the bound OpenNext/Workerd path hung under concurrent
  requests. Do not add production `"use cache"` boundaries until that runtime
  path has fresh concurrency proof.
- Content updates flow through rebuild/redeploy unless a future CMS integration
  proves a different path.
- On incremental cache choice: OpenNext's official SSG recommendation is
  `staticAssetsIncrementalCache` (served from Workers Static Assets, zero extra
  cost on the free tier). This site deliberately uses the `dummy` incremental
  cache instead, accepting rebuild-to-update as the content-refresh path so that
  no KV/R2/D1 binding is required. Revisit only if content must update without a
  redeploy. OpenNext's `enableCacheInterception` is incompatible with PPR;
  neither feature is enabled now. Reassess them together if Cache Components are
  re-enabled later.
- `wrangler.jsonc` must not add `kv_namespaces`, `r2_buckets`, `d1_databases`,
  or `durable_objects` for this starter by default. Older OpenNext setups wired
  KV as the incremental cache store; this repo intentionally omits it.
- `open-next.config.ts` must not add custom incremental cache, tag cache, or
  queue overrides by default.

If those platform pieces become real requirements later, update this file,
the related proof docs, and the matching tests in the same branch.
