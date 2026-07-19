import type { PlaywrightTestConfig } from "@playwright/test";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadCiConfig(shouldRebuild: boolean) {
  vi.stubEnv("CI", "1");
  vi.stubEnv("CI_DAILY", "");
  vi.stubEnv("CI_FLAKE_SAMPLING", "");
  vi.stubEnv("PLAYWRIGHT_PROFILE_LANE", "default");
  vi.stubEnv("PLAYWRIGHT_REBUILD_SERVER", shouldRebuild ? "true" : "");
  vi.stubEnv("STAGING_URL", "");
  vi.resetModules();

  const { default: config } = (await import("../../playwright.config")) as {
    default: PlaywrightTestConfig;
  };

  return config;
}

function getWebServer(config: PlaywrightTestConfig) {
  if (!config.webServer || Array.isArray(config.webServer)) {
    throw new Error("Expected one local Playwright web server");
  }

  return config.webServer;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Playwright CI web server", () => {
  it("rebuilds the release smoke server without weakening CI safeguards", async () => {
    const config = await loadCiConfig(true);

    expect(getWebServer(config).command).toBe("pnpm build && pnpm start");
    expect(config.forbidOnly).toBe(true);
    expect(config.retries).toBe(2);
    expect(config.workers).toBe(2);
  });

  it("reuses the workflow build in ordinary CI", async () => {
    const config = await loadCiConfig(false);

    expect(getWebServer(config).command).toBe("pnpm start");
    expect(config.forbidOnly).toBe(true);
    expect(config.retries).toBe(2);
    expect(config.workers).toBe(2);
  });
});
