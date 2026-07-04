# LCP first-paint motion boundary

Historical starter proof. This file is not current Tucsenberg launch proof; see
`../项目基础/上线验证.md`, `../项目基础/发布验证.md`, `../项目基础/验证等级.md`, and `../README.md` for the current
boundary.

Branch: `perf/lcp-before-after`
Base: `perf/lcp-cloudflare-size`

## Goal

Improve homepage LCP only where fresh Lighthouse evidence shows first-screen
content is delayed by client-side motion.

## Before

Commands:

```bash
pnpm build
CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse
```

Result: Lighthouse autorun passed for 14 URLs and 42 runs.

| Route | Score | LCP ms | LCP range | FCP | TBT | Total KB | JS/CSS/Font/Image/Doc KB | LCP element |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `/zh/products/north-america` | 89 | 3776 | 3772-3802 | 1356 | 59 | 451 | 313/101/0/5/28 | `section#sample-product-shapes img.object-contain` |
| `/en/products/north-america` | 89 | 3772 | 3768-3774 | 1356 | 59 | 447 | 313/101/0/3/27 | `section#sample-product-shapes img.object-contain` |
| `/en` | 89 | 3708 | 3693-3759 | 1358 | 52 | 426 | 301/101/0/0/21 | homepage hero `h1` |
| `/zh/products` | 89 | 3708 | 3306-3709 | 1358 | 56 | 427 | 303/101/0/0/20 | page text/card |
| `/zh` | 89 | 3696 | 3695-3759 | 1359 | 20 | 427 | 301/101/0/0/22 | homepage hero subtitle |
| `/en/products` | 89 | 3694 | 3457-3699 | 1356 | 63 | 426 | 303/101/0/0/19 | page text/card |
| `/en/blog` | 89 | 3694 | 3694-3710 | 1357 | 52 | 421 | 298/101/0/0/19 | page text/card |
| `/zh/blog/prepare-before-launch` | 90 | 3545 | 3457-3555 | 1358 | 49 | 423 | 298/101/0/0/21 | page text/card |
| `/zh/blog` | 90 | 3544 | 3457-3557 | 1358 | 46 | 422 | 298/101/0/0/20 | page text/card |
| `/en/contact` | 90 | 3543 | 3305-3543 | 1355 | 54 | 452 | 316/101/0/0/33 | page text/card |
| `/en/blog/prepare-before-launch` | 90 | 3543 | 3457-3544 | 1356 | 60 | 422 | 298/101/0/0/20 | page text/card |
| `/zh/about` | 90 | 3542 | 3459-3544 | 1357 | 47 | 425 | 298/101/0/0/22 | page text/card |
| `/en/about` | 91 | 3458 | 3308-3543 | 1358 | 54 | 423 | 298/101/0/0/21 | page text/card |
| `/zh/contact` | 92 | 3308 | 3306-3544 | 1358 | 49 | 454 | 316/101/0/0/35 | page text/card |

Public median reports:

- `/en`: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1780075880095-95079.report.html
- `/zh`: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1780075881771-44144.report.html

Finding:

- Homepage LCP was first-screen text, not an oversized image.
- Lighthouse LCP breakdown reported the homepage LCP as mostly render delay.
- The hero view was a Client Component and wrapped LCP-critical text in
  `BreathingStaggerItem`, whose hidden state used `opacity: 0` and `y: 12`.

## Change

- Kept homepage hero content server-rendered.
- Removed first-screen `BreathingStagger` / `BreathingStaggerItem` wrappers
  from `src/components/sections/hero-section-view.tsx`.
- Updated the client-boundary budget from 44 to 43 entries because the hero view
  is no longer a top-level client boundary.
- Left below-the-fold homepage reveal effects unchanged.

## After

Commands:

```bash
pnpm build
CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse
```

Result: Lighthouse autorun passed for 14 URLs and 42 runs.

| Route | Score | LCP ms | LCP range | FCP | TBT | Total KB | JS/CSS/Font/Image/Doc KB | LCP element |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `/en/products/north-america` | 89 | 3773 | 3770-3773 | 1356 | 58 | 447 | 313/101/0/3/27 | `section#sample-product-shapes img.object-contain` |
| `/zh/products/north-america` | 89 | 3771 | 3771-3880 | 1356 | 48 | 451 | 313/101/0/5/28 | `section#sample-product-shapes img.object-contain` |
| `/zh/products` | 89 | 3710 | 3457-3711 | 1358 | 53 | 427 | 303/101/0/0/20 | page text/card |
| `/en/products` | 89 | 3699 | 3696-3699 | 1359 | 65 | 426 | 303/101/0/0/19 | page text/card |
| `/en/blog` | 89 | 3692 | 3545-3701 | 1356 | 50 | 421 | 298/101/0/0/19 | page text/card |
| `/en` | 90 | 3556 | 3545-3560 | 1358 | 29 | 424 | 298/101/0/0/22 | homepage hero `h1` |
| `/en/about` | 90 | 3547 | 3457-3548 | 1358 | 30 | 423 | 298/101/0/0/21 | page text/card |
| `/zh/blog` | 90 | 3546 | 3545-3558 | 1358 | 28 | 422 | 298/101/0/0/20 | page text/card |
| `/zh` | 90 | 3545 | 3545-3560 | 1359 | 21 | 426 | 298/101/0/0/23 | homepage hero subtitle |
| `/zh/contact` | 90 | 3545 | 3306-3549 | 1356 | 56 | 454 | 316/101/0/0/34 | page text/card |
| `/zh/about` | 90 | 3544 | 3543-3548 | 1358 | 18 | 425 | 298/101/0/0/22 | page text/card |
| `/en/blog/prepare-before-launch` | 90 | 3544 | 3544-3546 | 1358 | 55 | 422 | 298/101/0/0/20 | page text/card |
| `/zh/blog/prepare-before-launch` | 90 | 3544 | 3459-3544 | 1357 | 50 | 423 | 298/101/0/0/21 | page text/card |
| `/en/contact` | 91 | 3456 | 3305-3544 | 1356 | 59 | 452 | 316/101/0/0/32 | page text/card |

Public median reports:

- `/en`: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1780076912257-31169.report.html
- `/zh`: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1780076914024-8575.report.html

## Comparison

| Route | Before LCP | After LCP | Delta |
| --- | ---: | ---: | ---: |
| `/en` | 3708 ms | 3556 ms | -152 ms |
| `/zh` | 3696 ms | 3545 ms | -151 ms |

The homepage improvement is modest but outside the before/after run ranges:

- `/en` before range: 3693-3759 ms; after range: 3545-3560 ms.
- `/zh` before range: 3695-3759 ms; after range: 3545-3560 ms.

## Decision

Keep the change.

It removes a first-screen client motion boundary, lowers the committed client
boundary budget, and produces a measured homepage LCP improvement without
lowering any Lighthouse gate or changing page content.

Product detail pages still show image LCP candidates under
`section#sample-product-shapes`; those are a separate candidate lane and were
not changed in this PR.
