import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import OpsTrafficPage, { generateMetadata } from "@/app/ops/traffic/page";
import { getCachedCloudflareTrafficSummary } from "@/lib/cloudflare/analytics-cache";
import { getCloudflareAnalyticsConfig } from "@/lib/cloudflare/analytics-config";
import { verifyOpsAccessCookieValue } from "@/lib/ops/access-cookie";

vi.mock("@/lib/cloudflare/analytics-config", () => ({
  getCloudflareAnalyticsConfig: vi.fn(() => ({
    configured: false,
    reason: "missing-credentials",
  })),
}));

vi.mock("@/lib/cloudflare/analytics-cache", () => ({
  getCachedCloudflareTrafficSummary: vi.fn(),
}));

vi.mock("@/lib/cloudflare/analytics-client", () => ({
  fetchCloudflareTrafficSummary: vi.fn(),
}));

vi.mock("@/lib/ops/access-cookie", () => ({
  OPS_TRAFFIC_ACCESS_COOKIE_NAME: "ops_traffic_access",
  verifyOpsAccessCookieValue: vi.fn(() => false),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(() => ({ value: "signed-cookie" })),
  })),
}));

const mockedGetConfig = vi.mocked(getCloudflareAnalyticsConfig);
const mockedGetCachedTraffic = vi.mocked(getCachedCloudflareTrafficSummary);
const mockedVerifyCookie = vi.mocked(verifyOpsAccessCookieValue);

describe("OpsTrafficPage", () => {
  it("keeps the owner dashboard out of search indexes", () => {
    expect(generateMetadata().robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("shows a safe unconfigured state without secrets", async () => {
    const page = await OpsTrafficPage({});

    render(page);

    expect(
      screen.getByText("Traffic dashboard is not configured"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/CLOUDFLARE_ANALYTICS_API_TOKEN/u),
    ).not.toBeInTheDocument();
  });

  it("asks for owner access before showing configured traffic data", async () => {
    mockedGetConfig.mockReturnValueOnce({
      configured: true,
      zoneId: "zone-123",
      apiToken: "token-123",
      hostname: "example.com",
    });
    mockedVerifyCookie.mockResolvedValueOnce(false);

    const page = await OpsTrafficPage({
      searchParams: Promise.resolve({ access: "denied" }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: "Owner traffic dashboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Access key was not accepted."),
    ).toBeInTheDocument();
    expect(mockedGetCachedTraffic).not.toHaveBeenCalled();
  });

  it("renders owner traffic numbers after access is verified", async () => {
    mockedGetConfig.mockReturnValueOnce({
      configured: true,
      zoneId: "zone-123",
      apiToken: "token-123",
      hostname: "example.com",
    });
    mockedVerifyCookie.mockResolvedValueOnce(true);
    mockedGetCachedTraffic.mockResolvedValueOnce({
      configured: true,
      source: "cloudflare",
      hostname: "example.com",
      lastUpdated: "2026-05-04T12:00:00.000Z",
      summary: {
        visits: 320,
        requests: 1200,
        bandwidthBytes: 4096,
        errorRate: 0.05,
      },
      hourly: [],
      topPages: [],
      topCountries: [],
      statusCodes: [],
    });

    const page = await OpsTrafficPage({});

    render(page);

    expect(screen.getByText("Cloudflare analytics")).toBeInTheDocument();
    expect(screen.getByText("320")).toBeInTheDocument();
    expect(screen.getByText("1200")).toBeInTheDocument();
    expect(screen.getByText("5.00%")).toBeInTheDocument();
  });
});
