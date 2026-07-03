# Lighthouse Yellow Debt Wave 2 Baseline

Date: 2026-05-23
Branch: `perf/lighthouse-wave-2-surface-optimization`
Base commit: `31c6af2 docs: plan lighthouse wave 2 optimization`

## Commands

| Command | Result |
| --- | --- |
| `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build` | Pass |
| `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse` | Pass; only warning-level `total-byte-weight` assertions remain |

## Metric rules

Route summary byte columns in this file are Lighthouse transfer-size metrics:

- `Total bytes`: Lighthouse `total-byte-weight.numericValue`
- `JS bytes`, `CSS bytes`, `Font bytes`, `Image bytes`: Lighthouse `resource-summary.*.transferSize`

The `Resource bytes` column in the product-detail resource table comes from
Lighthouse `network-requests.resourceSize`; it is listed only to compare
transferred and decoded resource size. This file does not use Lighthouse
treemap `resourceBytes` or `unusedBytes` as network transfer savings. Treemap
values remain attribution-only.

The Lighthouse command ran each URL 3 times. The table below uses the median
LHR per route by `total-byte-weight`, giving one row for each of the 14 checked
URLs.

## Route summary

| URL | Perf | A11y | LCP ms | TBT ms | Total bytes | JS bytes | CSS bytes | Font bytes | Image bytes | Over 490KB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en` | 87 | 100 | 4016 | 39 | 475209 | 299621 | 106083 | 44686 | 0 | 0 |
| `/en/about` | 90 | 100 | 3610 | 26 | 477483 | 301728 | 106083 | 44686 | 0 | 0 |
| `/en/blog` | 90 | 96 | 3613 | 15 | 514047 | 293824 | 106083 | 44686 | 0 | 24047 |
| `/en/blog/prepare-before-launch` | 90 | 96 | 3611 | 16 | 488986 | 293824 | 106083 | 44686 | 0 | 0 |
| `/en/contact` | 89 | 100 | 3758 | 38 | 518160 | 331935 | 106083 | 44686 | 0 | 28160 |
| `/en/products` | 87 | 96 | 4017 | 45 | 503651 | 307040 | 106083 | 44686 | 0 | 13651 |
| `/en/products/north-america` | 87 | 100 | 4061 | 47 | 607831 | 346838 | 106083 | 69088 | 2907 | 117831 |
| `/zh` | 87 | 100 | 4013 | 35 | 476559 | 299621 | 106083 | 44686 | 0 | 0 |
| `/zh/about` | 90 | 100 | 3612 | 25 | 478817 | 301728 | 106083 | 44686 | 0 | 0 |
| `/zh/blog` | 90 | 96 | 3611 | 14 | 516681 | 293824 | 106083 | 44686 | 0 | 26681 |
| `/zh/blog/prepare-before-launch` | 90 | 96 | 3609 | 18 | 491121 | 293824 | 106083 | 44686 | 0 | 1121 |
| `/zh/contact` | 88 | 100 | 3910 | 49 | 520697 | 331935 | 106083 | 44686 | 0 | 30697 |
| `/zh/products` | 89 | 96 | 3759 | 37 | 506024 | 307040 | 106083 | 44686 | 0 | 16024 |
| `/zh/products/north-america` | 87 | 100 | 4061 | 43 | 611383 | 346838 | 106083 | 69088 | 2907 | 121383 |

## Yellow URLs

The following URLs remain above the 490000 byte warning threshold:

- `/en/blog`: 24047 bytes over
- `/en/contact`: 28160 bytes over
- `/en/products`: 13651 bytes over
- `/en/products/north-america`: 117831 bytes over
- `/zh/blog`: 26681 bytes over
- `/zh/blog/prepare-before-launch`: 1121 bytes over
- `/zh/contact`: 30697 bytes over
- `/zh/products`: 16024 bytes over
- `/zh/products/north-america`: 121383 bytes over

Product detail distance from the 490000 byte warning threshold:

- `/en/products/north-america`: 117831 bytes over
- `/zh/products/north-america`: 121383 bytes over

## Product detail resource leads

Product detail resource leads from Lighthouse `network-requests` transfer
sizes. These are transfer-size observations only, not estimated savings.

| Route | Type | Resource | Transfer bytes | Resource bytes |
| --- | --- | --- | ---: | ---: |
| `/en/products/north-america` | Stylesheet | `/_next/static/chunks/0rgimnfopkuc~.css` | 102249 | 792830 |
| `/en/products/north-america` | Script | `/_next/static/chunks/0uety2vcipkf9.js` | 74327 | 231718 |
| `/en/products/north-america` | Font | `/_next/static/media/cf514f5d0007dafa-s.p.0lok5zj4ubzox.woff2` | 44686 | 42964 |
| `/en/products/north-america` | Script | `/_next/static/chunks/11~jx33~vd1zj.js` | 38703 | 135372 |
| `/en/products/north-america` | Font | `/_next/static/media/5b0229109f6656bb-s.1455rc8vwuctw.woff2` | 24402 | 22680 |
| `/en/products/north-america` | Script | `/_next/static/chunks/09ylxs517m3di.js` | 20453 | 83163 |
| `/en/products/north-america` | Script | `/_next/static/chunks/00mdli4.~1w1m.js` | 19810 | 50124 |
| `/en/products/north-america` | Script | `/_next/static/chunks/0971qs.~.2_x..js` | 17316 | 43521 |
| `/en/products/north-america` | Script | `/_next/static/chunks/17nrdw4ktq7p0.js` | 11938 | 30941 |
| `/en/products/north-america` | Script | `/_next/static/chunks/15f3sg68dsfe_.js` | 11223 | 31618 |
| `/zh/products/north-america` | Stylesheet | `/_next/static/chunks/0rgimnfopkuc~.css` | 102249 | 792830 |
| `/zh/products/north-america` | Script | `/_next/static/chunks/0uety2vcipkf9.js` | 74327 | 231718 |
| `/zh/products/north-america` | Font | `/_next/static/media/cf514f5d0007dafa-s.p.0lok5zj4ubzox.woff2` | 44686 | 42964 |
| `/zh/products/north-america` | Script | `/_next/static/chunks/11~jx33~vd1zj.js` | 38703 | 135372 |
| `/zh/products/north-america` | Font | `/_next/static/media/5b0229109f6656bb-s.1455rc8vwuctw.woff2` | 24402 | 22680 |
| `/zh/products/north-america` | Script | `/_next/static/chunks/09ylxs517m3di.js` | 20453 | 83163 |
| `/zh/products/north-america` | Script | `/_next/static/chunks/00mdli4.~1w1m.js` | 19810 | 50124 |
| `/zh/products/north-america` | Script | `/_next/static/chunks/0971qs.~.2_x..js` | 17316 | 43521 |
| `/zh/products/north-america` | Script | `/_next/static/chunks/17nrdw4ktq7p0.js` | 11938 | 30941 |
| `/zh/products/north-america` | Script | `/_next/static/chunks/15f3sg68dsfe_.js` | 11223 | 31618 |

Notes:

- Product detail pages still carry the same 106083 CSS transfer size seen on
  every checked route.
- Product detail pages carry 69088 font bytes, which is 24402 bytes higher than
  routes with 44686 font bytes.
- Radix-era script leads are still visible in the product detail resource list,
  including `17nrdw4ktq7p0.js` and `15f3sg68dsfe_.js`.

## Contrast findings

Lighthouse `color-contrast` reports these unique selector groups:

| Routes | Selector | Snippet | Lighthouse finding |
| --- | --- | --- | --- |
| `/en/products`, `/zh/products` | `div.mx-auto > header.mb-12 > div.mb-4 > p.text-[13px]` | `<p class="text-[13px] font-semibold uppercase tracking-[0.04em] text-primary">` | Contrast 2.93, foreground `#1e9df1`, background `#ffffff`; expected 4.5:1 |
| `/en/blog`, `/zh/blog` | `div.mx-auto > section.mt-12 > a.group > span.mt-6` | `<span class="mt-6 inline-flex text-sm font-semibold text-primary">` | Contrast 2.76, foreground `#1e9df1`, background `#f7f8f8`; expected 4.5:1 |
| `/en/blog/prepare-before-launch`, `/zh/blog/prepare-before-launch` | `main#main-content > div > div.mx-auto > a.mb-8` | `<a class="mb-8 inline-flex text-sm font-semibold text-primary hover:underline" href="...">` | Contrast 2.93, foreground `#1e9df1`, background `#ffffff`; expected 4.5:1 |

