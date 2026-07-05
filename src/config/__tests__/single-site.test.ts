import { afterEach, describe, expect, it, vi } from "vitest";

const PREVIEW_BASE_URL =
  "https://tucsenberg-site-preview.faints-pudgier-9r.workers.dev";

describe("single-site", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/env");
    vi.resetModules();
  });

  it("uses the Cloudflare preview fallback when no public site URL is explicitly configured", async () => {
    vi.resetModules();
    vi.doMock("@/lib/env", () => ({
      env: {
        NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SITE_URL: undefined,
      },
      runtimeEnv: {
        NEXT_PUBLIC_BASE_URL: undefined,
        NEXT_PUBLIC_SITE_URL: undefined,
      },
      getRuntimeEnvString: () => undefined,
      isRuntimeProduction: () => true,
    }));

    const { SINGLE_SITE_CONFIG } = await import("@/config/single-site");

    expect(SINGLE_SITE_CONFIG.baseUrl).toBe(PREVIEW_BASE_URL);
  });
});
