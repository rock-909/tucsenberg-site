/**
 * Pure, browser-safe compatibility search matcher.
 *
 * This module is the single source of the search-match algorithm. It is
 * imported by the above-the-fold home hero search client island, so it must
 * stay free of the Zod-validated data layer:
 *
 * - no value import of `@/data/product-compatibility` (the Zod barrel) or any
 *   of its data modules (`catalog`, `mappings`, `indexes`, `product-slug`,
 *   `search-index`);
 * - no `zod` import — no `.parse()` runs on hydration.
 *
 * Only TYPE imports from the leaf `search-types` module are used; types are
 * erased at compile time and never enter the client bundle, and that module
 * imports nothing back into the data layer, so there is no cycle.
 *
 * The server builds a pre-validated, JSON-serializable index
 * (`buildClientSearchIndex()` in `search-index.ts`) whose entries already
 * carry a precomputed list of normalized haystack fields. This module
 * normalizes the query the same way and does per-field substring matching, so
 * the results — same matches, same ordering, same `canonicalProductSlug` and
 * localized fields — are identical to the server-side
 * `findCompatibilityMatches`.
 */

import type {
  ModelCompatibilityEntry,
  ProductCompatibilityEntry,
} from "@/data/product-compatibility/search-types";

export type {
  ModelCompatibilityEntry,
  ProductCompatibilityEntry,
} from "@/data/product-compatibility/search-types";

/**
 * One searchable model entry: the UI-consumed shape plus a precomputed list of
 * already-normalized haystack fields. Plain data, JSON-serializable.
 */
export interface ClientModelSearchEntry {
  entry: ModelCompatibilityEntry;
  haystack: string[];
}

/**
 * One searchable product entry: the UI-consumed shape plus a precomputed list
 * of already-normalized haystack fields. Plain data, JSON-serializable.
 */
export interface ClientProductSearchEntry {
  entry: ProductCompatibilityEntry;
  haystack: string[];
}

/**
 * Serializable, pre-validated client search index. Built server-side from the
 * Zod-validated data layer and passed to the client as a plain prop. Contains
 * no class instances and no Zod instances.
 */
export interface ClientSearchIndex {
  models: ClientModelSearchEntry[];
  products: ClientProductSearchEntry[];
}

export interface ClientSearchResults {
  models: ModelCompatibilityEntry[];
  products: ProductCompatibilityEntry[];
}

/**
 * Lowercase + strip every non-alphanumeric character. Shared by the server
 * index builder and the client query path so a query and a haystack field
 * normalize identically (e.g. `TUC-T62-EPDM`, `tuc t62 epdm` ->
 * `tuct62epdm`).
 */
export function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Normalize every raw field once. The server builder calls this so the client
 * only ever normalizes the (short) query, never the catalog.
 */
export function buildHaystack(fields: readonly string[]): string[] {
  return fields.map((field) => normalizeSearchText(field));
}

function haystackIncludes(
  haystack: readonly string[],
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) {
    return false;
  }

  // Per-field substring match — identical semantics to the data layer's
  // `haystack.some((value) => normalize(value).includes(query))`.
  return haystack.some((field) => field.includes(normalizedQuery));
}

/**
 * Pure search over a serializable index. Returns the same result shape the UI
 * consumes, with the same matches and ordering as the server-side
 * `findCompatibilityMatches`.
 */
export function matchClientSearchIndex(
  query: string,
  index: ClientSearchIndex,
): ClientSearchResults {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return { models: [], products: [] };
  }

  const models = index.models
    .filter((candidate) =>
      haystackIncludes(candidate.haystack, normalizedQuery),
    )
    .map((candidate) => candidate.entry);
  const products = index.products
    .filter((candidate) =>
      haystackIncludes(candidate.haystack, normalizedQuery),
    )
    .map((candidate) => candidate.entry);

  return { models, products };
}
