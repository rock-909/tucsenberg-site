> Historical.

# D7b Message Semantics and Locale Residue Design

## Status

- Date: 2026-07-19
- Cluster: M3 Cluster 4
- Base: D7a exact SHA `583312c53f851be42e16e4861f463ef62b4dcf6b`
- Worktree: `/Users/Data/code/tucsenberg-site/.worktrees/m3-d7b`
- Branch: `refactor/m3-d7b-message-semantics`
- Delivery state: stop at `READY_FOR_CLUSTER`; do not merge before Cluster 4 acceptance

D7a is already internally accepted as `READY_FOR_CLUSTER`. D7b is a stacked
successor and must preserve the D7a behavior. The owner has approved continuous
Cluster 4 execution, so this design resolves the live implementation details
without reopening the multilingual architecture or the D7a -> D7b -> C7 order.

## Goal

Replace starter-era homepage message names with business-semantic names and
remove locale residue that has no live consumer. Buyer-visible English copy,
section order, product links, diagrams, locale routing, retired `/zh/**`
behavior, and email delivery behavior must remain unchanged.

The result should make a future locale author translate Tucsenberg concepts,
not reverse-engineer starter concepts such as `problems`, `structure`,
`cloudflareFoundation`, or `deploy`.

## Live inventory corrections

The old execution note has drifted in two places:

- `emailTemplates.runtimeDefaultLocale` was already removed before this task.
  D7b will record that fact but will not manufacture a deletion or a
  negative-space guard. The active English `emailTemplates` runtime remains.
- The three dead `LOCALES_CONFIG` fields are `prefixes`, `displayNames`, and
  `triggerLabels`. `retiredLocales`, `timeZones`, and `currencies` all have live
  runtime consumers and are not cleanup targets.

The homepage mock also has false-green gaps: it omits product link labels, the
FRP badge, and the fifth buying step. D7b must make the final semantic paths
complete rather than only renaming the subset currently exercised.

## Approaches considered

### Keep aliases for old keys

This would let old and new paths coexist, but it would create duplicate message
truth, weaken the usage gate, and force future locales to maintain keys that no
runtime should read. Rejected.

### Rename only the exact examples in the old note

Renaming `problems`, `est`, `countries`, and `cloudflareFoundation` alone would
leave sibling names such as `answer`, `startPath`, `range`, `production`,
`brand`, and `deploy` with the same starter-era mismatch. The object would be
half semantic and half historical. Rejected.

### Atomically rename the complete live collections and delete proven residue

Rename each homepage collection from physical pack through configuration,
consumer, usage gate, mocks, and tests in one stacked PR. Keep no aliases.
Consolidate the parallel product-card arrays into one descriptor tuple. Move
copyright sentence ownership into the locale pack while retaining factual
placeholder interpolation. Delete only fields and CSS rules proven unused.
Selected.

## Homepage semantic contract

### Product lines

Rename the namespace and section key:

```text
home.problems -> home.productLines
```

Use canonical product-line semantics for the item IDs:

```text
structure    -> absFloodBarriers
content      -> aluminumFloodGates
deployment   -> absorbentFloodBags
inquiry      -> floodTubeDams
multilingual -> frpFloodBarriers
```

Replace the parallel key array, link map, glyph map, and badge array with one
ordered descriptor tuple. Each row owns:

- the camelCase message key;
- the canonical product slug;
- the existing diagram kind;
- whether the row reads the optional badge message.

The tuple is the single order and mapping truth. Product route existence still
belongs to `single-site-product-catalog.ts`; D7b does not duplicate product
specifications or labels.

Rename live code identifiers with the same concept:

```text
SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS -> SINGLE_SITE_HOME_PRODUCT_LINES
HomeProblemSection                        -> HomeProductLinesSection
home-problem-section                      -> home-product-lines-section
content.problems                          -> content.productLines
homeSections.problems                     -> homeSections.productLines
```

