# Lighthouse Budget Governance

Historical starter proof. This file is not current Tucsenberg launch proof; see
`../项目基础/上线验证.md`, `../项目基础/发布验证.md`, `../项目基础/验证等级.md`, and `../README.md` for the current
boundary.

Date: 2026-05-24
Branch: `perf/lighthouse-wave-3-budget-governance`
Entry baseline: Wave 2 closeout, merged through PR #66 at `9c55bc2`

## Decision

Keep the existing global Lighthouse `total-byte-weight` warning at `490000`
bytes. Do not turn the current route-class targets into new error assertions in
this wave.

Reason: nine of the fourteen audited URLs still exceed the global warning line.
Adding route-specific hard failures now would convert known yellow debt into
false red builds instead of improving governance. The safer policy is:

1. keep global byte pressure visible,
2. record route-class targets from current Lighthouse transfer data,
3. require full Lighthouse evidence for release-facing or performance-sensitive
   changes,
4. only promote route-class targets into enforced assertions after repeated
   stable runs show they will not be flaky.

This document uses Lighthouse network transfer-size metrics:

- `total-byte-weight.numericValue` for total bytes,
- `resource-summary` `transferSize` for JS, CSS, and font bytes.

It does not use Lighthouse treemap `resourceBytes` as a network-transfer budget.

## When to run quick Lighthouse

Use the default quick check for normal non-performance edits that still touch
public pages. Lighthouse runs `pnpm start`, so build first unless you already
know `.next` was produced from the current code:

```bash
NODE_OPTIONS=--dns-result-order=ipv4first pnpm build
pnpm website:lighthouse
```

That checks the bilingual home pages:

- `/en`
- `/zh`

Use it after low-risk copy, metadata, or small page edits when the change does
not touch shared layout, route structure, UI foundation, fonts, global CSS,
client islands, form code, or deployment behavior.

## When to run full Lighthouse

Use the full fourteen-page sweep for release-facing work and anything that can
change shared performance:

```bash
NODE_OPTIONS=--dns-result-order=ipv4first pnpm build
CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse
```

Run the full sweep for:

- release or pre-merge closeout,
- Lighthouse, bundle, cache, image, font, or CSS changes,
- shared layout/header/footer/navigation changes,
- UI foundation, Radix wrapper, or design-token changes,
- client/server boundary changes,
- form, validation, analytics, cookie, or consent-island changes,
- route surface changes for home, about, contact, products, blog, product
  detail, or blog article pages.

## Current hard gates

`lighthouserc.js` keeps hard error gates for user-visible quality and Core Web
Vitals:

| Assertion | Level | Current gate |
| --- | --- | ---: |
| `categories:performance` | error | min score `0.78` |
| `categories:accessibility` | error | min score `0.9` |
| `categories:best-practices` | error | min score `0.9` |
| `categories:seo` | error | min score `0.9` |
| `first-contentful-paint` | error | `<= 2000 ms` |
| `largest-contentful-paint` | error | `<= 4500 ms` |
| `cumulative-layout-shift` | error | `<= 0.15` |
| `total-blocking-time` | error | `<= 350 ms` |
| `speed-index` | error | `<= 3000 ms` |
| `interactive` | error | `<= 6000 ms` |

Wave 3 does not loosen or remove these hard gates.

## Current warning gates

The global byte warning remains active:

| Assertion | Level | Current gate | Policy |
| --- | --- | ---: | --- |
| `total-byte-weight` | warn | `<= 490000 bytes` | Keep as the global yellow-debt signal. |
| `bootup-time` | warn | `<= 4000 ms` | Keep as a JS startup warning. |
| `unused-javascript` | warn | `<= 153600 bytes` | Keep as a tree-shaking warning. |
| `mainthread-work-breakdown` | warn | `<= 4000 ms` | Keep as a main-thread warning. |

The global `total-byte-weight` warning is intentionally stricter than the
current route-class footprint. It should stay visible until later optimization
work either brings the remaining routes below 490 KB or produces enough evidence
to justify a more detailed enforced budget.

## Current fourteen-page footprint

The table below comes from the Wave 3 verification Lighthouse reports. Each URL
has three runs; this table sorts by `total-byte-weight`, then by LCP, and uses
the median run. The byte columns drive budget decisions; LCP is reference data
for route health.

