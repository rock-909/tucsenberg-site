# Original Plan Delta Closure Design

## Context

This wave continues the current `showcase-website-starter` reset against the two external reports in `/Users/Data/Downloads/`.

The external remediation plan was written for a finished `tianze-website` brochure site. This repository is now explicitly a reusable `showcase-website-starter`, so the implementation must keep reusable starter capabilities:

- `docs/website/**`
- `.claude/skills/**` and `.codex/skills/**`
- Storybook and component governance
- Cloudflare/OpenNext workflow
- starter-facing commands such as `brand:check`, `content:check`, `component:check`, `website:check`, and `website:build:cf`

## Goal

Close the remaining practical differences from the external remediation plan without deleting starter capabilities.

## Acceptance Criteria

1. API lead routes no longer depend on `src/lib/api/lead-route-response.ts`.
2. Contact submission no longer depends on `src/lib/contact-form-error-utils.ts`.
3. Middleware no longer performs manual locale cookie rewriting or leaked middleware cookie cleanup; `next-intl` remains the only behavior owner in `src/middleware.ts`.
4. Non-starter test residue is removed from active coverage: Semgrep fixtures/rules, visual regression snapshots/specs, Firefox diagnosis, bbox layout E2E, and performance E2E.
5. Remaining derivative/equipment test branches are removed from active E2E.
6. CSP is tightened as far as is safe without reintroducing nonce/proxy complexity:
   - keep production `script-src` without generic `'unsafe-inline'`;
   - keep production `script-src-elem 'unsafe-inline'` only as the static App Router/RSC bootstrap allowance after release smoke proved strict script-element CSP breaks hydration;
   - add `script-src-attr 'none'` so inline event handlers remain blocked;
   - keep documented style inline allowances because the app still uses static CSP and framework/runtime style attributes.
7. Root layout no longer loads complete messages just to build the client provider payload. It loads only client-visible namespaces for `NextIntlClientProvider`.
8. Verification remains proportional and evidence-based. Do not claim full deployment/canary proof without deployed credentials and URL.

## Non-Goals

- Do not remove Storybook.
- Do not remove component governance.
- Do not remove `.claude/skills/**` or `.codex/skills/**`.
- Do not remove `docs/website/**`.
- Do not rename `src/middleware.ts` to `src/proxy.ts` in this wave. Installed Next.js 16 docs say `proxy` does not support Edge runtime; that migration needs separate Cloudflare/OpenNext proof.
- Do not attempt Cloudflare image optimization in this wave. `images.unoptimized` is a separate deployment/platform decision.

## Design

### API route helper slimming

Inline the tiny lead response helpers into `inquiry` and `subscribe` routes. Keep generic helpers that still provide starter value:

- keep `safeParseJson`;
- keep `withRateLimit`;
- keep `api-response`;
- keep CORS helpers for now because the starter exposes configurable allowed origins.

The removed helper file should be guarded by `tests/architecture/lib-facade-boundary.test.ts`.

### Contact error helper slimming

Move `mapZodIssueToErrorKey` into `src/lib/contact/submit-canonical-contact.ts`, because it is only used by the canonical contact submission path. Delete the old root helper file.

### Middleware final slimming

Make middleware a thin next-intl adapter:

```ts
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}
```

Keep the matcher. Update tests so they prove no security/CSP/health/header/cookie logic remains in middleware.

### Test residue cleanup

Remove active test files that are not starter proof:

- `tests/semgrep/**`
- `tests/e2e/__snapshots__/**`
- `tests/e2e/firefox-diagnosis.spec.ts`
- `tests/e2e/header-layout.bbox.spec.ts`
- `tests/e2e/performance.spec.ts`
- `tests/e2e/visual-cross-browser.spec.ts`
- `tests/e2e/visual-regression.spec.ts`

Keep architecture tests that enforce starter boundaries and component governance.

### CSP tightening

Next.js docs show static CSP via `next.config` can use inline allowances when nonce-based dynamic rendering is not required. This starter should not reintroduce nonce/proxy complexity in this wave. Runtime release smoke proved strict `script-src-elem` blocks the App Router/RSC inline bootstrap payload and prevents hydration. Keep the script-element allowance as an intentional static CSP compromise, block inline event handlers with `script-src-attr 'none'`, and keep style inline allowances until visual/runtime proof supports a stricter style policy.

### i18n provider narrowing

Add a loader for client message namespaces and use it in root layout. The request config can still use complete messages for server-side next-intl. The layout no longer needs to merge complete critical/deferred dictionaries just to immediately filter them.

## Verification Plan

Run focused tests first:

```bash
pnpm exec vitest run tests/architecture/lib-facade-boundary.test.ts tests/architecture/middleware-boundary.test.ts tests/architecture/env-boundary.test.ts
pnpm exec vitest run src/__tests__/middleware-locale-cookie.test.ts tests/unit/middleware.test.ts
pnpm exec vitest run src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts src/app/api/contact/__tests__/route.test.ts
pnpm exec vitest run src/config/__tests__/security.test.ts tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/current-truth-docs.test.ts
```

Then run broader proof if focused checks pass:

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
pnpm website:build:cf
```
