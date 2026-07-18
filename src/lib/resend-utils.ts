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

export const EMAIL_CONFIG = {
  from: SITE_CONFIG.contact.email,
  replyTo: SITE_CONFIG.contact.email,
  supportEmail: SITE_CONFIG.contact.email,
} as const;

export class ResendUtils {
  static validateProductInquiryData(
    data: ProductInquiryEmailData,
  ): ProductInquiryEmailData {
    return productInquiryEmailDataSchema.parse(data);
  }

  static sanitizeProductInquiryData(
    data: ProductInquiryEmailData,
  ): ProductInquiryEmailData {
    return {
      firstName: sanitizePlainText(data.firstName),
      lastName: sanitizePlainText(data.lastName),
      email: data.email.toLowerCase().trim(),
      productName: sanitizePlainText(data.productName),
      requirements: data.requirements
        ? sanitizeMultilineText(data.requirements)
        : undefined,
    };
  }

  static generateProductInquirySubject(data: ProductInquiryEmailData): string {
    return EMAIL_COPY.productInquiry.subject(data);
  }

  static getProductInquiryTags(): Array<{ name: string; value: string }> {
    return [
      { name: "type", value: "product-inquiry" },
      { name: "source", value: "website" },
    ];
  }
}