| URL | Route class | Total bytes | JS bytes | CSS bytes | Font bytes | LCP ms | Over 490KB | Yellow |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/en` | Home | 475218 | 299621 | 106090 | 44686 | 4016 | 0 | no |
| `/zh` | Home | 476568 | 299621 | 106090 | 44686 | 4011 | 0 | no |
| `/en/about` | About | 477493 | 301728 | 106090 | 44686 | 3609 | 0 | no |
| `/zh/about` | About | 478827 | 301728 | 106090 | 44686 | 3860 | 0 | no |
| `/en/contact` | Contact | 518167 | 331935 | 106090 | 44686 | 3708 | 28167 | yes |
| `/zh/contact` | Contact | 520704 | 331935 | 106090 | 44686 | 3608 | 30704 | yes |
| `/en/products` | Listing | 503673 | 307040 | 106090 | 44686 | 3759 | 13673 | yes |
| `/zh/products` | Listing | 506048 | 307040 | 106090 | 44686 | 3762 | 16048 | yes |
| `/en/blog` | Listing | 514120 | 293824 | 106090 | 44686 | 3610 | 24120 | yes |
| `/zh/blog` | Listing | 516764 | 293824 | 106090 | 44686 | 3710 | 26764 | yes |
| `/en/products/north-america` | Product detail | 607873 | 346838 | 106090 | 69088 | 4058 | 117873 | yes |
| `/zh/products/north-america` | Product detail | 611424 | 346838 | 106090 | 69088 | 4060 | 121424 | yes |
| `/en/blog/prepare-before-launch` | Blog article | 489025 | 293824 | 106090 | 44686 | 3705 | 0 | no |
| `/zh/blog/prepare-before-launch` | Blog article | 491168 | 293824 | 106090 | 44686 | 3609 | 1168 | yes |

## Remaining yellow URLs

Nine URLs remain above the 490 KB global warning threshold:

| URL | Total bytes | Over 490KB |
| --- | ---: | ---: |
| `/en/contact` | 518167 | 28167 |
| `/zh/contact` | 520704 | 30704 |
| `/en/products` | 503673 | 13673 |
| `/zh/products` | 506048 | 16048 |
| `/en/blog` | 514120 | 24120 |
| `/zh/blog` | 516764 | 26764 |
| `/en/products/north-america` | 607873 | 117873 |
| `/zh/products/north-america` | 611424 | 121424 |
| `/zh/blog/prepare-before-launch` | 491168 | 1168 |

These are warning-level findings only. They must not be treated as pass/fail
release blockers unless a later approved policy promotes a specific route-class
target into an enforced assertion.

## Route-class budget targets

These targets are governance targets, not enforced assertions in this wave.
They are generated from current Lighthouse reports:

- proposed warn: 8 percent above current best transfer size, rounded up to the
  nearest 10 KB,
- proposed error: 20 percent above current best transfer size, rounded up to the
  nearest 10 KB.

| Route class | Current best bytes | Proposed warn | Proposed error | Reason |
| --- | ---: | ---: | ---: | --- |
| Home | 475218 | 520000 | 580000 | Based on current Home report: `/en` |
| About | 477493 | 520000 | 580000 | Based on current About report: `/en/about` |
| Contact | 518167 | 560000 | 630000 | Based on current Contact report: `/en/contact` |
| Listing | 503673 | 550000 | 610000 | Based on current Listing report: `/en/products` |
| Product detail | 607873 | 660000 | 730000 | Based on current Product detail report: `/en/products/north-america` |
| Blog article | 489025 | 530000 | 590000 | Based on current Blog article report: `/en/blog/prepare-before-launch` |

## Promotion rule

Route-class targets may move from documentation into `lighthouserc.js` only
after a later branch proves all of the following:

1. at least two fresh full fourteen-page Lighthouse sweeps pass with the
   proposed route-class targets,
2. the target uses Lighthouse transfer-size metrics, not treemap source size,
3. known yellow debt is not converted into a red build without a matching
   product decision,
4. the `assertMatrix` shape, if used, preserves the current hard gates for every
   audited URL,
5. the change does not increase flake risk on GitHub runner.

Until then, `lighthouserc.js` keeps the global warning and this document owns
route-class budget expectations.

## Verification for policy changes

Any future budget-policy PR must run:

```bash
pnpm lint:check
pnpm type-check
pnpm test
NODE_OPTIONS=--dns-result-order=ipv4first pnpm build
CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse
```

If `lighthouserc.js` thresholds or assertion shape change, also include a short
before/after table showing assertion results and the affected URLs.
