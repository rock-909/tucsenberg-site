import enCriticalMessages from "../../messages/en/critical.json";
import enDeferredMessages from "../../messages/en/deferred.json";
import esCriticalMessages from "../../messages/es/critical.json";
import esDeferredMessages from "../../messages/es/deferred.json";
import { describe, expect, it } from "vitest";

type JsonObject = Record<string, unknown>;

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
      collectLeafPaths(entry, `${prefix}.${index}`.replace(/^\./u, "")),
    );
  }

  return Object.entries(value).flatMap(([key, child]) =>
    collectLeafPaths(child, `${prefix}.${key}`.replace(/^\./u, "")),
  );
}

const TODO_MARKER = /\[(?:ES|EN)-TODO\]|\bTODO\]/u;

/**
 * Namespaces reachable from the four public Step-4 pages (home, membrane
 * product, compatible-brand, quote) or from global public chrome (navigation,
 * footer, language switcher, cookie banner, theme toggle, accessibility
 * labels, API/error surfaces a buyer can hit, and the public 404). A Spanish
 * (or English) placeholder leaking into any of these is buyer-visible and a
 * launch blocker.
 *
 * `content.pages.quote` is included only if it exists — it currently does not
 * (page copy is MDX-backed), so the scan skips it cleanly.
 */
const GUARDED_NAMESPACES = [
  "home",
  "search",
  "membraneProduct",
  "compatibleBrand",
  "quote",
  "navigation",
  "footer",
  "accessibility",
  "language",
  "common",
  "cookie",
  "theme",
  "apiErrors",
  "errorBoundary",
  "errors.notFound",
  "content.pages.quote",
] as const;

/**
 * Leaf message paths under the `structured-data` namespace that are emitted
 * verbatim into PUBLIC machine-readable JSON-LD as human-readable text.
 *
 * - `organization.name` / `organization.description` and
 *   `website.name` / `website.description` are rendered site-wide on every
 *   public page (incl. all four Step-4 pages) via
 *   `generatePageStructuredData` -> `generateOrganizationData` /
 *   `generateWebSiteData` (`src/lib/structured-data-generators.ts`).
 * - `article.default*` and `product.default*` are emitted as crawler-visible
 *   fallbacks by `generateArticleData` / `generateProductData` when a page
 *   does not supply its own title/description.
 *
 * Intentionally NOT listed:
 * - `organization.phone` — not emitted; the generator sourced the telephone
 *   from `getPublicContactPhone`, never this leaf.
 * - `organization.social.twitter` / `organization.social.linkedin` — these are
 *   example URLs (`https://x.com/example`, …) that
 *   `normalizeSocialUrl`/`EXAMPLE_SOCIAL_URLS` strip before they can reach
 *   `sameAs`, so they never surface publicly. Guarding them would only assert
 *   placeholder-URL hygiene, not buyer/crawler exposure.
 *
 * A `[ES-TODO]` (or `[EN-TODO]`) in any listed leaf ships unfinished
 * machine-readable brand data to search engines and LLM crawlers — a public
 * regression even though it is not on-page rendered copy.
 */
const PUBLIC_STRUCTURED_DATA_LEAVES = [
  "structured-data.organization.name",
  "structured-data.organization.description",
  "structured-data.website.name",
  "structured-data.website.description",
  "structured-data.article.defaultTitle",
  "structured-data.article.defaultDescription",
  "structured-data.article.defaultAuthor",
  "structured-data.product.defaultName",
  "structured-data.product.defaultDescription",
] as const;

/**
 * Non-public / legacy namespaces explicitly OUT of this guard. None of these
 * are reachable from the four public Step-4 pages or from global public
 * chrome, so a retained `[ES-TODO]` here is intentional legacy debt, not a
 * buyer-visible regression. Documented here so widening this set is a
 * deliberate, reviewable decision rather than a silent allowlist drift.
 *
 * - `blog`, `catalog`, `underConstruction`: legacy/non-launched template
 *   surfaces, not linked from public Step-4 navigation.
 * - `monitoring`: ops surface, not rendered buyer copy and not emitted into
 *   public JSON-LD.
 * - `structured-data` as a whole namespace stays out of the on-page
 *   `GUARDED_NAMESPACES` scan (it is machine data, not rendered prose), BUT
 *   its public-emitted leaves are now guarded separately via
 *   `PUBLIC_STRUCTURED_DATA_LEAVES` below — a `[ES-TODO]` there leaks to
 *   crawlers, so it is no longer treated as out-of-scope debt.
 * - the remainder of `deferred.*` outside the guarded namespaces above:
 *   lazily-loaded non-public bundles.
 *
 * This set is asserted-aware: the test below only scans GUARDED_NAMESPACES, so
 * everything else (including these) is out of scope by construction. The list
 * is documentation of the boundary rationale, mirroring the rationale style of
 * `tests/unit/i18n-message-contract.test.ts`.
 */
const NON_PUBLIC_NAMESPACES_OUT_OF_GUARD = [
  "blog",
  "catalog",
  "underConstruction",
  "structured-data",
  "monitoring",
] as const;

const LOCALE_BUNDLES = [
  ["en", mergeMessages(enCriticalMessages, enDeferredMessages)],
  ["es", mergeMessages(esCriticalMessages, esDeferredMessages)],
] as const;

describe("public Spanish/English placeholder guard", () => {
  it("documents the non-public namespaces intentionally excluded", () => {
    // Sanity: the excluded set must not silently overlap the guarded set.
    for (const excluded of NON_PUBLIC_NAMESPACES_OUT_OF_GUARD) {
      expect(GUARDED_NAMESPACES).not.toContain(excluded);
    }
  });

  it.each(LOCALE_BUNDLES)(
    "has zero TODO markers in any public namespace for %s",
    (locale, messages) => {
      const leaks: string[] = [];

      for (const namespace of GUARDED_NAMESPACES) {
        const subtree = getMessageValue(messages, namespace);
        if (subtree === undefined) {
          // Namespace not present (e.g. content.pages.quote) — skip cleanly.
          continue;
        }

        for (const leafPath of collectLeafPaths(subtree, namespace)) {
          const value = getMessageValue(messages, leafPath);
          if (typeof value === "string" && TODO_MARKER.test(value)) {
            leaks.push(`${locale}:${leafPath} => ${value}`);
          }
        }
      }

      expect(leaks).toEqual([]);
    },
  );

  it.each(LOCALE_BUNDLES)(
    "has zero TODO markers in any public-emitted structured-data leaf for %s",
    (locale, messages) => {
      const leaks: string[] = [];

      for (const leafPath of PUBLIC_STRUCTURED_DATA_LEAVES) {
        const value = getMessageValue(messages, leafPath);
        // Every listed leaf must exist (key-parity guard) and be a string.
        expect(typeof value, `${locale}:${leafPath} must be a string`).toBe(
          "string",
        );
        if (typeof value === "string" && TODO_MARKER.test(value)) {
          leaks.push(`${locale}:${leafPath} => ${value}`);
        }
      }

      expect(leaks).toEqual([]);
    },
  );
});
