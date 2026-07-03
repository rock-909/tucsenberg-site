# Full Performance Audit

Date: 2026-06-21 local / 2026-06-22 UTC
Mode: read-only source audit; proof document only
Branch: `docs/vercel-absorption-enhancement-spec`
Commit: `4d743d9e82f6ce14ca14cde4054234101bbd9aca`

## Outcome

The current starter is in a healthy performance state. The fresh 14-page mobile
Lighthouse sweep passed with no assertion results, all routes stayed under the
490 KB `total-byte-weight` warning line, TBT stayed low, and CLS was zero across
the audited surface.

There is no P1 performance defect in this baseline.

The only evidence-backed P2 candidate is the global render-blocking CSS floor:
every route loads the same 101 KB CSS transfer, and Lighthouse attributes about
604-607 ms of render-blocking delay to the generated stylesheet. This should be
handled as a focused UI-foundation/CSS split spike, not as a quick deletion.

## Scope

Audited URLs:

- `/en`, `/zh`
- `/en/about`, `/zh/about`
- `/en/contact`, `/zh/contact`
- `/en/products`, `/zh/products`
- `/en/blog`, `/zh/blog`
- `/en/products/north-america`, `/zh/products/north-america`
- `/en/blog/prepare-before-launch`, `/zh/blog/prepare-before-launch`

Non-goals:

- no source, configuration, threshold, or test changes;
- no SEO, i18n, accessibility, motion, visual, or starter replacement-surface
  regressions for a Lighthouse number;
- no broad `next/dynamic`;
- no broad `memo`, `useMemo`, or `useCallback`;
- no dependency deletion based only on Knip, analyzer, or static hints;
- no WebGPU, shader, or full-frame animation trace expansion.

Temporary raw evidence lives under `/tmp/showcase-performance-audit/` and is not
intended for commit.

## Commands and collection notes

| Step | Command | Result |
| --- | --- | --- |
| Build | `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build` | Passed. Next.js 16.2.7 Turbopack build completed; 84 static pages generated. Non-blocking notes: deprecated `middleware` convention and missing Resend API key. |
| Analyzer | `pnpm exec next experimental-analyze --output` | Passed. Output written to `.next/diagnostics/analyze`. |
| Lighthouse | `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm exec lhci autorun --config=/tmp/showcase-performance-audit/lighthouserc.port3001.js` | Passed. 14 URLs x 3 runs = 42 runs. `.lighthouseci/assertion-results.json` was `[]`. |
| React Doctor | `pnpm react:doctor:report > /tmp/showcase-performance-audit/react-doctor.json` | Passed. `ok: true`, 22 diagnostics, warnings only. |

Port fallback:

- Port `3000` was already occupied by `node` PID `23741`.
- No process was killed.
- `lighthouserc.js` was copied to
  `/tmp/showcase-performance-audit/lighthouserc.port3001.js`.
- The temporary config changed only the Lighthouse URL/start-server port from
  `3000` to `3001`.
- Page list, run count, and thresholds were not changed.

Method:

- Lighthouse numbers below use the median run from the 3-run LHCI sweep.
- Byte columns use Lighthouse network transfer data, not treemap source size.
- Old proof reports were used only as leads; this document uses fresh build,
  Lighthouse, analyzer, React Doctor, chunk, and source evidence.

## 14-page Lighthouse metrics

