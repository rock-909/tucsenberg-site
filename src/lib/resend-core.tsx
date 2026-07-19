/**
 * Resend邮件服务核心类
 * Resend email service core class
 */

import "server-only";

import { env, getRuntimeEnvString } from "@/lib/env";
import type { ProductInquiryEmailData } from "@/lib/email/email-data-schema";
import { ResendHttpEmailClient } from "@/lib/email/resend-http-client";
import { buildProductInquiryEmailContent } from "@/lib/email/runtime-email-content";
import { logger, sanitizeEmail } from "@/lib/logger";
import { EMAIL_CONFIG, ResendUtils } from "@/lib/resend-utils";

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

  public isReady(): boolean {
    if (!this.isConfigured || this.resend === null) {
      this.initializeResend();
    }
    return this.isConfigured && this.resend !== null;
  }

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
}
