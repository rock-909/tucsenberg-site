# Nonce CSP feasibility

Decision: do not implement nonce CSP now.

This lane records the current feasibility decision for stricter CSP. It is a proof and decision lane, not an implementation lane.

No middleware/proxy migration test in this lane. The owner explicitly deferred `middleware.ts -> proxy.ts`, so this document does not prove proxy runtime behavior.

Current default remains static-compatible CSP:

- `NEXT_PUBLIC_SECURITY_MODE=strict` emits enforced security headers.
- `script-src` stays strict in production and does not allow generic `'unsafe-inline'`.
- `script-src-elem` keeps the static App Router/RSC inline bootstrap allowance.
- `script-src-attr 'none'` keeps inline event handlers blocked.
- The policy does not emit `'nonce-*'` directives.

## Why nonce CSP is not the default

Installed Next.js documentation says nonce CSP needs a proxy-generated nonce before rendering and therefore requires dynamic rendering. That changes the current site trade-off:

- Static optimization and CDN caching assumptions change.
- Cache Components behavior must be re-proven.
- Partial prerendering-style static shells cannot be treated as already compatible.
- Cloudflare/OpenNext output must be verified again, not assumed from a normal build.
- Turnstile, analytics, and any `next/script` usage must be checked with nonce propagation.

The current Tucsenberg site baseline should not pay this runtime and proof cost until a concrete security requirement justifies it.

## Minimum proof before future implementation

Any future nonce CSP implementation must first prove all of these, in a separate branch or workstream:

1. **Next.js rendering proof**
   - Show which routes become dynamic rendering.
   - Record whether normal page routes, 404 routes, and product routes still behave correctly.
   - Prove Cache Components behavior is still acceptable.

2. **Nonce transport proof**
   - Generate a proxy-generated nonce per request.
   - Confirm the CSP request/response headers carry the same nonce.
   - Confirm rendered framework scripts and any managed scripts receive the nonce.

3. **Cloudflare/OpenNext proof**
   - Run `pnpm build`.
   - Run `pnpm website:build:cf`.
   - Run Cloudflare/OpenNext preview or deployed checks in the approved environment.
   - Do not treat a local Next.js build as enough Cloudflare/OpenNext proof.

4. **Browser behavior proof**
   - Run navigation smoke.
   - Run contact form local smoke.
   - Confirm client islands hydrate.
   - Confirm Turnstile loads and form controls do not stay on the static fallback.

5. **Third-party script proof**
   - Check Turnstile.
   - Check analytics.
   - Check any future `next/script` usage.

6. **Launch proof labels**
   - Local browser checks stay `local/test-mode`.
   - Deployed reachability checks stay `deployed-smoke`.
   - Any external service proof must still be a separate `real-service-canary`.

7. **Rollback plan**
   - Keep the current static-compatible CSP as the rollback plan.
   - Make the nonce lane reversible without changing product/content replacement surfaces.
   - Do not mix nonce CSP with unrelated security cleanup.

## Non-goals for this lane

- Do not rename `src/middleware.ts` to `src/proxy.ts`.
- Do not add nonce helpers to `src/config/security.ts`.
- Do not add `x-nonce` request headers.
- Do not force dynamic rendering.
- Do not remove the production `script-src-elem 'unsafe-inline'` allowance without browser proof.
- Do not run deployed-smoke or real-service-canary unless a target environment is explicitly approved.

## Current recommended status

Keep the default static-compatible CSP, monitor CSP reports, and revisit nonce CSP only when Tucsenberg has a concrete compliance or sensitive-data requirement.
