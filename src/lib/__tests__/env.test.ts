import { afterEach, describe, expect, it, vi } from "vitest";
/**
 * Tests for env.ts utility functions
 *
 * Note: The env object itself is created via @t3-oss/env-nextjs at module load time
 * and is difficult to test directly. The global test setup mocks @/lib/env.
 * Here we test the exported utility functions by using the mocked env object.
 */

import {
  env,
  envUtils,
  getEnvVar,
  getRuntimeAppEnv,
  getRuntimeEnvBoolean,
  getRuntimeEnvNumber,
  getRuntimeEnvString,
  getRuntimeNodeEnv,
  isRuntimeCi,
  isRuntimeCloudflare,
  isRuntimeDevelopment,
  isRuntimePlaywright,
  isRuntimeProduction,
  isRuntimeProductionBuildPhase,
  isRuntimeTest,
  isSecureAppEnv,
  requireEnvVar,
} from "../env";

const cloudflareContextSymbol = Symbol.for("__cloudflare-context__");

afterEach(() => {
  delete (globalThis as typeof globalThis & Record<symbol, unknown>)[
    cloudflareContextSymbol
  ];
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("APP_ENV", "local");
  vi.stubEnv("CI", "false");
  vi.stubEnv("PLAYWRIGHT_TEST", "false");
  vi.stubEnv("NEXT_PHASE", "");
  vi.stubEnv("DEPLOYMENT_PLATFORM", "");
  vi.stubEnv("DEPLOY_TARGET", "");
  vi.stubEnv("NEXT_PUBLIC_DEPLOYMENT_PLATFORM", "self-hosted");
  vi.stubEnv("TURNSTILE_BYPASS", "false");
});

describe("env utilities", () => {
  describe("env object", () => {
    it("should export env object", () => {
      expect(env).toBeDefined();
      expect(typeof env).toBe("object");
    });

    it("should have NODE_ENV property", () => {
      expect(env.NODE_ENV).toBeDefined();
    });
  });

  describe("getEnvVar", () => {
    it("should return NODE_ENV value", () => {
      const result = getEnvVar("NODE_ENV");
      expect(result).toBe("test");
    });

    it("should return string values", () => {
      const result = getEnvVar("TURNSTILE_SECRET_KEY");
      expect(typeof result === "string" || result === undefined).toBe(true);
    });
  });

  describe("requireEnvVar", () => {
    it("should return TURNSTILE_SECRET_KEY when available", () => {
      // The test setup provides this value
      const result = requireEnvVar("TURNSTILE_SECRET_KEY");
      expect(result).toBe("test-secret-key");
    });

    it("should return RESEND_API_KEY when available", () => {
      const result = requireEnvVar("RESEND_API_KEY");
      expect(result).toBe("test-resend-key");
    });

    it("should return AIRTABLE_API_KEY when available", () => {
      const result = requireEnvVar("AIRTABLE_API_KEY");
      expect(result).toBe("test-airtable-key");
    });
  });

  describe("envUtils", () => {
    describe("environment detection", () => {
      it("should have isDevelopment function", () => {
        expect(typeof envUtils.isDevelopment).toBe("function");
      });

      it("should have isProduction function", () => {
        expect(typeof envUtils.isProduction).toBe("function");
      });

      it("should have isTest function", () => {
        expect(typeof envUtils.isTest).toBe("function");
      });

      it("isTest should return true in test environment", () => {
        expect(envUtils.isTest()).toBe(true);
      });

      it("isDevelopment should return false in test environment", () => {
        expect(envUtils.isDevelopment()).toBe(false);
      });

      it("isProduction should return false in test environment", () => {
        expect(envUtils.isProduction()).toBe(false);
      });
    });
    describe("Turnstile utilities", () => {
      it("should have getTurnstileSecret function", () => {
        expect(typeof envUtils.getTurnstileSecret).toBe("function");
      });

      it("should have getTurnstileSiteKey function", () => {
        expect(typeof envUtils.getTurnstileSiteKey).toBe("function");
      });

      it("getTurnstileSecret should return test value", () => {
        expect(envUtils.getTurnstileSecret()).toBe("test-secret-key");
      });
    });

    describe("Resend utilities", () => {
      it("should have getResendApiKey function", () => {
        expect(typeof envUtils.getResendApiKey).toBe("function");
      });

      it("getResendApiKey should return test value", () => {
        expect(envUtils.getResendApiKey()).toBe("test-resend-key");
      });
    });

    describe("Airtable utilities", () => {
      it("should have getAirtableToken function", () => {
        expect(typeof envUtils.getAirtableToken).toBe("function");
      });

      it("should have getAirtableBaseId function", () => {
        expect(typeof envUtils.getAirtableBaseId).toBe("function");
      });

      it("getAirtableToken should return test value", () => {
        expect(envUtils.getAirtableToken()).toBe("test-airtable-key");
      });

      it("getAirtableBaseId should return test value", () => {
        expect(envUtils.getAirtableBaseId()).toBe("test-base-id");
      });
    });
  });
});

