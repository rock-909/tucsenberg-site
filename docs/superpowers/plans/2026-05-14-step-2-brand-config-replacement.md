# Step 2 Brand Config Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the starter engineering shell with Tucsenberg brand, locale, SEO, navigation, token, and font configuration while leaving deep product/compatibility work for later phases.

**Architecture:** Keep one runtime locale truth in `src/config/paths/locales-config.ts`, add a public SEO locale subset for sitemap/hreflang, and update existing sitemap/robots/metadata helpers rather than creating parallel generators. Keep buyer-visible navigation Tucsenberg-specific by routing unfinished nav items to a safe placeholder, and keep theme changes token-based in `src/app/globals.css`.

**Tech Stack:** Next.js 16 App Router, next-intl, TypeScript strict, Vitest, Tailwind CSS v4 global tokens, next/font/google.

---

## File structure and responsibilities

**Locale / routing / SEO**
- Modify: `src/config/paths/locales-config.ts` — all runtime locales plus public SEO locale subset.
- Modify: `i18n-locales.config.js` — Node tooling mirror of runtime locale truth.
- Modify: `i18n.json` — translation tooling source/target locales.
- Modify: `src/app/sitemap.ts` — sitemap entries and alternates use public SEO locales only.
- Modify: `src/app/robots.ts` — no direct logic change unless required; consumes disallow paths from SEO config.
- Modify: `src/config/single-site-seo.ts` — robots disallow includes `/zh/`; public static sitemap allowlist remains canonical.
- Modify: `src/lib/seo/url-generator.ts` — public hreflang alternates use public SEO locales; canonical URL generation still supports all runtime locales.
- Modify: `src/lib/seo-metadata.ts` — path-aware metadata alternates use public SEO locales.
- Test: `src/app/__tests__/sitemap.test.ts`
- Test: `src/app/__tests__/robots.test.ts`
- Test: `src/lib/seo/__tests__/url-generator.test.ts`
- Test: `src/lib/__tests__/seo-metadata.test.ts`
- Test: `tests/architecture/i18n-locale-truth-parity.test.ts`

**Messages and Spanish placeholders**
- Create: `messages/es/critical.json`
- Create: `messages/es/deferred.json`
- Modify: `src/test/setup.base-mocks.ts` — add `es` MDX importer mocks and Google font mocks.
- Modify: `tests/unit/i18n-message-contract.test.ts` — include `es` structure, `[ES-TODO]` placeholder, and production-readiness guard checks.
- Modify: `scripts/starter-checks.js` or a focused helper under `scripts/quality/checks/` — expose a production/readiness check that fails on `[ES-TODO]` in Spanish messages.

**Brand / navigation / placeholder**
- Modify: `src/config/single-site.ts` — Tucsenberg identity, base URL fallback, contact/facts/SEO defaults.
- Modify: `src/config/site-facts.ts` only if required by type exports; otherwise leave as facade.
- Modify: `src/config/single-site-navigation.ts` — main nav labels point to Tucsenberg translation keys and placeholder target.
- Modify: `src/config/single-site-links.ts` — add placeholder target and future Tucsenberg route href constants if needed.
- Modify: `messages/en/critical.json`
- Modify: `messages/zh/critical.json`
- Modify: `messages/es/critical.json`
- Optional create or modify: `src/app/[locale]/[...rest]/page.tsx` or a dedicated existing route if placeholder handling already exists. Prefer existing catch-all if it can render the placeholder from i18n without creating new routes.

**Theme and fonts**
- Modify: `src/app/globals.css` — role-based Tucsenberg tokens and font aliases.
- Modify: `src/config/static-theme-colors.ts` — email/non-CSS bridge values if needed.
- Modify: `src/config/__tests__/static-theme-colors.test.ts` — raw brand hex guard and bridge tests.
- Modify: `src/app/[locale]/layout-fonts.ts` — IBM Plex Sans / Inter / IBM Plex Mono via `next/font/google`.
- Modify: `src/app/[locale]/__tests__/layout-fonts.test.ts`
- Modify: `src/test/setup.base-mocks.ts` — mock `IBM_Plex_Sans`, `Inter`, `IBM_Plex_Mono`.

**Starter references and progress**
- Modify: files containing confusing references to root `CLAUDE.md` / `AGENTS.md` only if grep shows they refer to starter source after rename.
- Modify: `DEVELOPMENT-LOG.md` — record Step 2 decisions and status.

---

### Task 1: Locale truth and public SEO locale contract

**Files:**
- Modify: `src/config/paths/locales-config.ts`
- Modify: `i18n-locales.config.js`
- Modify: `i18n.json`
- Modify: `tests/architecture/i18n-locale-truth-parity.test.ts`

- [ ] **Step 1: Write failing locale parity tests**

Update `tests/architecture/i18n-locale-truth-parity.test.ts` so it asserts all runtime locales and public SEO locales:

```ts
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { LOCALES_CONFIG } from "@/config/paths/locales-config";
import i18nToolConfig from "../../i18n.json";

const require = createRequire(import.meta.url);
const translationCheckConfig = require("../../i18n-locales.config.js") as {
  locales: string[];
  defaultLocale: string;
};

function sorted(values: readonly string[]) {
  return [...values].sort();
}

describe("i18n locale truth parity", () => {
  it("keeps translation checks aligned with the runtime locale truth", () => {
    expect(translationCheckConfig.locales).toEqual(LOCALES_CONFIG.locales);
    expect(translationCheckConfig.defaultLocale).toBe(
      LOCALES_CONFIG.defaultLocale,
    );
  });

  it("keeps the translation tool config aligned with the runtime locale truth", () => {
    const toolLocales = [
      i18nToolConfig.sourceLocale,
      ...i18nToolConfig.targetLocales,
    ];
    const targetLocales = LOCALES_CONFIG.locales.filter(
      (locale) => locale !== LOCALES_CONFIG.defaultLocale,
    );

    expect(i18nToolConfig.sourceLocale).toBe(LOCALES_CONFIG.defaultLocale);
    expect(sorted(i18nToolConfig.targetLocales)).toEqual(sorted(targetLocales));
    expect(sorted(toolLocales)).toEqual(sorted(LOCALES_CONFIG.locales));
  });

  it("keeps public SEO locales explicit and excludes internal Chinese preview", () => {
    expect(LOCALES_CONFIG.locales).toEqual(["en", "es", "zh"]);
    expect(LOCALES_CONFIG.publicLocales).toEqual(["en", "es"]);
    expect(LOCALES_CONFIG.publicLocales).not.toContain("zh");
  });

  it("documents the tooling locale config as a mirror, not the runtime truth", () => {
    const configSource = readFileSync("i18n-locales.config.js", "utf8");

    expect(configSource).toContain("LOCALES_CONFIG");
    expect(configSource).not.toContain("只需在此处修改 locales 数组");
  });
});
```

