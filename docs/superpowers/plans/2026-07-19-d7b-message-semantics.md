> Historical.

# D7b Message Semantics and Locale Residue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace starter-era homepage message names with complete Tucsenberg business semantics, move copyright grammar into the locale pack, and delete only proven locale residue without weakening future-locale or retired-route behavior.

**Architecture:** Keep the physical message packs as the only UI-copy source. Rename each dynamic collection atomically through config, runtime consumers, message-usage derivation, mocks, and tests; do not add aliases. Consolidate homepage product-card metadata into one descriptor tuple, keep factual message placeholders in TypeScript, and delete only configuration/CSS with no live consumer.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.7, TypeScript 6.0.3, next-intl 4.13.0, Vitest 4.1.8, Tailwind CSS 4.3.0.

---

## Execution constraints

- Work only in `/Users/Data/code/tucsenberg-site/.worktrees/m3-d7b` on `refactor/m3-d7b-message-semantics`.
- Base is D7a exact SHA `583312c53f851be42e16e4861f463ef62b4dcf6b`.
- Do not touch the main worktree or PR #102.
- Do not merge D7a or D7b and do not start C7.
- Use `apply_patch` for manual edits. Do not use `rm`, `rmdir`, `unlink`, `git rm`, `git clean`, or `find -delete`.
- Do not amend commits.
- Use `composer-2.5-fast` for Cursor implementation.
- Follow TDD: run the named RED command before the production change, then run the matching GREEN command.
- Keep Ponytail full: no aliases, compatibility maps, new generic translators, or new negative-space guards.
- Before editing the App Router page, read:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md
sed -n '1,220p' node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
sed -n '1,220p' node_modules/next/dist/docs/01-app/02-guides/internationalization.md
```

## Final semantic mapping

```text
home.problems -> home.productLines
  structure    -> absFloodBarriers
  content      -> aluminumFloodGates
  deployment   -> absorbentFloodBags
  inquiry      -> floodTubeDams
  multilingual -> frpFloodBarriers

home.answer -> home.buyerSegments
  pageStructure        -> dealersDistributors
  replacementSurface   -> importersBrands
  inquiryPath          -> contractorsProjects
  cloudflareFoundation -> smallBusinessBuyers

home.startPath -> home.buyingProcess
  brand   -> sendRfq
  content -> quoteResponse
  forms   -> paidSample
  deploy  -> productionQc
  ship    -> shipment

home.hero.proof
  est / estLabel               -> quoteSla / quoteSlaLabel
  countries / countriesLabel   -> warranty / warrantyLabel
  range / rangeLabel           -> factoryPool / factoryPoolLabel
  production / productionLabel -> oem / oemLabel
```

### Task 1: Write the final semantic contract tests

**Files:**
- Modify: `src/config/__tests__/single-site-page-expression.test.ts`
- Modify: `src/app/[locale]/__tests__/page.test.tsx`
- Modify: `src/components/sections/__tests__/hero-section.test.tsx`
- Modify: `src/lib/__tests__/load-messages-runtime.test.ts`

- [ ] **Step 1: Make page-expression tests expect the final live tuples**

Import the final exports and assert the real order and mappings:

```ts
import {
  SINGLE_SITE_HOME_BUYER_SEGMENT_KEYS,
  SINGLE_SITE_HOME_BUYING_PROCESS_STEP_KEYS,
  SINGLE_SITE_HOME_HERO_PROOF_ITEMS,
  SINGLE_SITE_HOME_PRODUCT_LINES,
  SINGLE_SITE_HOME_SECTION_ORDER,
} from "@/config/single-site-page-expression";

expect(SINGLE_SITE_HOME_SECTION_ORDER).toEqual([
  "hero",
  "productLines",
  "howToChoose",
  "buyingProcess",
  "buyerSegments",
  "verify",
  "faq",
  "finalCta",
]);

