/**
 * Resend邮件服务核心类
 * Resend email service core class
 */

import "server-only";

import { env, getRuntimeEnvString } from "@/lib/env";
import type {
  EmailTemplateData,
  ProductInquiryEmailData,
} from "@/lib/email/email-data-schema";
import { ResendHttpEmailClient } from "@/lib/email/resend-http-client";
import {
  buildConfirmationEmailContent,
  buildContactFormEmailContent,
  buildProductInquiryEmailContent,
} from "@/lib/email/runtime-email-content";
import { logger, sanitizeEmail } from "@/lib/logger";
import { EMAIL_CONFIG, ResendUtils } from "@/lib/resend-utils";

/**
 * Resend邮件服务配置
 * Resend email service configuration
 */
export class ResendService {
  private resend: ResendHttpEmailClient | null = null;
  private isConfigured: boolean = false;
  private emailConfig: {
    from: string;
    replyTo: string;
    supportEmail: string;
  };

  constructor() {
    this.emailConfig = this.readEmailConfig();
  }

  private readEmailEnv(
    key: "EMAIL_FROM" | "EMAIL_REPLY_TO",
  ): string | undefined {
    return getRuntimeEnvString(key) ?? env[key];
  }

  private readEmailConfig(): typeof this.emailConfig {
    const replyTo = this.readEmailEnv("EMAIL_REPLY_TO");
    return {
      from: this.readEmailEnv("EMAIL_FROM") || EMAIL_CONFIG.from,
      replyTo: replyTo || EMAIL_CONFIG.replyTo,
      supportEmail: replyTo || EMAIL_CONFIG.supportEmail,
    };
  }

