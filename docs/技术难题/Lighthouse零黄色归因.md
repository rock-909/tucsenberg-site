# Lighthouse Zero-Yellow Attribution

Historical starter proof. This file is not current Tucsenberg launch proof; see
`../项目基础/上线验证.md`, `../项目基础/发布验证.md`, `../项目基础/验证等级.md`, and `../README.md` for the current
boundary.

Date: 2026-05-24
Branch: `perf/lighthouse-wave-4a-zero-yellow-attribution`

## Decision

Further optimization is worth doing, but not as a broad "make every warning
disappear" pass.

The remaining nine `total-byte-weight` warnings are not one problem:

- Blog listing, products listing, product detail, and the Chinese blog article
  all show measurable Next.js RSC prefetch transfer under Lighthouse's `other`
  bucket. This is the clearest Wave 4B repair candidate because it can be tested
  with route-level before/after transfer data and does not require deleting
  content.
- Contact has a separate route-specific JS and document delta. It should be a
  second Wave 4B lane only after the prefetch lane is measured.
- Product detail remains the largest overage. It cannot be cleared by one small
  tweak: it combines JS, font, RSC prefetch, document, and one small image
  transfer. It needs a separate product-detail wave if zero-yellow is still the
  target after the lower-risk repairs.

Wave 4A made no production code, content, font, Radix, Lighthouse threshold, or
budget-policy changes.

## Commands

| Command | Result |
| --- | --- |
| `pnpm lint:check` | Pass. ESLint completed with zero warnings, and `eslint-disable` starter check reported OK. |
| `pnpm type-check` | Pass. `next typegen` completed and `tsc --noEmit` exited 0. |
| `pnpm test` | Pass. 345 test files passed; 3417 tests passed and 7 skipped. |
| `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build` | Pass. Existing `DYNAMIC_SERVER_USAGE` digests appeared during static generation, matching prior waves. |
| `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse` | Pass. Assertions processed 14 URLs and 42 runs. Remaining assertion results are 9 warning-level `total-byte-weight` items only. Temporary report uploads completed. This public upload path is acceptable here because the audited pages are public starter content. |
| LHR batch sanity script | Pass. Selected 42 files, 14 URLs, 3 runs per URL. Fetch range: `2026-05-24T10:27:20.396Z -> 2026-05-24T10:35:27.380Z`. |
| Route table extraction from `.lighthouseci/lhr-*.json` | Pass. Uses Lighthouse transfer-size metrics from `total-byte-weight`, `resource-summary`, and `network-requests`. |
| `python3 .codex/skills/avoid-ai-tropes/scripts/check.py docs/技术难题/Lighthouse零黄色归因.md` | Pass. No AI-trope patterns detected. |
| `git diff --check -- docs/技术难题/Lighthouse零黄色归因.md docs/superpowers/specs/2026-05-24-lighthouse-zero-yellow-attribution-design.md docs/superpowers/plans/2026-05-24-lighthouse-zero-yellow-attribution.md` | Pass. No whitespace errors. |

## Current fourteen-page table

This table uses the median selected LHR run per URL after sorting by
`total-byte-weight`, then LCP. Byte values are Lighthouse network transfer-size
metrics.

