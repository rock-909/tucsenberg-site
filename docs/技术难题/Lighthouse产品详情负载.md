# Lighthouse Product Detail Payload Proof

Historical starter proof. This file is not current Tucsenberg launch proof; see
`../项目基础/上线验证.md`, `../项目基础/发布验证.md`, and `../README.md` for the current boundary.

Date: 2026-05-24
Branch: `perf/lighthouse-product-detail-payload`

## Decision

Keep the product-detail prefetch-policy change, but do not close the zero-yellow
goal yet.

The change worked on the measured RSC problem: product-detail
`text/x-component` / `_rsc=` transfer dropped to **0 bytes** on both audited
product-detail routes.

It did not clear all `total-byte-weight` warnings. The fresh fourteen-page
Lighthouse run now has four warning-level routes:

- `/en/contact`
- `/zh/contact`
- `/en/products/north-america`
- `/zh/products/north-america`

The next lane should target a shared transfer source, not more product-detail
prefetch. The current evidence points to font/system-font strategy or another
similarly broad shared payload reduction. Contact has no RSC requests, so it
cannot be fixed by product-detail prefetch policy.

## What changed

Production changes were intentionally narrow:

- product-detail breadcrumb Home and Products links opt out of automatic
  prefetch;
- product-detail family inquiry links keep their `/contact?...` destinations
  and query context, but opt out of automatic prefetch;
- product-detail bottom CTA keeps `/contact`, but opts out of automatic
  prefetch;
- existing component defaults remain unchanged for other callsites.

No business content, CTA destination, query parameter, Lighthouse threshold,
Radix surface, or starter profile was changed.

## Before baseline

Before data comes from `docs/技术难题/Lighthouse预取策略.md`
after PR #69.

| URL | Before total | Before JS | Before CSS | Before Font | Before Document | Before Other | Before RSC | Before over |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en/contact` | 475517 | 296392 | 103246 | 43264 | 30989 | 1626 | 0 | 0 |
| `/zh/contact` | 478053 | 296392 | 103246 | 43264 | 33525 | 1626 | 0 | 0 |
| `/en/products/north-america` | 540228 | 307029 | 103246 | 66244 | 26114 | 34087 | 32461 | 50228 |
| `/zh/products/north-america` | 543780 | 307029 | 103246 | 66244 | 27648 | 36105 | 34479 | 53780 |

## After Lighthouse run

Command:

```bash
CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse
```

Batch:

```text
14 URLs
42 runs
Fetch range: 2026-05-24T13:03:39.260Z -> 2026-05-24T13:09:56.084Z
```

The run completed. LHCI report upload had one transient TLS warning while
fetching the previous public urlMap, then all median report uploads completed.
The assertion processing and autorun completed successfully.

All byte values below are Lighthouse transfer-size metrics from
`total-byte-weight`, `resource-summary`, and `network-requests`. They are not
treemap `resourceBytes`.

| URL | Total | JS | CSS | Font | Image | Document | Other | RSC | LCP ms | Over 490KB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en` | 475220 | 299621 | 106090 | 44686 | 0 | 21775 | 3048 | 0 | 4011 | 0 |
| `/en/about` | 477493 | 301728 | 106090 | 44686 | 0 | 21941 | 3048 | 0 | 3611 | 0 |
| `/en/blog` | 465216 | 293824 | 106090 | 44686 | 0 | 17568 | 3048 | 0 | 3608 | 0 |
| `/en/blog/prepare-before-launch` | 465311 | 293824 | 106090 | 44686 | 0 | 17663 | 3048 | 0 | 3706 | 0 |
| `/en/contact` | 518167 | 331935 | 106090 | 44686 | 0 | 32408 | 3048 | 0 | 3607 | 28167 |
| `/en/products` | 474409 | 301243 | 106090 | 44686 | 0 | 19342 | 3048 | 0 | 3760 | 0 |
| `/en/products/north-america` | 525710 | 317046 | 106090 | 69088 | 2907 | 27531 | 3048 | 0 | 4059 | 35710 |
| `/zh` | 476570 | 299621 | 106090 | 44686 | 0 | 23125 | 3048 | 0 | 4015 | 0 |
| `/zh/about` | 478827 | 301728 | 106090 | 44686 | 0 | 23275 | 3048 | 0 | 3610 | 0 |
| `/zh/blog` | 466327 | 293824 | 106090 | 44686 | 0 | 18679 | 3048 | 0 | 3609 | 0 |
| `/zh/blog/prepare-before-launch` | 466490 | 293824 | 106090 | 44686 | 0 | 18842 | 3048 | 0 | 3609 | 0 |
| `/zh/contact` | 520704 | 331935 | 106090 | 44686 | 0 | 34945 | 3048 | 0 | 3607 | 30704 |
| `/zh/products` | 475538 | 301243 | 106090 | 44686 | 0 | 20471 | 3048 | 0 | 4014 | 0 |
| `/zh/products/north-america` | 527242 | 317046 | 106090 | 69088 | 2907 | 29063 | 3048 | 0 | 4059 | 37242 |