### Buyer segments

Rename the namespace:

```text
home.answer -> home.buyerSegments
```

Rename the four item IDs:

```text
pageStructure        -> dealersDistributors
replacementSurface   -> importersBrands
inquiryPath          -> contractorsProjects
cloudflareFoundation -> smallBusinessBuyers
```

Rename the configuration and component identifiers:

```text
SINGLE_SITE_HOME_PUBLIC_DEMO_ANSWER_KEYS -> SINGLE_SITE_HOME_BUYER_SEGMENT_KEYS
HomeCapabilitiesSection                  -> HomeBuyerSegmentsSection
content.answers                          -> content.buyerSegments
homeSections.answer                      -> homeSections.buyerSegments
```

The buyer-visible heading remains "Who we supply". This is a key and code
semantic correction, not a copy rewrite.

### Buying process

Rename the namespace:

```text
home.startPath -> home.buyingProcess
```

Rename the five step IDs:

```text
brand   -> sendRfq
content -> quoteResponse
forms   -> paidSample
deploy  -> productionQc
ship    -> shipment
```

Rename the configuration and component identifiers:

```text
SINGLE_SITE_HOME_PUBLIC_DEMO_START_PATH_KEYS -> SINGLE_SITE_HOME_BUYING_PROCESS_STEP_KEYS
HomeStartPathSection                         -> HomeBuyingProcessSection
content.startPath                            -> content.buyingProcess
homeSections.startPath                       -> homeSections.buyingProcess
```

The fifth `shipment` step must be present in the page test fixture. Missing
fixture keys may not silently return their own path and count as proof.

### Hero proof

Rename all four proof IDs so the set is internally consistent:

```text
est        -> quoteSla
countries  -> warranty
range      -> factoryPool
production -> oem
```

Rename each paired `Label` key and update the switch, order tuple, message pack,
page fixture, and Hero tests atomically. These are semantic names only; values,
labels, order, and site-fact inputs remain unchanged.

`SINGLE_SITE_HOME_FINAL_TRUST_ITEMS` has no production consumer and exists only
to satisfy its own test. Delete it rather than renaming its dead value.

## Message usage governance

Dynamic template calls are proven by `message-key-usage-baseline.js`. Update the
three dynamic prefixes and the exact source names in the same commit as the
configuration rename:

```text
home.productLines.items.
home.buyerSegments.items.
home.buyingProcess.items.
```

The product-line descriptor consumer must derive keys from its `key` property.
Do not add compatibility prefixes, unused-key allowlists, or rules that merely
forbid the retired names. The gate should prove the final live collections.

## Copyright ownership

The locale pack must own sentence grammar:

```json
"copyright": "© {currentYear} {siteName}. All rights reserved."
```

Keep factual values in `SiteMessageValues`:

- `siteName`
- `companyName`
- `currentYear`

Delete `copyright.en`, `copyright.zh`, and the loader's `{copyright}` branch.
After that deletion the interpolation helpers no longer need a locale argument.
The year remains derived from checked-in company facts; do not use the runtime
clock and do not hardcode `2026` in the message.

Footer continues to read the strict `footer.copyright` key introduced by D7a.
Its test translator must interpolate the final factual placeholders instead of
recreating a copyright language map.

## Locale configuration cleanup

Delete only:

```text
LOCALES_CONFIG.prefixes
LOCALES_CONFIG.displayNames
LOCALES_CONFIG.triggerLabels
```

Remove tests that only proved these fields existed. Replace broad locale-shape
assertions with the positive live registry contract where needed.

Keep:

- `locales`, `defaultLocale`, and `localePrefix` for next-intl routing;
- `retiredLocales` for the `/zh` and `/zh/**` 404 plus noindex behavior;
- `timeZones` and `currencies` for request configuration;
- `getLocaleTimeZone`, `getLocaleCurrency`, and their runtime tests.

