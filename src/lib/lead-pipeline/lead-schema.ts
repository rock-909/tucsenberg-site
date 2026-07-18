/**
 * Lead Pipeline Schema Definitions
 * Unified Zod schema for all lead sources: contact and product inquiry
 */

import { z } from "zod";
import { CONTACT_FORM_VALIDATION_CONSTANTS } from "@/config/contact-form-config";
import { singleSiteProductCatalog } from "@/config/single-site-product-catalog";
import {
  canonicalBuyerEmailSchema,
  canonicalBuyerFullNameSchema,
  canonicalBuyerMessageSchema,
} from "@/lib/lead-pipeline/canonical-buyer-fields";
import {
  PRODUCT_INQUIRY_KINDS,
  type ProductInquiryKind,
} from "@/lib/lead-pipeline/product-inquiry-kinds";
import {
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/security/validation";
import type { AttributionFieldName } from "@/lib/marketing/attribution-fields";
import {
  MAX_LEAD_COMPANY_LENGTH,
  MAX_LEAD_PRODUCT_NAME_LENGTH,
  MAX_LEAD_REQUIREMENTS_LENGTH,
} from "@/constants";

/**
 * Lead type discriminator
 */
export const LEAD_TYPES = {
  CONTACT: "contact",
  PRODUCT: "product",
} as const;

export type LeadType = (typeof LEAD_TYPES)[keyof typeof LEAD_TYPES];

export { PRODUCT_INQUIRY_KINDS, type ProductInquiryKind };

/**
 * Subject options for contact form
 */
export const CONTACT_SUBJECTS = {
  PRODUCT_INQUIRY: "product_inquiry",
  DISTRIBUTOR: "distributor",
  CUSTOM_PROJECT: "custom_project",
  OTHER: "other",
} as const;

/**
 * Reusable sanitized string field
 * Uses Zod v4 .overwrite() to sanitize while preserving ZodString type for chaining
 */
const sanitizedString = () => z.string().overwrite(sanitizePlainText);

/**
 * Multiline sanitized string field.
 * Preserves buyer line breaks for free-text fields rendered as multiple lines
 * downstream (email/Airtable). Single-line fields keep {@link sanitizedString}.
 */
const multilineSanitizedString = () =>
  z.string().overwrite(sanitizeMultilineText);
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

function isPositiveQuantityString(value: string): boolean {
  const parsedQuantity = Number(value);
  if (!Number.isFinite(parsedQuantity)) {
    return true;
  }

  return parsedQuantity > 0;
}

function isValidProductQuantity(value: unknown): value is string | number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0;
  }

  if (typeof value === "string") {
    return isPositiveQuantityString(value);
  }

  return false;
}

/**
 * Base lead fields shared across all lead types
 */
const baseLeadFields = {
  email: canonicalBuyerEmailSchema,
  ...leadAttributionFields,
};

const productQuantitySchema: z.ZodType<string | number | undefined> = z
  .unknown()
  .transform((value) => {
    // Optional field: blank form/API input means "not provided".
    if (
      value === undefined ||
      (typeof value === "string" && value.trim().length === 0)
    ) {
      return undefined;
    }

    return typeof value === "string" ? value.trim() : value;
  })
  .refine((value) => value === undefined || isValidProductQuantity(value), {
    error: "Quantity must be positive when using a numeric string",
  });

/**
 * Contact form lead schema
 * Used for general inquiries via /contact page
 */