## Before / after deltas

| URL | Before total | After total | Total delta | Before RSC | After RSC | RSC delta | Before over | After over |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en/contact` | 475517 | 518167 | +42650 | 0 | 0 | 0 | 0 | 28167 |
| `/zh/contact` | 478053 | 520704 | +42651 | 0 | 0 | 0 | 0 | 30704 |
| `/en/products/north-america` | 540228 | 525710 | -14518 | 32461 | 0 | -32461 | 50228 | 35710 |
| `/zh/products/north-america` | 543780 | 527242 | -16538 | 34479 | 0 | -34479 | 53780 | 37242 |

Interpretation:

- Product-detail RSC prefetch removal succeeded.
- Net product-detail savings are smaller than the removed RSC bytes because the
  fresh build/run also has a higher shared JS/CSS/font/document floor than the
  PR #69 proof run.
- Contact returned to yellow without any RSC transfer. That makes Contact a
  shared-payload problem in this run, not a prefetch-policy problem.

## Product-detail RSC request check

RSC boundary:

```js
request.mimeType === "text/x-component" || /[?&]_rsc=/.test(request.url)
```

| URL | Before RSC transfer | After RSC transfer | Main after RSC requests |
| --- | ---: | ---: | --- |
| `/en/products/north-america` | 32461 | 0 | none |
| `/zh/products/north-america` | 34479 | 0 | none |
| `/en/contact` | 0 | 0 | none |
| `/zh/contact` | 0 | 0 | none |

This proves the product-detail prefetch-policy code change addressed the
measured RSC source.

## Remaining yellow URLs

| URL | Total | Over 490KB | Dominant remaining contributors |
| --- | ---: | ---: | --- |
| `/en/contact` | 518167 | 28167 | JS 331935, CSS 106090, font 44686, document 32408 |
| `/zh/contact` | 520704 | 30704 | JS 331935, CSS 106090, font 44686, document 34945 |
| `/en/products/north-america` | 525710 | 35710 | JS 317046, CSS 106090, font 69088, document 27531 |
| `/zh/products/north-america` | 527242 | 37242 | JS 317046, CSS 106090, font 69088, document 29063 |

## Verification

| Command | Result |
| --- | --- |
| Focused RED before production code | Failed as expected: 4 prefetch contract assertions failed; no syntax errors. |
| Focused GREEN after production code | Pass: 3 files, 35 tests. |
| `git diff --check` | Pass. |
| `pnpm lint:check` | Pass. ESLint completed and the starter `eslint-disable` check reported OK. |
| `pnpm type-check` | Pass. `next typegen` and `tsc --noEmit` exited 0. |
| `pnpm test` | Pass. 345 files passed; 3426 tests passed and 7 skipped. |
| `pnpm exec playwright test tests/e2e/navigation.spec.ts --project=chromium` | Pass. 20 tests passed. |
| First `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build` retry in this closeout | Failed while fetching Google Fonts URLs from `fonts.gstatic.com`; no local code error was indicated. |
| Font URL probes | Mixed transient network result: initial probes failed with TLS `SSL_ERROR_SYSCALL`, later probes returned HTTP 200 with `content-type: font/woff2`. |
| Final `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build` retry | Pass. Existing `DYNAMIC_SERVER_USAGE` digests appeared during static generation, matching prior waves. |
| `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse` | Pass. 14 URLs, 42 runs. Four warning-level `total-byte-weight` assertions remain. Median report uploads completed successfully. |

## Next decision

Continue, but switch target.

Do not add more product-detail prefetch work: RSC is already 0. The next lane
needs a shared transfer reduction that can clear Contact and help product-detail
at the same time. The smallest evidence-backed candidate is font strategy:

- current shared baseline font transfer is 44686 bytes on every audited route;
- product-detail additionally loads a 24402-byte Open Sans symbol subset;
- removing only product-detail glyph use would not clear Contact;
- a broader system-font or font-loading strategy could clear both Contact and
  product-detail, but it is a visible UI change and needs screenshot / browser
  proof before it can be kept.

If the next lane cannot preserve the visual baseline, revert that lane and keep
this proof as the boundary: product-detail RSC prefetch was solved, but the
remaining yellow debt is shared payload debt.