describe("env type safety", () => {
  it("should have correct server env vars defined", () => {
    // These are defined in the schema and should exist on the env object
    expect("NODE_ENV" in env).toBe(true);
    expect("TURNSTILE_SECRET_KEY" in env).toBe(true);
    expect("RESEND_API_KEY" in env).toBe(true);
  });

  it("exposes the production runtime contract vars through the central env object", () => {
    expect("NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" in env).toBe(true);
    expect("ALLOW_MEMORY_RATE_LIMIT" in env).toBe(true);
  });

  it("exposes Cloudflare deployment account vars through the central env object", () => {
    expect("CLOUDFLARE_ACCOUNT_ID" in env).toBe(true);
  });

  it("should have correct client env vars defined", () => {
    expect("NEXT_PUBLIC_BASE_URL" in env).toBe(true);
    expect("NEXT_PUBLIC_TURNSTILE_SITE_KEY" in env).toBe(true);
  });
});

describe("runtime env helpers", () => {
  it("prefers process.env strings over validated env values", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(getRuntimeEnvString("NODE_ENV")).toBe("development");
    expect(getRuntimeNodeEnv()).toBe("development");
    expect(isRuntimeDevelopment()).toBe(true);
    expect(isRuntimeProduction()).toBe(false);
    expect(isRuntimeTest()).toBe(false);
  });

  it("prefers Cloudflare request context bindings over process.env", () => {
    vi.stubEnv("RESEND_API_KEY", "process-env-key");
    (globalThis as typeof globalThis & Record<symbol, unknown>)[
      cloudflareContextSymbol
    ] = {
      env: {
        RESEND_API_KEY: "cloudflare-binding-key",
      },
    };

    expect(getRuntimeEnvString("RESEND_API_KEY")).toBe(
      "cloudflare-binding-key",
    );
  });

  it("parses booleans and detects CI / Playwright flags", () => {
    vi.stubEnv("CI", "true");
    vi.stubEnv("PLAYWRIGHT_TEST", "true");
    vi.stubEnv("TURNSTILE_BYPASS", "true");

    expect(getRuntimeEnvBoolean("TURNSTILE_BYPASS")).toBe(true);
    expect(isRuntimeCi()).toBe(true);
    expect(isRuntimePlaywright()).toBe(true);
  });

  it("parses numeric runtime env values and ignores invalid numbers", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS", "3001");
    expect(getRuntimeEnvNumber("NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS")).toBe(
      3001,
    );

    vi.stubEnv("NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS", "not-a-number");
    expect(
      getRuntimeEnvNumber("NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS"),
    ).toBeUndefined();
  });

  it("recognizes secure app envs and production build phase", () => {
    vi.stubEnv("APP_ENV", "preview");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");

    expect(getRuntimeAppEnv()).toBe("preview");
    expect(isSecureAppEnv()).toBe(true);
    expect(isRuntimeProductionBuildPhase()).toBe(true);
  });

  it("detects Cloudflare runtime from server or public deployment platform", () => {
    vi.stubEnv("DEPLOYMENT_PLATFORM", "cloudflare");
    expect(isRuntimeCloudflare()).toBe(true);

    vi.stubEnv("DEPLOYMENT_PLATFORM", "");
    vi.stubEnv("NEXT_PUBLIC_DEPLOYMENT_PLATFORM", "cloudflare");
    expect(isRuntimeCloudflare()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_DEPLOYMENT_PLATFORM", "self-hosted");
    expect(isRuntimeCloudflare()).toBe(false);
  });

  it("detects Cloudflare runtime from the legacy deployment target alias", () => {
    vi.stubEnv("DEPLOYMENT_PLATFORM", "");
    vi.stubEnv("NEXT_PUBLIC_DEPLOYMENT_PLATFORM", "self-hosted");
    vi.stubEnv("DEPLOY_TARGET", "cloudflare");

    expect(isRuntimeCloudflare()).toBe(true);
  });

  it("returns undefined for unknown runtime app env", () => {
    vi.stubEnv("APP_ENV", "staging");

    expect(getRuntimeAppEnv()).toBeUndefined();
  });
});