## Lane decisions

| Lane | Initial decision | Reason | Next action |
| --- | --- | --- | --- |
| Lane 4 Radix/static surface | Proceed with evaluation; keep or revert after before/after proof | Product detail still has the largest route payload and still shows Radix-era script leads. The global 106083 CSS bytes remain shared across all routes, so any change must prove transfer-size benefit before being kept. | Evaluate static product/spec surfaces only. Do not change UI foundation or business content. |
| Lane 5 font | Proceed with evaluation | Product detail font transfer is 69088 bytes, 24402 bytes above the 44686 byte route baseline. | Review product-detail font subset/weight usage against current `next/font` docs. Keep current strategy if no measured transfer reduction appears. |
| Lane 6 contrast | Proceed with targeted contrast fix | Lighthouse reports exact `text-primary` contrast failures on product listing, blog listing, and blog article back links. | Fix only the failing local usages or a narrow token/variant path. Do not globally darken `--muted-foreground` or unrelated copy. |

## Lane 4 Radix/static surface evaluation

**Evaluation date:** 2026-05-23

**Attempted change:** Added plain-HTML `StaticDataCard` exports and moved only
`SpecTable`, `ProductSpecs`, and `ProductTradeInfo` to the static product/spec
surface.

**Verification commands during evaluation:**

