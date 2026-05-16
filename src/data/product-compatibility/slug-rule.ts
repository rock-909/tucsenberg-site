/**
 * Pure canonical-slug rule.
 *
 * This is the single source of the slug-building logic, isolated from the
 * compatibility indexes so that `indexes.ts` can carry the canonical slug on
 * each product entry without a circular import (`product-slug.ts` imports
 * `compatibilityByProduct` from `indexes.ts`; `indexes.ts` cannot import back
 * from `product-slug.ts`). Both modules derive the slug from this rule — do
 * not rebuild it inline elsewhere.
 *
 * The rule depends only on the variant shape and its group category, so it
 * stays Zod-free and side-effect-free.
 */

import type {
  ProductCategory,
  ProductVariant,
} from "@/data/product-compatibility/schemas";

/**
 * The data-layer slug encodes the dimension token, e.g. `tuc-d9-epdm` → `9`,
 * `tuc-t62-epdm` → `62`. Disc dimensions are nominal inches; tube classes are
 * nominal millimetres (see `catalog.ts` `specs.diameter`). The dimension token
 * is parsed from the variant slug so the rule stays deterministic even though
 * `specs.diameter` is free-form prose.
 */
const DIMENSION_TOKEN = /^tuc-[dt](\d+)-/;

function dimensionToken(variant: ProductVariant): string {
  const match = DIMENSION_TOKEN.exec(variant.slug);

  if (!match?.[1]) {
    // Defensive: every catalog variant matches today; fall back to the SKU so
    // the slug stays unique and URL-safe rather than throwing at build time.
    return variant.sku.toLowerCase();
  }

  return match[1];
}

/**
 * Pure, deterministic canonical slug.
 *
 * Rule: `{dimension}-{unit}-{material}-{form}-replacement`
 * - dimension: numeric token from the variant slug (`d9` → 9, `t62` → 62)
 * - unit: `inch` for disc, `mm` for tube
 * - material: variant material (`epdm` | `tpu`)
 * - form: group category (`disc` | `tube`)
 *
 * Examples: `9-inch-epdm-disc-replacement`, `62-mm-epdm-tube-replacement`.
 */
export function buildCanonicalProductSlug(
  variant: ProductVariant,
  category: ProductCategory,
): string {
  const unit = category === "disc" ? "inch" : "mm";

  return [
    dimensionToken(variant),
    unit,
    variant.material,
    category,
    "replacement",
  ].join("-");
}
