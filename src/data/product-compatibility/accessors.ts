import {
  compatibilityByBrand,
  compatibilityByModel,
  compatibilityByProduct,
  type BrandCompatibilityEntry,
  type ModelCompatibilityEntry,
  type ProductCompatibilityEntry,
} from "@/data/product-compatibility/indexes";

export function getProductCompatibility(
  slug: string,
): ProductCompatibilityEntry | undefined {
  return compatibilityByProduct[slug];
}

export function getBrandCompatibility(
  slug: string,
): BrandCompatibilityEntry | undefined {
  return compatibilityByBrand[slug];
}

export function getModelCompatibility(
  slug: string,
): ModelCompatibilityEntry | undefined {
  return compatibilityByModel[slug];
}
