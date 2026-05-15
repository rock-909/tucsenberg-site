import { z } from "zod";
import { i18nTextSchema } from "@/data/i18n-types";

// ---------------------------------------------------------------------------
// Spec sub-schemas
// ---------------------------------------------------------------------------

export const dimensionSchema = z.object({
  value: z.number(),
  unit: z.enum(["inch", "mm"]),
});

export type Dimension = z.infer<typeof dimensionSchema>;

export const temperatureRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  unit: z.enum(["celsius", "fahrenheit"]),
});

export type TemperatureRange = z.infer<typeof temperatureRangeSchema>;

export const airFlowRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  unit: z.enum(["scfm", "sm3/hr/m"]),
});

export type AirFlowRange = z.infer<typeof airFlowRangeSchema>;

// ---------------------------------------------------------------------------
// Product Group
// ---------------------------------------------------------------------------

export const productGroupSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: i18nTextSchema,
  description: i18nTextSchema,
  category: z.enum(["disc", "tube"]),
  variantIds: z.array(z.string()),
});

export type ProductGroup = z.infer<typeof productGroupSchema>;

// ---------------------------------------------------------------------------
// Product Variant
// ---------------------------------------------------------------------------

export const productVariantSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  groupId: z.string().min(1),
  name: i18nTextSchema,
  material: z.enum(["epdm", "tpu"]),
  sku: z.string().min(1),
  phase: z.union([z.literal(1), z.literal(2)]),
  specs: z
    .object({
      diameter: dimensionSchema.optional(),
      length: dimensionSchema.optional(),
      wallThickness: dimensionSchema.optional(),
      temperatureRange: temperatureRangeSchema.optional(),
      shoreHardness: z.number().optional(),
      tensileStrength: z.number().optional(),
      airFlowRange: airFlowRangeSchema.optional(),
    })
    .optional(),
});

export type ProductVariant = z.infer<typeof productVariantSchema>;

// ---------------------------------------------------------------------------
// OEM Brand
// ---------------------------------------------------------------------------

export const oemBrandSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  parentCompany: z.string().min(1).optional(),
  trademarkDisclaimer: i18nTextSchema,
  modelIds: z.array(z.string()),
});

export type OEMBrand = z.infer<typeof oemBrandSchema>;

// ---------------------------------------------------------------------------
// OEM Model
// ---------------------------------------------------------------------------

export const oemModelSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  brandId: z.string().min(1),
  name: z.string().min(1),
  oemPartNumbers: z.array(z.string()),
  category: z.enum(["disc", "tube"]),
  specs: z
    .object({
      diameter: dimensionSchema.optional(),
      length: dimensionSchema.optional(),
      connectionStyle: z.string().optional(),
      airFlowRange: airFlowRangeSchema.optional(),
    })
    .optional(),
});

export type OEMModel = z.infer<typeof oemModelSchema>;

// ---------------------------------------------------------------------------
// Compatibility Mapping
// ---------------------------------------------------------------------------

export const compatibilityMappingSchema = z.object({
  id: z.string().min(1),
  oemModelId: z.string().min(1),
  productVariantId: z.string().min(1),
  fitStatus: z.enum(["exact", "verify-dimensions", "custom"]),
  confidence: z.enum(["high", "medium", "low"]),
  requiredChecks: z.array(z.string()),
  disclaimer: z.string().min(1),
});

export type CompatibilityMapping = z.infer<typeof compatibilityMappingSchema>;
