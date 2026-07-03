import { z } from "zod";
import { CONTACT_FORM_VALIDATION_CONSTANTS } from "@/config/contact-form-config";

/**
 * 邮件模板数据验证模式
 * Email template data validation schema
 */
export const emailTemplateDataSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
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
  marketingConsent: z.boolean().optional(),

  // Honeypot field - should remain empty
  website: z
    .string()
    .optional()
    .refine((value) => !value, "Website field should be empty"),
});

export type EmailTemplateData = z.infer<typeof emailTemplateDataSchema>;

/**
 * Product inquiry email data validation schema
 */
export const productInquiryEmailDataSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  company: z.string().optional(),
  productName: z.string(),
  productSlug: z.string(),
  quantity: z.union([z.string(), z.number()]),
  requirements: z.string().optional(),
  marketingConsent: z.boolean().optional(),
});

export type ProductInquiryEmailData = z.infer<
  typeof productInquiryEmailDataSchema
>;
