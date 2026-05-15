# Proxy migration official-doc check

This is an official-doc-only check for the `middleware.ts` to `proxy.ts`
question. It is not a runtime migration proof.

Decision: do not migrate middleware.ts to proxy.ts now.

No runtime migration test in this lane. `src/middleware.ts remains the runtime entrypoint`.
`src/proxy.ts is not created`.

## Official docs checked

Installed Next.js docs are the source used for this check:

- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/runtime.md`
- `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`

## What the docs prove

- Next.js 16 calls the old Middleware convention Proxy, and the recommended file
  convention is now `proxy.ts`.
- Proxy runs before routes render and can rewrite, redirect, mutate headers, or
  return a response.
- Proxy should use static matcher values so Next.js can analyze the matcher at
  build time.
- Proxy defaults to the Node.js runtime.
- The `runtime` config option cannot be used in Proxy files.
- `runtime = "edge"` is not supported for Cache Components.
- Nonce CSP examples use a proxy-generated nonce and require dynamic rendering.

## Current site context

This site currently has:

- Next.js 16 Cache Components enabled in `next.config.ts`.
- Cloudflare/OpenNext as the supported deployment path.
- A thin `src/middleware.ts` that only delegates locale routing to
  `next-intl/middleware`.
- A confirmed CSP decision to keep static-compatible CSP rather than nonce CSP.

The docs are enough to say this is not a harmless warning cleanup. A blind rename
would touch the request entrypoint while the project still has Cache Components,
Cloudflare/OpenNext, i18n routing, and CSP trade-offs to preserve.

## Decision

Keep `src/middleware.ts` for now.

Do not create `src/proxy.ts` just to silence the framework deprecation warning.
Treat the warning as a known platform-transition warning.

If Tucsenberg later decides to actually migrate, that future branch must be a
separate migration lane. It should not be bundled with CSP, i18n, Cloudflare, or
cleanup work.

## Non-goals

- Do not rename `src/middleware.ts`.
- Do not create `src/proxy.ts`.
- Do not change the matcher.
- Do not add nonce CSP.
- Do not add `x-nonce` request headers.
- Do not run proxy runtime migration tests in this lane.
- Do not run Cloudflare preview, deployed-smoke, or real-service-canary for this
  decision.
- Do not run a migration codemod.
