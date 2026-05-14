import { describe, expect, it, vi } from "vitest";

import {
  getCloudflareAnalyticsConfig,
  isCloudflareAnalyticsConfigured,
} from "@/lib/cloudflare/analytics-config";

describe("cloudflare analytics config", () => {
  it("reports unconfigured when required vars are missing", () => {
    vi.stubEnv("CLOUDFLARE_ZONE_ID", "");
    vi.stubEnv("CLOUDFLARE_ANALYTICS_API_TOKEN", "");
    vi.stubEnv("CLOUDFLARE_ANALYTICS_HOSTNAME", "");

    expect(isCloudflareAnalyticsConfigured()).toBe(false);
    expect(getCloudflareAnalyticsConfig()).toEqual({
      configured: false,
      reason: "missing-credentials",
    });
  });

  it("returns a configured server-only contract", () => {
    vi.stubEnv("CLOUDFLARE_ZONE_ID", "zone-123");
    vi.stubEnv("CLOUDFLARE_ANALYTICS_API_TOKEN", "token-123");
    vi.stubEnv("CLOUDFLARE_ANALYTICS_HOSTNAME", "example.com");

    expect(getCloudflareAnalyticsConfig()).toEqual({
      configured: true,
      zoneId: "zone-123",
      apiToken: "token-123",
      hostname: "example.com",
    });
  });
});
