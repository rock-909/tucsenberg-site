import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";
import {
  shouldValidateProductionRuntimeContract,
  validateProductionConfig,
  validateProductionRuntimeContract,
} from "../../../scripts/starter-checks.js";

function createChildEnv(overrides: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("VITEST")),
  );

  return {
    ...env,
    ...overrides,
  };
}

function createValidProductionEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    DEPLOYMENT_PLATFORM: "cloudflare",
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "upstash-token",
    RATE_LIMIT_PEPPER: "a".repeat(32),
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "turnstile-site-key",
    RESEND_API_KEY: "resend-api-key",
    AIRTABLE_API_KEY: "airtable-api-key",
    AIRTABLE_BASE_ID: "appBaseId",
  };
}

describe("validate-production-config runtime contract", () => {
  it("enables strict runtime validation only in production mode", () => {
    expect(
      shouldValidateProductionRuntimeContract({
        APP_ENV: "preview",
        NODE_ENV: "test",
      }),
    ).toBe(false);
    expect(
      shouldValidateProductionRuntimeContract({
        APP_ENV: "production",
        NODE_ENV: "test",
      }),
    ).toBe(true);
    expect(
      shouldValidateProductionRuntimeContract({ NODE_ENV: "production" }),
    ).toBe(true);
    expect(
      shouldValidateProductionRuntimeContract({ NODE_ENV: "development" }),
    ).toBe(false);
    expect(shouldValidateProductionRuntimeContract({ NODE_ENV: "test" })).toBe(
      false,
    );
  });

  it("passes when the release-critical production contract is satisfied", () => {
    const result = validateProductionRuntimeContract(
      createValidProductionEnv(),
    );

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("fails when production DEPLOYMENT_PLATFORM is not canonical cloudflare", () => {
    const result = validateProductionRuntimeContract({
      ...createValidProductionEnv(),
      DEPLOYMENT_PLATFORM: "self-hosted",
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('DEPLOYMENT_PLATFORM must be "cloudflare"'),
      ]),
    );
  });

  it("fails when production DEPLOYMENT_PLATFORM is missing", () => {
    const env = createValidProductionEnv();
    delete env.DEPLOYMENT_PLATFORM;

    const result = validateProductionRuntimeContract(env);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('DEPLOYMENT_PLATFORM must be "cloudflare"'),
      ]),
    );
  });

  it("fails when production security stores are missing", () => {
    const env = {
      ...createValidProductionEnv(),
      UPSTASH_REDIS_REST_URL: undefined,
      UPSTASH_REDIS_REST_TOKEN: undefined,
    };

    const result = validateProductionRuntimeContract(env);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "Production rate limiting requires Upstash Redis",
        ),
      ]),
    );
  });

  it("rejects degraded in-memory stores in production", () => {
    const env = {
      ...createValidProductionEnv(),
      UPSTASH_REDIS_REST_URL: undefined,
      UPSTASH_REDIS_REST_TOKEN: undefined,
      ALLOW_MEMORY_RATE_LIMIT: "true",
    };

    const result = validateProductionRuntimeContract(env);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "Degraded in-memory rate-limit store flag (ALLOW_MEMORY_RATE_LIMIT) cannot be used in production",
        ),
      ]),
    );
  });

  it("does not reject an explicit false in-memory store fallback flag", () => {
    const env = {
      ...createValidProductionEnv(),
      ALLOW_MEMORY_RATE_LIMIT: "false",
    };

    const result = validateProductionRuntimeContract(env);

    expect(result.errors).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "Degraded in-memory rate-limit store flag (ALLOW_MEMORY_RATE_LIMIT) cannot be used in production",
        ),
      ]),
    );
  });

  it("fails fast on partial or forbidden store configuration", () => {
    const partialUpstash = validateProductionRuntimeContract({
      ...createValidProductionEnv(),
      UPSTASH_REDIS_REST_TOKEN: undefined,
    });
    const kvOnly = validateProductionRuntimeContract({
      ...createValidProductionEnv(),
      UPSTASH_REDIS_REST_URL: undefined,
      UPSTASH_REDIS_REST_TOKEN: undefined,
      KV_REST_API_URL: "https://kv.example.com",
      KV_REST_API_TOKEN: "kv-token",
      ALLOW_MEMORY_RATE_LIMIT: "true",
    });

    expect(partialUpstash.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "Production rate limiting requires Upstash Redis",
        ),
      ]),
    );
    expect(kvOnly.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("KV-only rate limiting is not allowed"),
      ]),
    );
  });

  it("fails when lead-path or secret requirements are missing or too short", () => {
    const result = validateProductionRuntimeContract({
      ...createValidProductionEnv(),
      RATE_LIMIT_PEPPER: "short",
      TURNSTILE_SECRET_KEY: undefined,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined,
      RESEND_API_KEY: undefined,
      AIRTABLE_API_KEY: undefined,
      AIRTABLE_BASE_ID: undefined,
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "RATE_LIMIT_PEPPER must be at least 32 characters",
        ),
        expect.stringContaining("TURNSTILE_SECRET_KEY is required"),
        expect.stringContaining("NEXT_PUBLIC_TURNSTILE_SITE_KEY is required"),
        expect.stringContaining("RESEND_API_KEY is required"),
        expect.stringContaining("AIRTABLE_API_KEY is required"),
        expect.stringContaining("AIRTABLE_BASE_ID is required"),
      ]),
    );
  });

  it.each([
    {
      name: "Upstash",
      remove: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
      message: "Production rate limiting requires Upstash Redis",
    },
    {
      name: "rate-limit pepper",
      remove: ["RATE_LIMIT_PEPPER"],
      message: "RATE_LIMIT_PEPPER is required",
    },
    {
      name: "Resend",
      remove: ["RESEND_API_KEY"],
      message: "RESEND_API_KEY is required",
    },
    {
      name: "Airtable API key",
      remove: ["AIRTABLE_API_KEY"],
      message: "AIRTABLE_API_KEY is required",
    },
    {
      name: "Airtable base",
      remove: ["AIRTABLE_BASE_ID"],
      message: "AIRTABLE_BASE_ID is required",
    },
  ])(
    "fails closed when a complete production fixture loses $name",
    (fixture) => {
      const env = createValidProductionEnv();
      for (const key of fixture.remove) {
        delete env[key];
      }

      const result = validateProductionRuntimeContract(env);

      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining(fixture.message)]),
      );
    },
  );
});