| Route | Score | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | Total KB | JS KB | CSS KB | Doc KB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en` | 0.91 | 1364 | 3464 | 42 | 0.000 | 1364 | 429 | 302 | 101 | 22 |
| `/zh` | 0.89 | 1371 | 3723 | 34 | 0.000 | 1371 | 430 | 302 | 101 | 24 |
| `/en/about` | 0.91 | 1370 | 3470 | 42 | 0.000 | 1370 | 427 | 302 | 101 | 21 |
| `/zh/about` | 0.91 | 1368 | 3468 | 40 | 0.000 | 1368 | 429 | 302 | 101 | 22 |
| `/en/contact` | 0.90 | 1360 | 3612 | 45 | 0.000 | 1360 | 458 | 321 | 101 | 33 |
| `/zh/contact` | 0.88 | 1359 | 3852 | 38 | 0.000 | 1359 | 461 | 321 | 101 | 35 |
| `/en/products` | 0.92 | 1359 | 3312 | 42 | 0.000 | 1359 | 430 | 307 | 101 | 19 |
| `/zh/products` | 0.89 | 1361 | 3724 | 39 | 0.000 | 1361 | 432 | 307 | 101 | 21 |
| `/en/blog` | 0.89 | 1358 | 3766 | 41 | 0.000 | 1358 | 425 | 302 | 101 | 19 |
| `/zh/blog` | 0.91 | 1360 | 3460 | 44 | 0.000 | 1360 | 426 | 302 | 101 | 20 |
| `/en/products/north-america` | 0.90 | 1357 | 3607 | 43 | 0.000 | 1357 | 453 | 319 | 101 | 27 |
| `/zh/products/north-america` | 0.88 | 1358 | 3865 | 68 | 0.000 | 1358 | 455 | 319 | 101 | 29 |
| `/en/blog/prepare-before-launch` | 0.89 | 1364 | 3717 | 41 | 0.000 | 1364 | 426 | 302 | 101 | 20 |
| `/zh/blog/prepare-before-launch` | 0.91 | 1361 | 3462 | 46 | 0.000 | 1361 | 427 | 302 | 101 | 21 |

## Route class summary

Worst route in each class is shown for score, transfer, LCP, and TBT.

| Class | Routes | Score | Total KB | JS KB | CSS KB | Doc KB | LCP ms | TBT ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | `/en`, `/zh` | 0.89 | 430 | 302 | 101 | 24 | 3723 | 42 |
| Marketing content | `/en/about`, `/zh/about`, `/en/contact`, `/zh/contact` | 0.88 | 461 | 321 | 101 | 35 | 3852 | 45 |
| Listing | `/en/products`, `/zh/products`, `/en/blog`, `/zh/blog` | 0.89 | 432 | 307 | 101 | 21 | 3766 | 44 |
| Detail | `/en/products/north-america`, `/zh/products/north-america`, `/en/blog/prepare-before-launch`, `/zh/blog/prepare-before-launch` | 0.88 | 455 | 319 | 101 | 29 | 3865 | 68 |

## Locale comparison

| Page pair | Score delta zh-en | LCP delta ms | Total delta KB | Doc delta KB | Judgment |
| --- | ---: | ---: | ---: | ---: | --- |
| Home | -0.02 | +259 | +1 | +1 | Mild variance; no payload concern. |
| About | 0.00 | -2 | +1 | +1 | Equivalent. |
| Contact | -0.02 | +241 | +2 | +2 | Mild variance; still under warning budget. |
| Products listing | -0.03 | +412 | +1 | +1 | Largest zh LCP variance, but TBT and bytes remain healthy. |
| Blog listing | +0.02 | -305 | +1 | +1 | Equivalent. |
| Product detail | -0.02 | +258 | +2 | +2 | Mild variance; no separate zh payload issue. |
| Blog detail | +0.02 | -255 | +1 | +1 | Equivalent. |

## Bundle and network summary

Global network shape:

- maximum total transfer: `/zh/contact` at 471,616 bytes, about 461 KB;
- current global warning line: 490,000 bytes;
- worst route is still about 18 KB below the warning line;
- CSS transfer is consistently about 101 KB on every route;
- JS transfer ranges from about 302 KB on common pages to about 321 KB on
  contact pages;
- document transfer ranges from about 19 KB to 35 KB;
- Lighthouse `third-party-summary` was empty on representative median reports.

Representative render-blocking resource:

| Route | Resource | Transfer bytes | Wasted ms |
| --- | --- | ---: | ---: |
| `/en` | `/_next/static/chunks/1-6pow6uq7fug.css` | 103452 | 607 |
| `/zh/contact` | `/_next/static/chunks/1-6pow6uq7fug.css` | 103452 | 604 |
| `/zh/products/north-america` | `/_next/static/chunks/1-6pow6uq7fug.css` | 103452 | 604 |

Top script transfers on representative median reports were broadly identical:

| Script | Transfer bytes | Resource bytes |
| --- | ---: | ---: |
| `/_next/static/chunks/2-__0r8u7plcr.js` | 74327 | 231706 |
| `/_next/static/chunks/0ot8dm_egt7yb.js` | 38714 | 135386 |
| `/_next/static/chunks/0nskc7_ei-in9.js` | 20437 | 83168 |
| `/_next/static/chunks/0jx0wi74lcuq0.js` | 19759 | 49979 |
| `/_next/static/chunks/43uh4inhy953t.js` | 17345 | 43542 |
| `/_next/static/chunks/0pbzaibh8kbif.js` | 15564 | 39579 |
| `/_next/static/chunks/1nz9zqdirhq33.js` | 14224 | 41795 |
| `/_next/static/chunks/2tuhe7gcw_iim.js` | 13256 | 36885 |

Largest decoded/static files from `.next/static/chunks` include:

| File | Size |
| --- | ---: |
| `.next/static/chunks/1-6pow6uq7fug.css` | 800148 bytes on disk; 103452 bytes transfer in Lighthouse |
| `.next/static/chunks/2-__0r8u7plcr.js` | 231706 bytes |
| `.next/static/chunks/0ot8dm_egt7yb.js` | 135386 bytes |
| `.next/static/chunks/0cz1d0mv5g_q7.js` | 112594 bytes |
| `.next/static/chunks/0nskc7_ei-in9.js` | 83168 bytes |

Top unused JavaScript signals on representative pages:

- `/en`: `2-__0r8u7plcr.js` had about 72 KB decoded unused bytes in the treemap,
  but Lighthouse `unused-javascript` numeric value remained far below the
  warning threshold.
- `/zh/contact`: `2-__0r8u7plcr.js` and `0ot8dm_egt7yb.js` had decoded unused
  treemap bytes, but the route still had only 38 ms TBT and stayed below the
  total-byte warning.
- `/zh/products/north-america`: same shared script shape; no unique P1/P2 JS
  blocking issue was found.

## Vercel React Best Practices attribution

| Lane | Evidence | Judgment |
| --- | --- | --- |
| `async-*` waterfalls | `src/app/[locale]/layout.tsx:43-62`, `src/lib/i18n/client-messages.ts:49-62`, `src/lib/i18n/load-messages.ts:157-172`, and `src/app/[locale]/blog/[slug]/page.tsx:95-116` use `Promise.all` for independent work. | No fresh P1/P2 server waterfall. The old blog structured-data waterfall lead is no longer current. |
| `bundle-*` shared cost | Analyzer data for `[locale]` includes `header-language-menu`, `dropdown-menu`, `floating-ui`, `client-messages`, `NextIntlClientProvider`, `navigation-progress-bar`, `motion-value`, and `Feature.mjs`; it does not include `Turnstile`. | Shared client floor exists, but Lighthouse shows low TBT and green total bytes. Treat as focused P2/P3 candidates, not a red-line problem. |
| `server-*` cache/dedupe | `src/lib/content-query/queries.ts:18-20` wraps loaders with `React.cache`; `src/lib/i18n/load-messages.ts:114-135` uses `unstable_cache`; message loads use parallel paths. | Healthy enough for this audit. No current broad server-cache repair. |
| `server-serialization` / RSC payload | `src/app/[locale]/layout.tsx:85` passes `clientMessages` to `NextIntlClientProvider`; `src/lib/i18n/client-messages.ts:13-22` includes 8 client namespaces. Fresh document transfer is still only 19-35 KB. | Real boundary to watch, but current payload evidence is mild. P3, not P1/P2. |
| `client-*` loading | Contact form loads its container on intersection at `src/components/contact/contact-form-island.tsx:50-53` and `120-150`; Turnstile is lazy/intersection/idle loaded at `src/components/forms/lazy-turnstile.tsx:43-47` and `70-104`; analyzer did not find `Turnstile` in the shared `[locale]` graph. | Contact and CAPTCHA loading are controlled. Do not change in this audit. |
| `rerender-*` | React Doctor found `prefer-module-scope-static-value` in `src/components/grid/grid-section.tsx:33`, but no route-level runtime evidence. | P3 only. No broad memoization pass. |
| `rendering-*` | Lighthouse consistently reports the global stylesheet as render-blocking; first-screen hero motion had already been moved out of the LCP path in earlier proof. | CSS floor is the main P2. Motion should not be removed mechanically. |
| `js-*` | React Doctor found `js-hoist-intl` in `src/lib/blog/format-published-date.ts:29`. | P3 micro-signal only. Do not make this the performance mainline. |

## Findings

### P1

None.

Fresh evidence does not show a blocking-script, TBT, total-byte, CLS, third-party,
or server-waterfall issue severe enough to justify P1.

### P2-1: Global render-blocking CSS floor

Evidence:

- Lighthouse render-blocking resource on representative median reports:
  `/_next/static/chunks/1-6pow6uq7fug.css`, 103452 transfer bytes,
  about 604-607 ms wasted time.
- Every audited route transfers about 101 KB CSS.
- `src/app/globals.css:1` imports Tailwind globally.
- `src/app/globals.css:6` imports `@radix-ui/themes/styles.css` globally.

Why it matters:

- It affects all 14 audited routes.
- It is the clearest repeated render-path cost in the fresh baseline.
- It is more evidence-backed than JS micro-optimizations because TBT is already
  low and total bytes are green.

Why not quick-fix:

- `src/app/globals.css:3-6` documents that Radix Themes pilot CSS is intentionally
  imported through the global CSS entry so CSS order remains reviewable.
- The project UI foundation currently treats runtime color truth and Radix pilot
  mapping as governed surfaces.
- Removing or splitting this without a focused plan risks visual, wrapper, and
  governance regressions.

Recommended action:

- Open a separate CSS/Radix split spike.
- Measure before/after with the same 14-page sweep.
- Keep the change only if render-blocking time or CSS transfer improves without
  harming UI foundation, accessibility, visual state, or replacement surfaces.

### P2-2: Header language menu import is effectively started immediately

Evidence:

- `src/components/layout/header-client.tsx:19-20` creates
  `headerLanguageMenuImport = import("@/components/layout/header-language-menu")`
  at module scope.
- `src/components/layout/header-client.tsx:145-147` catches that promise in an
  effect, so the import is already started when the client module loads.
- `src/components/layout/header-language-menu.tsx` imports Radix dropdown
  primitives through `@/components/ui/dropdown-menu`.
- Analyzer data for `[locale]` includes `header-language-menu`,
  `dropdown-menu`, and `floating-ui`.

Why it matters:

- This is a small shared bundle cleanup candidate.
- It is route-wide because the header is shared.

Why it is not urgent:

- TBT remains 34-68 ms across all pages.
- Total transfer stays below the 490 KB warning line.
- The menu has user-facing language switching behavior and accessibility
  requirements, so it should not be removed or hidden.

Recommended action:

- If starting with a low-risk fix, this is the best single candidate:
  make the language menu truly demand/hover/focus loaded, then verify header
  behavior, keyboard access, and 14-page Lighthouse.

### P3-1: Client messages are broader than strictly necessary

Evidence:

- `src/lib/i18n/client-messages.ts:13-22` sends 8 namespaces:
  `accessibility`, `apiErrors`, `contact`, `cookie`, `errors`, `language`,
  `navigation`, and `theme`.
- `src/app/[locale]/layout.tsx:85` passes `clientMessages` to
  `NextIntlClientProvider`.
- Analyzer data includes `client-messages` and `NextIntlClientProvider`.
- Fresh document transfer remains small: about 19-35 KB.

Judgment:

- This is a valid serialization boundary to watch.
- It is not causing a current route-level payload problem.
- Keep as P3 unless a future payload measurement shows document/RSC growth.

### P3-2: Shared motion/layout client floor

Evidence:

- `src/app/[locale]/layout.tsx:87-105` renders
  `LightMotionProvider`, `NavigationProgressBar`, and `PageTransition`.
- `motion/react` is used by
  `src/components/motion/page-transition.tsx`,
  `src/components/motion/light-motion-provider.tsx`,
  `src/components/motion/breathing-reveal.tsx`,
  `src/components/motion/breathing-stagger.tsx`, and
  `src/components/navigation/navigation-progress-bar.tsx`.
- Analyzer data includes `motion-value`, `Feature.mjs`, and
  `navigation-progress-bar`.
- Fresh TBT remains low, and earlier proof already removed first-screen hero
  motion from the LCP path.

Judgment:

- Do not delete motion for Lighthouse.
- Only revisit if motion scope grows or if a focused visual-performance spike
  can prove route-level gains without harming reduced-motion behavior.

### P3-3: React Doctor performance micro-signals

Fresh React Doctor output:

| Rule | Location | Judgment |
| --- | --- | --- |
| `prefer-module-scope-static-value` | `src/components/grid/grid-section.tsx:33` | Maintainability/per-render cleanup; no route-level evidence. |
| `js-hoist-intl` | `src/lib/blog/format-published-date.ts:29` | Reasonable micro-cleanup later; no route-level evidence. |

Judgment:

- These are backlog cleanup leads, not performance-engineering priorities.

## Non-findings

- No P1 blocking script issue: top scripts are shared framework/app chunks, but
  TBT is consistently low.
- No third-party blocking issue in local Lighthouse: representative reports had
  empty `third-party-summary`.
- No contact/Turnstile leakage into shared routes: analyzer did not include
  `Turnstile` in `[locale]`; contact form and Turnstile are lazy-loaded.
- No current blog article server waterfall: the current article page uses
  `Promise.all` for article and breadcrumb structured data.
- No evidence that zh locale carries a separate heavy payload: zh pages are only
  about 1-2 KB heavier in total transfer than matching en pages.
- No basis for dependency deletion from this audit.

## Recommended next fix candidate

If the next round is a repair round, start with one of these, not both:

1. **Lowest-risk code fix:** make `HeaderLanguageMenu` truly on-demand instead
   of starting the import at module load. This is a small, reversible shared
   bundle cleanup, but expected Lighthouse impact is modest.
2. **Highest evidence performance lane:** open a CSS/Radix split spike for the
   global render-blocking stylesheet. This has the stronger Lighthouse evidence,
   but it has higher UI-foundation risk and needs a careful plan.

My recommendation: start with the header language-menu import if the goal is a
safe first patch; start with the CSS/Radix spike if the goal is meaningful
performance upside.

## Do not mechanically optimize

Do not:

- add broad `next/dynamic`;
- add broad `memo`, `useMemo`, or `useCallback`;
- remove motion, SEO, i18n, accessibility, or visual expression for Lighthouse;
- delete starter reserve dependencies because a single static tool hints at it;
- turn low-priority JS micro-optimizations into the main performance lane;
- expand this into WebGPU, shader, or full-frame animation tracing.

## Raw evidence paths

- `/tmp/showcase-performance-audit/build.log`
- `/tmp/showcase-performance-audit/next-experimental-analyze.log`
- `/tmp/showcase-performance-audit/lhci.log`
- `/tmp/showcase-performance-audit/lighthouserc.port3001.js`
- `/tmp/showcase-performance-audit/lighthouse-summary.json`
- `/tmp/showcase-performance-audit/lighthouse-summary.md`
- `/tmp/showcase-performance-audit/react-doctor.json`
- `/tmp/showcase-performance-audit/react-doctor.stderr`
- `/tmp/showcase-performance-audit/lighthouseci/*`
- `.next/diagnostics/analyze`

## Public median Lighthouse reports

| URL | Report |
| --- | --- |
| `/en` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110078633-35000.report.html> |
| `/zh` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110080532-89810.report.html> |
| `/en/about` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110082234-67572.report.html> |
| `/zh/about` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110084203-9700.report.html> |
| `/en/contact` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110085767-31042.report.html> |
| `/zh/contact` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110087372-11342.report.html> |
| `/en/products` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110088980-70632.report.html> |
| `/zh/products` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110090547-32046.report.html> |
| `/en/blog` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110092220-2110.report.html> |
| `/zh/blog` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110094033-79110.report.html> |
| `/en/products/north-america` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110095612-24193.report.html> |
| `/zh/products/north-america` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110097233-56655.report.html> |
| `/en/blog/prepare-before-launch` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110098884-49212.report.html> |
| `/zh/blog/prepare-before-launch` | <https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1782110100537-23547.report.html> |
