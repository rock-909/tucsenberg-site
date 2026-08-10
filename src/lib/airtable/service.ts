import "server-only";

import type {
  CreatedAirtableRecord,
  ProductLeadData,
} from "@/lib/airtable/types";
import { env, getRuntimeEnvString } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createLeadRecord } from "@/lib/airtable/service-internal/lead-records";

/**
 * Airtable 单次请求预算（毫秒）。
 *
 * 直接绑定到底层 fetch 的 AbortSignal，不在外层竞速一个无法取消的 Promise。
 */
export const AIRTABLE_REQUEST_TIMEOUT_MS = 8000;

type AirtableEnvKey =
  "AIRTABLE_API_KEY" | "AIRTABLE_BASE_ID" | "AIRTABLE_TABLE_NAME";

function readAirtableEnv(key: AirtableEnvKey): string | undefined {
  return getRuntimeEnvString(key) ?? env[key];
}

export class AirtableService {
  public isReady(): boolean {
    return Boolean(
      readAirtableEnv("AIRTABLE_API_KEY") &&
      readAirtableEnv("AIRTABLE_BASE_ID"),
    );
  }

  /** Create a product/general inquiry record in Airtable. */
  public createLead(data: ProductLeadData): Promise<CreatedAirtableRecord> {
    const apiKey = readAirtableEnv("AIRTABLE_API_KEY");
    const baseId = readAirtableEnv("AIRTABLE_BASE_ID");
    const tableName = readAirtableEnv("AIRTABLE_TABLE_NAME") || "Contacts";

    if (!apiKey || !baseId) {
      logger.warn("Airtable configuration missing - service will be disabled", {
        hasApiKey: Boolean(apiKey),
        hasBaseId: Boolean(baseId),
      });
      return Promise.reject(new Error("Airtable service is not configured"));
    }

    return createLeadRecord({
      apiKey,
      baseId,
      tableName,
      data,
      signal: AbortSignal.timeout(AIRTABLE_REQUEST_TIMEOUT_MS),
    });
  }
}
