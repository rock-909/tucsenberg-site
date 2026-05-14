/**
 * Airtable 核心服务类
 */

import "server-only";

// 动态引入 Airtable，避免构建期和初始化顺序问题
// import type 仅用于类型提示，实际模块在运行时按需加载
import type AirtableNS from "airtable";
import type {
  AirtableQueryOptions,
  AirtableRecord,
  ContactLeadData,
  ContactStatus,
  NewsletterLeadData,
  ProductLeadData,
} from "@/lib/airtable/types";
import { env } from "@/lib/env";
import type { LeadType } from "@/lib/lead-pipeline/lead-schema";
import { logger } from "@/lib/logger";
import {
  deleteContactRecord,
  getContactRecords,
  isDuplicateEmailAddress,
  updateContactRecordStatus,
} from "@/lib/airtable/service-internal/contact-records";
import { resolveAirtableModule } from "@/lib/airtable/service-internal/client";
import { createLeadRecord } from "@/lib/airtable/service-internal/lead-records";
import { getContactStatistics } from "@/lib/airtable/service-internal/stats";

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
    this.tableName = env.AIRTABLE_TABLE_NAME || "Contacts";
    // 不在构造函数中执行初始化，延迟到首次调用方法时
  }

  /**
   * 初始化Airtable连接
   * Initialize Airtable connection
   */
  private async initializeAirtable(): Promise<void> {
    try {
      if (!env.AIRTABLE_API_KEY || !env.AIRTABLE_BASE_ID) {
        logger.warn(
          "Airtable configuration missing - service will be disabled",
          {
            hasApiKey: Boolean(env.AIRTABLE_API_KEY),
            hasBaseId: Boolean(env.AIRTABLE_BASE_ID),
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
        apiKey: env.AIRTABLE_API_KEY,
      });

      this.base = Airtable.base(env.AIRTABLE_BASE_ID);
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
    await this.ensureReady();
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

  private async getBaseIfReady(): Promise<AirtableNS.Base | null> {
    await this.ensureReady();
    return this.isReady() ? (this.base as AirtableNS.Base) : null;
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

  /**
   * 获取联系人记录
   * Get contact records from Airtable
   */
  public async getContacts(
    options: AirtableQueryOptions = {},
  ): Promise<AirtableRecord[]> {
    const base = await this.requireBase();
    return getContactRecords({ base, tableName: this.tableName, options });
  }

  /**
   * 更新联系人记录状态
   * Update contact record status
   */
  public async updateContactStatus(
    recordId: string,
    status: ContactStatus,
  ): Promise<void> {
    const base = await this.requireBase();
    await updateContactRecordStatus({
      base,
      tableName: this.tableName,
      recordId,
      status,
    });
  }

  /**
   * 删除联系人记录
   * Delete contact record
   */
  public async deleteContact(recordId: string): Promise<void> {
    const base = await this.requireBase();
    await deleteContactRecord({
      base,
      tableName: this.tableName,
      recordId,
    });
  }

  /**
   * 检查重复邮箱
   * Check for duplicate email addresses
   *
   * Returns false if service is not configured (graceful degradation).
   * Logs warning and returns false if the check fails (e.g., API error),
   * allowing form submission to proceed rather than blocking users.
   */
  public async isDuplicateEmail(email: string): Promise<boolean> {
    const base = await this.getBaseIfReady();
    if (!base) return false;

    try {
      return await isDuplicateEmailAddress({
        base,
        tableName: this.tableName,
        email,
      });
    } catch (error) {
      // Log warning but allow submission to proceed - duplicate check is
      // a nice-to-have, not a hard requirement. Better to accept potential
      // duplicates than block legitimate submissions due to transient errors.
      logger.warn("Duplicate email check failed, proceeding with submission", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * 获取统计信息
   * Get statistics
   */
  public async getStatistics(): Promise<{
    totalContacts: number;
    newContacts: number;
    completedContacts: number;
    recentContacts: number;
  }> {
    const base = await this.requireBase();
    return getContactStatistics({ base, tableName: this.tableName });
  }
}
