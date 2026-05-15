import {
  oemBrands,
  oemModels,
  productGroups,
  productVariants,
} from "@/data/product-compatibility/catalog";
import { compatibilityMappings } from "@/data/product-compatibility/mappings";
import type {
  CompatibilityMapping,
  LocalizedText,
  OEMModel,
  ProductCategory,
  ProductVariant,
} from "@/data/product-compatibility/schemas";

interface CompatibleProductEntry {
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

interface CompatibleOEMModelEntry {
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

const brandById = new Map(oemBrands.map((brand) => [brand.id, brand]));
const modelById = new Map(oemModels.map((model) => [model.id, model]));
const variantById = new Map(
  productVariants.map((variant) => [variant.id, variant]),
);
const groupById = new Map(productGroups.map((group) => [group.id, group]));

function getBrandById(brandId: string) {
  const brand = brandById.get(brandId);

  if (!brand) {
    throw new Error(`Missing OEM brand for id: ${brandId}`);
  }

  return brand;
}

function getModelById(modelId: string) {
  const model = modelById.get(modelId);

  if (!model) {
    throw new Error(`Missing OEM model for id: ${modelId}`);
  }

  return model;
}

function getVariantById(productVariantId: string) {
  const variant = variantById.get(productVariantId);

  if (!variant) {
    throw new Error(`Missing product variant for id: ${productVariantId}`);
  }

  return variant;
}

function categoryForVariant(variant: ProductVariant): ProductCategory {
  const group = groupById.get(variant.groupId);

  if (!group) {
    throw new Error(`Missing product group for id: ${variant.groupId}`);
  }

  return group.category;
}

function compatibleProductFromMapping(
  mapping: CompatibilityMapping,
): CompatibleProductEntry {
  const variant = getVariantById(mapping.productVariantId);

  return {
    id: variant.id,
    slug: variant.slug,
    sku: variant.sku,
    name: variant.name,
    material: variant.material,
    fitStatus: mapping.fitStatus,
    confidence: mapping.confidence,
    requiredChecks: mapping.requiredChecks,
    disclaimer: mapping.disclaimer,
  };
}

function compatibleOemModelFromMapping(
  mapping: CompatibilityMapping,
): CompatibleOEMModelEntry {
  const model = getModelById(mapping.oemModelId);
  const brand = getBrandById(model.brandId);

  return {
    modelId: model.id,
    modelSlug: model.slug,
    modelName: model.name,
    brandId: brand.id,
    brandSlug: brand.slug,
    brandName: brand.name,
    trademarkDisclaimer: brand.trademarkDisclaimer,
    category: model.category,
    oemPartNumbers: model.oemPartNumbers,
    searchAliases: model.searchAliases,
    specs: model.specs,
    fitStatus: mapping.fitStatus,
    confidence: mapping.confidence,
    requiredChecks: mapping.requiredChecks,
    disclaimer: mapping.disclaimer,
  };
}

function mappingsForModel(modelId: string) {
  return compatibilityMappings.filter(
    (mapping) => mapping.oemModelId === modelId,
  );
}

function mappingsForProduct(productVariantId: string) {
  return compatibilityMappings.filter(
    (mapping) => mapping.productVariantId === productVariantId,
  );
}

function modelEntryFor(model: OEMModel): ModelCompatibilityEntry {
  const brand = getBrandById(model.brandId);

  return {
    modelId: model.id,
    modelSlug: model.slug,
    modelName: model.name,
    brandId: brand.id,
    brandSlug: brand.slug,
    brandName: brand.name,
    trademarkDisclaimer: brand.trademarkDisclaimer,
    category: model.category,
    oemPartNumbers: model.oemPartNumbers,
    searchAliases: model.searchAliases,
    specs: model.specs,
    compatibleProducts: mappingsForModel(model.id).map(
      compatibleProductFromMapping,
    ),
  };
}

function productEntryFor(variant: ProductVariant): ProductCompatibilityEntry {
  return {
    productVariantId: variant.id,
    productSlug: variant.slug,
    sku: variant.sku,
    name: variant.name,
    material: variant.material,
    category: categoryForVariant(variant),
    compatibleOemModels: mappingsForProduct(variant.id).map(
      compatibleOemModelFromMapping,
    ),
  };
}

export const compatibilityByModel = Object.fromEntries(
  oemModels.map((model) => [model.slug, modelEntryFor(model)]),
) as Record<string, ModelCompatibilityEntry>;

export const compatibilityByProduct = Object.fromEntries(
  productVariants.map((variant) => [variant.slug, productEntryFor(variant)]),
) as Record<string, ProductCompatibilityEntry>;

export const compatibilityByBrand = Object.fromEntries(
  oemBrands.map((brand) => {
    const models = brand.modelIds.map((modelId) =>
      modelEntryFor(getModelById(modelId)),
    );

    return [
      brand.slug,
      {
        brandId: brand.id,
        brandSlug: brand.slug,
        brandName: brand.name,
        trademarkDisclaimer: brand.trademarkDisclaimer,
        models,
      },
    ];
  }),
) as Record<string, BrandCompatibilityEntry>;

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function includesNormalized(haystack: readonly string[], query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return false;
  }

  return haystack.some((value) =>
    normalizeSearchText(value).includes(normalizedQuery),
  );
}

function modelSearchHaystack(entry: ModelCompatibilityEntry) {
  return [
    entry.modelId,
    entry.modelSlug,
    entry.modelName,
    entry.brandId,
    entry.brandSlug,
    entry.brandName,
    ...entry.oemPartNumbers,
    ...entry.searchAliases,
    entry.specs.diameter ?? "",
    entry.specs.length ?? "",
    entry.specs.connectionStyle ?? "",
  ];
}

function productSearchHaystack(entry: ProductCompatibilityEntry) {
  return [
    entry.productVariantId,
    entry.productSlug,
    entry.sku,
    entry.name.en,
    entry.name.es,
    entry.name.zh,
    entry.material,
  ];
}

export function findCompatibilityMatches(
  query: string,
): CompatibilitySearchResults {
  const models = Object.values(compatibilityByModel).filter((entry) =>
    includesNormalized(modelSearchHaystack(entry), query),
  );
  const products = Object.values(compatibilityByProduct).filter((entry) =>
    includesNormalized(productSearchHaystack(entry), query),
  );

  return { models, products };
}
