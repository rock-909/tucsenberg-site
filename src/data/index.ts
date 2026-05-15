// Types
export type {
  Dimension,
  TemperatureRange,
  AirFlowRange,
  ProductGroup,
  ProductVariant,
  OEMBrand,
  OEMModel,
  CompatibilityMapping,
} from "@/data/schemas";
export type { I18nText } from "@/data/i18n-types";

// Data arrays
export { oemBrands } from "@/data/oem-brands";
export { oemModels } from "@/data/oem-models";
export { productGroups, productVariants } from "@/data/products";
export { compatibilityMappings } from "@/data/compatibility";

// Query functions and result types
export type {
  CompatibleProductResult,
  CompatibleOEMResult,
  SearchResult,
} from "@/data/queries";
export {
  getOEMBrandById,
  getOEMModelById,
  getProductGroupById,
  getProductVariantById,
  getCompatibleProducts,
  getCompatibleOEMModels,
  getOEMBrandModels,
  searchByPartNumber,
} from "@/data/queries";