- `pnpm exec vitest run src/components/ui/__tests__/data-card.test.tsx`:
  failed before implementation because static exports did not exist.
- `pnpm exec vitest run src/components/ui/__tests__/data-card.test.tsx`:
  passed after the smallest static wrapper implementation.
- `pnpm exec vitest run src/components/products/__tests__/spec-table.test.tsx src/components/products/__tests__/product-specs.test.tsx src/components/ui/__tests__/data-card.test.tsx tests/architecture/radix-theme-route-footprint.test.tsx`:
  passed.
- `pnpm component:governance:test`: passed.
- `pnpm component:governance`: passed.
- `pnpm component:check`: passed.
- `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build`: passed.
- `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse`:
  passed with warning-level `total-byte-weight` assertions only.

### Product-detail before / attempted after

All numbers below are Lighthouse transfer-size metrics from the median product
detail LHR for each route.

| URL | State | Total bytes | JS bytes | CSS bytes | Font bytes | Delta total | Delta JS | Delta CSS | Delta font |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en/products/north-america` | Baseline | 607831 | 346838 | 106083 | 69088 | - | - | - | - |
| `/en/products/north-america` | Static wrapper attempt | 607809 | 346838 | 106083 | 69088 | -22 | 0 | 0 | 0 |
| `/zh/products/north-america` | Baseline | 611383 | 346838 | 106083 | 69088 | - | - | - | - |
| `/zh/products/north-america` | Static wrapper attempt | 611291 | 346838 | 106083 | 69088 | -92 | 0 | 0 | 0 |

### Lane 4 decision

**Decision:** reverted; keep the current Radix-backed `DataCard` wrapper.

**Rationale:** The static wrapper attempt did not reduce product-detail JS, CSS,
or font transfer size. The total-byte reduction was only 22 bytes on
`/en/products/north-america` and 92 bytes on `/zh/products/north-america`, which
is too small to justify adding a second public DataCard surface. The product
detail pages remain warning-level yellow URLs with effectively unchanged
payload:

- `/en/products/north-america`: 607809 bytes after the attempt, still 117809
  bytes over the 490000 byte warning threshold.
- `/zh/products/north-america`: 611291 bytes after the attempt, still 121291
  bytes over the 490000 byte warning threshold.

The code changes were rolled back after measurement. Lane 4 keeps this document
record only so future work does not repeat the same static-wrapper attempt
without stronger route-level evidence.

### Post-revert verification

After reverting the static wrapper code, the current branch was verified again:

- `pnpm exec vitest run src/components/ui/__tests__/data-card.test.tsx src/components/products/__tests__/spec-table.test.tsx src/components/products/__tests__/product-specs.test.tsx tests/architecture/radix-theme-route-footprint.test.tsx`:
  passed.
- `pnpm component:governance:test`: passed.
- `pnpm component:governance`: passed.
- `pnpm component:check`: passed.
- `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build`: passed.
- `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse`:
  passed with warning-level `total-byte-weight` assertions only.

Current post-revert product detail medians:

| URL | Total bytes | JS bytes | CSS bytes | Font bytes | Over 490KB |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/en/products/north-america` | 607850 | 346838 | 106083 | 69088 | 117850 |
| `/zh/products/north-america` | 611392 | 346838 | 106083 | 69088 | 121392 |

