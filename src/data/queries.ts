import type {
  OEMBrand,
  OEMModel,
  ProductGroup,
  ProductVariant,
  CompatibilityMapping,
} from "@/data/schemas";
import { oemBrands } from "@/data/oem-brands";
import { oemModels } from "@/data/oem-models";
import { productGroups, productVariants } from "@/data/products";
import { compatibilityMappings } from "@/data/compatibility";

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getOEMBrandById(id: string): OEMBrand | undefined {
  return oemBrands.find((b) => b.id === id);
}

export function getOEMModelById(id: string): OEMModel | undefined {
  return oemModels.find((m) => m.id === id);
}

export function getProductGroupById(id: string): ProductGroup | undefined {
  return productGroups.find((g) => g.id === id);
}

export function getProductVariantById(id: string): ProductVariant | undefined {
  return productVariants.find((v) => v.id === id);
}

// ---------------------------------------------------------------------------
// Compatibility queries
// ---------------------------------------------------------------------------

export interface CompatibleProductResult {
  mapping: CompatibilityMapping;
  variant: ProductVariant;
  group: ProductGroup;
}

export function getCompatibleProducts(
  oemModelId: string,
): CompatibleProductResult[] {
  const results: CompatibleProductResult[] = [];

  for (const mapping of compatibilityMappings) {
    if (mapping.oemModelId !== oemModelId) continue;

    const variant = getProductVariantById(mapping.productVariantId);
    if (!variant) continue;

    const group = getProductGroupById(variant.groupId);
    if (!group) continue;

    results.push({ mapping, variant, group });
  }

  return results;
}

export interface CompatibleOEMResult {
  mapping: CompatibilityMapping;
  model: OEMModel;
  brand: OEMBrand;
}

export function getCompatibleOEMModels(
  productVariantId: string,
): CompatibleOEMResult[] {
  const results: CompatibleOEMResult[] = [];

  for (const mapping of compatibilityMappings) {
    if (mapping.productVariantId !== productVariantId) continue;

    const model = getOEMModelById(mapping.oemModelId);
    if (!model) continue;

    const brand = getOEMBrandById(model.brandId);
    if (!brand) continue;

    results.push({ mapping, model, brand });
  }

  return results;
}

export function getOEMBrandModels(brandId: string): OEMModel[] {
  return oemModels.filter((m) => m.brandId === brandId);
}

// ---------------------------------------------------------------------------
// Part number search
// ---------------------------------------------------------------------------

export interface SearchResult {
  model: OEMModel;
  brand: OEMBrand;
  compatibleProducts: CompatibleProductResult[];
}

export function searchByPartNumber(query: string): SearchResult[] {
  const normalizedQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const model of oemModels) {
    const isMatch = model.oemPartNumbers.some((pn) =>
      pn.toLowerCase().includes(normalizedQuery),
    );
    if (!isMatch) continue;

    const brand = getOEMBrandById(model.brandId);
    if (!brand) continue;

    results.push({
      model,
      brand,
      compatibleProducts: getCompatibleProducts(model.id),
    });
  }

  return results;
}
