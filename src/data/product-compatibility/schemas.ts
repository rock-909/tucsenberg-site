import { z } from "zod";

export const localizedTextSchema = z.object({
  en: z.string().trim().min(1),
  es: z.string().trim().min(1),
  zh: z.string().trim().min(1),
});

export const productCategorySchema = z.enum(["disc", "tube"]);
export const membraneMaterialSchema = z.enum(["epdm", "tpu"]);
export const productPhaseSchema = z.union([z.literal(1), z.literal(2)]);

export const productSpecsSchema = z.object({
  diameter: z.string().trim().min(1).optional(),
  length: z.string().trim().min(1).optional(),
  wallThickness: z.string().trim().min(1).optional(),
  temperatureRange: z.string().trim().min(1).optional(),
  shoreHardness: z.string().trim().min(1).optional(),
  airFlowRange: z.string().trim().min(1).optional(),
});

export const productGroupSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  name: localizedTextSchema,
  description: localizedTextSchema,
  category: productCategorySchema,
  variantIds: z.array(z.string().trim().min(1)).min(1),
});

export const productVariantSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  groupId: z.string().trim().min(1),
  name: localizedTextSchema,
  material: membraneMaterialSchema,
  sku: z.string().trim().min(1),
  phase: productPhaseSchema,
  specs: productSpecsSchema,
});

export const oemBrandSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  trademarkDisclaimer: localizedTextSchema,
  modelIds: z.array(z.string().trim().min(1)).min(1),
});

export const oemModelSpecsSchema = z.object({
  diameter: z.string().trim().min(1).optional(),
  length: z.string().trim().min(1).optional(),
  connectionStyle: z.string().trim().min(1).optional(),
});

export const oemModelSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  brandId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  oemPartNumbers: z.array(z.string().trim().min(1)),
  searchAliases: z.array(z.string().trim().min(1)).min(1),
  category: productCategorySchema,
  specs: oemModelSpecsSchema,
});

export const fitStatusSchema = z.enum(["exact", "verify-dimensions", "custom"]);
export const confidenceSchema = z.enum(["high", "medium", "low"]);

export const compatibilityMappingSchema = z.object({
  id: z.string().trim().min(1),
  oemModelId: z.string().trim().min(1),
  productVariantId: z.string().trim().min(1),
  fitStatus: fitStatusSchema,
  confidence: confidenceSchema,
  requiredChecks: z.array(localizedTextSchema).min(1),
  disclaimer: localizedTextSchema,
});

export const productCompatibilityCatalogSchema = z.object({
  productGroups: z.array(productGroupSchema).min(1),
  productVariants: z.array(productVariantSchema).min(1),
  oemBrands: z.array(oemBrandSchema).min(1),
  oemModels: z.array(oemModelSchema).min(1),
  compatibilityMappings: z.array(compatibilityMappingSchema).min(1),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type MembraneMaterial = z.infer<typeof membraneMaterialSchema>;
export type ProductSpecs = z.infer<typeof productSpecsSchema>;
export type ProductGroup = z.infer<typeof productGroupSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type OEMBrand = z.infer<typeof oemBrandSchema>;
export type OEMModel = z.infer<typeof oemModelSchema>;
export type FitStatus = z.infer<typeof fitStatusSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type CompatibilityMapping = z.infer<typeof compatibilityMappingSchema>;
