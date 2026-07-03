# Lighthouse Prefetch Policy Proof

Date: 2026-05-24
Branch: `perf/lighthouse-wave-4b-prefetch-policy`

## Decision

Wave 4B first lane worked.

The fourteen-page Lighthouse run now has only two warning-level
`total-byte-weight` results, both on product detail pages:

- `/en/products/north-america`: 540228 bytes, 50228 bytes over 490 KB.
- `/zh/products/north-america`: 543780 bytes, 53780 bytes over 490 KB.

The five expected listing/article targets cleared:

- `/en/products`
- `/zh/products`
- `/en/blog`
- `/zh/blog`
- `/zh/blog/prepare-before-launch`

Contact also measured green in this run, but Wave 4B does not claim that as a
direct prefetch-policy saving. Contact had no RSC prefetch requests before or
after; its route delta is mostly shared JS/build-output movement and should not
be attributed to the listing/article link change.

Next recommended lane: a dedicated product-detail payload wave. Product-detail
still has about 32-34 KB of `text/x-component` transfer plus extra JS, font,
document, and small image transfer. Do not reopen Contact first unless a future
fresh run brings it back above the 490 KB warning line.

## What changed

Production changes were intentionally narrow:

- blog listing article card links now set `prefetch={false}`;
- blog article back-to-blog link now sets `prefetch={false}`;
- products listing passes `homePrefetch={false}` to its breadcrumb only;
- `CatalogBreadcrumb` and `CatalogBreadcrumbView` forward that optional home
  prefetch setting only to the Home breadcrumb link;
- product-detail page code was not changed.

Tests now lock the intended contract:

- blog listing article route links opt out of automatic prefetch;
- blog article back link opts out of automatic prefetch;
- products listing passes `homePrefetch: false`;
- `CatalogBreadcrumb` supports explicit home opt-out;
- real product-detail page callsite keeps `homePrefetch` unset.

## Before baseline

Before data comes from
`docs/proof/performance/lighthouse-zero-yellow-attribution.md`, produced by the
Wave 4A fresh fourteen-page Lighthouse sweep.

Baseline warning URLs:

| URL | Before total | Before over 490KB |
| --- | ---: | ---: |
| `/en/contact` | 518168 | 28168 |
| `/zh/contact` | 520704 | 30704 |
| `/en/products` | 503673 | 13673 |
| `/zh/products` | 506041 | 16041 |
| `/en/blog` | 514122 | 24122 |
| `/zh/blog` | 516752 | 26752 |
| `/en/products/north-america` | 607869 | 117869 |
| `/zh/products/north-america` | 611414 | 121414 |
| `/zh/blog/prepare-before-launch` | 491160 | 1160 |

## After Lighthouse run

The after run used the latest 42 LHR files: fourteen URLs, three runs per URL.

Batch sanity:

```text
Selected files: 42
Selected URLs: 14
Fetch range: 2026-05-24T11:49:49.840Z -> 2026-05-24T11:57:31.622Z
Each audited URL: 3 runs
```

Byte values below are Lighthouse transfer-size metrics from
`total-byte-weight`, `resource-summary`, and `network-requests`. They are not
treemap `resourceBytes`.

| URL | Total | JS | CSS | Font | Image | Document | Other | LCP ms | Over 490KB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en` | 438257 | 269768 | 103246 | 43264 | 0 | 20353 | 1626 | 3843 | 0 |
| `/en/about` | 440528 | 271875 | 103246 | 43264 | 0 | 20517 | 1626 | 3454 | 0 |
| `/en/blog` | 429674 | 265393 | 103246 | 43264 | 0 | 16145 | 1626 | 3541 | 0 |
| `/en/blog/prepare-before-launch` | 429770 | 265393 | 103246 | 43264 | 0 | 16241 | 1626 | 3541 | 0 |
| `/en/contact` | 475517 | 296392 | 103246 | 43264 | 0 | 30989 | 1626 | 3605 | 0 |
| `/en/products` | 436023 | 269968 | 103246 | 43264 | 0 | 17919 | 1626 | 3706 | 0 |
| `/en/products/north-america` | 540228 | 307029 | 103246 | 66244 | 3508 | 26114 | 34087 | 3960 | 50228 |
| `/zh` | 439605 | 269768 | 103246 | 43264 | 0 | 21701 | 1626 | 3841 | 0 |
| `/zh/about` | 441864 | 271875 | 103246 | 43264 | 0 | 21853 | 1626 | 3537 | 0 |
| `/zh/blog` | 430784 | 265393 | 103246 | 43264 | 0 | 17255 | 1626 | 3539 | 0 |
| `/zh/blog/prepare-before-launch` | 430948 | 265393 | 103246 | 43264 | 0 | 17419 | 1626 | 3456 | 0 |
| `/zh/contact` | 478053 | 296392 | 103246 | 43264 | 0 | 33525 | 1626 | 3704 | 0 |
| `/zh/products` | 437151 | 269968 | 103246 | 43264 | 0 | 19047 | 1626 | 3460 | 0 |
| `/zh/products/north-america` | 543780 | 307029 | 103246 | 66244 | 3508 | 27648 | 36105 | 3831 | 53780 |

## Before/after deltas

| URL | Before total | After total | Total delta | Before other | After other | Other delta | Before over | After over |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en/products` | 503673 | 436023 | -67650 | 26518 | 1626 | -24892 | 13673 | 0 |
| `/zh/products` | 506041 | 437151 | -68890 | 27755 | 1626 | -26129 | 16041 | 0 |
| `/en/blog` | 514122 | 429674 | -84448 | 51952 | 1626 | -50326 | 24122 | 0 |
| `/zh/blog` | 516752 | 430784 | -85968 | 53472 | 1626 | -51846 | 26752 | 0 |
| `/en/blog/prepare-before-launch` | 489020 | 429770 | -59250 | 26761 | 1626 | -25135 | 0 | 0 |
| `/zh/blog/prepare-before-launch` | 491160 | 430948 | -60212 | 27726 | 1626 | -26100 | 1160 | 0 |
| `/en/products/north-america` | 607869 | 540228 | -67641 | 55414 | 34087 | -21327 | 117869 | 50228 |
| `/zh/products/north-america` | 611414 | 543780 | -67634 | 57427 | 36105 | -21322 | 121414 | 53780 |
| `/en/contact` | 518168 | 475517 | -42651 | 3048 | 1626 | -1422 | 28168 | 0 |
| `/zh/contact` | 520704 | 478053 | -42651 | 3048 | 1626 | -1422 | 30704 | 0 |

