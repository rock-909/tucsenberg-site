/**
 * Airtable 核心服务类
 */

import "server-only";

// 动态引入 Airtable，避免构建期和初始化顺序问题
// import type 仅用于类型提示，实际模块在运行时按需加载
import type AirtableNS from "airtable";
import type {
  AirtableRecord,
  ContactLeadData,
  NewsletterLeadData,
  ProductLeadData,
} from "@/lib/airtable/types";
import { env, getRuntimeEnvString } from "@/lib/env";
import type { LeadType } from "@/lib/lead-pipeline/lead-schema";
import { logger } from "@/lib/logger";
import { resolveAirtableModule } from "@/lib/airtable/service-internal/client";
import { createLeadRecord } from "@/lib/airtable/service-internal/lead-records";

type AirtableEnvKey =
  | "AIRTABLE_API_KEY"
  | "AIRTABLE_BASE_ID"
  | "AIRTABLE_TABLE_NAME";

function readAirtableEnv(key: AirtableEnvKey): string | undefined {
  return getRuntimeEnvString(key) ?? env[key];
}

/**
 * Airtable配置和初始化
 * Airtable configuration and initialization
 */
export class AirtableService {
  private base: AirtableNS.Base | null = null;
  private tableName: string;
  private isConfigured: boolean = false;
  private airtableModule: unknown = null;
  private initializationError: Error | null = null;

  constructor() {
    this.tableName = readAirtableEnv("AIRTABLE_TABLE_NAME") || "Contacts";
    // 不在构造函数中执行初始化，延迟到首次调用方法时
  }

  /**
   * 初始化Airtable连接
   * Initialize Airtable connection
   */
  private async initializeAirtable(): Promise<void> {
    try {
      const apiKey = readAirtableEnv("AIRTABLE_API_KEY");
      const baseId = readAirtableEnv("AIRTABLE_BASE_ID");
      this.tableName = readAirtableEnv("AIRTABLE_TABLE_NAME") || this.tableName;

      if (!apiKey || !baseId) {
        logger.warn(
          "Airtable configuration missing - service will be disabled",
          {
            hasApiKey: Boolean(apiKey),
            hasBaseId: Boolean(baseId),
          },
        );
        return;
      }
      // 动态加载 airtable 模块
      if (!this.airtableModule) {
        this.airtableModule = await import("airtable");
      }

      const Airtable = resolveAirtableModule(this.airtableModule);
      if (!Airtable) {
        logger.warn("Airtable module did not expose expected API");
        return;
      }

      Airtable.configure({
        endpointUrl: "https://api.airtable.com",
        apiKey,
      });

      this.base = Airtable.base(baseId);
      this.isConfigured = true;

      logger.info("Airtable service initialized successfully", {
        tableName: this.tableName,
      });
    } catch (error) {
      this.initializationError =
        error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to initialize Airtable service", {
        error: this.initializationError.message,
      });
    }
  }

  /**
   * 确保 Airtable 已初始化
   */
  private async ensureReady(): Promise<void> {
    if (this.isConfigured && this.base) return;
    await this.initializeAirtable();
  }

  /**
   * 检查服务是否已配置
   * Check if service is configured
   */
  public isReady(): boolean {
    return this.isConfigured && this.base !== null;
  }

  private async requireBase(): Promise<AirtableNS.Base> {
    if (!this.isReady()) {
      await this.ensureReady();
    }

    if (!this.isReady()) {
      if (this.initializationError) {
        throw new Error(
          `Airtable service initialization failed: ${this.initializationError.message}`,
        );
      }
      throw new Error("Airtable service is not configured");
    }
    return this.base as AirtableNS.Base;
  }

  /**
   * Create a unified lead record in Airtable
   * Supports contact, product inquiry, and newsletter leads
   */
  public async createLead(
    type: LeadType,
    data: ContactLeadData | ProductLeadData | NewsletterLeadData,
  ): Promise<AirtableRecord> {
    const base = await this.requireBase();
    return createLeadRecord({ base, tableName: this.tableName, type, data });
  }
}