expect(SINGLE_SITE_HOME_PRODUCT_LINES).toEqual([
  {
    key: "absFloodBarriers",
    slug: "abs-flood-barriers",
    glyph: "boxwall",
  },
  {
    key: "aluminumFloodGates",
    slug: "aluminum-flood-gates",
    glyph: "gate",
  },
  {
    key: "absorbentFloodBags",
    slug: "absorbent-flood-bags",
    glyph: "bag",
  },
  {
    key: "floodTubeDams",
    slug: "flood-tube-dams",
    glyph: "tube",
  },
  {
    key: "frpFloodBarriers",
    slug: "frp-flood-barriers",
    glyph: "frp",
    hasBadge: true,
  },
]);

expect(SINGLE_SITE_HOME_BUYER_SEGMENT_KEYS).toEqual([
  "dealersDistributors",
  "importersBrands",
  "contractorsProjects",
  "smallBusinessBuyers",
]);

expect(SINGLE_SITE_HOME_BUYING_PROCESS_STEP_KEYS).toEqual([
  "sendRfq",
  "quoteResponse",
  "paidSample",
  "productionQc",
  "shipment",
]);

expect(SINGLE_SITE_HOME_HERO_PROOF_ITEMS).toEqual([
  "quoteSla",
  "warranty",
  "factoryPool",
  "oem",
]);
```

Delete the import and assertion for `SINGLE_SITE_HOME_FINAL_TRUST_ITEMS`; the
export has no runtime consumer.

- [ ] **Step 2: Replace the homepage mock with complete final paths**

Keep the existing sentinel copy values, but rename every path and add every
dynamic leaf the page reads:

```ts
const homeMessages: Record<string, string> = {
  // Keep the existing non-D7b hero and section leaves.
  "hero.proof.quoteSla": "Standard items",
  "hero.proof.quoteSlaLabel": "reply within 12 hours",
  "hero.proof.warranty": "3-year warranty",
  "hero.proof.warrantyLabel": "on all standard lines",
  "hero.proof.factoryPool": "Factory pool",
  "hero.proof.factoryPoolLabel": "supplies established brands",
  "hero.proof.oem": "OEM",
  "hero.proof.oemLabel": "private label ready",

  "productLines.title": "Five product lines",
  "productLines.description": "Product-line sentinel description.",
  "productLines.items.absFloodBarriers.title": "ABS barriers",
  "productLines.items.absFloodBarriers.description": "ABS description",
  "productLines.items.absFloodBarriers.linkLabel": "Explore ABS barriers",
  "productLines.items.aluminumFloodGates.title": "Aluminum gates",
  "productLines.items.aluminumFloodGates.description": "Gate description",
  "productLines.items.aluminumFloodGates.linkLabel": "Explore flood gates",
  "productLines.items.absorbentFloodBags.title": "Flood bags",
  "productLines.items.absorbentFloodBags.description": "Bag description",
  "productLines.items.absorbentFloodBags.linkLabel": "Explore flood bags",
  "productLines.items.floodTubeDams.title": "Tube dams",
  "productLines.items.floodTubeDams.description": "Tube description",
  "productLines.items.floodTubeDams.linkLabel": "Explore tube dams",
  "productLines.items.frpFloodBarriers.title": "FRP barriers",
  "productLines.items.frpFloodBarriers.description": "FRP description",
  "productLines.items.frpFloodBarriers.linkLabel": "Register interest",
  "productLines.items.frpFloodBarriers.badge": "New",

  "buyerSegments.title": "Who we supply",
  "buyerSegments.description": "Buyer segment sentinel description.",
  "buyerSegments.items.dealersDistributors.title": "Dealers",
  "buyerSegments.items.dealersDistributors.description": "Dealer description",
  "buyerSegments.items.importersBrands.title": "Importers",
  "buyerSegments.items.importersBrands.description": "Importer description",
  "buyerSegments.items.contractorsProjects.title": "Contractors",
  "buyerSegments.items.contractorsProjects.description": "Contractor description",
  "buyerSegments.items.smallBusinessBuyers.title": "Small businesses",
  "buyerSegments.items.smallBusinessBuyers.description": "Small-business description",

  "buyingProcess.title": "How we work",
  "buyingProcess.description": "Buying process sentinel description.",
  "buyingProcess.items.sendRfq.title": "Send RFQ",
  "buyingProcess.items.sendRfq.description": "RFQ description",
  "buyingProcess.items.quoteResponse.title": "Quote response",
  "buyingProcess.items.quoteResponse.description": "Quote description",
  "buyingProcess.items.paidSample.title": "Paid sample",
  "buyingProcess.items.paidSample.description": "Sample description",
  "buyingProcess.items.productionQc.title": "Production and QC",
  "buyingProcess.items.productionQc.description": "Production description",
  "buyingProcess.items.shipment.title": "Shipment",
  "buyingProcess.items.shipment.description": "Shipment description",
};
```

Do not paste a second full fixture. Rename the current keys in place and add the
missing leaves.

Make the translator strict so missing mock leaves fail the real page render:

```ts
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() => (key: string) => {
    const value = homeMessages[key];
    if (value === undefined) {
      throw new Error(`Missing home test message: ${key}`);
    }
    return value;
  }),
  setRequestLocale: vi.fn(),
}));
```

Rename positive selectors and section-order expectations:

```text
home-problem-section -> home-product-lines-section
problems             -> productLines
answer               -> buyerSegments
startPath            -> buyingProcess
```

- [ ] **Step 3: Make Hero tests expect the four final proof keys**

Update fixture keys and assertions to:

```ts
"hero.proof.quoteSla"
"hero.proof.quoteSlaLabel"
"hero.proof.warranty"
"hero.proof.warrantyLabel"
"hero.proof.factoryPool"
"hero.proof.factoryPoolLabel"
"hero.proof.oem"
"hero.proof.oemLabel"
```

Keep proof order and rendered values unchanged.

- [ ] **Step 4: Make runtime message tests require the final paths**

Replace starter-era path arrays with complete final paths, including all five
buying steps and all four Hero proof pairs. Use existing `expectStringPath`:

```ts
for (const key of [
  "absFloodBarriers",
  "aluminumFloodGates",
  "absorbentFloodBags",
  "floodTubeDams",
  "frpFloodBarriers",
] as const) {
  expectStringPath(messages, ["home", "productLines", "items", key, "title"]);
  expectStringPath(messages, [
    "home",
    "productLines",
    "items",
    key,
    "description",
  ]);
  expectStringPath(messages, [
    "home",
    "productLines",
    "items",
    key,
    "linkLabel",
  ]);
}