  /**
   * 初始化Resend服务
   * Initialize Resend service
   */
  private initializeResend(): void {
    try {
      if (this.isConfigured && this.resend !== null) {
        return;
      }

      const apiKey =
        getRuntimeEnvString("RESEND_API_KEY") ?? env.RESEND_API_KEY;
      this.emailConfig = this.readEmailConfig();

      if (!apiKey) {
        logger.warn("Resend API key missing - email service will be disabled");
        return;
      }

      this.resend = new ResendHttpEmailClient(apiKey);
      this.isConfigured = true;

      logger.info("Resend email service initialized successfully", {
        from: this.emailConfig.from,
        replyTo: this.emailConfig.replyTo,
      });
    } catch (error) {
      logger.error("Failed to initialize Resend service", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * 检查服务是否已配置
   * Check if service is configured
   */
  public isReady(): boolean {
    if (!this.isConfigured || this.resend === null) {
      this.initializeResend();
    }
    return this.isConfigured && this.resend !== null;
  }

  /**
   * 发送联系表单邮件给管理员
   * Send contact form email to admin
   */
  public async sendContactFormEmail(data: EmailTemplateData): Promise<string> {
    if (!this.isReady()) {
      throw new Error("Resend service is not configured");
    }

    try {
      const validatedData = ResendUtils.validateEmailData(data);
      const sanitizedData = ResendUtils.sanitizeEmailData(validatedData);

      const subject = ResendUtils.generateContactSubject(sanitizedData);
      const emailContent = buildContactFormEmailContent(sanitizedData);

      const result = await this.resend!.send({
        from: this.emailConfig.from,
        to: [this.emailConfig.replyTo],
        replyTo: sanitizedData.email,
        subject,
        html: emailContent.html,
        text: emailContent.text,
        tags: ResendUtils.getContactFormTags(),
      });

      if (result.error || !result.data) {
        throw new Error(
          `Resend API error: ${result.error?.message ?? "missing message id"}`,
        );
      }

      logger.info("Contact form email sent successfully", {
        messageId: result.data.id,
        to: sanitizeEmail(this.emailConfig.replyTo),
        from: sanitizeEmail(sanitizedData.email),
        subject,
      });

      return result.data.id;
    } catch (error) {
      logger.error("Failed to send contact form email", {
        error: error instanceof Error ? error.message : "Unknown error",
        email: sanitizeEmail(data.email),
      });
      throw new Error("Failed to send email", { cause: error });
    }
  }

  /**
   * 发送确认邮件给用户
   * Send confirmation email to user
   */
  public async sendConfirmationEmail(data: EmailTemplateData): Promise<string> {
    if (!this.isReady()) {
      throw new Error("Resend service is not configured");
    }

    try {
      const validatedData = ResendUtils.validateEmailData(data);
      const sanitizedData = ResendUtils.sanitizeEmailData(validatedData);

      const subject = ResendUtils.generateConfirmationSubject();
      const emailContent = buildConfirmationEmailContent(sanitizedData);

      const result = await this.resend!.send({
        from: this.emailConfig.from,
        to: [sanitizedData.email],
        replyTo: this.emailConfig.supportEmail,
        subject,
        html: emailContent.html,
        text: emailContent.text,
        tags: ResendUtils.getConfirmationTags(),
      });

      if (result.error || !result.data) {
        throw new Error(
          `Resend API error: ${result.error?.message ?? "missing message id"}`,
        );
      }

      logger.info("Confirmation email sent successfully", {
        messageId: result.data.id,
        to: sanitizeEmail(sanitizedData.email),
        subject,
      });

      return result.data.id;
    } catch (error) {
      logger.error("Failed to send confirmation email", {
        error: error instanceof Error ? error.message : "Unknown error",
        email: sanitizeEmail(data.email),
      });
      throw new Error("Failed to send confirmation email", { cause: error });
    }
  }

  /**
   * Send product inquiry email to admin
   */
  public async sendProductInquiryEmail(
    data: ProductInquiryEmailData,
  ): Promise<string> {
    if (!this.isReady()) {
      throw new Error("Resend service is not configured");
    }

    try {
      const validatedData = ResendUtils.validateProductInquiryData(data);
      const sanitizedData =
        ResendUtils.sanitizeProductInquiryData(validatedData);

      const subject = ResendUtils.generateProductInquirySubject(sanitizedData);
      const emailContent = buildProductInquiryEmailContent(sanitizedData);

      const result = await this.resend!.send({
        from: this.emailConfig.from,
        to: [this.emailConfig.replyTo],
        replyTo: sanitizedData.email,
        subject,
        html: emailContent.html,
        text: emailContent.text,
        tags: ResendUtils.getProductInquiryTags(),
      });

      if (result.error || !result.data) {
        throw new Error(
          `Resend API error: ${result.error?.message ?? "missing message id"}`,
        );
      }

      logger.info("Product inquiry email sent successfully", {
        messageId: result.data.id,
        to: sanitizeEmail(this.emailConfig.replyTo),
        from: sanitizeEmail(sanitizedData.email),
        product: sanitizedData.productName,
        quantity: sanitizedData.quantity,
      });

      return result.data.id;
    } catch (error) {
      logger.error("Failed to send product inquiry email", {
        error: error instanceof Error ? error.message : "Unknown error",
        email: sanitizeEmail(data.email),
        product: data.productName,
      });
      throw new Error("Failed to send product inquiry email", { cause: error });
    }
  }

  /**
   * 获取邮件发送统计
   * Get email sending statistics
   */
  public getEmailStats(): {
    sent: number;
    delivered: number;
    bounced: number;
    complained: number;
  } {
    return {
      sent: 0,
      delivered: 0,
      bounced: 0,
      complained: 0,
    };
  }

  /**
   * 获取邮件配置
   * Get email configuration
   */
  public getEmailConfig(): typeof this.emailConfig {
    return {
      from: this.emailConfig.from,
      replyTo: this.emailConfig.replyTo,
      supportEmail: this.emailConfig.supportEmail,
    };
  }

  /**
   * 检查API连接状态
   * Check API connection status
   *
   * Note: This is a synchronous check that only verifies configuration state.
   * For actual API connectivity testing, use an async health check endpoint.
   */
  public checkConnection(): boolean {
    return this.isReady();
  }
}
