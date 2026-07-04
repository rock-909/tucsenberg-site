# Lighthouse Yellow Debt Wave 2 Closeout

Historical starter proof. This file is not current Tucsenberg launch proof; see
`../项目基础/上线验证.md`, `../项目基础/发布验证.md`, `../项目基础/验证等级.md`, and `../README.md` for the current
boundary.

Date: 2026-05-24
Branch: `perf/lighthouse-wave-2-surface-optimization`

## Wave 2 summary

Wave 2 is ready to close with one kept production fix and two documented
keep/revert decisions:

- Lane 4 Radix/static surface: reverted the static `DataCard` attempt and kept
  the current Radix-backed `DataCard`. The measured product-detail transfer
  reduction was only 22 bytes on `/en/products/north-america` and 92 bytes on
  `/zh/products/north-america`, with no JS, CSS, or font-byte reduction.
- Lane 5 font strategy: kept the current Open Sans strategy. The extra
  product-detail font transfer is the Open Sans symbol subset caused by rendered
  product-detail content, not a separate weight file that can be safely removed
  inside this lane.
- Lane 6 contrast: kept the scoped contrast fix. The measured `text-primary`
  contrast findings on products, blog listing, and blog article back-link
  surfaces are cleared.

Wave 2 did not delete business content, did not change the default profile, and
did not change Lighthouse thresholds or budget policy.

## Before / after

The Wave 1 numbers come from
`docs/技术难题/Lighthouse黄色债务第一轮收口.md`. The Wave 2
numbers come from the final Wave 2 Lighthouse verification run in this closeout
task. All byte values are Lighthouse network transfer-size metrics from
`total-byte-weight`.

| URL | Wave 1 total bytes | Wave 2 total bytes | Delta | Wave 1 A11y | Wave 2 A11y | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `/en` | 475210 | 475219 | +9 | 100 | 100 | Below 490KB |
| `/zh` | 476559 | 476569 | +10 | 100 | 100 | Below 490KB |
| `/en/about` | 477482 | 477493 | +11 | 100 | 100 | Below 490KB |
| `/zh/about` | 478817 | 478826 | +9 | 100 | 100 | Below 490KB |
| `/en/contact` | 518159 | 518168 | +9 | 100 | 100 | 28168 bytes over 490KB |
| `/zh/contact` | 520696 | 520704 | +8 | 100 | 100 | 30704 bytes over 490KB |
| `/en/products` | 503652 | 503670 | +18 | 96 | 100 | 13670 bytes over 490KB; contrast cleared |
| `/zh/products` | 506021 | 506045 | +24 | 96 | 100 | 16045 bytes over 490KB; contrast cleared |
| `/en/blog` | 514028 | 514130 | +102 | 96 | 100 | 24130 bytes over 490KB; contrast cleared |
| `/zh/blog` | 516662 | 516763 | +101 | 96 | 100 | 26763 bytes over 490KB; contrast cleared |
| `/en/products/north-america` | 607843 | 607871 | +28 | 100 | 100 | 117871 bytes over 490KB |
| `/zh/products/north-america` | 611368 | 611421 | +53 | 100 | 100 | 121421 bytes over 490KB |
| `/en/blog/prepare-before-launch` | 488993 | 489023 | +30 | 96 | 100 | Below 490KB; contrast cleared |
| `/zh/blog/prepare-before-launch` | 491129 | 491165 | +36 | 96 | 100 | 1165 bytes over 490KB; contrast cleared |

## Remaining yellow URLs

Nine URLs remain above the 490000-byte warning threshold:

| URL | Wave 2 total bytes | Over 490KB |
| --- | ---: | ---: |
| `/en/contact` | 518168 | 28168 |
| `/zh/contact` | 520704 | 30704 |
| `/en/products` | 503670 | 13670 |
| `/zh/products` | 506045 | 16045 |
| `/en/blog` | 514130 | 24130 |
| `/zh/blog` | 516763 | 26763 |
| `/en/products/north-america` | 607871 | 117871 |
| `/zh/products/north-america` | 611421 | 121421 |
| `/zh/blog/prepare-before-launch` | 491165 | 1165 |

The remaining yellow items are still warning-level `total-byte-weight`
assertions. No remaining yellow item is from the Lane 6 color-contrast finding.

## Accessibility closeout

The affected contrast pages moved from A11y 96 to A11y 100:

- `/en/products`
- `/zh/products`
- `/en/blog`
- `/zh/blog`
- `/en/blog/prepare-before-launch`
- `/zh/blog/prepare-before-launch`

The post-fix Lighthouse `color-contrast` detail list is empty for these routes.

## Lane decisions

- Lane 4: reverted the static wrapper attempt and kept the current `DataCard`
  implementation because route-level transfer savings were not material.
- Lane 5: kept the current font strategy because the measured product-detail
  font delta is a symbol-subset issue, not a safe weight-removal target.
- Lane 6: kept the scoped contrast fix using the existing `--primary-text`
  token on only the measured failing usages.

## Verification

Final Wave 2 verification commands:

```bash
pnpm lint:check
pnpm type-check
pnpm test
pnpm component:check
NODE_OPTIONS=--dns-result-order=ipv4first pnpm build
CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse
python3 .codex/skills/avoid-ai-tropes/scripts/check.py docs/技术难题/Lighthouse黄色债务第二轮收口.md
git diff --check -- docs/技术难题/Lighthouse黄色债务第二轮收口.md
```

Results:

- `pnpm lint:check`: pass.
- `pnpm type-check`: pass.
- `pnpm test`: pass, 345 test files, 3416 passed, 7 skipped.
- `pnpm component:check`: pass; Storybook build completed. Existing warnings:
  `@opennextjs/cloudflare` package metadata warning, CSS `@import` order
  warning, and large Storybook preview chunk warning.
- `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build`: pass. Existing
  `DYNAMIC_SERVER_USAGE` prerender digests appeared during static page
  generation, matching earlier Wave 2 behavior.
- `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse`:
  pass. The remaining assertions are warning-level `total-byte-weight` items
  for the nine URLs listed above. LHCI upload had one transient TLS failure for
  the first report upload, then completed autorun with exit 0.
- `python3 .codex/skills/avoid-ai-tropes/scripts/check.py docs/技术难题/Lighthouse黄色债务第二轮收口.md`:
  pass, no AI-trope patterns detected.
- `git diff --check -- docs/技术难题/Lighthouse黄色债务第二轮收口.md`:
  pass.

## Deferred to Wave 3

Budget policy remains deferred to Wave 3. Wave 2 did not edit `lighthouserc.js`,
route budgets, default `company-site` content, default profile settings, or
business content to reduce bytes.