for (const key of [
  "dealersDistributors",
  "importersBrands",
  "contractorsProjects",
  "smallBusinessBuyers",
] as const) {
  expectStringPath(messages, ["home", "buyerSegments", "items", key, "title"]);
  expectStringPath(messages, [
    "home",
    "buyerSegments",
    "items",
    key,
    "description",
  ]);
}

for (const key of [
  "sendRfq",
  "quoteResponse",
  "paidSample",
  "productionQc",
  "shipment",
] as const) {
  expectStringPath(messages, ["home", "buyingProcess", "items", key, "title"]);
  expectStringPath(messages, [
    "home",
    "buyingProcess",
    "items",
    key,
    "description",
  ]);
}
```

- [ ] **Step 5: Run RED tests**

Run:

```bash
pnpm exec vitest run \
  src/config/__tests__/single-site-page-expression.test.ts \
  'src/app/[locale]/__tests__/page.test.tsx' \
  src/components/sections/__tests__/hero-section.test.tsx \
  src/lib/__tests__/load-messages-runtime.test.ts
```

Expected: FAIL because final exports and message paths do not exist and the old
runtime still reads the starter-era names.

### Task 2: Implement the atomic homepage semantic rename

**Files:**
- Modify: `messages/profiles/catalog/en/messages.json`
- Modify: `src/config/single-site-page-expression.ts`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/components/sections/hero-section.tsx`
- Modify: `scripts/quality/message-key-usage-baseline.js`
- Test: files changed in Task 1

- [ ] **Step 1: Rename the physical message tree without changing values**

Apply the exact mapping from the plan header. Preserve every English string and
object order. The final top-level home shape must include:

