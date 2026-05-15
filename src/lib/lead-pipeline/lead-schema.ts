/**
 * Lead Pipeline Schema Definitions
 * Unified Zod schema for all lead sources: contact, product inquiry, newsletter
 */

import { z } from "zod";
import { sanitizePlainText } from "@/lib/security/validation";
import {
  MAX_LEAD_COMPANY_LENGTH,
  MAX_LEAD_EMAIL_LENGTH,
  MAX_LEAD_MESSAGE_LENGTH,
  MAX_LEAD_NAME_LENGTH,
  MAX_LEAD_PRODUCT_NAME_LENGTH,
  MAX_LEAD_REQUIREMENTS_LENGTH,
  MIN_LEAD_MESSAGE_LENGTH,
  MAX_LEAD_SUBJECT_LENGTH,
  MIN_LEAD_SUBJECT_LENGTH,
  MAX_LEAD_COUNTRY_LENGTH,
  MAX_LEAD_PART_NUMBERS_LENGTH,
  MAX_LEAD_QUANTITY_LENGTH,
  MAX_LEAD_SHUTDOWN_LENGTH,
  ONE,
} from "@/constants";

/**
 * Lead type discriminator
 */
export const LEAD_TYPES = {
  CONTACT: "contact",
  PRODUCT: "product",
  NEWSLETTER: "newsletter",
  RFQ: "rfq",
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
  email: z.string().trim().min(ONE).email().max(MAX_LEAD_EMAIL_LENGTH),
  company: sanitizedString().max(MAX_LEAD_COMPANY_LENGTH).optional(),
  marketingConsent: z.boolean().optional().default(false),
};

const productQuantitySchema: z.ZodType<string | number> = z
  .any()
  .transform((value, context) => {
    if (
      value === undefined ||
      (typeof value === "string" && value.trim().length === 0)
    ) {
      context.addIssue({
        code: "too_small",
        minimum: ONE,
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
  fullName: sanitizedString().min(ONE).max(MAX_LEAD_NAME_LENGTH),
  subject: sanitizedString()
    .transform((value) => (value.length === 0 ? undefined : value))
    .refine(
      (value) =>
        value === undefined ||
        (value.length >= MIN_LEAD_SUBJECT_LENGTH &&
          value.length <= MAX_LEAD_SUBJECT_LENGTH),
      `Subject must be between ${MIN_LEAD_SUBJECT_LENGTH} and ${MAX_LEAD_SUBJECT_LENGTH} characters`,
    )
    .optional(),
  message: sanitizedString()
    .min(MIN_LEAD_MESSAGE_LENGTH)
    .max(MAX_LEAD_MESSAGE_LENGTH),
  turnstileToken: z.string().min(ONE),
  submittedAt: z.string().optional(),
  ...baseLeadFields,
});

/**
 * Product inquiry lead schema
 * Used for product-specific inquiries via product page drawer
 */
export const productLeadSchema = z.object({
  type: z.literal(LEAD_TYPES.PRODUCT),
  fullName: sanitizedString().min(ONE).max(MAX_LEAD_NAME_LENGTH),
  productSlug: z.string().trim().min(ONE),
  productName: sanitizedString().min(ONE).max(MAX_LEAD_PRODUCT_NAME_LENGTH),
  quantity: productQuantitySchema,
  requirements: sanitizedString().max(MAX_LEAD_REQUIREMENTS_LENGTH).optional(),
  ...baseLeadFields,
});

/**
 * Newsletter subscription lead schema
 * Used for blog/news page email subscriptions
 */
export const newsletterLeadSchema = z.object({
  type: z.literal(LEAD_TYPES.NEWSLETTER),
  email: z.string().email().max(MAX_LEAD_EMAIL_LENGTH),
});

/**
 * RFQ quote lead schema
 *
 * Used by the public `/quote` page (`POST /api/quote`). It is intentionally
 * standalone (not part of the `leadSchema` discriminated union): the quote
 * route validates the rich RFQ input here, then composes a contact-shaped
 * payload for the audited `processLead` pipeline. File uploads are handled
 * client-side only for now; the server endpoint accepts JSON, so uploaded
 * file name/size metadata rides in `notes`.
 */
export const rfqLeadSchema = z.object({
  type: z.literal(LEAD_TYPES.RFQ),
  fullName: sanitizedString().min(ONE).max(MAX_LEAD_NAME_LENGTH),
  country: sanitizedString().max(MAX_LEAD_COUNTRY_LENGTH).optional(),
  partNumbers: sanitizedString().min(ONE).max(MAX_LEAD_PART_NUMBERS_LENGTH),
  quantity: sanitizedString().max(MAX_LEAD_QUANTITY_LENGTH).optional(),
  material: z.enum(["epdm", "tpu", "not-sure"]).optional(),
  shutdownDate: sanitizedString().max(MAX_LEAD_SHUTDOWN_LENGTH).optional(),
  notes: sanitizedString().max(MAX_LEAD_REQUIREMENTS_LENGTH).optional(),
  ...baseLeadFields,
});

export type RfqLeadInput = z.infer<typeof rfqLeadSchema>;

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
