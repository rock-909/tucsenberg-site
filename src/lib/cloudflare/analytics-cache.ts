import "server-only";

import { FIVE_MINUTES_MS } from "@/constants/time";
import type { CloudflareTrafficDashboardState } from "@/lib/cloudflare/analytics-types";

interface CacheEntry {
  expiresAt: number;
  value: CloudflareTrafficDashboardState;
}

const cache = new Map<string, CacheEntry>();

export async function getCachedCloudflareTrafficSummary(input: {
  cacheKey: string;
  nowMs?: number;
  loader: () => Promise<CloudflareTrafficDashboardState>;
}): Promise<CloudflareTrafficDashboardState> {
  const nowMs = input.nowMs ?? Date.now();
  const existing = cache.get(input.cacheKey);

  if (existing && existing.expiresAt > nowMs) {
    return existing.value;
  }

  const value = await input.loader();
  cache.set(input.cacheKey, {
    value,
    expiresAt: nowMs + FIVE_MINUTES_MS,
  });
  return value;
}