describe("validateProductionConfig CI vs deploy gate", () => {
  it("skips runtime contract for preview when APP_ENV=preview", () => {
    const env: NodeJS.ProcessEnv = {
      APP_ENV: "preview",
      NODE_ENV: "production",
    };

    const result = validateProductionConfig(env);

    expect(result.errors).toEqual([]);
    expect(result.runtimeContractChecked).toBe(false);
  });

  it("does not fail preview deploys when DEPLOYMENT_PLATFORM is not cloudflare", () => {
    const env: NodeJS.ProcessEnv = {
      APP_ENV: "preview",
      NODE_ENV: "production",
      DEPLOYMENT_PLATFORM: "development",
    };

    const result = validateProductionConfig(env);

    expect(result.errors).toEqual([]);
    expect(result.runtimeContractChecked).toBe(false);
  });

  it("enforces runtime contract for strict public launch checks in preview", () => {
    const env: NodeJS.ProcessEnv = {
      APP_ENV: "preview",
      NODE_ENV: "production",
      PUBLIC_LAUNCH_STRICT: "true",
    };

    const result = validateProductionConfig(env);

    expect(result.runtimeContractChecked).toBe(true);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "Production rate limiting requires Upstash Redis",
        ),
      ]),
    );
  });

  it("keeps runtime errors as hard failures when VALIDATE_CONFIG_SKIP_RUNTIME is absent", () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
    };

    const result = validateProductionConfig(env);

    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("keeps runtime errors as hard failures even when CI=true without the skip flag", () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      CI: "true",
    };

    const result = validateProductionConfig(env);

    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("public launch trust content guard", () => {
  it("checks the actual wrangler production public URLs in strict mode", () => {
    const result = validateProductionConfig({
      APP_ENV: "production",
      NODE_ENV: "production",
      PUBLIC_LAUNCH_STRICT: "true",
      PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED: "true",
      NEXT_PUBLIC_SITE_URL: "https://launch.tucsenberg.test",
      NEXT_PUBLIC_BASE_URL: "https://launch.tucsenberg.test",
      ...createValidProductionEnv(),
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "wrangler.jsonc env.production.vars.NEXT_PUBLIC_SITE_URL",
        ),
        expect.stringContaining(
          "wrangler.jsonc env.production.vars.NEXT_PUBLIC_BASE_URL",
        ),
      ]),
    );
  });

  it("reports owner-dependent public trust items as warnings by default", () => {
    const env: NodeJS.ProcessEnv = {
      APP_ENV: "preview",
      NODE_ENV: "production",
      VALIDATE_PUBLIC_LAUNCH_CONTENT: "true",
    };

    const result = validateProductionConfig(env);

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("SITE_CONFIG.contact.phone"),
        expect.stringContaining("brandAssets.logo.status"),
        expect.stringContaining("brandAssets.productPhotos.status"),
      ]),
    );
  });

  it("promotes public trust items to errors when PUBLIC_LAUNCH_STRICT=true", () => {
    const env: NodeJS.ProcessEnv = {
      APP_ENV: "preview",
      NODE_ENV: "production",
      PUBLIC_LAUNCH_STRICT: "true",
    };

    const result = validateProductionConfig(env);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("SITE_CONFIG.contact.phone"),
        expect.stringContaining("brandAssets.logo.status"),
        expect.stringContaining("brandAssets.productPhotos.status"),
      ]),
    );
  });

  it("blocks starter identity, SEO defaults, and missing legal/contact owner review in client launch strict mode", () => {
    const result = validateProductionConfig({
      APP_ENV: "preview",
      NODE_ENV: "production",
      PUBLIC_LAUNCH_STRICT: "true",
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("SITE_CONFIG.name"),
        expect.stringContaining("SITE_CONFIG.baseUrl"),
        expect.stringContaining("SITE_CONFIG.contact.email"),
        expect.stringContaining("SITE_CONFIG.seo.defaultTitle"),
        expect.stringContaining("SITE_CONFIG.seo.defaultDescription"),
        expect.stringContaining("SITE_CONFIG.social.twitter"),
        expect.stringContaining("SITE_CONFIG.social.linkedin"),
        expect.stringContaining("SITE_CONFIG.seo.titleTemplate"),
        expect.stringContaining("SITE_CONFIG.description"),
        expect.stringContaining("SITE_CONFIG.facts.company.name"),
        expect.stringContaining("SITE_CONFIG.facts.company.location"),
        expect.stringContaining("PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED"),
        expect.stringContaining(
          "content/pages/{locale}/{about,contact,privacy,terms}.mdx",
        ),
      ]),
    );
  });

  it("allows intentionally empty optional social links in the real strict public-launch CLI", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/starter-checks.js", "validate-production-config"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: createChildEnv({
          APP_ENV: "preview",
          NODE_ENV: "production",
          PUBLIC_LAUNCH_STRICT: "true",
        }),
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).not.toContain("SITE_CONFIG.social.twitter");
    expect(result.stderr).not.toContain("SITE_CONFIG.social.linkedin");
  });

  it("does not make legal/contact owner review a permanent client-launch failure", () => {
    const result = validateProductionConfig({
      APP_ENV: "preview",
      NODE_ENV: "production",
      PUBLIC_LAUNCH_STRICT: "true",
      PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED: "true",
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("SITE_CONFIG.name")]),
    );
    expect(result.errors).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED"),
      ]),
    );
  });

  it("treats workers.dev and example.invalid as non-launch public URLs", () => {
    const workersDev = validateProductionConfig({
      APP_ENV: "production",
      NODE_ENV: "production",
      PUBLIC_LAUNCH_STRICT: "true",
      NEXT_PUBLIC_SITE_URL:
        "https://tucsenberg-site-preview.example.workers.dev",
      ...createValidProductionEnv(),
    });
    const exampleInvalid = validateProductionConfig({
      APP_ENV: "production",
      NODE_ENV: "production",
      PUBLIC_LAUNCH_STRICT: "true",
      NEXT_PUBLIC_SITE_URL:
        "https://tucsenberg-site-production.example.invalid",
      ...createValidProductionEnv(),
    });

    expect(workersDev.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("NEXT_PUBLIC_SITE_URL")]),
    );
    expect(exampleInvalid.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("NEXT_PUBLIC_SITE_URL")]),
    );
  });

  it("treats workers.dev and example.invalid base URLs as non-launch public URLs", () => {
    const workersDev = validateProductionConfig({
      APP_ENV: "production",
      NODE_ENV: "production",
      PUBLIC_LAUNCH_STRICT: "true",
      NEXT_PUBLIC_BASE_URL:
        "https://tucsenberg-site-preview.example.workers.dev",
      ...createValidProductionEnv(),
    });
    const exampleInvalid = validateProductionConfig({
      APP_ENV: "production",
      NODE_ENV: "production",
      PUBLIC_LAUNCH_STRICT: "true",
      NEXT_PUBLIC_BASE_URL:
        "https://tucsenberg-site-production.example.invalid",
      ...createValidProductionEnv(),
    });

    expect(workersDev.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("NEXT_PUBLIC_BASE_URL")]),
    );
    expect(exampleInvalid.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("NEXT_PUBLIC_BASE_URL")]),
    );
  });
});