| URL | Class | Total | JS | CSS | Font | Image | Document | Other | LCP ms | Over 490KB |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en` | Home | 475219 | 299621 | 106090 | 44686 | 0 | 21774 | 3048 | 4007 | 0 |
| `/zh` | Home | 476570 | 299621 | 106090 | 44686 | 0 | 23125 | 3048 | 4024 | 0 |
| `/en/about` | About | 477494 | 301728 | 106090 | 44686 | 0 | 21942 | 3048 | 3609 | 0 |
| `/zh/about` | About | 478827 | 301728 | 106090 | 44686 | 0 | 23275 | 3048 | 3612 | 0 |
| `/en/contact` | Contact | 518168 | 331935 | 106090 | 44686 | 0 | 32409 | 3048 | 3703 | 28168 |
| `/zh/contact` | Contact | 520704 | 331935 | 106090 | 44686 | 0 | 34945 | 3048 | 3719 | 30704 |
| `/en/products` | Listing | 503673 | 307040 | 106090 | 44686 | 0 | 19339 | 26518 | 3759 | 13673 |
| `/zh/products` | Listing | 506041 | 307040 | 106090 | 44686 | 0 | 20470 | 27755 | 3761 | 16041 |
| `/en/blog` | Listing | 514122 | 293824 | 106090 | 44686 | 0 | 17570 | 51952 | 3463 | 24122 |
| `/zh/blog` | Listing | 516752 | 293824 | 106090 | 44686 | 0 | 18680 | 53472 | 3703 | 26752 |
| `/en/products/north-america` | Product detail | 607869 | 346838 | 106090 | 69088 | 2907 | 27532 | 55414 | 3996 | 117869 |
| `/zh/products/north-america` | Product detail | 611414 | 346838 | 106090 | 69088 | 2907 | 29064 | 57427 | 4059 | 121414 |
| `/en/blog/prepare-before-launch` | Blog article | 489020 | 293824 | 106090 | 44686 | 0 | 17659 | 26761 | 3613 | 0 |
| `/zh/blog/prepare-before-launch` | Blog article | 491160 | 293824 | 106090 | 44686 | 0 | 18834 | 27726 | 3708 | 1160 |

## Remaining yellow URLs

The table below uses the median selected LHR route table totals. LHCI
`assertion-results.json` independently confirms the same nine warning-level
URLs, all from `total-byte-weight`, with no error-level assertion failures. The
assertion `actual` value can differ slightly from the median route-table value
because LHCI assertion aggregation selects from the three run values.

| URL | Median total bytes | Median over 490KB | LHCI assertion actual |
| --- | ---: | ---: | ---: |
| `/en/contact` | 518168 | 28168 | 518168 |
| `/zh/contact` | 520704 | 30704 | 520704 |
| `/en/products` | 503673 | 13673 | 503673 |
| `/zh/products` | 506041 | 16041 | 506041 |
| `/en/blog` | 514122 | 24122 | 514086 |
| `/zh/blog` | 516752 | 26752 | 516740 |
| `/en/products/north-america` | 607869 | 117869 | 607846 |
| `/zh/products/north-america` | 611414 | 121414 | 611393 |
| `/zh/blog/prepare-before-launch` | 491160 | 1160 | 491160 |

## Shared resource matrix

`Total across routes` is audit-surface exposure only. It is not a per-route
saving and must not be used as before/after savings. Candidate repair ranking
uses per-route transfer and affected route count separately.

| Resource | Type | Route count | Max transfer | Total across routes |
| --- | --- | ---: | ---: | ---: |
| `/_next/static/chunks/11sfep3~jwnd~.css` | Stylesheet | 14 | 102256 | 1431584 |
| `/_next/static/chunks/0uety2vcipkf9.js` | Script | 14 | 74327 | 1040578 |
| `/_next/static/media/cf514f5d0007dafa-s.p.0lok5zj4ubzox.woff2` | Font | 14 | 44686 | 625604 |
| `/_next/static/chunks/11~jx33~vd1zj.js` | Script | 14 | 38703 | 541842 |
| `/_next/static/chunks/09ylxs517m3di.js` | Script | 14 | 20453 | 286342 |
| `/_next/static/chunks/00mdli4.~1w1m.js` | Script | 14 | 19810 | 277340 |
| `/_next/static/chunks/0971qs.~.2_x..js` | Script | 14 | 17316 | 242424 |
| `/_next/static/chunks/0_904ofvws2zr.js` | Script | 14 | 14226 | 199164 |
| `/_next/static/chunks/05ryhx8s-_cu1.js` | Script | 14 | 12397 | 173558 |
| `/_next/static/chunks/0vkl4asjh422h.js` | Script | 14 | 11853 | 165942 |
| `/_next/static/chunks/15f3sg68dsfe_.js` | Script | 14 | 11223 | 157122 |
| `/_next/static/chunks/11uf-~67pgjip.js` | Script | 14 | 10748 | 150472 |
| `/_next/static/chunks/0xco132-6i40d.js` | Script | 14 | 10574 | 148036 |
| `/_next/static/chunks/0zfadd0c21~n5.js` | Script | 14 | 10034 | 140476 |
| `/_next/static/chunks/0s14hsss.f50y.js` | Script | 14 | 9213 | 128982 |
| `/_next/static/chunks/0avzk-vy1n8zs.js` | Script | 14 | 6904 | 96656 |
| `/_next/static/chunks/turbopack-147cf6qlturoo.js` | Script | 14 | 6053 | 84742 |
| `/_next/static/chunks/0~dosmejdukc6.js` | Script | 14 | 5705 | 79870 |
| `/_next/static/chunks/155fk-zm_.0pk.js` | Script | 14 | 4309 | 60326 |
| `/_next/static/chunks/0__-z_mz2ilos.js` | Script | 14 | 4121 | 57694 |
| `/_next/static/chunks/0gz86_siys95i.css` | Stylesheet | 14 | 3834 | 53676 |
| `/_next/static/chunks/0tevxf7zai0uu.js` | Script | 14 | 3761 | 52654 |
| `/favicon.ico` | Other | 14 | 3048 | 42672 |
| `/_next/static/chunks/117i_m91.6jgn.js` | Script | 14 | 2094 | 29316 |

Source notes for the shared floor:

- Home and About pages currently sit around 475-479 KB, leaving only about
  11-15 KB below the 490 KB global warning. Shared-floor work needs fresh
  before/after proof; chunk presence alone is not enough to claim a saving.
- `src/app/[locale]/layout.tsx:98-138` wraps all pages in
  `NextIntlClientProvider`, `ThemeProvider`, `LightMotionProvider`,
  `NavigationProgressBar`, `AttributionBootstrap`, `Header`, `Footer`,
  `LazyThemeSwitcher`, and `LazyCookieConsentIsland`.
- `src/lib/i18n/client-messages.ts:13-21` sends fixed client message namespaces
  to the client. `blog` is not in that list, so blog listing is not
  yellow because blog copy is globally sent to the client.
- `src/components/motion/light-motion-provider.tsx:1-14`,
  `src/components/motion/page-transition.tsx:1-47`, and
  `src/components/navigation/navigation-progress-bar.tsx:1-180` explain the
  shared motion chunks.
- `src/app/globals.css:9-18` imports Radix Themes CSS globally. Wave 2 already
  tested a static `DataCard` replacement and found only a 22-92 byte route-level
  transfer change, so repeating that exact fix is not justified.
- `src/app/[locale]/layout-fonts.ts:8-13` loads Open Sans weights
  `400/500/600/700` for all pages.

## Route-class deltas

| Delta | Total | JS | CSS | Font | Other | Document | Image | LCP ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| EN contact - EN about | 40674 | 30207 | 0 | 0 | 0 | 10467 | 0 | 94 |
| ZH contact - ZH about | 41877 | 30207 | 0 | 0 | 0 | 11670 | 0 | 107 |
| EN products - EN home | 28454 | 7419 | 0 | 0 | 23470 | -2435 | 0 | -248 |
| ZH products - ZH home | 29471 | 7419 | 0 | 0 | 24707 | -2655 | 0 | -263 |
| EN blog listing - EN article | 25102 | 0 | 0 | 0 | 25191 | -89 | 0 | -150 |
| ZH blog listing - ZH article | 25592 | 0 | 0 | 0 | 25746 | -154 | 0 | -5 |
| EN blog listing - EN home | 38903 | -5797 | 0 | 0 | 48904 | -4204 | 0 | -544 |
| ZH blog listing - ZH home | 40182 | -5797 | 0 | 0 | 50424 | -4445 | 0 | -321 |
| EN product detail - EN products | 104196 | 39798 | 0 | 24402 | 28896 | 8193 | 2907 | 237 |
| ZH product detail - ZH products | 105373 | 39798 | 0 | 24402 | 29672 | 8594 | 2907 | 298 |
| ZH home - EN home | 1351 | 0 | 0 | 0 | 0 | 1351 | 0 | 17 |
| ZH product detail - EN product detail | 3545 | 0 | 0 | 0 | 2013 | 1532 | 0 | 63 |

### RSC prefetch attribution

The route deltas show a strong `other` bucket pattern. `Other total` is the
Lighthouse resource-summary bucket and includes the shared `/favicon.ico`
transfer. `RSC transfer` is only `text/x-component` transfer from linked-route
prefetch requests, excluding the favicon.

| Route | Other total | RSC transfer | Main observed `text/x-component` requests | Interpretation |
| --- | ---: | ---: | --- | --- |
| `/en/blog` | 51952 | 48904 | `/en/blog/use-resources-and-contact`, `/en/blog/prepare-before-launch`, `/en/blog/showcase-site-pages` | Blog listing prefetches article routes from article card links in `src/app/[locale]/blog/page.tsx:64-84`. |
| `/zh/blog` | 53472 | 50424 | `/zh/blog/use-resources-and-contact`, `/zh/blog/prepare-before-launch`, `/zh/blog/showcase-site-pages` | Same pattern as English, slightly larger Chinese RSC payloads. |
| `/en/products` | 26518 | 23470 | `/en` | Products listing prefetches the home route through catalog breadcrumb links in `src/components/products/catalog-breadcrumb-view.tsx:28-39`. |
| `/zh/products` | 27755 | 24707 | `/zh` | Same as English, slightly larger Chinese route payloads. |
| `/en/products/north-america` | 55414 | 52366 | `/en/contact`, `/en`, `/en/products` | Product detail prefetches contact inquiry links, home, and products links from breadcrumb and CTA surfaces. |
| `/zh/products/north-america` | 57427 | 54379 | `/zh/contact`, `/zh`, `/zh/products` | Same as English, slightly larger Chinese route payloads. |
| `/en/blog/prepare-before-launch` | 26761 | 23713 | `/en/blog` | Blog article prefetches the back-to-blog link in `src/app/[locale]/blog/[slug]/page.tsx:78-83`. |
| `/zh/blog/prepare-before-launch` | 27726 | 24678 | `/zh/blog` | Same pattern; this page is only 1160 bytes over 490KB. |

This is the clearest low-risk opportunity. It should still be proven by a
before/after Wave 4B run; Wave 4A only establishes the current transfer
opportunity.

Blog listing does not show a document/content or structured-data primary cause:
there is no blog listing JSON-LD in `src/app/[locale]/blog/page.tsx:1-89`, and
blog listing has smaller document transfer than both home pages. Its increase
over home is dominated by RSC transfer in the `other` bucket.

### Contact attribution

Contact is not an RSC-prefetch problem. It has the same `other` bytes as green
home/about pages.

Evidence:

- Contact vs about delta is about 40-42 KB total.
- JS accounts for 30207 bytes of that delta in both locales.
- Document accounts for 10467 bytes in English and 11670 bytes in Chinese.
- `src/app/[locale]/contact/contact-page-sections.tsx:210-214` mounts
  `ContactFormIsland` with a static fallback.
- `src/components/contact/contact-form-island.tsx:41-44` dynamically imports
  `@/components/forms/contact-form-container`.
- `src/components/contact/contact-form-island.tsx:93-114` loads that dynamic
  form module immediately on mount.
- `src/components/forms/lazy-turnstile.tsx:43-47` lazy-loads the Turnstile
  widget, and `src/components/forms/lazy-turnstile.tsx:101-104` still has an
  idle fallback path.

Contact can likely be improved, but it touches inquiry conversion and bot
protection timing. It should not be mixed into the first small prefetch repair.

### Product detail attribution

Product detail is the largest remaining class and has multiple sources:

- JS: +39798 bytes vs products listing.
- Font: +24402 bytes from
  `/_next/static/media/5b0229109f6656bb-s.1455rc8vwuctw.woff2`, present only on
  the two product-detail URLs.
- Other: +28896 to +29672 bytes vs products listing, mostly RSC prefetches for
  contact, home, and products routes.
- Document: +8193 to +8594 bytes vs products listing.
- Image: +2907 bytes from the product fixture SVG.

Source evidence:

- `src/app/[locale]/products/[market]/page.tsx:70-151` renders JSON-LD,
  breadcrumb, hero, family sections, trust signals, and CTA.
- Historical `src/app/[locale]/products/[market]/market-page-sections.tsx` and
  `src/components/products/family-section.tsx` paths added inquiry/contact
  links when this attribution was recorded. S2 retired those paths after S1
  moved current product detail rendering to `TUCSENBERG_PRODUCT_PAGES`.
- Historical `src/components/products/family-section.tsx` rendered the visible
  check mark glyph. Wave 2 found the product-detail font delta was a
  symbol-subset issue, not a separate removable font weight.
- `src/components/products/spec-table.tsx:22-61` and
  `src/components/products/product-specs.tsx:25-55,137-194` render dense spec
  tables with `DataCard`.
- `src/components/ui/data-card.tsx:1-23` and
  `src/components/ui/badge.tsx:1-59` go through Radix Themes pilot wrappers.
  Because Wave 2 already measured a negligible route-level saving from a static
  `DataCard` attempt, Radix should not be treated as the first standalone fix.
- `src/app/[locale]/products/[market]/market-jsonld.ts:11-44` and
  `src/components/seo/json-ld-script.tsx:81-99` explain part of the document
  payload through server-rendered JSON-LD.

Product detail should be handled as a separate wave after prefetch and contact
results are known.

## Candidate repair backlog

These are estimated transfer opportunities or upper bounds from the current
reports. They are not verified savings. Real savings require a later repair
branch with before/after Lighthouse data.

| Candidate | Target routes | Evidence | Estimated transfer opportunity, not verified savings | Risk | Wave 4B decision |
| --- | --- | --- | ---: | --- | --- |
| Disable automatic RSC prefetch for non-critical listing and article navigation links | Blog listing, products listing, blog article | RSC transfer is 23-50 KB on listing/article routes; requests are `text/x-component` for linked routes; source links lack `prefetch={false}` in blog cards, products listing catalog breadcrumb, and article back-to-blog links | Up to about 23-50 KB on affected routes; enough to likely clear products listing, blog listing, and `/zh/blog/prepare-before-launch` | Low-medium. Navigation behavior stays the same, but perceived click latency can change and needs smoke testing. Products listing breadcrumb work must be route-specific or instance-specific because product detail uses the same breadcrumb view | **Do first** as Wave 4B small repair |
| Contact form load timing review | `/en/contact`, `/zh/contact` | Contact has +30207 JS and +10-12 KB document vs about; form island dynamically imports form container immediately on mount | About 30 KB JS opportunity if non-critical form code can be deferred while the form security contract stays unchanged; not proven | Medium-high. Contact conversion, Turnstile token handling, server verification, rate limiting, validation, and error fallback are security and revenue paths | Do after prefetch only if contact remains yellow; must include contact submission, token reset, and Turnstile failure-path regression checks |
| Product-detail font symbol experiment | Product detail only | Product detail loads one extra 24402-byte font subset; source renders visible check mark glyph in family highlights | Up to 24402 bytes on product detail only | Medium. Visual baseline and accessibility need review | Separate product-detail wave, not first |
| Product-detail RSC prefetch reduction | Product detail only | Product detail `other` is 55-57 KB and includes contact/home/products RSC fetches | Up to about 52-54 KB on product detail, but still not enough alone | Medium. Product detail links are closer to inquiry conversion and should not be mixed into listing/article cleanup | Separate product-detail sublane; reassess after the first prefetch lane |
| Shared motion/client floor audit | All 14 routes | Shared motion chunks and layout client islands appear on every URL; green pages are only 11-15 KB under global warning | Potentially material, but no before/after evidence in Wave 4A | Medium-high. Page transition and navigation UX can regress | Defer until route prefetch evidence lands |
| Radix static `DataCard` retry | Product detail and contact static surfaces | Radix CSS and wrappers exist, but Wave 2 static `DataCard` test saved only 22-92 bytes route-level | No current evidence of material saving from the same attempt | Medium | **Do not retry as-is** |

## No-go items

- Do not loosen the 490000-byte global `total-byte-weight` warning.
- Do not introduce route-class hard failures while current debt is still known
  and measured.
- Do not delete business content, product specs, blog articles, JSON-LD, or
  contact form functionality to reduce transfer size.
- Do not delete, disable, bypass, or weaken Turnstile, server-side Turnstile
  verification, rate limiting, form validation, token reset behavior, or contact
  error fallbacks for byte savings.
- Do not let contact forms submit without a valid Turnstile token where the
  current contract requires one.
- Do not treat Lighthouse treemap `resourceBytes` as network-transfer savings.
- Do not use `totalAcrossRoutes` from the shared matrix as per-page savings.
- Do not repeat the Wave 2 static `DataCard` attempt without a new hypothesis;
  it already measured as non-material.
- Do not treat `/zh/blog/prepare-before-launch` as a standalone repair target.
  It is only 1160 bytes over and should clear only as part of a broader fix.
- Do not commit `.lighthouseci/`, `.cursor/`, `.claude/`, local MCP config, or
  unrelated AIFS documents.
- Do not use LHCI temporary public storage for pages containing customer-private
  copy, unreleased assets, internal paths, or sensitive data. Switch to local or
  private report handling first.

## Recommendation

Proceed to Wave 4B, but keep it narrow:

1. First repair lane: add a measured prefetch policy for non-critical internal
   links on blog listing, products listing, and blog article surfaces. This
   includes blog card links, the blog article back link, and the products
   listing catalog breadcrumb. Do not include product-detail inquiry links,
   product-detail CTA links, or product-detail breadcrumb links in the first
   lane. If the products listing breadcrumb is changed, the change must be
   route-specific or instance-specific; do not unconditionally change the shared
   `CatalogBreadcrumbView` in a way that also changes product detail.
2. Run a full fourteen-page Lighthouse before/after comparison.
3. If products listing, blog listing, and the Chinese blog article clear, close
   that lane and decide between:
   - contact form load timing, or
   - a dedicated product-detail payload wave.

Do not start with Radix or font changes. They are either already measured as
low value in the same form, or need UI foundation review and visual regression
checks. The prefetch evidence is clearer, smaller in scope, and directly maps
to several of the remaining yellow pages.