```json
{
  "hero": {
    "proof": {
      "quoteSla": "Standard items",
      "quoteSlaLabel": "reply within 12 hours",
      "warranty": "3-year warranty",
      "warrantyLabel": "on all standard lines",
      "factoryPool": "Factory pool",
      "factoryPoolLabel": "supplies established brands",
      "oem": "OEM",
      "oemLabel": "private label ready"
    }
  },
  "productLines": {},
  "buyerSegments": {},
  "buyingProcess": {}
}
```

The `{}` markers above mean "retain the renamed existing subtree"; do not
replace the real subtree with an empty object.

- [ ] **Step 2: Replace parallel product-card truth with one descriptor tuple**

In `single-site-page-expression.ts`, extend the existing product-catalog import
and add the diagram-kind type:

```ts
import {
  PRODUCT_CATALOG,
  type ProductMarketSlug,
} from "@/constants/product-catalog";
import type { TucsenbergProductDiagramKind } from "@/constants/tucsenberg-product-page-types";
```

Define:

```ts
export const SINGLE_SITE_HOME_PRODUCT_LINES = [
  {
    key: "absFloodBarriers",
    slug: "abs-flood-barriers",
    glyph: "boxwall",
  },
  {
    key: "aluminumFloodGates",
    slug: "aluminum-flood-gates",
    glyph: "gate",
  },
  {
    key: "absorbentFloodBags",
    slug: "absorbent-flood-bags",
    glyph: "bag",
  },
  {
    key: "floodTubeDams",
    slug: "flood-tube-dams",
    glyph: "tube",
  },
  {
    key: "frpFloodBarriers",
    slug: "frp-flood-barriers",
    glyph: "frp",
    hasBadge: true,
  },
] as const satisfies readonly {
  key: string;
  slug: ProductMarketSlug;
  glyph: TucsenbergProductDiagramKind;
  hasBadge?: true;
}[];

export const SINGLE_SITE_HOME_BUYER_SEGMENT_KEYS = [
  "dealersDistributors",
  "importersBrands",
  "contractorsProjects",
  "smallBusinessBuyers",
] as const;

export const SINGLE_SITE_HOME_BUYING_PROCESS_STEP_KEYS = [
  "sendRfq",
  "quoteResponse",
  "paidSample",
  "productionQc",
  "shipment",
] as const;

export const SINGLE_SITE_HOME_HERO_PROOF_ITEMS = [
  "quoteSla",
  "warranty",
  "factoryPool",
  "oem",
] as const;
```

Delete:

```text
SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS
SINGLE_SITE_HOME_PUBLIC_DEMO_ANSWER_KEYS
SINGLE_SITE_HOME_PUBLIC_DEMO_START_PATH_KEYS
SINGLE_SITE_HOME_PRODUCT_CARD_LINKS
SINGLE_SITE_HOME_PRODUCT_CARD_BADGE_KEYS
SINGLE_SITE_HOME_FINAL_TRUST_ITEMS
```

Change `SINGLE_SITE_HOME_SECTION_ORDER` to the final section names.

- [ ] **Step 3: Update the homepage consumer with no compatibility layer**

Remove `HOME_PRODUCT_CARD_GLYPHS`. Build the product card directly from the
descriptor:

```ts
productLines: SINGLE_SITE_HOME_PRODUCT_LINES.map(
  (productLine): HomeProductCardItem => ({
    title: t(`productLines.items.${productLine.key}.title`),
    description: t(`productLines.items.${productLine.key}.description`),
    href: `/products/${productLine.slug}`,
    linkLabel: t(`productLines.items.${productLine.key}.linkLabel`),
    glyph: productLine.glyph,
    ...(productLine.hasBadge
      ? { badge: t("productLines.items.frpFloodBarriers.badge") }
      : {}),
  }),
),
buyerSegments: SINGLE_SITE_HOME_BUYER_SEGMENT_KEYS.map((key) => ({
  title: t(`buyerSegments.items.${key}.title`),
  description: t(`buyerSegments.items.${key}.description`),
})),
buyingProcess: SINGLE_SITE_HOME_BUYING_PROCESS_STEP_KEYS.map((key, index) => ({
  number: String(index + 1).padStart(2, "0"),
  title: t(`buyingProcess.items.${key}.title`),
  description: t(`buyingProcess.items.${key}.description`),
})),
```

