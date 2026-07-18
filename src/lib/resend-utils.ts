/**
 * Resend邮件服务工具函数
 * Resend email service utilities
 */

import {
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/security/validation";
import {
  emailTemplateDataSchema,
  productInquiryEmailDataSchema,
  type EmailTemplateData,
  type ProductInquiryEmailData,
} from "@/lib/email/email-data-schema";
import { SITE_CONFIG } from "@/config/paths/site-config";
import { EMAIL_COPY } from "@/emails/email-copy";

/**
 * 邮件配置常量
 * Email configuration constants
 */
export const EMAIL_CONFIG = {
  from: SITE_CONFIG.contact.email,
  replyTo: SITE_CONFIG.contact.email,
  supportEmail: SITE_CONFIG.contact.email,
} as const;

/**
 * 邮件工具类
 * Email utilities class
 */
export class ResendUtils {
  /**
   * 验证邮件数据
   * Validate email data
   */
  static validateEmailData(data: EmailTemplateData): EmailTemplateData {
    return emailTemplateDataSchema.parse(data);
  }

  /**
   * 清理邮件数据
   * Sanitize email data
   */
  static sanitizeEmailData(data: EmailTemplateData): EmailTemplateData {
    return {
      firstName: sanitizePlainText(data.firstName),
      lastName: sanitizePlainText(data.lastName),
      email: data.email.toLowerCase().trim(),
      company: data.company ? sanitizePlainText(data.company) : undefined,
      message: sanitizeMultilineText(data.message),
      phone: data.phone ? sanitizePlainText(data.phone) : undefined,
      subject: data.subject ? sanitizePlainText(data.subject) : undefined,
      submittedAt: data.submittedAt,
    };
  }

  /**
   * 生成邮件主题
   * Generate email subject
   */
  static generateContactSubject(data: EmailTemplateData): string {
    return EMAIL_COPY.contact.subject(data);
  }

  /**
   * 生成确认邮件主题
   * Generate confirmation email subject
   */
  static generateConfirmationSubject(): string {
    return EMAIL_COPY.confirmation.subject(SITE_CONFIG.name);
  }

  /**
   * 获取邮件标签
   * Get email tags
   */
  static getContactFormTags(): Array<{ name: string; value: string }> {
    return [
      { name: "type", value: "contact-form" },
      { name: "source", value: "website" },
    ];
  }

  /**
   * 获取确认邮件标签
   * Get confirmation email tags
   */
  static getConfirmationTags(): Array<{ name: string; value: string }> {
    return [
      { name: "type", value: "confirmation" },
      { name: "source", value: "website" },
    ];
  }

  /**
   * 格式化日期时间
   * Format date time
   */
  static formatDateTime(date: Date | string): string {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return EMAIL_COPY.common.unknownSubmissionTime;
    }

    const year = parsedDate.getUTCFullYear();
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getUTCDate()).padStart(2, "0");
    const hour = String(parsedDate.getUTCHours()).padStart(2, "0");
    const minute = String(parsedDate.getUTCMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute} UTC`;
  }

  /**
   * Validate product inquiry email data
   */
  static validateProductInquiryData(
    data: ProductInquiryEmailData,
  ): ProductInquiryEmailData {
    return productInquiryEmailDataSchema.parse(data);
  }

  /**
   * Sanitize product inquiry email data
   */
  static sanitizeProductInquiryData(
    data: ProductInquiryEmailData,
  ): ProductInquiryEmailData {
    const quantity =
      typeof data.quantity === "string"
        ? sanitizePlainText(data.quantity)
        : data.quantity;

    return {
      firstName: sanitizePlainText(data.firstName),
      lastName: sanitizePlainText(data.lastName),
      email: data.email.toLowerCase().trim(),
      company: data.company ? sanitizePlainText(data.company) : undefined,
      phone: data.phone ? sanitizePlainText(data.phone) : undefined,
      productName: sanitizePlainText(data.productName),
      quantity,
      requirements: data.requirements
        ? sanitizeMultilineText(data.requirements)
        : undefined,
    };
  }

  /**
   * Generate product inquiry email subject
   */
  static generateProductInquirySubject(data: ProductInquiryEmailData): string {
    return EMAIL_COPY.productInquiry.subject(data);
  }

  /**
   * Get product inquiry email tags
   */
  static getProductInquiryTags(): Array<{ name: string; value: string }> {
    return [
      { name: "type", value: "product-inquiry" },
      { name: "source", value: "website" },
    ];
  }
}
