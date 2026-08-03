/**
 * Resend邮件服务工具函数
 * Resend email service utilities
 */

import {
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/security/validation";
import {
  productInquiryEmailDataSchema,
  type ProductInquiryEmailData,
} from "@/lib/email/email-data-schema";
import { SITE_CONFIG } from "@/config/paths/site-config";
import { EMAIL_COPY } from "@/emails/email-copy";

interface ResendTag {
  name: string;
  value: string;
}

export const EMAIL_CONFIG = {
  from: SITE_CONFIG.contact.email,
  replyTo: SITE_CONFIG.contact.email,
  supportEmail: SITE_CONFIG.contact.email,
} as const;

export function validateProductInquiryData(
  data: ProductInquiryEmailData,
): ProductInquiryEmailData {
  return productInquiryEmailDataSchema.parse(data);
}

export function sanitizeProductInquiryData(
  data: ProductInquiryEmailData,
): ProductInquiryEmailData {
  return {
    referenceId: data.referenceId,
    firstName: sanitizePlainText(data.firstName),
    lastName: sanitizePlainText(data.lastName),
    email: data.email.toLowerCase().trim(),
    productName: sanitizePlainText(data.productName),
    requirements: data.requirements
      ? sanitizeMultilineText(data.requirements)
      : undefined,
  };
}

export function generateProductInquirySubject(
  data: ProductInquiryEmailData,
): string {
  return EMAIL_COPY.productInquiry.subject(data);
}

export function getProductInquiryTags(referenceId: string): ResendTag[] {
  return [
    { name: "type", value: "product-inquiry" },
    { name: "source", value: "website" },
    { name: "reference-id", value: referenceId },
  ];
}