Rename section functions, `data-testid`, content properties, `homeSections`
keys, and static title/description calls to the final names. Do not change
markup, classes, links, order, or buyer-visible strings.

- [ ] **Step 4: Update Hero switch cases**

Use:

```ts
case "quoteSla":
  return {
    value: t("hero.proof.quoteSla", {
      established: siteFacts.company.established,
    }),
    label: t("hero.proof.quoteSlaLabel"),
  };
case "warranty":
  return {
    value: t("hero.proof.warranty", {
      countries: siteFacts.stats.exportCountries,
    }),
    label: t("hero.proof.warrantyLabel"),
  };
case "factoryPool":
  return {
    value: t("hero.proof.factoryPool"),
    label: t("hero.proof.factoryPoolLabel"),
  };
case "oem":
  return {
    value: t("hero.proof.oem"),
    label: t("hero.proof.oemLabel"),
  };
```

Do not change the current site-fact interpolation behavior even where the
English string currently has no placeholder; this task is naming-only.

- [ ] **Step 5: Update the positive message-usage derivation**

Replace the old prefixes and source names:

```js
[
  "home.productLines.items.",
  "homepage product lines are keyed by the approved product-line descriptors",
],
[
  "home.buyerSegments.items.",
  "homepage buyer segments are keyed by the approved buyer-segment tuple",
],
[
  "home.buyingProcess.items.",
  "homepage buying steps are keyed by the approved buying-process tuple",
],
```

Use collection consumers:

```js
{
  kind: "collection-values",
  file: "src/config/single-site-page-expression.ts",
  sourceName: "SINGLE_SITE_HOME_PRODUCT_LINES",
  valueProperty: "key",
  prefix: "home.productLines.items.",
  suffixes: [".title", ".description", ".linkLabel"],
  reason: "homepage product cards derive their message keys from the product-line descriptors",
},
{
  kind: "collection-values",
  file: "src/config/single-site-page-expression.ts",
  sourceName: "SINGLE_SITE_HOME_BUYER_SEGMENT_KEYS",
  prefix: "home.buyerSegments.items.",
  suffixes: [".title", ".description"],
  reason: "homepage buyer segments derive their exact keys from this tuple",
},
{
  kind: "collection-values",
  file: "src/config/single-site-page-expression.ts",
  sourceName: "SINGLE_SITE_HOME_BUYING_PROCESS_STEP_KEYS",
  prefix: "home.buyingProcess.items.",
  suffixes: [".title", ".description"],
  reason: "homepage buying steps derive their exact keys from this tuple",
},
```

Do not add old-prefix compatibility or unused-key baselines.

- [ ] **Step 6: Run GREEN semantic tests and gates**

Run:

```bash
pnpm exec vitest run \
  src/config/__tests__/single-site-page-expression.test.ts \
  'src/app/[locale]/__tests__/page.test.tsx' \
  src/components/sections/__tests__/hero-section.test.tsx \
  src/lib/__tests__/load-messages-runtime.test.ts
node scripts/starter-checks.js message-key-usage
pnpm content:check
pnpm type-check
```

Expected: all pass; message-key-usage reports no dynamic-prefix or unused-key
errors.

- [ ] **Step 7: Commit the semantic rename**

```bash
git add messages/profiles/catalog/en/messages.json src/config/single-site-page-expression.ts 'src/app/[locale]/page.tsx' src/components/sections/hero-section.tsx scripts/quality/message-key-usage-baseline.js src/config/__tests__/single-site-page-expression.test.ts 'src/app/[locale]/__tests__/page.test.tsx' src/components/sections/__tests__/hero-section.test.tsx src/lib/__tests__/load-messages-runtime.test.ts
git commit -m "refactor: rename homepage messages to business semantics"
```

### Task 3: Move copyright grammar into the locale pack