- [ ] **Step 2: Run the locale parity test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/architecture/i18n-locale-truth-parity.test.ts
```

Expected: FAIL because `LOCALES_CONFIG.publicLocales` does not exist and runtime locales are still `["en", "zh"]`.

- [ ] **Step 3: Update runtime locale config**

Replace `src/config/paths/locales-config.ts` with:

```ts
/**
 * Canonical locale configuration.
 */

export const LOCALES_CONFIG = Object.freeze({
  locales: Object.freeze(["en", "es", "zh"] as const),
  publicLocales: Object.freeze(["en", "es"] as const),
  defaultLocale: "en" as const,
  localePrefix: "always" as const,

  // Display/helper prefixes are metadata. next-intl route prefix behavior is
  // controlled by `localePrefix` above.
  prefixes: Object.freeze({
    en: "",
    es: "/es",
    zh: "/zh",
  }),

  displayNames: Object.freeze({
    en: "English",
    es: "Español",
    zh: "中文",
  }),

  timeZones: Object.freeze({
    en: "UTC",
    es: "America/Mexico_City",
    zh: "Asia/Shanghai",
  }),

  currencies: Object.freeze({
    en: "USD",
    es: "USD",
    zh: "CNY",
  }),
} as const);

/**
 * @public Locale configuration contract for downstream routing customization.
 */
export type LocalesConfig = typeof LOCALES_CONFIG;
export type ConfiguredLocale = (typeof LOCALES_CONFIG.locales)[number];
export type PublicSeoLocale = (typeof LOCALES_CONFIG.publicLocales)[number];
export type ConfiguredCurrency =
  (typeof LOCALES_CONFIG.currencies)[ConfiguredLocale];

export function getLocaleTimeZone(locale: ConfiguredLocale): string {
  return LOCALES_CONFIG.timeZones[locale];
}

export function getLocaleCurrency(
  locale: ConfiguredLocale,
): ConfiguredCurrency {
  return LOCALES_CONFIG.currencies[locale];
}

export function isPublicSeoLocale(
  locale: ConfiguredLocale,
): locale is PublicSeoLocale {
  return LOCALES_CONFIG.publicLocales.includes(locale as PublicSeoLocale);
}
```

- [ ] **Step 4: Update Node i18n mirror**

Replace the exported locale array in `i18n-locales.config.js` with:

```js
module.exports = {
  locales: ["en", "es", "zh"],
  defaultLocale: "en",
};
```

Keep the existing comment that says runtime truth lives in `LOCALES_CONFIG`.

- [ ] **Step 5: Update translation tool config**

Replace `i18n.json` with:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "zh"],
  "buckets": [
    {
      "include": ["messages/**/*.json"],
      "exclude": []
    },
    {
      "include": ["src/**/*.{ts,tsx,js,jsx}"],
      "exclude": [
        "src/**/*.test.{ts,tsx,js,jsx}",
        "src/**/*.spec.{ts,tsx,js,jsx}"
      ]
    },
    {
      "include": ["content/**/*.{md,mdx}"],
      "exclude": []
    }
  ],
  "llm": {
    "engine": "google",
    "model": "gemini-2.5-pro"
  },
  "experimental": {
    "incremental": true
  }
}
```

- [ ] **Step 6: Run the locale parity test and verify it passes**

Run:

```bash
pnpm exec vitest run tests/architecture/i18n-locale-truth-parity.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit locale truth changes**

Run:

```bash
git add src/config/paths/locales-config.ts i18n-locales.config.js i18n.json tests/architecture/i18n-locale-truth-parity.test.ts
git commit -m "feat: add Spanish runtime locale"
```

Expected: commit succeeds.

---

### Task 2: Spanish message placeholders and production guard

**Files:**
- Create: `messages/es/critical.json`
- Create: `messages/es/deferred.json`
- Modify: `src/test/setup.base-mocks.ts`
- Modify: `tests/unit/i18n-message-contract.test.ts`
- Modify: `scripts/starter-checks.js`

- [ ] **Step 1: Create Spanish message files with English structure and TODO-prefixed leaves**

Use a temporary Node one-liner to copy English JSON and prefix every string leaf:

```bash
node - <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

function prefixStrings(value) {
  if (typeof value === 'string') return `[ES-TODO] ${value}`;
  if (Array.isArray(value)) return value.map(prefixStrings);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, prefixStrings(child)]));
  }
  return value;
}

fs.mkdirSync('messages/es', { recursive: true });
for (const name of ['critical.json', 'deferred.json']) {
  const input = JSON.parse(fs.readFileSync(path.join('messages/en', name), 'utf8'));
  fs.writeFileSync(path.join('messages/es', name), `${JSON.stringify(prefixStrings(input), null, 2)}\n`);
}
NODE
```

Expected: `messages/es/critical.json` and `messages/es/deferred.json` are created.

- [ ] **Step 2: Update test base mocks for Spanish locale and new Google fonts**

In `src/test/setup.base-mocks.ts`, replace the MDX importer mock and `next/font/google` mock with:

```ts
vi.mock("@/lib/mdx-importers.generated", () => ({
  postImporters: {
    en: {},
    es: {},
    zh: {},
  },
  productImporters: {
    en: {},
    es: {},
    zh: {},
  },
  pageImporters: {
    en: {},
    es: {},
    zh: {},
  },
}));

