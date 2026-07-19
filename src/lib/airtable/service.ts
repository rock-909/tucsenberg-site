/**
 * Airtable 核心服务类
 */

import "server-only";

// 动态引入 Airtable，避免构建期和初始化顺序问题
// import type 仅用于类型提示，实际模块在运行时按需加载
import type AirtableNS from "airtable";
import type {
  CreatedAirtableRecord,
  ProductLeadData,
} from "@/lib/airtable/types";
import { env, getRuntimeEnvString } from "@/lib/env";
import { logger } from "@/lib/logger";
import { resolveAirtableModule } from "@/lib/airtable/service-internal/client";
import { createLeadRecord } from "@/lib/airtable/service-internal/lead-records";

/**
 * Airtable 单次请求预算（毫秒）。
 *
 * Airtable SDK 默认 requestTimeout 为 300000ms（5 分钟）。对 B2B 买家提交表单
 * 而言，这意味着 CRM 挂起时响应可能被拖到几分钟，属于不可接受的等待。
 *
 * 取值 8000ms 的依据：
 * - Airtable 单条记录写入 p50 约 150-300ms、p99 一般在 2s 以内；
 * - SDK 对 HTTP 429 会做指数退避重试（含 jitter），一轮退避约 1-2s；
 * - 8s 可从容覆盖 p99 + 一次限流重试并留出余量；
 * - 8s 约为默认 300s 的 1/37，远低于“分钟级”，买家绝不会等到几分钟。
 *
 * inquiry 路由会并行启动业主邮件与 Airtable 写入；响应会等待两者 settle，
 * 或等到 Airtable 达到上述预算上限。任一通道成功即视为用户成功。
 */
export const AIRTABLE_REQUEST_TIMEOUT_MS = 8000;

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
        // 覆盖 SDK 默认的 300000ms，避免挂起请求把 Cloudflare 调用拖住数分钟
        requestTimeout: AIRTABLE_REQUEST_TIMEOUT_MS,
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

  /** Create a product/general inquiry record in Airtable. */
  public async createLead(
    data: ProductLeadData,
  ): Promise<CreatedAirtableRecord> {
    const base = await this.requireBase();
    return createLeadRecord({ base, tableName: this.tableName, data });
  }
}
