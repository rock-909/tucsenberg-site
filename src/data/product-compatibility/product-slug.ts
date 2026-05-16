/**
 * Canonical, buyer-facing product slug derivation.
 *
 * Tucsenberg is an unknown aftermarket brand, so the product detail URL must
 * carry the real buyer search terms (diameter + material + form +
 * "replacement") instead of the internal SKU slug. The descriptive slug is the
 * CANONICAL URL; the short SKU slug (`tuc-d9-epdm`) permanently redirects to
 * it so datasheet / QR / already-shared links never 404 and link equity
 * consolidates.
 *
 * This is the single source of slug-building logic. Pages, sitemap, and nav
 * config must derive product URLs from here — do not rebuild this rule inline.
 */

import {
  compatibilityByProduct,
  type ProductCompatibilityEntry,
} from "@/data/product-compatibility/indexes";
import { productVariants } from "@/data/product-compatibility/catalog";
import { buildCanonicalProductSlug } from "@/data/product-compatibility/slug-rule";
import type { ProductVariant } from "@/data/product-compatibility/schemas";

const variantById = new Map(
  productVariants.map((variant) => [variant.id, variant] as const),
);

const groupCategoryByVariantId = new Map(
  Object.values(compatibilityByProduct).map(
    (entry) => [entry.productVariantId, entry.category] as const,
  ),
);

function categoryFor(variant: ProductVariant): "disc" | "tube" {
  const category = groupCategoryByVariantId.get(variant.id);

  if (!category) {
    throw new Error(`Missing product group category for: ${variant.id}`);
  }

  return category;
}

/**
 * Pure, deterministic canonical slug. Delegates to the shared slug rule
 * (`slug-rule.ts`) so the rule has exactly one definition; this wrapper only
 * resolves the variant's group category from the compatibility index.
 *
 * Examples: `9-inch-epdm-disc-replacement`, `62-mm-epdm-tube-replacement`.
 */
export function canonicalProductSlug(variant: ProductVariant): string {
  return buildCanonicalProductSlug(variant, categoryFor(variant));
}

interface CanonicalSlugMaps {
  bySkuSlug: Map<string, string>;
  byCanonicalSlug: Map<string, ProductCompatibilityEntry>;
}

function buildMaps(): CanonicalSlugMaps {
  const bySkuSlug = new Map<string, string>();
  const byCanonicalSlug = new Map<string, ProductCompatibilityEntry>();

  for (const variant of productVariants) {
    const canonical = canonicalProductSlug(variant);

    if (byCanonicalSlug.has(canonical)) {
      // The uniqueness invariant is proven in product-slug.test.ts. If two
      // variants ever collide on {dimension,unit,material,form}, fail loudly
      // at module load rather than silently shadowing a product.
      throw new Error(
        `Duplicate canonical product slug "${canonical}" for variant ${variant.id}`,
      );
    }

    const entry = compatibilityByProduct[variant.slug];

    if (!entry) {
      throw new Error(
        `Missing compatibility entry for variant slug: ${variant.slug}`,
      );
    }

    bySkuSlug.set(variant.slug, canonical);
    byCanonicalSlug.set(canonical, entry);
  }

  return { bySkuSlug, byCanonicalSlug };
}

const { bySkuSlug, byCanonicalSlug } = buildMaps();

/**
 * Resolve a product entry by its canonical descriptive slug. Returns
 * `undefined` for unknown slugs and for the legacy SKU slug (the SKU slug must
 * redirect, not render).
 */
export function getProductCompatibilityByCanonicalSlug(
  slug: string,
): ProductCompatibilityEntry | undefined {
  return byCanonicalSlug.get(slug);
}

/**
 * Map a legacy SKU data-layer slug (`tuc-d9-epdm`) to its canonical
 * descriptive slug. Returns `undefined` when the input is not a known SKU slug
 * (including when it is already a canonical slug).
 */
export function resolveCanonicalProductSlugFromSku(
  skuSlug: string,
): string | undefined {
  return bySkuSlug.get(skuSlug);
}

/** Every canonical descriptive slug, in catalog order. */
export function allCanonicalProductSlugs(): string[] {
  return productVariants.map((variant) => canonicalProductSlug(variant));
}

/**
 * Canonical descriptive slug for a known SKU/variant slug, or the input
 * unchanged when it is not a SKU slug (e.g. already canonical). Useful for
 * config/nav values defined as a SKU slug today.
 */
export function toCanonicalProductSlug(slug: string): string {
  return bySkuSlug.get(slug) ?? slug;
}

/** Canonical descriptive slug for a variant id, used by indexes/consumers. */
export function canonicalProductSlugForVariantId(
  variantId: string,
): string | undefined {
  const variant = variantById.get(variantId);
  return variant ? canonicalProductSlug(variant) : undefined;
}