// Mock next/font/google for Tucsenberg font stack.
vi.mock("next/font/google", () => ({
  IBM_Plex_Sans: vi.fn(() => ({
    variable: "--font-ibm-plex-sans",
    className: "ibm-plex-sans",
    style: { fontFamily: "IBM Plex Sans" },
  })),
  Inter: vi.fn(() => ({
    variable: "--font-inter",
    className: "inter",
    style: { fontFamily: "Inter" },
  })),
  IBM_Plex_Mono: vi.fn(() => ({
    variable: "--font-ibm-plex-mono",
    className: "ibm-plex-mono",
    style: { fontFamily: "IBM Plex Mono" },
  })),
}));

vi.mock("next/font/local", () => ({
  default: vi.fn(() => ({
    variable: "--font-ibm-plex-sans",
    className: "font-local",
    style: { fontFamily: "IBM Plex Sans" },
  })),
}));
```

Keep the top CSS and `server-only` mocks unchanged.

- [ ] **Step 3: Write failing i18n message contract tests for Spanish structure and TODO guard**

Replace `tests/unit/i18n-message-contract.test.ts` with:

```ts
import enCriticalMessages from "../../messages/en/critical.json";
import enDeferredMessages from "../../messages/en/deferred.json";
import esCriticalMessages from "../../messages/es/critical.json";
import esDeferredMessages from "../../messages/es/deferred.json";
import zhCriticalMessages from "../../messages/zh/critical.json";
import zhDeferredMessages from "../../messages/zh/deferred.json";
import { describe, expect, it } from "vitest";

type JsonObject = Record<string, unknown>;

const REQUIRED_RUNTIME_KEYS = [
  "accessibility.securityVerificationUnavailable",
  "accessibility.turnstileDevBypass",
  "accessibility.turnstileTestMode",
  "accessibility.turnstileLoadFailed",
  "contact.form.networkError",
] as const;

const INQUIRY_API_VALIDATION_DETAIL_KEYS = [
  "errors.fullName.required",
  "errors.fullName.invalid",
  "errors.fullName.tooLong",
  "errors.fullName.tooShort",
  "errors.email.required",
  "errors.email.invalid",
  "errors.email.tooLong",
  "errors.company.tooShort",
  "errors.company.tooLong",
  "errors.company.invalid",
  "errors.productSlug.required",
  "errors.productSlug.invalid",
  "errors.productName.required",
  "errors.productName.invalid",
  "errors.productName.tooLong",
  "errors.productName.tooShort",
  "errors.quantity.required",
  "errors.quantity.invalid",
  "errors.requirements.invalid",
  "errors.requirements.tooLong",
] as const;

const CONTACT_API_VALIDATION_DETAIL_KEYS = [
  "errors.message.required",
  "errors.message.tooShort",
  "errors.message.tooLong",
  "errors.subject.length",
  "errors.acceptPrivacy.required",
] as const;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeMessages(critical: JsonObject, deferred: JsonObject): JsonObject {
  const result: JsonObject = { ...critical };

  for (const [key, value] of Object.entries(deferred)) {
    const existingValue = result[key];
    result[key] =
      isJsonObject(existingValue) && isJsonObject(value)
        ? mergeMessages(existingValue, value)
        : value;
  }

  return result;
}

function getMessageValue(messages: JsonObject, keyPath: string): unknown {
  return keyPath.split(".").reduce<unknown>((current, key) => {
    if (!isJsonObject(current)) return undefined;
    return current[key];
  }, messages);
}

function collectLeafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectLeafPaths(entry, `${prefix}.${index}`.replace(/^\./, "")),
    );
  }

  return Object.entries(value).flatMap(([key, child]) =>
    collectLeafPaths(child, `${prefix}.${key}`.replace(/^\./, "")),
  );
}

function collectStringLeaves(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringLeaves);
  if (isJsonObject(value)) {
    return Object.values(value).flatMap(collectStringLeaves);
  }
  return [];
}

const LOCALE_MESSAGES = [
  ["en", mergeMessages(enCriticalMessages, enDeferredMessages)],
  ["es", mergeMessages(esCriticalMessages, esDeferredMessages)],
  ["zh", mergeMessages(zhCriticalMessages, zhDeferredMessages)],
] as const;

