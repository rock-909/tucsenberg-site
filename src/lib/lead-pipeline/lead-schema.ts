/**
 * Lead Pipeline Schema Definitions
 * Canonical product/general inquiry schema for /api/inquiry
 */

import { z } from "zod";
import { isProductMarketSlug } from "@/constants/product-catalog";
import {
  canonicalBuyerEmailSchema,
  canonicalBuyerFullNameSchema,
  canonicalBuyerMessageSchema,
} from "@/lib/lead-pipeline/canonical-buyer-fields";
import {
  PRODUCT_INQUIRY_KINDS,
  type ProductInquiryKind,
} from "@/lib/lead-pipeline/product-inquiry-kinds";
import { sanitizePlainText } from "@/lib/security/validation";
import type { AttributionFieldName } from "@/lib/marketing/attribution-fields";
import { MAX_LEAD_PRODUCT_NAME_LENGTH } from "@/constants";

export const PRODUCT_LEAD_TYPE = "product" as const;

export { PRODUCT_INQUIRY_KINDS, type ProductInquiryKind };

const sanitizedString = () => z.string().overwrite(sanitizePlainText);
const MAX_ATTRIBUTION_FIELD_LENGTH = 256;

export const leadAttributionFields = {
  utmSource: sanitizedString().max(MAX_ATTRIBUTION_FIELD_LENGTH).optional(),
  utmMedium: sanitizedString().max(MAX_ATTRIBUTION_FIELD_LENGTH).optional(),
  utmCampaign: sanitizedString().max(MAX_ATTRIBUTION_FIELD_LENGTH).optional(),
  utmTerm: sanitizedString().max(MAX_ATTRIBUTION_FIELD_LENGTH).optional(),
  utmContent: sanitizedString().max(MAX_ATTRIBUTION_FIELD_LENGTH).optional(),
  gclid: sanitizedString().max(MAX_ATTRIBUTION_FIELD_LENGTH).optional(),
  fbclid: sanitizedString().max(MAX_ATTRIBUTION_FIELD_LENGTH).optional(),
  msclkid: sanitizedString().max(MAX_ATTRIBUTION_FIELD_LENGTH).optional(),
  landingPage: sanitizedString().max(MAX_ATTRIBUTION_FIELD_LENGTH).optional(),
  capturedAt: sanitizedString().max(MAX_ATTRIBUTION_FIELD_LENGTH).optional(),
} satisfies Record<AttributionFieldName, z.ZodOptional<z.ZodString>>;

const baseLeadFields = {
  ...leadAttributionFields,
};

const catalogProductIdSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isProductMarketSlug, {
    error: "catalogProductId must match a real catalog product",
  });

export const productLeadSchema = z
  .object({
    type: z.literal(PRODUCT_LEAD_TYPE),
    productInquiryKind: z.enum([
      PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT,
      PRODUCT_INQUIRY_KINDS.GENERAL_RFQ,
    ]),
    fullName: canonicalBuyerFullNameSchema,
    email: canonicalBuyerEmailSchema,
    message: canonicalBuyerMessageSchema.optional(),
    catalogProductId: catalogProductIdSchema.optional(),
    buyerInterest: sanitizedString()
      .max(MAX_LEAD_PRODUCT_NAME_LENGTH)
      .optional(),
    ...baseLeadFields,
  })
  .superRefine((data, ctx) => {
    if (data.productInquiryKind === PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT) {
      if (!data.catalogProductId) {
        ctx.addIssue({
          code: "custom",
          path: ["catalogProductId"],
          message: "catalogProductId is required for a catalog product inquiry",
        });
      }
      return;
    }

    if (data.catalogProductId !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["catalogProductId"],
        message: "general RFQ must not carry a catalog product identity",
      });
    }
  });

export type ProductLeadInput = z.infer<typeof productLeadSchema>;

export function isCatalogProductInquiry(lead: ProductLeadInput): boolean {
  return lead.productInquiryKind === PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT;
}