Attribution boundary:

- The `other` reduction on products/blog listing and blog article routes maps
  directly to disappeared RSC prefetch requests.
- Shared JS, CSS, font, document, and favicon-size movement appears across
  green pages too. This proof records it as observed after-run transfer data,
  but does not claim those bytes as direct savings from the prefetch-policy
  change.
- Contact cleared in this after run, but its main delta is JS/shared build
  movement, not route prefetch removal.

## RSC prefetch request check

This table uses `network-requests` entries with `mimeType: text/x-component`
or `_rsc=` request URLs. This is the correct boundary for RSC prefetch transfer;
`network-requests.resourceType` may be `Fetch`, not `Other`.

| URL | RSC transfer | Main text/x-component requests |
| --- | ---: | --- |
| `/en` | 0 | none |
| `/en/about` | 0 | none |
| `/en/blog` | 0 | none |
| `/en/blog/prepare-before-launch` | 0 | none |
| `/en/contact` | 0 | none |
| `/en/products` | 0 | none |
| `/en/products/north-america` | 32461 | `/en/contact` (19289), `/en/products` (6711), `/en` (6461) |
| `/zh` | 0 | none |
| `/zh/about` | 0 | none |
| `/zh/blog` | 0 | none |
| `/zh/blog/prepare-before-launch` | 0 | none |
| `/zh/contact` | 0 | none |
| `/zh/products` | 0 | none |
| `/zh/products/north-america` | 34479 | `/zh/contact` (20444), `/zh/products` (7017), `/zh` (7018) |

Interpretation:

- The targeted listing/article surfaces no longer prefetch linked RSC payloads
  during the Lighthouse run.
- Product-detail RSC prefetch remains by design. This is the right next target
  if zero-yellow remains the goal.

## Remaining yellow URLs

LHCI assertion results after Wave 4B:

| URL | Assertion actual | Warning |
| --- | ---: | --- |
| `/en/products/north-america` | 540228 | `total-byte-weight` over 490000 |
| `/zh/products/north-america` | 543780 | `total-byte-weight` over 490000 |

All other audited URLs are below the 490 KB warning line in the after run.

## Verification

| Command | Result |
| --- | --- |
| Focused RED test run before production code | Failed as expected: 4 prefetch/homePrefetch assertions failed; no syntax or mock errors. |
| Focused GREEN test run after production code | Pass: 5 files, 44 tests. |
| `pnpm lint:check` | Pass. ESLint completed and `eslint-disable` starter check reported OK. |
| `pnpm type-check` | Pass. `next typegen` and `tsc --noEmit` exited 0. |
| `pnpm test` | Pass. 345 files passed; 3423 tests passed and 7 skipped. |
| First `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build` | Failed while fetching one Google Fonts URL from `fonts.gstatic.com`; no local code error was indicated. |
| Font URL probe | Pass. The failed `fonts.gstatic.com` URL returned HTTP 200 with `content-type: font/woff2`. |
| Retry `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build` | Pass. Existing `DYNAMIC_SERVER_USAGE` digests appeared during static generation, matching prior waves. |
| `pnpm exec playwright test tests/e2e/navigation.spec.ts --project=chromium` | Pass. 20 tests passed. |
| `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse` | Pass. 14 URLs, 42 runs. Only 2 warning-level `total-byte-weight` assertion results remain. Temporary report uploads completed for public starter pages. |

## Next recommendation

Proceed to a product-detail-specific wave if the goal remains zero yellow.

Do not bundle product-detail work with Contact or global shared-floor work. The
next product-detail lane should separately attribute:

1. remaining product-detail RSC prefetch transfer;
2. product-detail-only JS delta;
3. product-detail font delta;
4. product-detail document and JSON-LD transfer;
5. the small product image transfer.

Contact should be treated as currently green, not as the next repair target,
unless a fresh rerun shows it above 490 KB again.