## Lane 5 font strategy refinement

**Evaluation date:** 2026-05-23

**Decision:** keep current Open Sans weights
`["400", "500", "600", "700"]`; skip production code changes.

### Font target evidence

The product-detail font delta is real, but it is not attributable to a single
Open Sans weight. The current `next/font` output emits the same self-hosted
Open Sans font file URLs for the configured 400, 500, 600, and 700 weights, so
removing a weight would not directly remove the product-detail font transfer
observed by Lighthouse.

The extra product-detail font transfer comes from an additional Open Sans
symbol subset requested on both product-detail routes:

| Route | Font resource | Transfer bytes | Resource bytes | Source attribution |
| --- | --- | ---: | ---: | --- |
| `/en/products/north-america` | `/_next/static/media/cf514f5d0007dafa-s.p.0lok5zj4ubzox.woff2` | 44686 | 42964 | Open Sans latin/punctuation baseline also seen on non-detail routes |
| `/en/products/north-america` | `/_next/static/media/5b0229109f6656bb-s.1455rc8vwuctw.woff2` | 24402 | 22680 | Open Sans symbol subset; product-detail rendered text includes `U+2713` (`✓`) |
| `/zh/products/north-america` | `/_next/static/media/cf514f5d0007dafa-s.p.0lok5zj4ubzox.woff2` | 44686 | 42964 | Open Sans latin/punctuation baseline also seen on non-detail routes |
| `/zh/products/north-america` | `/_next/static/media/5b0229109f6656bb-s.1455rc8vwuctw.woff2` | 24402 | 22680 | Open Sans symbol subset; product-detail rendered text includes `U+2713` (`✓`) |

Installed Next.js 16.2.6 font docs confirm `next/font/google` self-hosts Google
font files, preloads requested subsets by default, and requires explicit
weights only when not using the variable-font default. The current route
evidence shows a unicode subset issue, not a weight-only issue.

### Verification commands

- `pnpm exec vitest run 'src/app/[locale]/__tests__/layout-fonts.test.ts'`:
  passed, 3 tests.
- `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build`: passed. Existing
  `DYNAMIC_SERVER_USAGE` prerender digests were observed during static page
  generation, matching the current project behavior.
- `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse`:
  passed with warning-level `total-byte-weight` assertions only.

No browser screenshot was needed because Lane 5 did not change font rendering
or production code.

### Product-detail before / after

All numbers below are Lighthouse transfer-size metrics from the median product
detail LHR for each route.

| URL | State | Total bytes | JS bytes | CSS bytes | Font bytes | Delta total | Delta JS | Delta CSS | Delta font |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en/products/north-america` | Post-Lane-4 baseline | 607850 | 346838 | 106083 | 69088 | - | - | - | - |
| `/en/products/north-america` | Lane 5 keep-current rerun | 607839 | 346838 | 106083 | 69088 | -11 | 0 | 0 | 0 |
| `/zh/products/north-america` | Post-Lane-4 baseline | 611392 | 346838 | 106083 | 69088 | - | - | - | - |
| `/zh/products/north-america` | Lane 5 keep-current rerun | 611390 | 346838 | 106083 | 69088 | -2 | 0 | 0 | 0 |

### Yellow URL impact after Lane 5

Lane 5 did not change production code, so yellow URL movement is Lighthouse run
noise only. The warning set remains unchanged.

| URL | Total bytes | JS bytes | CSS bytes | Font bytes | Over 490KB |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/en/blog` | 514060 | 293824 | 106083 | 44686 | 24060 |
| `/en/contact` | 518159 | 331935 | 106083 | 44686 | 28159 |
| `/en/products` | 503651 | 307040 | 106083 | 44686 | 13651 |
| `/en/products/north-america` | 607839 | 346838 | 106083 | 69088 | 117839 |
| `/zh/blog` | 516697 | 293824 | 106083 | 44686 | 26697 |
| `/zh/blog/prepare-before-launch` | 491128 | 293824 | 106083 | 44686 | 1128 |
| `/zh/contact` | 520696 | 331935 | 106083 | 44686 | 30696 |
| `/zh/products` | 506024 | 307040 | 106083 | 44686 | 16024 |
| `/zh/products/north-america` | 611390 | 346838 | 106083 | 69088 | 121390 |

