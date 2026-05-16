/**
 * Pure, serializable compatibility entry/result types.
 *
 * This is a LEAF module: it imports only Zod-derived TYPES from `schemas.ts`
 * (erased at compile time) and nothing else from the data layer. It exists so
 * the pure browser-safe matcher (`search-match.ts`) and the Zod-validated
 * server index builder (`indexes.ts`) can share one set of UI-consumed shapes
 * WITHOUT a circular dependency:
 *
 *   indexes.ts        -> search-match.ts   (value: matchClientSearchIndex, ...)
 *   indexes.ts        -> search-types.ts   (type only)
 *   search-match.ts   -> search-types.ts   (type only)
 *   search-types.ts   -> schemas.ts        (type only, schemas imports only zod)
 *
 * There is no edge back into `indexes.ts` from either consumer, so the
 * dependency graph is strictly one-directional and acyclic.
 *
 * Every type here is plain, JSON-serializable data — no class instances and no
 * Zod instances — so a built index can cross the server/client boundary as a
 * plain prop.
 */

import type {
  CompatibilityMapping,
  LocalizedText,
  OEMModel,
  ProductCategory,
  ProductVariant,
} from "@/data/product-compatibility/schemas";

export interface CompatibleProductEntry {
  id: string;
  slug: string;
  sku: string;
  name: LocalizedText;
  material: ProductVariant["material"];
  fitStatus: CompatibilityMapping["fitStatus"];
  confidence: CompatibilityMapping["confidence"];
  requiredChecks: LocalizedText[];
  disclaimer: LocalizedText;
}

export interface CompatibleOEMModelEntry {
  modelId: string;
  modelSlug: string;
  modelName: string;
  brandId: string;
  brandSlug: string;
  brandName: string;
  trademarkDisclaimer: LocalizedText;
  category: ProductCategory;
  oemPartNumbers: string[];
  searchAliases: string[];
  specs: OEMModel["specs"];
  fitStatus: CompatibilityMapping["fitStatus"];
  confidence: CompatibilityMapping["confidence"];
  requiredChecks: LocalizedText[];
  disclaimer: LocalizedText;
}

export interface ModelCompatibilityEntry {
  modelId: string;
  modelSlug: string;
  modelName: string;
  brandId: string;
  brandSlug: string;
  brandName: string;
  trademarkDisclaimer: LocalizedText;
  category: ProductCategory;
  oemPartNumbers: string[];
  searchAliases: string[];
  specs: OEMModel["specs"];
  compatibleProducts: CompatibleProductEntry[];
}

export interface BrandCompatibilityEntry {
  brandId: string;
  brandSlug: string;
  brandName: string;
  trademarkDisclaimer: LocalizedText;
  models: ModelCompatibilityEntry[];
}

export interface ProductCompatibilityEntry {
  productVariantId: string;
  productSlug: string;
  /**
   * Canonical descriptive buyer URL slug (`{dimension}-{unit}-{material}-
   * {form}-replacement`). The product route renders this slug; `productSlug`
   * (the legacy SKU slug) only 308-redirects to it. Computed server-side in
   * `indexes.ts` so client search components link the canonical URL directly
   * without importing the Zod-validated data barrel.
   */
  canonicalProductSlug: string;
  sku: string;
  name: LocalizedText;
  material: ProductVariant["material"];
  category: ProductCategory;
  compatibleOemModels: CompatibleOEMModelEntry[];
}

export interface CompatibilitySearchResults {
  models: ModelCompatibilityEntry[];
  products: ProductCompatibilityEntry[];
}