**Files:**
- Modify: `messages/profiles/catalog/en/messages.json`
- Modify: `src/lib/i18n/site-message-values.ts`
- Modify: `src/lib/i18n/load-messages.ts`
- Modify: `src/lib/i18n/__tests__/site-message-values.test.ts`
- Modify: `src/lib/__tests__/load-messages-runtime.test.ts`
- Modify: `src/components/footer/__tests__/Footer.test.tsx`
- Modify: `docs/design/可迁移设计资产-剖面动画与页脚.md`

- [ ] **Step 1: Write the copyright RED assertions**

Change the source-template assertion to:

```ts
expect(rawMessages.footer.copyright).toBe(
  "© {currentYear} {siteName}. All rights reserved.",
);
```

Keep the existing runtime assertion:

```ts
expect(enMessages.footer.copyright).toBe(
  `© ${currentYear} ${SINGLE_SITE_CONFIG.name}. All rights reserved.`,
);
```

Change the unresolved-placeholder regex to:

```ts
const SITE_MESSAGE_PLACEHOLDER_PATTERN =
  /\{(?:siteName|companyName|currentYear)\}/u;
```

In `site-message-values.test.ts`, expect exactly the factual shape:

```ts
expect(values).toEqual({
  siteName: SINGLE_SITE_CONFIG.name,
  companyName: SINGLE_SITE_FACTS.company.name,
  currentYear: CHECKED_IN_SITE_YEAR,
});
```

Run:

```bash
pnpm exec vitest run \
  src/lib/i18n/__tests__/site-message-values.test.ts \
  src/lib/__tests__/load-messages-runtime.test.ts
```

Expected: FAIL because the pack still uses `{copyright}` and the value object
still contains `copyright.en/zh`.

- [ ] **Step 2: Put locale grammar in the physical pack**

Change only the Footer leaf:

```json
"copyright": "© {currentYear} {siteName}. All rights reserved."
```

- [ ] **Step 3: Reduce `SiteMessageValues` to facts**

Use:

```ts
export interface SiteMessageValues {
  siteName: string;
  companyName: string;
  currentYear: string;
}

export function getSiteMessageValues(): SiteMessageValues {
  const currentYear = String(
    SINGLE_SITE_FACTS.company.established +
      SINGLE_SITE_FACTS.company.yearsInBusiness,
  );

  return {
    siteName: SINGLE_SITE_CONFIG.name,
    companyName: SINGLE_SITE_FACTS.company.name,
    currentYear,
  };
}
```

- [ ] **Step 4: Remove locale-dependent copyright interpolation**

The replacement function should be:

```ts
function interpolateSiteMessageString(
  value: string,
  siteValues: SiteMessageValues,
): string {
  const replacements: Record<string, string> = {
    siteName: siteValues.siteName,
    companyName: siteValues.companyName,
    currentYear: siteValues.currentYear,
  };

  return value.replace(
    /\{(siteName|companyName|currentYear)\}/gu,
    (match, key: string) => replacements[key] ?? match,
  );
}
```

Remove `locale` from `interpolateSiteMessageValues` and every recursive call.
Keep `safeLocale` only for selecting the physical pack.

- [ ] **Step 5: Update the Footer test translator without a language map**

Replace its special `{copyright}` branch with factual placeholder replacement:

```ts
const siteValues = getSiteMessageValues();

return value.replace(
  /\{(siteName|companyName|currentYear)\}/gu,
  (match, key: string) =>
    siteValues[key as keyof typeof siteValues] ?? match,
);
```

Do not add another copyright object to the test.

- [ ] **Step 6: Update the one active Footer design statement**

State that the locale pack owns the sentence and the loader interpolates
`{currentYear}` and `{siteName}` from checked-in site facts. Do not update broad
M3 status here; C7 owns final documentation closure.

- [ ] **Step 7: Run GREEN copyright tests**

Run:

```bash
pnpm exec vitest run \
  src/lib/i18n/__tests__/site-message-values.test.ts \
  src/lib/__tests__/load-messages-runtime.test.ts \
  src/components/footer/__tests__/Footer.test.tsx
pnpm content:check
pnpm type-check
```