D7b does not add a language switcher or speculative display metadata. Those
fields can be designed when a real consumer exists.

## CSS residue

Delete the unused late duplicate block containing:

- `.font-chinese, [lang="zh"]`;
- `.zh-firstframe-title`;
- `:root[lang="zh"] [data-fast-lcp-zh="1"] ...`.

Keep the earlier `.font-chinese` utility, `--font-chinese` token, Tailwind theme
binding, body CJK fallback, and Footer font token. They are general glyph
fallback infrastructure, not retired locale routing.

## Active documentation

Update the live Footer design note that currently says `{copyright}` injects the
whole sentence. It must describe locale-owned grammar plus factual
`{currentYear}` / `{siteName}` interpolation. Broader execution-state cleanup
remains C7's responsibility.

## Test strategy

### RED: final semantic names

Before production renames, update focused tests to expect:

- final section order and semantic tuples;
- final product, buyer-segment, buying-process, and Hero paths;
- all product `linkLabel` values, the FRP badge, and all five buying steps;
- final copyright source template and runtime value;
- the reduced locale registry shape.

Run the focused tests and confirm they fail because the old keys or fields still
exist. Tests must exercise real page/config/message behavior, not source-text
absence.

### GREEN: atomic implementation

Rename physical messages, configuration, page consumers, Hero consumers,
message-usage derived consumers, fixtures, and tests together. Then run:

```bash
pnpm exec vitest run \
  src/config/__tests__/single-site-page-expression.test.ts \
  'src/app/[locale]/__tests__/page.test.tsx' \
  src/components/sections/__tests__/hero-section.test.tsx \
  src/lib/__tests__/load-messages-runtime.test.ts \
  src/lib/i18n/__tests__/site-message-values.test.ts \
  src/components/footer/__tests__/Footer.test.tsx \
  src/config/__tests__/paths.test.ts \
  tests/architecture/tucsenberg-site-contract.test.ts \
  src/i18n/__tests__/request.test.ts \
  src/__tests__/middleware-locale-cookie.test.ts \
  tests/unit/middleware.test.ts
node scripts/starter-checks.js message-key-usage
pnpm content:check
pnpm type-check
pnpm test
pnpm build
git diff --check
```

No new E2E is required: rendered copy, order, links, and route behavior do not
change. The final Cluster 4 Playwright suite runs on the C7 tip.

## Out of scope

- adding a second locale or language switcher;
- changing locale prefix strategy;
- removing retired `/zh/**` route protection;
- translating the runtime email system;
- changing buyer-visible homepage copy, order, links, or diagrams;
- changing the factual copyright-year derivation;
- D7a fallback behavior;
- C7's broad documentation and comment closure;
- buyer phone or WhatsApp fields;
- domain, PDF, product-photo, tube-dam MOQ, or legal-signature decisions;
- M2 or public-launch approval.

## Acceptance criteria

- Homepage physical messages, config, consumers, usage gate, mocks, and tests
  use only the final product-line, buyer-segment, buying-process, and Hero proof
  semantics.
- Product card order, links, glyphs, badge behavior, buyer-visible copy, and
  section order are unchanged.
- The homepage test fixture contains every dynamic leaf the runtime reads and
  cannot pass by rendering a missing key path.
- Copyright grammar lives in the locale pack; TypeScript owns only factual
  interpolation values and keeps the prerender-safe year rule.
- `prefixes`, `displayNames`, and `triggerLabels` are deleted without weakening
  locale routing, `/zh/**` retirement, time-zone, or currency behavior.
- zh-only first-frame CSS is gone while general CJK fallback infrastructure
  remains.
- `emailTemplates.runtimeDefaultLocale` remains absent without a new guard, and
  active English email templates remain intact.
- Focused tests, message usage, `content:check`, type-check, full tests, build,
  exact-SHA CI, and independent review have no P1/P2.
- D7b is marked `READY_FOR_CLUSTER`, not `ACCEPTED` or merged.
