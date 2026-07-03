# Lighthouse Shared Payload Proof

Historical starter proof. This file is not current Tucsenberg launch proof; see
`../launch.md`, `../release.md`, and `README.md` for the current boundary.

Date: 2026-05-24
Branch: `perf/lighthouse-shared-payload`

## Baseline decision

Proceed with a system-font test lane because the current Open Sans transfer is
large enough to clear all four remaining warning-level routes.

This baseline is attribution-only. It records the current shared font payload and
before screenshots without changing production code.

## Baseline remaining warnings

Source: latest three existing `.lighthouseci/lhr-*.json` runs per route, using
the middle run as the median baseline.

| URL | Selected LHR | Fetch time | Total | Over 490KB | JS | CSS | Font | Document |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en/contact` | `lhr-1779629088578.json` | `2026-05-24T13:24:39.325Z` | 518167 | 28167 | 331935 | 106090 | 44686 | 32408 |
| `/zh/contact` | `lhr-1779629123779.json` | `2026-05-24T13:25:14.405Z` | 520704 | 30704 | 331935 | 106090 | 44686 | 34945 |
| `/en/products/north-america` | `lhr-1779629294484.json` | `2026-05-24T13:28:05.014Z` | 525710 | 35710 | 317046 | 106090 | 69088 | 27531 |
| `/zh/products/north-america` | `lhr-1779629330789.json` | `2026-05-24T13:28:41.008Z` | 527242 | 37242 | 317046 | 106090 | 69088 | 29063 |

## Latest-run median inputs

```text
/en/contact
latest-three lhr-1779629076954.json@2026-05-24T13:24:27.531Z:total=518614 | lhr-1779629088578.json@2026-05-24T13:24:39.325Z:total=518167 | lhr-1779629100291.json@2026-05-24T13:24:50.910Z:total=518167

/zh/contact
latest-three lhr-1779629111972.json@2026-05-24T13:25:02.694Z:total=521160 | lhr-1779629123779.json@2026-05-24T13:25:14.405Z:total=520704 | lhr-1779629135587.json@2026-05-24T13:25:26.200Z:total=520704

/en/products/north-america
latest-three lhr-1779629282611.json@2026-05-24T13:27:52.994Z:total=525710 | lhr-1779629294484.json@2026-05-24T13:28:05.014Z:total=525710 | lhr-1779629306362.json@2026-05-24T13:28:16.811Z:total=525710

/zh/products/north-america
latest-three lhr-1779629318245.json@2026-05-24T13:28:28.701Z:total=527242 | lhr-1779629330789.json@2026-05-24T13:28:41.008Z:total=527242 | lhr-1779629343092.json@2026-05-24T13:28:53.401Z:total=527242
```

## Baseline font resources

Contact routes currently load one shared Open Sans font resource:

```text
/en/contact
font 44686 /_next/static/media/cf514f5d0007dafa-s.p.0lok5zj4ubzox.woff2

/zh/contact
font 44686 /_next/static/media/cf514f5d0007dafa-s.p.0lok5zj4ubzox.woff2
```

Product-detail routes currently load the same 44686-byte shared Open Sans
resource plus a 24402-byte Open Sans symbol subset:

```text
/en/products/north-america
font 44686 /_next/static/media/cf514f5d0007dafa-s.p.0lok5zj4ubzox.woff2
font 24402 /_next/static/media/5b0229109f6656bb-s.1455rc8vwuctw.woff2

/zh/products/north-america
font 44686 /_next/static/media/cf514f5d0007dafa-s.p.0lok5zj4ubzox.woff2
font 24402 /_next/static/media/5b0229109f6656bb-s.1455rc8vwuctw.woff2
```

## Baseline resource-summary output

```text
/en/contact
resource-summary total:518167 script:331935 stylesheet:106090 font:44686 document:32408 other:3048 image:0 media:0 third-party:0

/zh/contact
resource-summary total:520704 script:331935 stylesheet:106090 font:44686 document:34945 other:3048 image:0 media:0 third-party:0

/en/products/north-america
resource-summary total:525710 script:317046 stylesheet:106090 font:69088 document:27531 other:3048 image:2907 media:0 third-party:0