### Lane 5 rationale

Changing the Open Sans weight list would be a visual compatibility risk with no
font-transfer proof. The measured extra 24402 bytes are caused by the symbol
subset needed by product-detail rendered content, not by loading separate
weight files. Replacing the checkmark glyph or changing the starter to system
fonts is broader than this Lane 5 font-strategy refinement and would affect
visible product-detail UI. The safer decision is to keep the current strategy
and defer any glyph-level or system-font migration to a separately scoped visual
change with screenshot proof.

## Lane 6 measured contrast remediation

**Evaluation date:** 2026-05-23

**Decision:** keep the fix. Replace only the three Lighthouse-reported local
`text-primary` text usages with the existing semantic `--primary-text` token.
No global color token, `--muted-foreground`, or Lighthouse threshold changed.

### Source mapping

| Lighthouse route group | Source file | Local fix |
| --- | --- | --- |
| `/en/products`, `/zh/products` | `src/app/[locale]/products/page.tsx` | Header kicker now uses `text-[var(--primary-text)]` |
| `/en/blog`, `/zh/blog` | `src/app/[locale]/blog/page.tsx` | Card read-more label now uses `text-[var(--primary-text)]` |
| `/en/blog/prepare-before-launch`, `/zh/blog/prepare-before-launch` | `src/app/[locale]/blog/[slug]/page.tsx` | Back-to-blog link now uses `text-[var(--primary-text)]` |

### Test-first proof

- `pnpm exec vitest run 'src/app/[locale]/products/__tests__/page.test.tsx' 'src/app/[locale]/blog/__tests__/page.test.tsx' 'src/app/[locale]/blog/[slug]/__tests__/page.test.tsx'`:
  failed before implementation because the three local usages still rendered
  `text-primary`.
- The same narrow command passed after the local class changes: 3 test files,
  16 tests.

### Verification commands

- `pnpm lint:check`: passed.
- `pnpm type-check`: passed.
- `pnpm test`: passed, 345 test files, 3416 passed, 7 skipped.
- `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build`: passed. Existing
  `DYNAMIC_SERVER_USAGE` prerender digests were observed during static page
  generation, matching the current project behavior.
- `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse`:
  passed with warning-level `total-byte-weight` assertions only.

### Contrast before / after

| URL | Before A11y | After A11y | Before contrast finding | After contrast finding |
| --- | ---: | ---: | --- | --- |
| `/en/products` | 96 | 100 | Header kicker `text-primary`, contrast 2.93 on white | Cleared |
| `/zh/products` | 96 | 100 | Header kicker `text-primary`, contrast 2.93 on white | Cleared |
| `/en/blog` | 96 | 100 | Card read-more `text-primary`, contrast 2.76 on `#f7f8f8` | Cleared |
| `/zh/blog` | 96 | 100 | Card read-more `text-primary`, contrast 2.76 on `#f7f8f8` | Cleared |
| `/en/blog/prepare-before-launch` | 96 | 100 | Back link `text-primary`, contrast 2.93 on white | Cleared |
| `/zh/blog/prepare-before-launch` | 96 | 100 | Back link `text-primary`, contrast 2.93 on white | Cleared |

The post-fix Lighthouse `color-contrast` detail list is empty for the affected
routes.

### Yellow URL impact after Lane 6

Lane 6 is an accessibility contrast fix. The remaining yellow assertions are
still `total-byte-weight` warnings; no accessibility warnings remain on the
affected routes.

| URL | Total bytes | JS bytes | CSS bytes | Font bytes | Over 490KB |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/en/blog` | 514130 | 293824 | 106090 | 44686 | 24130 |
| `/en/contact` | 518167 | 331935 | 106090 | 44686 | 28167 |
| `/en/products` | 503672 | 307040 | 106090 | 44686 | 13672 |
| `/en/products/north-america` | 607875 | 346838 | 106090 | 69088 | 117875 |
| `/zh/blog` | 516758 | 293824 | 106090 | 44686 | 26758 |
| `/zh/blog/prepare-before-launch` | 491166 | 293824 | 106090 | 44686 | 1166 |
| `/zh/contact` | 520703 | 331935 | 106090 | 44686 | 30703 |
| `/zh/products` | 506047 | 307040 | 106090 | 44686 | 16047 |
| `/zh/products/north-america` | 611424 | 346838 | 106090 | 69088 | 121424 |
