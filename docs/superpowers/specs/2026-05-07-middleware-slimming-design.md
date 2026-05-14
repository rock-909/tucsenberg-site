# Middleware Slimming Design

## Goal

Shrink `src/middleware.ts` to request-routing work only, without breaking the starter's documented locale, cookie, and Cloudflare behavior.

## Current responsibilities

| Responsibility | Current location | Decision |
| --- | --- | --- |
| next-intl locale routing | `src/middleware.ts` | Keep. This is the core middleware job. |
| Static matcher exclusions for API, admin, ops, assets | `src/middleware.ts` | Keep. Matcher must remain static for Next/OpenNext. |
| Invalid locale prefix redirect, e.g. `/fr/about` -> `/en/about` | `src/middleware.ts` | Keep for now. Current tests and user-facing behavior rely on it. |
| No-JS locale fallback path preservation | `src/middleware.ts` | Keep. `docs/specs/behavioral-contracts.md` documents this behavior. |
| `NEXT_LOCALE` httpOnly cookie normalization | `src/middleware.ts` | Keep while next-intl does not guarantee the same hardened cookie attributes. |
| Removing leaked `x-middleware-set-cookie` | `src/middleware.ts` | Keep while middleware updates locale cookies. |
| CSP and generic security headers | `src/middleware.ts` plus `next.config.ts` | Move fully to `next.config.ts` native `headers()` config. |
| Per-request CSP nonce generation | `src/middleware.ts` / `src/config/security.ts` | Remove from the active runtime path. Current App Router/static output already needs `script-src-elem 'unsafe-inline'`, so the nonce is misleading as a middleware responsibility. |
| Rename `middleware.ts` to `proxy.ts` | Not active | Do not do in this branch. `.claude/rules/cloudflare.md` requires a dedicated Cloudflare proof branch first. |

## Target behavior

The middleware should still:

- call `next-intl/middleware`;
- keep the existing static matcher:
  - `/`
  - `/((?!api|_next|admin|ops|.*\\..*).*)`
- redirect invalid locale prefixes for known routes to the default locale;
- preserve the current path for no-JS language fallback only when a same-origin `Referer` exists;
- update `NEXT_LOCALE` with `httpOnly`, `sameSite=lax`, `secure` in secure app envs, and configured `maxAge`;
- strip `x-middleware-set-cookie`;
- not inject request override headers such as `x-middleware-request-x-nonce` or `x-middleware-override-headers`.

Security headers should instead be emitted by Next.js native `headers()` in `next.config.ts`:

- `getSecurityHeaders()` should return the full security header set, including CSP;
- `next.config.ts` should not filter out `Content-Security-Policy` or `Content-Security-Policy-Report-Only`;
- CSP remains static and environment-derived, without per-request nonce values.

## Acceptance criteria

1. `src/middleware.ts` has no import from `@/config/security`.
2. `src/middleware.ts` has no `generateNonce`, `getSecurityHeaders`, `Content-Security-Policy`, or nonce header responsibility.
3. `src/config/security.ts` no longer exports nonce helpers as active starter runtime API.
4. `next.config.ts` applies `getSecurityHeaders()` directly through native `headers()`.
5. Existing middleware behavior tests still pass:
   - locale cookie security flags;
   - invalid locale redirects;
   - dynamic invalid locale redirects;
   - no-JS fallback same-origin behavior;
   - cross-origin/missing referer fall-through;
   - matcher exclusions;
   - no leaked `x-middleware-set-cookie`;
   - no request override headers.
6. Security config tests prove static CSP still contains required directives and external domains.
7. Docs no longer describe middleware as owning CSP nonce/security headers.

## Out of scope

- Retiring no-JS locale fallback.
- Retiring invalid locale prefix redirects.
- Renaming `src/middleware.ts` to `src/proxy.ts`.
- Removing Storybook, component governance, API route helpers, or other starter capabilities.

## Self-review

- No placeholder sections remain.
- The scope is one subsystem: middleware responsibility slimming.
- The design deliberately rejects a destructive "next-intl only at any cost" cut because it would break documented locale behavior.
- The main responsibility removal is CSP/security headers, because Next.js has a native `headers()` mechanism and this repo already uses it for the non-CSP security headers.
