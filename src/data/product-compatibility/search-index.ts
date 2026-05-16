/**
 * Server-side entry point for the serializable client search index.
 *
 * `buildClientSearchIndex()` is defined in `indexes.ts` (where the
 * Zod-validated catalog already lives, so Zod parsing stays server-side). The
 * home page Server Component imports it from here, builds the plain index
 * once, and passes it as a prop to the client hero search. The client hero
 * search imports only the PURE matcher from `search-match.ts` and never this
 * module or the Zod barrel.
 *
 * Pairing:
 * - SERVER: `buildClientSearchIndex()` (this module / `indexes.ts`)
 * - CLIENT: `matchClientSearchIndex(query, index)` (`search-match.ts`)
 */

export { buildClientSearchIndex } from "@/data/product-compatibility/indexes";
export {
  matchClientSearchIndex,
  type ClientSearchIndex,
  type ClientSearchResults,
  type ModelCompatibilityEntry,
  type ProductCompatibilityEntry,
} from "@/data/product-compatibility/search-match";