export const contactLeadSchema = z.object({
  type: z.literal(LEAD_TYPES.CONTACT),
  fullName: sanitizedString()
    .min(CONTACT_FORM_VALIDATION_CONSTANTS.NAME_MIN_LENGTH)
    .max(CONTACT_FORM_VALIDATION_CONSTANTS.NAME_MAX_LENGTH),
  subject: sanitizedString()
    .transform((value) => (value.length === 0 ? undefined : value))
    .refine(
      (value) =>
        value === undefined ||
        (value.length >= CONTACT_FORM_VALIDATION_CONSTANTS.SUBJECT_MIN_LENGTH &&
          value.length <= CONTACT_FORM_VALIDATION_CONSTANTS.SUBJECT_MAX_LENGTH),
      `Subject must be between ${CONTACT_FORM_VALIDATION_CONSTANTS.SUBJECT_MIN_LENGTH} and ${CONTACT_FORM_VALIDATION_CONSTANTS.SUBJECT_MAX_LENGTH} characters`,
    )
    .optional(),
  message: multilineSanitizedString()
    .min(CONTACT_FORM_VALIDATION_CONSTANTS.MESSAGE_MIN_LENGTH)
    .max(CONTACT_FORM_VALIDATION_CONSTANTS.MESSAGE_MAX_LENGTH),
  turnstileToken: z.string().min(1),
  submittedAt: z.string().optional(),
  company: sanitizedString()
    .max(CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MAX_LENGTH)
    .optional(),
  ...baseLeadFields,
});

/**
 * The set of real catalog product ids (market slugs). Sourced from the catalog
 * literal (not the aggregated site config) so lead validation stays free of the
 * runtime/site-URL environment coupling.
 */
const CATALOG_PRODUCT_IDS: ReadonlySet<string> = new Set(
  singleSiteProductCatalog.markets.map((market) => market.slug),
);

function isCatalogProductId(id: string): boolean {
  return CATALOG_PRODUCT_IDS.has(id);
}

/**
 * Catalog-product identity field.
 *
 * The identity is the catalog product id (a market slug). It is validated
 * server-side against the product registry, so a client cannot invent a product
 * identity by sending an arbitrary slug — the registry is the source of truth.
 */
const catalogProductIdSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isCatalogProductId, {
    error: "catalogProductId must match a real catalog product",
  });

/**
 * Product inquiry lead schema.
 *
 * Models three explicit, server-defined states instead of trusting a client
 * product slug/name as identity:
 * - catalog product: `productInquiryKind === "catalog-product"` with a
 *   registry-validated `catalogProductId`;
 * - general RFQ: `productInquiryKind === "general-rfq"` with no product
 *   identity;
 * - buyer interest: `buyerInterest` free text, kept for description only and
 *   never used as product attribution.
 *
 * The display product name is resolved server-side from the registry (catalog
 * product) or a fixed general-RFQ label — it is never taken from the client.
 */
export const productLeadSchema = z
  .object({
    type: z.literal(LEAD_TYPES.PRODUCT),
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
    quantity: productQuantitySchema.optional(),
    company: sanitizedString().max(MAX_LEAD_COMPANY_LENGTH).optional(),
    /** @deprecated Legacy RFQ field; prefer canonical `message`. */
    requirements: multilineSanitizedString()
      .max(MAX_LEAD_REQUIREMENTS_LENGTH)
      .optional(),
    ...leadAttributionFields,
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

    // A general RFQ carries no per-product identity; reject a smuggled slug.
    if (data.catalogProductId !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["catalogProductId"],
        message: "general RFQ must not carry a catalog product identity",
      });
    }
  });

/**
 * Unified lead schema using discriminated union
 * Allows type-safe handling of different lead types
 */
export const leadSchema = z.discriminatedUnion("type", [
  contactLeadSchema,
  productLeadSchema,
]);

/**
 * Type exports for external use
 */
export type ContactLeadInput = z.infer<typeof contactLeadSchema>;
export type ProductLeadInput = z.infer<typeof productLeadSchema>;
export type LeadInput = z.infer<typeof leadSchema>;

/**
 * Type guard functions for runtime type checking
 */
export function isContactLead(lead: LeadInput): lead is ContactLeadInput {
  return lead.type === LEAD_TYPES.CONTACT;
}

export function isProductLead(lead: LeadInput): lead is ProductLeadInput {
  return lead.type === LEAD_TYPES.PRODUCT;
}

/** A product inquiry that targets a real, registry-validated catalog product. */
export function isCatalogProductInquiry(lead: ProductLeadInput): boolean {
  return lead.productInquiryKind === PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT;
}
