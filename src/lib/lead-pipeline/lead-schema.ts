/**
 * Lead Pipeline Schema Definitions
 * Unified Zod schema for all lead sources: contact, product inquiry, newsletter
 */

import { z } from "zod";
import { CONTACT_FORM_VALIDATION_CONSTANTS } from "@/config/contact-form-config";
import {
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/security/validation";
import { hasSpreadsheetFormulaPrefix } from "@/lib/security/spreadsheet-formula";
import type { AttributionFieldName } from "@/lib/marketing/attribution-fields";
import {
  MAX_LEAD_COMPANY_LENGTH,
  MAX_LEAD_EMAIL_LENGTH,
  MAX_LEAD_NAME_LENGTH,
  MAX_LEAD_PRODUCT_NAME_LENGTH,
  MAX_LEAD_REQUIREMENTS_LENGTH,
} from "@/constants";

/**
 * Lead type discriminator
 */
export const LEAD_TYPES = {
  CONTACT: "contact",
  PRODUCT: "product",
  NEWSLETTER: "newsletter",
} as const;

export type LeadType = (typeof LEAD_TYPES)[keyof typeof LEAD_TYPES];

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

// Airtable's Email field stays a real email value; reject formula-capable
// prefixes here instead of corrupting valid addresses with text escaping.
const leadEmailSchema = z
  .string()
  .trim()
  .min(1)
  .email()
  .max(MAX_LEAD_EMAIL_LENGTH)
  .refine((email) => !hasSpreadsheetFormulaPrefix(email));

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
  email: leadEmailSchema,
  marketingConsent: z.boolean().optional().default(false),
  ...leadAttributionFields,
};

const productQuantitySchema: z.ZodType<string | number> = z
  .unknown()
  .transform((value, context) => {
    if (
      value === undefined ||
      (typeof value === "string" && value.trim().length === 0)
    ) {
      context.addIssue({
        code: "too_small",
        minimum: 1,
        inclusive: true,
        origin: "string",
        message: "Quantity is required",
      });
      return z.NEVER;
    }

    return typeof value === "string" ? value.trim() : value;
  })
  .refine(isValidProductQuantity, {
    message: "Quantity must be positive when using a numeric string",
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
 * Product inquiry lead schema
 * Used for product-specific inquiries via product page drawer
 */
export const productLeadSchema = z.object({
  type: z.literal(LEAD_TYPES.PRODUCT),
  fullName: sanitizedString().min(1).max(MAX_LEAD_NAME_LENGTH),
  productSlug: z.string().trim().min(1),
  productName: sanitizedString().min(1).max(MAX_LEAD_PRODUCT_NAME_LENGTH),
  quantity: productQuantitySchema,
  company: sanitizedString().max(MAX_LEAD_COMPANY_LENGTH).optional(),
  requirements: multilineSanitizedString()
    .max(MAX_LEAD_REQUIREMENTS_LENGTH)
    .optional(),
  ...baseLeadFields,
});

/**
 * Newsletter subscription lead schema
 * Used for blog/news page email subscriptions
 */
export const newsletterLeadSchema = z.object({
  type: z.literal(LEAD_TYPES.NEWSLETTER),
  email: leadEmailSchema,
});

/**
 * Unified lead schema using discriminated union
 * Allows type-safe handling of different lead types
 */
const leadSchemaOptions = {
  contact: contactLeadSchema,
  product: productLeadSchema,
  newsletter: newsletterLeadSchema,
} as const;

export const leadSchema = z.discriminatedUnion(
  "type",
  Object.values(leadSchemaOptions) as [
    typeof contactLeadSchema,
    typeof productLeadSchema,
    typeof newsletterLeadSchema,
  ],
);

/**
 * Type exports for external use
 */
export type ContactLeadInput = z.infer<typeof contactLeadSchema>;
export type ProductLeadInput = z.infer<typeof productLeadSchema>;
export type NewsletterLeadInput = z.infer<typeof newsletterLeadSchema>;
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

export function isNewsletterLead(lead: LeadInput): lead is NewsletterLeadInput {
  return lead.type === LEAD_TYPES.NEWSLETTER;
}
