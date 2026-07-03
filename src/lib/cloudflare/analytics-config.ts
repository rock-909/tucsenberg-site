import "server-only";

import { getRuntimeEnvString } from "@/lib/env";
import type { CloudflareAnalyticsConfigState } from "@/lib/cloudflare/analytics-types";

function readTrimmedEnv(
  key: Parameters<typeof getRuntimeEnvString>[0],
): string | undefined {
  return getRuntimeEnvString(key)?.trim();
}

export function getCloudflareAnalyticsConfig(): CloudflareAnalyticsConfigState {
  const zoneId = readTrimmedEnv("CLOUDFLARE_ZONE_ID");
  const apiToken = readTrimmedEnv("CLOUDFLARE_ANALYTICS_API_TOKEN");
  const hostname = readTrimmedEnv("CLOUDFLARE_ANALYTICS_HOSTNAME");

  if (!zoneId || !apiToken || !hostname) {
    return { configured: false, reason: "missing-credentials" };
  }

  return {
    configured: true,
    zoneId,
    apiToken,
    hostname,
  };
}

export function isCloudflareAnalyticsConfigured(): boolean {
  return getCloudflareAnalyticsConfig().configured;
}
