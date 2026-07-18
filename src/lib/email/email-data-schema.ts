import { z } from "zod";
import { CONTACT_FORM_VALIDATION_CONSTANTS } from "@/config/contact-form-config";

/**
 * 邮件模板数据验证模式
 * Email template data validation schema
 */
export const emailTemplateDataSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  company: z
    .string()
    .transform((val) => val.trim())
    .transform((val) => (val.length === 0 ? undefined : val))
    .refine(
      (val) =>
        val === undefined ||
        (val.length >= CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MIN_LENGTH &&
          val.length <= CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MAX_LENGTH),
      {
        message: `Company name must be between ${CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MIN_LENGTH} and ${CONTACT_FORM_VALIDATION_CONSTANTS.COMPANY_MAX_LENGTH} characters`,
      },
    )
    .optional(),
  message: z.string(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  submittedAt: z.string(),

  // Honeypot field - should remain empty
  website: z
    .string()
    .optional()
    .refine((value) => !value, "Website field should be empty"),
});

export type EmailTemplateData = z.infer<typeof emailTemplateDataSchema>;

/**
 * Product inquiry email data validation schema.
 *
 * `productName` is the server-resolved display name (catalog label or the
 * general-RFQ label), never a client-supplied slug. `quantity` is optional
 * because a general RFQ carries no quantity. Buyer free-text interest is folded
 * into `requirements` as description upstream.
 */
export const productInquiryEmailDataSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  productName: z.string(),
  quantity: z.union([z.string(), z.number()]).optional(),
  requirements: z.string().optional(),
});

export type ProductInquiryEmailData = z.infer<
  typeof productInquiryEmailDataSchema
>;
