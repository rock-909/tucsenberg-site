# Middleware Locale Patch Retirement Design

## Goal

Continue slimming `src/middleware.ts` by retiring custom locale-routing patches that are not essential starter defaults, while preserving next-intl routing and hardened locale-cookie behavior.

## Current remaining custom responsibilities

| Responsibility | Current location | Decision |
| --- | --- | --- |
| next-intl routing | `src/middleware.ts` | Keep. This is the middleware core. |
| Static matcher exclusions | `src/middleware.ts` | Keep. Next/OpenNext require static matchers and the repo excludes API, `_next`, admin, ops, and assets. |
| `NEXT_LOCALE` httpOnly cookie hardening | `src/middleware.ts` | Keep for now. next-intl's own cookie sync does not guarantee this repo's hardened flags. |
| Remove leaked `x-middleware-set-cookie` | `src/middleware.ts` | Keep while the middleware normalizes locale cookies. |
| No-JS fallback path preservation via `?fromLocaleFallback=1` + `Referer` | `src/middleware.ts` and `src/components/layout/header-client.tsx` | Retire. It is too much custom routing logic for a starter default. No-JS fallback should link to locale root only. |
| Unsupported locale prefix redirect, e.g. `/fr/about` -> `/en/about` | `src/middleware.ts` | Retire. Let unsupported locale-like paths follow normal app routing / 404 instead of guessing intent. |
| Route-pattern parser for dynamic invalid-locale redirects | `src/middleware.ts` | Retire with unsupported locale redirect. |

## Target behavior

Middleware should become:

1. call `next-intl/middleware`;
2. derive the resolved locale from the current request path or the `location` header produced by next-intl;
3. set/normalize `NEXT_LOCALE` only when needed;
4. remove leaked `x-middleware-set-cookie`;
5. export the same static matcher.

No-JS language fallback should become simpler:

- mobile no-JS fallback links go to `/en` and `/zh`;
- current-page path preservation remains a JavaScript behavior only;
- `docs/specs/behavioral-contracts.md` should say no-JS fallback lands on locale root.

Unsupported locale prefixes should become normal not-found/routing behavior:

- `/fr/about` should not be rewritten to `/en/about` by middleware;
- `/fr/products/eu` should not be rewritten to `/en/products/eu` by middleware.

## Acceptance criteria

1. `src/middleware.ts` does not contain `fromLocaleFallback`.
2. `src/middleware.ts` does not contain route-pattern parsing helpers:
   - `getRoutingPathPatterns`
   - `matchesRoutePattern`
   - `isKnownLocalizedPath`
   - `tryHandleInvalidLocalePrefix`
3. `src/components/layout/header-client.tsx` does not emit `fromLocaleFallback`.
4. `tests/e2e/no-js-html-contract.spec.ts` expects `/en` and `/zh` fallback hrefs and locale-root navigation.
5. Middleware tests still prove:
   - `NEXT_LOCALE` cookie is hardened and set once;
   - root redirect cookie flags are normalized;
   - leaked middleware cookie headers are stripped;
   - no request override headers are injected;
   - unsupported locale prefixes fall through to next-intl instead of custom redirecting.
6. `docs/specs/behavioral-contracts.md` reflects the new no-JS behavior.

## Out of scope

- Renaming `src/middleware.ts` to `src/proxy.ts`.
- Removing locale-cookie hardening.
- Removing next-intl.
- Changing JavaScript language-switcher path preservation.

## Self-review

- No placeholders remain.
- Scope is one subsystem: retiring custom locale patches from middleware.
- The design intentionally preserves the hardened cookie seam because it is still a concrete security/UX behavior.