/zh/products/north-america
resource-summary total:527242 script:317046 stylesheet:106090 font:69088 document:29063 other:3048 image:2907 media:0 third-party:0
```

## Visual baseline artifacts

- `reports/lighthouse-shared-payload/before-en-contact.png`
- `reports/lighthouse-shared-payload/before-zh-contact.png`
- `reports/lighthouse-shared-payload/before-en-products-north-america.png`
- `reports/lighthouse-shared-payload/before-zh-products-north-america.png`

## Decision

Keep the system-font default.

The after run removed the route-specific font transfer from the four formerly
yellow routes and brought all 14 measured URLs under the 490KB warning line.
The change stays within the shared payload goal without adding a replacement
font strategy.

## Verification / after run

Focused tests:

```text
pnpm exec vitest run 'src/app/[locale]/__tests__/layout-fonts.test.ts' 'src/app/[locale]/__tests__/layout.test.tsx'
exit 0
```

Lint:

```text
pnpm lint:check
exit 0
```

Type check:

```text
pnpm type-check
exit 0
```

Full unit/integration tests:

```text
pnpm test
exit 0
345 files passed; 3430 tests passed; 7 skipped
```

Build:

```text
NODE_OPTIONS=--dns-result-order=ipv4first pnpm build
exit 0
```

Notes:

- The build still emitted the known `DYNAMIC_SERVER_USAGE` digest.
- The build still emitted the known Resend API key missing message.
- Both messages match the previous wave behavior and are not blockers for this
  shared payload change.

Navigation smoke:

```text
pnpm exec playwright test tests/e2e/navigation.spec.ts --project=chromium
exit 0
20 passed
```

Lighthouse:

```text
CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse
exit 0
```

Run coverage:

- 14 URLs.
- 42 Lighthouse runs.
- Assertions processed successfully.
- Autorun finished with exit 0.
- Median report uploads succeeded for all 14 URLs in the final rerun.

Final result:

- 14 of 14 audited URLs are below the 490KB warning line.
- 0 warning-level `total-byte-weight` routes remain.
- The largest measured route is `/zh/contact` at 431980 bytes.

## After median resource table

| URL | Total | JS | CSS | Font | Image | Document | Other | LCP ms | Over 490KB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en` | 392103 | 269768 | 100815 | 0 | 0 | 19894 | 1626 | 3560 | 0 |
| `/zh` | 393458 | 269768 | 100815 | 0 | 0 | 21249 | 1626 | 3569 | 0 |
| `/en/about` | 394484 | 271875 | 100815 | 0 | 0 | 20168 | 1626 | 3389 | 0 |
| `/zh/about` | 395808 | 271875 | 100815 | 0 | 0 | 21492 | 1626 | 3159 | 0 |
| `/en/contact` | 429445 | 296392 | 100815 | 0 | 0 | 30612 | 1626 | 3156 | 0 |
| `/zh/contact` | 431980 | 296392 | 100815 | 0 | 0 | 33147 | 1626 | 3262 | 0 |
| `/en/products` | 389975 | 269968 | 100815 | 0 | 0 | 17566 | 1626 | 3399 | 0 |
| `/zh/products` | 391091 | 269968 | 100815 | 0 | 0 | 18682 | 1626 | 3155 | 0 |
| `/en/blog` | 383633 | 265393 | 100815 | 0 | 0 | 15799 | 1626 | 3394 | 0 |
| `/zh/blog` | 384739 | 265393 | 100815 | 0 | 0 | 16905 | 1626 | 3411 | 0 |
| `/en/products/north-america` | 416084 | 284349 | 100815 | 0 | 3508 | 25786 | 1626 | 3553 | 0 |
| `/zh/products/north-america` | 417553 | 284349 | 100815 | 0 | 3508 | 27255 | 1626 | 3554 | 0 |
| `/en/blog/prepare-before-launch` | 383729 | 265393 | 100815 | 0 | 0 | 15895 | 1626 | 3160 | 0 |
| `/zh/blog/prepare-before-launch` | 384887 | 265393 | 100815 | 0 | 0 | 17053 | 1626 | 3157 | 0 |

## Formerly yellow route font resources after change

The four formerly yellow routes now show no font resource transfer in the
selected after medians.

| URL | Total | Font resources | Selected LHR | Fetch time |
| --- | ---: | --- | --- | --- |
| `/en/contact` | 429445 | none | `lhr-1779668019359.json` | `2026-05-25T00:13:30.081Z` |
| `/zh/contact` | 431980 | none | `lhr-1779668054482.json` | `2026-05-25T00:14:05.189Z` |
| `/en/products/north-america` | 416084 | none | `lhr-1779668226350.json` | `2026-05-25T00:16:56.815Z` |
| `/zh/products/north-america` | 417553 | none | `lhr-1779668262994.json` | `2026-05-25T00:17:33.305Z` |

## Before / after deltas

| URL | Before total | After total | Total delta | Before font | After font | Font delta | Before over | After over |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en/contact` | 518167 | 429445 | -88722 | 44686 | 0 | -44686 | 28167 | 0 |
| `/zh/contact` | 520704 | 431980 | -88724 | 44686 | 0 | -44686 | 30704 | 0 |
| `/en/products/north-america` | 525710 | 416084 | -109626 | 69088 | 0 | -69088 | 35710 | 0 |
| `/zh/products/north-america` | 527242 | 417553 | -109689 | 69088 | 0 | -69088 | 37242 | 0 |

## After visual artifacts

Screenshots:

- `reports/lighthouse-shared-payload/after-en-contact.png`
- `reports/lighthouse-shared-payload/after-zh-contact.png`
- `reports/lighthouse-shared-payload/after-en-products-north-america.png`
- `reports/lighthouse-shared-payload/after-zh-products-north-america.png`

All four after screenshots are 1440 x 1200 PNG files.

Visual review note: compared with the before screenshots, the four after pages
show no obvious missing text, clipping, unreadable text, or severe
spacing/layout breakage.