Expected: all pass; final runtime copyright remains unchanged.

- [ ] **Step 8: Commit copyright ownership**

```bash
git add messages/profiles/catalog/en/messages.json src/lib/i18n/site-message-values.ts src/lib/i18n/load-messages.ts src/lib/i18n/__tests__/site-message-values.test.ts src/lib/__tests__/load-messages-runtime.test.ts src/components/footer/__tests__/Footer.test.tsx 'docs/design/可迁移设计资产-剖面动画与页脚.md'
git commit -m "refactor: move copyright grammar into locale messages"
```

### Task 4: Delete proven locale and CSS residue

**Files:**
- Modify: `src/config/paths/locales-config.ts`
- Modify: `src/config/__tests__/paths.test.ts`
- Modify: `tests/architecture/tucsenberg-site-contract.test.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the positive locale-registry RED contract**

Replace tests that read `prefixes`, `displayNames`, or `triggerLabels` with a
positive live registry assertion:

```ts
expect(Object.keys(LOCALES_CONFIG)).toEqual([
  "locales",
  "defaultLocale",
  "localePrefix",
  "retiredLocales",
  "timeZones",
  "currencies",
]);
```

Keep runtime assertions for:

```ts
expect(LOCALES_CONFIG.retiredLocales).toEqual(["zh"]);
expect(getLocaleTimeZone("en")).toBe("UTC");
expect(getLocaleCurrency("en")).toBe("USD");
```

Remove loops whose only purpose is proving `prefixes` or `displayNames` exists
for each locale.

Run:

```bash
pnpm exec vitest run \
  src/config/__tests__/paths.test.ts \
  tests/architecture/tucsenberg-site-contract.test.ts
```

Expected: FAIL because the three dead fields still exist.

- [ ] **Step 2: Delete only the three dead fields**

The final config object keeps:

```ts
export const LOCALES_CONFIG = Object.freeze({
  locales: Object.freeze(["en"] as const),
  defaultLocale: "en" as const,
  localePrefix: "never" as const,
  retiredLocales: Object.freeze(["zh"] as const),
  timeZones: Object.freeze({ en: "UTC" }),
  currencies: Object.freeze({ en: "USD" }),
} as const);
```

Do not change helper exports or locale routing.

- [ ] **Step 3: Delete only the late zh-specific CSS block**

Delete the block from the late duplicate `.font-chinese, [lang="zh"]` selector
through the end of the `data-fast-lcp-zh` rule. Keep:

```text
--font-chinese
@theme inline --font-chinese binding
body font-family fallback
the earlier .font-chinese utility
footer-style-tokens.ts reference
```

Do not add a source guard for the deleted selectors.

- [ ] **Step 4: Prove retired-route and request locale behavior remains**

Run:

```bash
pnpm exec vitest run \
  src/config/__tests__/paths.test.ts \
  tests/architecture/tucsenberg-site-contract.test.ts \
  src/i18n/__tests__/routing.test.ts \
  src/i18n/__tests__/request.test.ts \
  tests/architecture/i18n-locale-truth-parity.test.ts \
  src/__tests__/middleware-locale-cookie.test.ts \
  tests/unit/middleware.test.ts
