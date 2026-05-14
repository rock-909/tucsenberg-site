---
paths:
  - "src/middleware.ts"
  - "open-next.config.ts"
  - "wrangler.jsonc"
  - "scripts/starter-checks.js"
  - "src/app/actions.ts"
  - "src/app/**/actions.ts"
  - "src/lib/actions/**"
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

- `pnpm website:build:cf` is the public Cloudflare build command.
- OpenNext worker minification stays disabled in `open-next.config.ts` until
  native build and preview have fresh proof.
- Wrangler-level minification in `wrangler.jsonc` may stay enabled; do not
  treat it as proof that OpenNext split-function minification is safe.
- Use `DEPLOYMENT_PLATFORM=cloudflare` as the canonical Cloudflare signal.
  `DEPLOY_TARGET=cloudflare` is legacy compatibility only.

## Runtime entry

Keep `src/middleware.ts` as the runtime entrypoint.

Do not rename `src/middleware.ts` to `src/proxy.ts` in this starter. Cloudflare/OpenNext support is not acceptable for a blind migration.
Next.js warns that `middleware` is deprecated, but this repo treats that as a known
platform-transition warning, not as a reason to risk the locale-routing entrypoint.
Current decision record:
`docs/website/proxy-migration-official-doc-check.md` (`official-doc-only check`).
No runtime migration test was run for that decision.

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

Browser contact submissions go through `/api/contact`. Middleware must not
inject internal client-IP headers for public form flows.

Server Action contact code is compatibility-only. It must validate internally
and fail closed when request identity is unavailable rather than relying on
middleware-provided trusted IP headers.

## Cache and runtime bindings

- Do not add `cacheTag()`, `revalidateTag()`, or `revalidatePath()` to
  production code without a new Cloudflare proof plan.
- Do not add `cacheHandlers`, `cacheHandler`, R2-backed cache, or external
  cache storage as a starter default.
- New `"use cache"` boundaries must stay narrow and explain why rebuild/redeploy
  is not enough.
- Content updates flow through rebuild/redeploy unless a future CMS integration
  proves a different path.
- `wrangler.jsonc` must not add `r2_buckets`, `d1_databases`, or
  `durable_objects` for this starter by default.
- `open-next.config.ts` must not add custom incremental cache, tag cache, or
  queue overrides by default.

If those platform pieces become real requirements later, update this file,
the related proof docs, and the matching tests in the same branch.