describe("real i18n runtime message contract", () => {
  it.each(LOCALE_MESSAGES)(
    "keeps degraded-state form keys in the real %s split message bundle",
    (_locale, messages) => {
      for (const keyPath of REQUIRED_RUNTIME_KEYS) {
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it.each(LOCALE_MESSAGES)(
    "keeps inquiry API validation detail keys in the real %s contact form bundle",
    (_locale, messages) => {
      for (const detailKey of INQUIRY_API_VALIDATION_DETAIL_KEYS) {
        const keyPath = `contact.form.${detailKey}`;
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it.each(LOCALE_MESSAGES)(
    "keeps contact API validation detail keys in the real %s contact form bundle",
    (_locale, messages) => {
      for (const detailKey of CONTACT_API_VALIDATION_DETAIL_KEYS) {
        const keyPath = `contact.form.${detailKey}`;
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it("keeps Spanish split message keys structurally aligned with English", () => {
    expect(collectLeafPaths(esCriticalMessages).sort()).toEqual(
      collectLeafPaths(enCriticalMessages).sort(),
    );
    expect(collectLeafPaths(esDeferredMessages).sort()).toEqual(
      collectLeafPaths(enDeferredMessages).sort(),
    );
  });

  it("marks copied Spanish placeholder strings with ES-TODO", () => {
    const spanishLeaves = [
      ...collectStringLeaves(esCriticalMessages),
      ...collectStringLeaves(esDeferredMessages),
    ];

    expect(spanishLeaves.length).toBeGreaterThan(0);
    expect(spanishLeaves.every((value) => value.startsWith("[ES-TODO] "))).toBe(
      true,
    );
  });
});
```

- [ ] **Step 4: Add an ES-TODO production-readiness check**

In `scripts/starter-checks.js`, add a small helper near other content readiness helpers:

```js
function checkSpanishTodoMarkersForProduction() {
  const spanishMessageFiles = [
    path.join(ROOT_DIR, "messages/es/critical.json"),
    path.join(ROOT_DIR, "messages/es/deferred.json"),
  ];

  const offenders = spanishMessageFiles.filter((filePath) => {
    if (!fs.existsSync(filePath)) return false;
    return fs.readFileSync(filePath, "utf8").includes("[ES-TODO] ");
  });

  if (offenders.length === 0) return;

  throw new Error(
    [
      "Spanish placeholder copy remains in production-readiness messages:",
      ...offenders.map((filePath) => `- ${path.relative(ROOT_DIR, filePath)}`),
      "Replace [ES-TODO] strings with reviewed Latin American Spanish before production launch.",
    ].join("\n"),
  );
}
```

Then call `checkSpanishTodoMarkersForProduction()` inside the strict client launch path of `runContentReadinessCheck()` when `--strict-client-launch` is present. Do not make normal `pnpm content:check` fail during Step 2.

- [ ] **Step 5: Run message contract test**

Run:

```bash
pnpm exec vitest run tests/unit/i18n-message-contract.test.ts
```

Expected: PASS after message files and tests are aligned.

- [ ] **Step 6: Run production-readiness guard manually and verify it fails only in strict mode**

Run:

```bash
node scripts/starter-checks.js content-readiness
node scripts/starter-checks.js content-readiness --strict-client-launch
```

Expected:
- first command does not fail solely because of `[ES-TODO]`.
- second command FAILS with a clear Spanish placeholder message.

- [ ] **Step 7: Commit Spanish placeholder and guard changes**

Run:

```bash
git add messages/es src/test/setup.base-mocks.ts tests/unit/i18n-message-contract.test.ts scripts/starter-checks.js
git commit -m "feat: add Spanish placeholder messages"
```

Expected: commit succeeds.

---

### Task 3: Public SEO locale filtering for sitemap, robots, and metadata

**Files:**
- Modify: `src/config/single-site-seo.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/__tests__/sitemap.test.ts`
- Modify: `src/app/__tests__/robots.test.ts`
- Modify: `src/lib/seo/url-generator.ts`
- Modify: `src/lib/seo/__tests__/url-generator.test.ts`
- Modify: `src/lib/seo-metadata.ts`
- Modify: `src/lib/__tests__/seo-metadata.test.ts`

- [ ] **Step 1: Write/update SEO tests for zh exclusion and es inclusion**

Update `src/app/__tests__/robots.test.ts` so the sensitive paths test includes `/zh/`:

```ts
expect(disallowed).toContain("/zh/");
```

Update the `vi.mock("@/i18n/routing"...` block in `src/app/__tests__/sitemap.test.ts`:

```ts
vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "es", "zh"],
    defaultLocale: "en",
  },
}));
```

Then update sitemap assertions:

```ts
it("should include static pages for public SEO locales only", async () => {
  const result = await sitemap();

  for (const locale of ["en", "es"]) {
    for (const pagePath of SINGLE_SITE_PUBLIC_STATIC_PAGES) {
      expect(findEntry(result, locale, pagePath)).toBeDefined();
    }
  }

  for (const pagePath of SINGLE_SITE_PUBLIC_STATIC_PAGES) {
    expect(findEntry(result, "zh", pagePath)).toBeUndefined();
  }
});

it("does not include zh URLs or zh alternates", async () => {
  const result = await sitemap();

  expect(result.some((entry) => String(entry.url).includes("/zh"))).toBe(false);
  for (const entry of result) {
    expect(entry.alternates?.languages).toHaveProperty("en");
    expect(entry.alternates?.languages).toHaveProperty("es");
    expect(entry.alternates?.languages).toHaveProperty("x-default");
    expect(entry.alternates?.languages).not.toHaveProperty("zh");
  }
});
```

In `src/lib/seo/__tests__/url-generator.test.ts`, update expected language alternates from `en + zh + x-default` to `en + es + x-default` and add:

```ts
expect(alternates).not.toHaveProperty("zh");
```

In `src/lib/__tests__/seo-metadata.test.ts`, update alternates expectations to exclude `zh` and include `es`.

- [ ] **Step 2: Run SEO tests and verify they fail**

Run:

```bash
pnpm exec vitest run src/app/__tests__/robots.test.ts src/app/__tests__/sitemap.test.ts src/lib/seo/__tests__/url-generator.test.ts src/lib/__tests__/seo-metadata.test.ts
```

Expected: FAIL because current implementation still uses all runtime locales and robots lacks `/zh/`.

- [ ] **Step 3: Update robots disallow config**

In `src/config/single-site-seo.ts`, update `SINGLE_SITE_ROBOTS_DISALLOW_PATHS`:

```ts
export const SINGLE_SITE_ROBOTS_DISALLOW_PATHS = [
  "/api/",
  "/_next/",
  "/ops/",
  "/error-test/",
  "/zh/",
] as const;
```

Update `src/config/__tests__/single-site-seo.test.ts` expected array to include `"/zh/"`.

- [ ] **Step 4: Update sitemap public locale handling**

In `src/app/sitemap.ts`, import `LOCALES_CONFIG` and replace all sitemap locale loops with `LOCALES_CONFIG.publicLocales`.

Add helper:

```ts
import { LOCALES_CONFIG } from "@/config/paths/locales-config";
```

Replace `buildAlternateLanguages()` with:

```ts
function buildAlternateLanguages(path: string): Record<string, string> {
  const entries = LOCALES_CONFIG.publicLocales.map((locale) => [
    locale,
    `${BASE_URL}/${locale}${path}`,
  ]);
  entries.push([
    "x-default",
    `${BASE_URL}/${LOCALES_CONFIG.defaultLocale}${path}`,
  ]);
  return Object.fromEntries(entries);
}
```

Replace:

```ts
for (const locale of routing.locales) {
```

with:

```ts
for (const locale of LOCALES_CONFIG.publicLocales) {
```

in both static and catalog entry generators. If the `routing` import becomes unused, remove it.

- [ ] **Step 5: Update SEO URL generator**

In `src/lib/seo/url-generator.ts`, add a public SEO locale field:

```ts
import {
  getLocalizedPath,
  LOCALES_CONFIG,
  PATHS_CONFIG,
  SITE_CONFIG,
  type Locale,
  type PageType,
  type PublicSeoLocale,
} from "@/config/paths";
```

If `PublicSeoLocale` is not exported from `@/config/paths`, update the relevant barrel export or import from `@/config/paths/locales-config`.

In the class:

```ts
private readonly publicLocales: readonly PublicSeoLocale[];
```

In constructor:

```ts
this.publicLocales = LOCALES_CONFIG.publicLocales;
```

Update `generateLanguageAlternates()` return type and loop:

```ts
generateLanguageAlternates(
  pageType: PageType,
): Record<PublicSeoLocale | "x-default", string> {
  const alternates: Record<string, string> = {};

  this.publicLocales.forEach((locale) => {
    alternates[locale] = this.generateCanonicalURL(pageType, locale);
  });

  alternates["x-default"] = this.generateCanonicalURL(
    pageType,
    this.defaultLocale,
  );

  return alternates as Record<PublicSeoLocale | "x-default", string>;
}
```

Update `generateHreflangLinks()` to iterate `this.publicLocales`.

Keep `generatePageURL()` and `generateCanonicalURL()` accepting all runtime `Locale`, so `/zh` internal preview still works.

- [ ] **Step 6: Update metadata language alternates**

In `src/lib/seo-metadata.ts`, import `LOCALES_CONFIG` and update `buildLanguagesForPath()`:

```ts
function buildLanguagesForPath(path: string): Record<string, string> {
  const normalizedPath = normalizePath(path);

  const entries: Array<[string, string]> = LOCALES_CONFIG.publicLocales.map(
    (locale) => [
      locale,
      new URL(`/${locale}${normalizedPath}`, SITE_CONFIG.baseUrl).toString(),
    ],
  );
  entries.push([
    "x-default",
    new URL(
      `/${LOCALES_CONFIG.defaultLocale}${normalizedPath}`,
      SITE_CONFIG.baseUrl,
    ).toString(),
  ]);

  return Object.fromEntries(entries);
}
```

- [ ] **Step 7: Run SEO tests and verify they pass**

Run:

```bash
pnpm exec vitest run src/config/__tests__/single-site-seo.test.ts src/app/__tests__/robots.test.ts src/app/__tests__/sitemap.test.ts src/lib/seo/__tests__/url-generator.test.ts src/lib/__tests__/seo-metadata.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit SEO public locale filtering**

Run:

```bash
git add src/config/single-site-seo.ts src/config/__tests__/single-site-seo.test.ts src/app/sitemap.ts src/app/__tests__/sitemap.test.ts src/app/__tests__/robots.test.ts src/lib/seo/url-generator.ts src/lib/seo/__tests__/url-generator.test.ts src/lib/seo-metadata.ts src/lib/__tests__/seo-metadata.test.ts
git commit -m "feat: exclude internal Chinese locale from public SEO"
```

Expected: commit succeeds.

---

### Task 4: Tucsenberg identity and navigation placeholder

**Files:**
- Modify: `src/config/single-site.ts`
- Modify: `src/config/single-site-links.ts`
- Modify: `src/config/single-site-navigation.ts`
- Modify: `messages/en/critical.json`
- Modify: `messages/es/critical.json`
- Modify: `messages/zh/critical.json`
- Modify: `src/config/__tests__/site-facts.test.ts`
- Modify: `src/config/__tests__/footer-links.test.ts`
- Modify: `src/config/__tests__/single-site-page-expression.test.ts` if section-key assertions fail after config renames.

- [ ] **Step 1: Write/update identity and navigation tests**

Open `src/config/__tests__/site-facts.test.ts` and add expectations:

```ts
expect(siteFacts.company.name).toBe("Tucsenberg");
expect(siteFacts.contact.email).toBe("contact@tucsenberg.com");
expect(siteFacts.company.location.country).toBe("China");
```

Open the navigation/footer relevant tests and add:

```ts
expect(SINGLE_SITE_NAVIGATION.map((item) => item.key)).toEqual([
  "membranes",
  "compatibility",
  "materials",
  "quote",
]);
expect(
  SINGLE_SITE_NAVIGATION.every((item) => item.href === SINGLE_SITE_ROUTE_HREFS.comingSoon),
).toBe(true);
```

If direct imports are not present, import:

```ts
import { SINGLE_SITE_NAVIGATION } from "@/config/single-site-navigation";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";
```

- [ ] **Step 2: Run identity/navigation tests and verify they fail**

Run:

```bash
pnpm exec vitest run src/config/__tests__/site-facts.test.ts src/config/__tests__/footer-links.test.ts
```

Expected: FAIL because site facts and nav are still starter-oriented.

- [ ] **Step 3: Update route hrefs**

In `src/config/single-site-links.ts`, add a placeholder target:

```ts
comingSoon: "#coming-soon",
```

Keep existing route hrefs to avoid broad route deletions.

Update `SINGLE_SITE_HOME_LINK_TARGETS` if needed:

```ts
export const SINGLE_SITE_HOME_LINK_TARGETS = {
  contact: SINGLE_SITE_ROUTE_HREFS.comingSoon,
  products: SINGLE_SITE_ROUTE_HREFS.comingSoon,
} as const;
```

- [ ] **Step 4: Update navigation config**

Replace `SINGLE_SITE_NAVIGATION` in `src/config/single-site-navigation.ts` with explicit Tucsenberg nav items:

```ts
export const SINGLE_SITE_NAVIGATION: SiteNavigationItem[] = [
  {
    key: "membranes",
    href: SINGLE_SITE_ROUTE_HREFS.comingSoon,
    translationKey: "navigation.membranes",
  },
  {
    key: "compatibility",
    href: SINGLE_SITE_ROUTE_HREFS.comingSoon,
    translationKey: "navigation.compatibility",
  },
  {
    key: "materials",
    href: SINGLE_SITE_ROUTE_HREFS.comingSoon,
    translationKey: "navigation.materials",
  },
  {
    key: "quote",
    href: SINGLE_SITE_ROUTE_HREFS.comingSoon,
    translationKey: "navigation.quote",
  },
];
```

Remove `requireNavigationKey()` if unused.

- [ ] **Step 5: Update Tucsenberg identity**

In `src/config/single-site.ts`, set:

```ts
const baseUrl = resolveSingleSiteBaseUrl("https://tucsenberg.com");

const social = {
  twitter: "https://x.com/tucsenberg",
  linkedin: "https://www.linkedin.com/company/tucsenberg",
} as const;

const contact = {
  phone: "+86-000-0000-0000",
  email: "contact@tucsenberg.com",
} as const;

const establishedYear = 2026;
const siteFactSnapshotYear = 2026;

export const SINGLE_SITE_KEY = "tucsenberg" as const;
```

Update config block:

```ts
name: "Tucsenberg",
description:
  "Compatible aeration replacement membranes for maintenance teams that need model fit, material guidance, and batch RFQ support",
seo: {
  titleTemplate: "%s | Tucsenberg",
  defaultTitle: "Tucsenberg - Compatible Aeration Replacement Membranes",
  defaultDescription:
    "Find compatible aeration replacement membranes by OEM family, membrane type, material fit, and batch RFQ needs.",
  keywords: [
    "aeration replacement membrane",
    "compatible diffuser membrane",
    "Sanitaire membrane replacement",
    "EDI membrane replacement",
    "SSI diffuser membrane",
    "EPDM aeration membrane",
    "TPU aeration membrane",
    "industrial wastewater aeration parts",
  ],
},
```

Update facts:

```ts
company: {
  name: "Tucsenberg",
  established: establishedYear,
  yearsInBusiness: siteFactSnapshotYear - establishedYear,
  employees: 1,
  location: {
    country: "China",
    city: "To be confirmed",
    address: "To be confirmed",
  },
},
```

Keep `brandAssets.status` as pending.

- [ ] **Step 6: Update navigation and placeholder messages**

In `messages/en/critical.json`, update `navigation` keys:

```json
"membranes": "Membranes",
"compatibility": "Compatibility",
"materials": "Materials",
"quote": "Quote"
```

Add:

```json
"comingSoon": {
  "title": "Tucsenberg pages are being prepared.",
  "description": "We are building the membrane, compatibility, material guidance, and quote paths for the first sample release.",
  "quoteNote": "The RFQ form is scheduled for the Step 4 sample flow.",
  "backHome": "Back to home"
}
```

In `messages/es/critical.json`, add the same keys with `[ES-TODO] ` prefix on every string leaf.

In `messages/zh/critical.json`, add:

```json
"membranes": "曝气膜片",
"compatibility": "兼容查询",
"materials": "材质选择",
"quote": "询价"
```

and:

```json
"comingSoon": {
  "title": "Tucsenberg 页面正在准备中。",
  "description": "我们正在搭建膜片、兼容查询、材质选择和询价路径，供第一批样板页面使用。",
  "quoteNote": "RFQ 询价表单会在 Step 4 样板流程中上线。",
  "backHome": "返回首页"
}
```

Place keys under existing `navigation` or a top-level namespace that is already loaded by the catch-all/placeholder route. If using a new namespace, update the consuming component accordingly.

- [ ] **Step 7: Render placeholder for hash/catch-all target**

If `#coming-soon` is used, add an anchored section to the home page or existing catch-all page. Prefer adding a small section in `src/app/[locale]/page.tsx` only if it can use translation keys and does not hard-code copy.

If using `src/app/[locale]/[...rest]/page.tsx`, render a short translated placeholder for unknown routes. Use `getTranslations()` with the namespace from Step 6.

Do not create full `/compatible`, `/materials`, or `/quote` pages in Step 2.

- [ ] **Step 8: Run identity/navigation tests and content check**

Run:

```bash
pnpm exec vitest run src/config/__tests__/site-facts.test.ts src/config/__tests__/footer-links.test.ts
pnpm content:check
```

Expected: tests pass and content check does not fail on message shape.

- [ ] **Step 9: Commit identity and navigation changes**

Run:

```bash
git add src/config/single-site.ts src/config/single-site-links.ts src/config/single-site-navigation.ts messages/en/critical.json messages/es/critical.json messages/zh/critical.json src/config/__tests__/site-facts.test.ts src/config/__tests__/footer-links.test.ts src/app/[locale]/page.tsx src/app/[locale]/[...rest]/page.tsx
git commit -m "feat: apply Tucsenberg identity shell"
```

Expected: commit succeeds. If one of the optional page files was not changed, omit it from `git add`.

---

### Task 5: Role-based Tucsenberg theme tokens and raw hex guard

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/config/static-theme-colors.ts`
- Modify: `src/config/__tests__/static-theme-colors.test.ts`

- [ ] **Step 1: Write raw brand hex guard test**

Append to `src/config/__tests__/static-theme-colors.test.ts`:

```ts
const TUCSENBERG_BRAND_HEX_VALUES = [
  "#123B5D",
  "#0F7C82",
  "#DCEFF1",
  "#F7FAFC",
] as const;

it("keeps Tucsenberg raw brand hex values confined to global token source", () => {
  const scannedFiles = [
    ...BROWSER_UI_SCAN_ROOTS.flatMap((directoryPath) =>
      collectFiles(directoryPath),
    ),
    ...EXPLICIT_BROWSER_UI_FILES,
  ].filter(
    (filePath, index, allFiles) =>
      allFiles.indexOf(filePath) === index &&
      filePath !== "src/app/globals.css" &&
      filePath !== "src/config/__tests__/static-theme-colors.test.ts" &&
      !filePath.startsWith("src/emails/") &&
      /\.(ts|tsx|css)$/.test(filePath),
  );

  const offenders = scannedFiles.flatMap((filePath) => {
    const source = readFileSync(filePath, "utf8");
    return TUCSENBERG_BRAND_HEX_VALUES.filter((hex) =>
      source.includes(hex),
    ).map((hex) => `${filePath}: ${hex}`);
  });

  expect(offenders).toEqual([]);
});
```

- [ ] **Step 2: Run static theme test and verify current state**

Run:

```bash
pnpm exec vitest run src/config/__tests__/static-theme-colors.test.ts
```

Expected: PASS before token changes if no raw Tucsenberg colors exist yet.

- [ ] **Step 3: Update global role tokens**

In `src/app/globals.css`, inside `:root`, add role tokens before existing brand scale:

```css
  --color-brand-primary: #123B5D;
  --color-brand-accent: #0F7C82;
  --color-surface-canvas: #F7FAFC;
  --color-surface-elevated: #FFFFFF;
  --color-surface-muted: #DCEFF1;
  --color-text-primary: #0F172A;
  --color-text-secondary: #334155;
  --color-text-muted: #64748B;
  --color-border-default: #CBD5E1;
  --color-border-strong: #94A3B8;
  --color-state-success: oklch(0.56 0.13 155);
  --color-state-warning: oklch(0.66 0.14 72);
  --color-state-danger: oklch(0.55 0.2 27);
  --color-state-info: var(--color-brand-accent);
```

Then map existing semantic tokens:

```css
  --background: var(--color-surface-canvas);
  --foreground: var(--color-text-primary);
  --card: var(--color-surface-elevated);
  --card-foreground: var(--color-text-primary);
  --popover: var(--color-surface-elevated);
  --popover-foreground: var(--color-text-primary);
  --primary: var(--color-brand-primary);
  --primary-foreground: var(--color-surface-elevated);
  --primary-dark: color-mix(in oklch, var(--color-brand-primary) 82%, black);
  --primary-light: var(--color-surface-muted);
  --primary-50: var(--color-surface-muted);
  --accent: var(--color-surface-muted);
  --accent-foreground: var(--color-brand-primary);
  --muted: var(--neutral-3);
  --muted-foreground: var(--color-text-muted);
  --success: var(--color-state-success);
  --warning: var(--color-state-warning);
  --error: var(--color-state-danger);
  --info: var(--color-state-info);
  --border: var(--color-border-default);
  --border-light: var(--color-surface-muted);
  --ring: var(--color-brand-accent);
```

Keep existing `--brand-*` and `--neutral-*` scale unless removing them is obviously safe.

- [ ] **Step 4: Add accent usage comment**

Near the role tokens, add this comment:

```css
  /* Accent is for links, focus rings, selected state, and narrow status cues.
     Do not use it as broad card background, default icon color, divider color,
     or decorative fill. */
```

- [ ] **Step 5: Update static color bridge**

Update `src/config/static-theme-colors.ts` to align non-CSS surfaces:

```ts
export const STATIC_THEME_COLORS = {
  primary: "#123B5D",
  primaryHover: "#0B2A43",
  success: "#0F7B5F",
  successLight: "#EEF9F4",
  warning: "#9A5A00",
  warningLight: "#FFF7DC",
  error: "#B42318",
  text: "#0F172A",
  textLight: "#64748B",
  muted: "#64748B",
  background: "#F7FAFC",
  contentBackground: "#FFFFFF",
  headerText: "#FFFFFF",
  border: "#CBD5E1",
} as const;
```

This file is allowed to contain hex values because it is the non-CSS bridge.

- [ ] **Step 6: Run theme tests**

Run:

```bash
pnpm exec vitest run src/config/__tests__/static-theme-colors.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit token changes**

Run:

```bash
git add src/app/globals.css src/config/static-theme-colors.ts src/config/__tests__/static-theme-colors.test.ts
git commit -m "feat: add Tucsenberg role color tokens"
```

Expected: commit succeeds.

---

### Task 6: IBM Plex / Inter font stack

**Files:**
- Modify: `src/app/[locale]/layout-fonts.ts`
- Modify: `src/app/[locale]/__tests__/layout-fonts.test.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing font tests**

Replace `src/app/[locale]/__tests__/layout-fonts.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import {
  ibmPlexMono,
  ibmPlexSans,
  inter,
  getFontClassNames,
} from "@/app/[locale]/layout-fonts";

describe("Layout Fonts Configuration", () => {
  describe("IBM Plex Sans font", () => {
    it("should be configured with correct CSS variable", () => {
      expect(ibmPlexSans).toBeDefined();
      expect(ibmPlexSans.variable).toBe("--font-ibm-plex-sans");
    });

    it("should include required Next.js font properties", () => {
      expect(ibmPlexSans).toHaveProperty("variable");
      expect(ibmPlexSans).toHaveProperty("className");
      expect(ibmPlexSans).toHaveProperty("style");
    });
  });

  describe("Inter fallback font", () => {
    it("should be configured with correct CSS variable", () => {
      expect(inter).toBeDefined();
      expect(inter.variable).toBe("--font-inter");
    });
  });

  describe("IBM Plex Mono font", () => {
    it("should be configured with correct CSS variable", () => {
      expect(ibmPlexMono).toBeDefined();
      expect(ibmPlexMono.variable).toBe("--font-ibm-plex-mono");
    });

    it("should include required Next.js font properties", () => {
      expect(ibmPlexMono).toHaveProperty("variable");
      expect(ibmPlexMono).toHaveProperty("className");
      expect(ibmPlexMono).toHaveProperty("style");
    });
  });

  describe("getFontClassNames", () => {
    it("should return all font variables", () => {
      const classNames = getFontClassNames();

      expect(typeof classNames).toBe("string");
      expect(classNames).toContain("--font-ibm-plex-sans");
      expect(classNames).toContain("--font-inter");
      expect(classNames).toContain("--font-ibm-plex-mono");
    });

    it("should return consistent results", () => {
      expect(getFontClassNames()).toBe(getFontClassNames());
    });

    it("should return non-empty string", () => {
      const classNames = getFontClassNames();
      expect(classNames).toBeTruthy();
      expect(classNames.length).toBeGreaterThan(0);
    });

    it("should not have leading or trailing whitespace", () => {
      const classNames = getFontClassNames();
      expect(classNames).not.toMatch(/^\s/);
      expect(classNames).not.toMatch(/\s$/);
    });

    it("should not have consecutive spaces", () => {
      const classNames = getFontClassNames();
      expect(classNames).not.toMatch(/\s{2,}/);
    });
  });
});
```

- [ ] **Step 2: Run font test and verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/__tests__/layout-fonts.test.ts'
```

Expected: FAIL because `ibmPlexSans`, `inter`, and `ibmPlexMono` are not exported yet.

- [ ] **Step 3: Implement next/font/google font stack**

Replace `src/app/[locale]/layout-fonts.ts` with:

```ts
import { IBM_Plex_Mono, IBM_Plex_Sans, Inter } from "next/font/google";

/**
 * Tucsenberg primary sans token.
 *
 * next/font/google self-hosts these assets after build-time resolution, so
 * buyer-visible runtime pages do not request Google Fonts directly.
 */
export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

/**
 * Secondary Latin UI/body fallback.
 */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Mono token for part numbers, SKUs, dimensions, and technical labels.
 */
export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

/**
 * Get font class names string for html element.
 */
export function getFontClassNames(): string {
  return `${ibmPlexSans.variable} ${inter.variable} ${ibmPlexMono.variable}`;
}
```

- [ ] **Step 4: Update CSS font aliases**

In `src/app/globals.css`, update font token aliases:

```css
  --font-display: var(--font-ibm-plex-sans);
  --font-body: var(--font-ibm-plex-sans), var(--font-inter);
  --font-sans: var(--font-body), -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  --font-mono:
    var(--font-ibm-plex-mono), "SF Mono", ui-monospace, SFMono-Regular,
    Menlo, Consolas, "Liberation Mono", monospace;
```

Preserve existing Chinese fallback tokens.

- [ ] **Step 5: Run font test**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/__tests__/layout-fonts.test.ts'
```

Expected: PASS.

- [ ] **Step 6: Run a build or type check to verify Google font import shape**

Run:

```bash
pnpm type-check
```

Expected: PASS. If it fails because `IBM_Plex_Sans` or subset/weight options are invalid, correct to the installed Next.js font API output and rerun.

- [ ] **Step 7: Commit font changes**

Run:

```bash
git add 'src/app/[locale]/layout-fonts.ts' 'src/app/[locale]/__tests__/layout-fonts.test.ts' src/app/globals.css
git commit -m "feat: switch to Tucsenberg font stack"
```

Expected: commit succeeds.

---

### Task 7: Starter rule reference cleanup and progress log

**Files:**
- Modify: only files found by grep with confusing references.
- Modify: `DEVELOPMENT-LOG.md`

- [ ] **Step 1: Grep starter rule references**

Run:

```bash
rg -n "CLAUDE\\.md|AGENTS\\.md|Showcase Website Starter|showcase-website-starter" CLAUDE.md CLAUDE.starter.md AGENTS.starter.md docs src messages scripts README.md DEVELOPMENT-LOG.md
```

Expected: output includes legitimate starter references and possible confusing references.

- [ ] **Step 2: Clean only misleading renamed-file references**

If a file refers to the starter's rule entrypoint as `CLAUDE.md` or `AGENTS.md` after the rename, update that reference to `CLAUDE.starter.md` or `AGENTS.starter.md`.

Do not rewrite starter docs wholesale. Do not remove historical references under `docs/superpowers/**`.

- [ ] **Step 3: Update DEVELOPMENT-LOG**

Update `DEVELOPMENT-LOG.md`:

- Current stage: `Phase 1 Step 2 in progress` if implementation is not fully verified yet, or `Step 2 complete` after final verification.
- Recent decisions:
  - navigation placeholder uses Tucsenberg labels and a safe placeholder target.
  - `zh` is runtime/internal only and excluded from sitemap/hreflang.
  - `next/font/google` is allowed because the hard rule is runtime network avoidance, not a hook ban.
  - Spanish placeholders use `[ES-TODO]` until real Latin American Spanish is written.
- Add any fallback TODO if Google font build-time fetch fails.

- [ ] **Step 4: Commit cleanup and progress log**

Run:

```bash
git add DEVELOPMENT-LOG.md
git commit -m "docs: record step 2 replacement decisions"
```

Expected: commit succeeds. If Step 2 reference cleanup changed extra files, stage only those exact files after inspecting `git status --short`; do not broad-add `docs`, `src`, `messages`, or `scripts`.

---

### Task 8: Full Step 2 verification

**Files:**
- No direct edits unless verification exposes a bug.

- [ ] **Step 1: Run locale/path tests**

Run:

```bash
pnpm exec vitest run src/config/__tests__/pages-config.test.ts src/config/paths/__tests__/site-config.test.ts tests/architecture/i18n-locale-truth-parity.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run SEO public-locale tests**

Run:

```bash
pnpm exec vitest run src/config/__tests__/single-site-seo.test.ts src/app/__tests__/robots.test.ts src/app/__tests__/sitemap.test.ts src/lib/__tests__/seo-metadata.test.ts src/lib/seo/__tests__/url-generator.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run font and theme tests**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/__tests__/layout-fonts.test.ts' src/config/__tests__/static-theme-colors.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run message/content checks**

Run:

```bash
pnpm exec vitest run tests/unit/i18n-message-contract.test.ts
pnpm content:check
```

Expected: PASS.

- [ ] **Step 5: Run type check**

Run:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 6: Run local dev smoke**

Start dev server:

```bash
pnpm dev
```

Wait for:

```text
Ready
```

In another shell, run:

```bash
curl -I http://localhost:3000
curl -I http://localhost:3000/es
curl -I http://localhost:3000/zh
curl http://localhost:3000/robots.txt
curl http://localhost:3000/sitemap.xml
```

Expected:

- `/`, `/es`, and `/zh` return HTTP responses.
- `robots.txt` includes `/zh/`.
- `sitemap.xml` includes `/en` and `/es` URLs but no `/zh` URL.

Stop the dev server after smoke verification.

- [ ] **Step 7: Run broad release-facing check if time permits**

Run:

```bash
pnpm website:check
```

Expected: PASS. If this is too slow or fails due unrelated starter content readiness, record the exact failure in `DEVELOPMENT-LOG.md` and final report.

- [ ] **Step 8: Final git status**

Run:

```bash
git status --short --branch
```

Expected: clean except ignored runtime files. If not clean, inspect and either commit intended changes or document remaining files.

---

## Self-review checklist

- Spec coverage:
  - Brand identity: Task 4.
  - Locale truth: Task 1.
  - Spanish `[ES-TODO]`: Task 2.
  - `zh` robots/sitemap/hreflang exclusion: Task 3.
  - Navigation placeholder and Quote option A: Task 4.
  - Role tokens and accent boundary: Task 5.
  - Font strategy and rule hardness: Task 6.
  - Starter references and log: Task 7.
  - Verification: Task 8.
- Placeholder scan:
  - `[ES-TODO]` appears only as the intentional Spanish placeholder marker.
  - No `TBD` sections.
  - No vague "add tests" without specific files/assertions.
- Type consistency:
  - `publicLocales` and `PublicSeoLocale` are introduced in Task 1 and consumed in Task 3.
  - Font exports `ibmPlexSans`, `inter`, `ibmPlexMono` are used consistently in tests and implementation.