pnpm type-check
```

Expected: all pass; `/zh/**` retirement, time zone, currency, and English-only
routing remain intact.

- [ ] **Step 5: Commit the residue cleanup**

```bash
git add src/config/paths/locales-config.ts src/config/__tests__/paths.test.ts tests/architecture/tucsenberg-site-contract.test.ts src/app/globals.css
git commit -m "refactor: delete unused locale metadata and zh css residue"
```

### Task 5: Full D7b verification, self-review, and PR handoff

**Files:**
- Create PR from: `refactor/m3-d7b-message-semantics`

Do not update the broad M3 status documents here. C7 owns the final live-state
rewrite after the complete code stack exists.

- [ ] **Step 1: Scan the final live semantics and protected boundaries**

Run:

```bash
rg -n "PUBLIC_DEMO|cloudflareFoundation|home\.problems|home\.answer|home\.startPath|hero\.proof\.(est|countries|range|production)|runtimeDefaultLocale" src messages scripts tests --glob '!**/*.snap'
rg -n "retiredLocales|getLocaleTimeZone|getLocaleCurrency|--font-chinese" src tests
```

Expected:

- first scan has no live production/test starter-era semantic hits;
- `runtimeDefaultLocale` has no code/message hit;
- second scan proves the retained live boundaries.

Do not turn these scans into new forbidden-name gates.

- [ ] **Step 2: Run focused D7b verification**

Run:

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
  src/i18n/__tests__/routing.test.ts \
  src/i18n/__tests__/request.test.ts \
  tests/architecture/i18n-locale-truth-parity.test.ts \
  src/__tests__/middleware-locale-cookie.test.ts \
  tests/unit/middleware.test.ts \
  tests/architecture/email-copy-boundary.test.ts \
  tests/architecture/email-runtime-boundary.test.ts \
  src/emails/__tests__/email-copy-source.test.ts
node scripts/starter-checks.js message-key-usage
pnpm content:check
pnpm type-check
git diff --check 583312c53f851be42e16e4861f463ef62b4dcf6b...HEAD
```

- [ ] **Step 3: Run the broad gates serially**

Run one at a time:

```bash
pnpm test
pnpm build
```

Do not run another `.next` writer at the same time as `pnpm build`.

- [ ] **Step 4: Self-review the final diff**

Confirm:

- no compatibility aliases or duplicate message keys;
- one product descriptor tuple replaces the four parallel truths;
- buyer-visible strings, links, section order, and diagrams are unchanged;
- strict D7a Footer/Contact behavior remains;
- copyright year still comes from checked-in facts;
- active email templates remain English and unchanged;
- `/zh/**` 404/noindex, request time zone, and currency still work;
- CJK fallback tokens remain;
- no P1/P2 and no simplification that can delete more code without losing the
  documented behavior.

- [ ] **Step 5: Push and open the stacked PR**

Create `/tmp/d7b-pr-body.md` with `apply_patch` using this exact body:

```markdown
## Scope

Stacked D7b successor to PR #143 / D7a exact SHA `583312c53f851be42e16e4861f463ef62b4dcf6b`.

- Renames homepage product-line, buyer-segment, buying-process, and Hero proof keys to final business semantics without changing buyer-visible copy or order.
- Consolidates product-card key/link/glyph/badge truth into one descriptor tuple.
- Moves copyright sentence grammar into the English physical message pack while keeping factual year/name interpolation.
- Deletes only `LOCALES_CONFIG.prefixes`, `displayNames`, `triggerLabels`, and unused zh first-frame CSS; keeps retired `/zh/**`, time-zone, currency, and CJK fallback behavior.
- Live inventory proved `emailTemplates.runtimeDefaultLocale` was already absent; no deletion or negative-space guard was added.

## Verification

Include the exact RED/GREEN commands and final results from this run.

State: WAITING_FOR_CI
```

Then run:

```bash
git push -u origin refactor/m3-d7b-message-semantics
gh pr create \
  --base refactor/m3-d7a-english-fallbacks \
  --head refactor/m3-d7b-message-semantics \
  --title "refactor: rename starter-era message keys to product semantics" \
  --body-file /tmp/d7b-pr-body.md
```

The PR body must state:

- stacked base: D7a exact SHA `583312c` / PR #143;
- final semantic mapping and buyer-visible no-change contract;
- copyright and locale-residue boundaries;
- `runtimeDefaultLocale` was already absent and no guard was added;
- RED/GREEN evidence and exact commands;
- `State: WAITING_FOR_CI`.

- [ ] **Step 6: Wait for exact-SHA GitHub CI**

After the PR head is stable, record:

```bash
git rev-parse HEAD
gh pr view --json headRefOid,statusCheckRollup,state,url
```

Do not mark `READY_FOR_CLUSTER` until exact-SHA CI is all green and Codex has
completed both spec-compliance and code-quality review. Do not merge and do not
start C7.
