import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCloudflareTrafficSummary } from "@/lib/cloudflare/analytics-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchCloudflareTrafficSummary", () => {
  it("maps Cloudflare GraphQL response into owner dashboard data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          viewer: {
            zones: [
              {
                totals: [
                  {
                    count: 1200,
                    sum: { visits: 320, edgeResponseBytes: 4096 },
                  },
                ],
                statusCodes: [
                  {
                    dimensions: { edgeResponseStatus: 200 },
                    count: 1100,
                  },
                  {
                    dimensions: { edgeResponseStatus: 500 },
                    count: 5,
                  },
                ],
                topPaths: [
                  {
                    dimensions: { clientRequestPath: "/" },
                    count: 700,
                  },
                ],
                topCountries: [
                  {
                    dimensions: { clientCountryName: "United States" },
                    count: 500,
                  },
                ],
                hourly: [
                  {
                    dimensions: { datetimeHour: "2026-05-04T10:00:00Z" },
                    count: 100,
                    sum: { visits: 50, edgeResponseBytes: 1024 },
                  },
                ],
              },
            ],
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchCloudflareTrafficSummary({
      zoneId: "zone-123",
      apiToken: "token-123",
      hostname: "example.com",
      now: new Date("2026-05-04T12:00:00Z"),
    });

    expect(result.configured).toBe(true);
    if (!result.configured) throw new Error("Expected configured result");
    expect(result.summary.visits).toBe(320);
    expect(result.summary.requests).toBe(1200);
    expect(result.summary.bandwidthBytes).toBe(4096);
    expect(result.summary.errorRate).toBeCloseTo(5 / 1200);
    expect(result.topPages).toEqual([{ path: "/", requests: 700 }]);
    expect(result.topCountries).toEqual([
      { country: "United States", requests: 500 },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/graphql",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      }),
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.query).toContain("$zoneTag: String!");
    expect(body.query).toContain("$hostname: String!");
    expect(body.query).toContain("sum { visits edgeResponseBytes }");
    expect(body.query).toContain('requestSource: "eyeball"');
  });

  it("returns a safe error without exposing the token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => "token-123 is forbidden",
      }),
    );

    const result = await fetchCloudflareTrafficSummary({
      zoneId: "zone-123",
      apiToken: "token-123",
      hostname: "example.com",
      now: new Date("2026-05-04T12:00:00Z"),
    });

    expect(result).toEqual({
      configured: false,
      reason: "request-failed",
    });
  });

  it("returns a safe error when the Cloudflare request throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("token-123")));

    const result = await fetchCloudflareTrafficSummary({
      zoneId: "zone-123",
      apiToken: "token-123",
      hostname: "example.com",
      now: new Date("2026-05-04T12:00:00Z"),
    });

    expect(result).toEqual({
      configured: false,
      reason: "request-failed",
    });
  });
});
