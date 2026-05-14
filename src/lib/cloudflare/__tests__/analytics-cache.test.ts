import { describe, expect, it, vi } from "vitest";

import { getCachedCloudflareTrafficSummary } from "@/lib/cloudflare/analytics-cache";

describe("getCachedCloudflareTrafficSummary", () => {
  it("caches a configured result for five minutes", async () => {
    const loader = vi.fn().mockResolvedValue({
      configured: true,
      source: "cloudflare",
      hostname: "example.com",
      lastUpdated: "2026-05-04T12:00:00.000Z",
      summary: { visits: 1, requests: 2, bandwidthBytes: 3, errorRate: 0 },
      hourly: [],
      topPages: [],
      topCountries: [],
      statusCodes: [],
    });

    const first = await getCachedCloudflareTrafficSummary({
      cacheKey: "example.com",
      nowMs: 1000,
      loader,
    });
    const second = await getCachedCloudflareTrafficSummary({
      cacheKey: "example.com",
      nowMs: 1000 + 60_000,
      loader,
    });

    expect(first).toBe(second);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
