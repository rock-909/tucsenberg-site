/**
 * 环境变量模块（单一真相源）
 *
 * 约束：生产/测试代码统一从 `@/lib/env` 导入，避免出现多套 schema/mock 分叉。
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const serverEnvSchema = {
  // Email Service (Resend)
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),

  // Data Storage (Airtable)
  AIRTABLE_API_KEY: z.string().min(1).optional(),
  AIRTABLE_BASE_ID: z.string().min(1).optional(),
  AIRTABLE_TABLE_NAME: z.string().min(1).optional(),

  // Bot Protection (Cloudflare Turnstile)
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  TURNSTILE_ALLOWED_HOSTS: z.string().optional(),
  TURNSTILE_ALLOWED_ACTIONS: z.string().optional(),
  TURNSTILE_EXPECTED_ACTION: z.string().optional(),
  TURNSTILE_BYPASS: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  // Cloudflare split-worker Server Action compatibility
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: z.string().min(1).optional(),

  // Cloudflare analytics and owner dashboard
  CLOUDFLARE_ZONE_ID: z.string().min(1).optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
  CLOUDFLARE_ANALYTICS_API_TOKEN: z.string().min(1).optional(),
  CLOUDFLARE_ANALYTICS_HOSTNAME: z.string().min(1).optional(),
  OPS_DASHBOARD_ACCESS_KEY: z.string().min(16).optional(),

  // Runtime and platform configuration
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).optional(),
  CONTENT_ENABLE_DRAFTS: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  DEPLOYMENT_PLATFORM: z
    .enum(["cloudflare", "development", "self-hosted"])
    .optional(),
  DEPLOY_TARGET: z
    .enum(["cloudflare", "development", "self-hosted"])
    .optional(),
  CF_PAGES: z.string().optional(),
  GOOGLE_SITE_VERIFICATION: z.string().min(1).optional(),
  YANDEX_VERIFICATION: z.string().min(1).optional(),

  // Distributed storage and rate limiting
  RATE_LIMIT_PEPPER: z.string().min(1).optional(),
  RATE_LIMIT_PEPPER_PREVIOUS: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().min(1).optional(),
  ALLOW_MEMORY_RATE_LIMIT: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  // Node Environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_ENV: z
    .enum(["local", "development", "test", "preview", "production"])
    .optional(),
  NEXT_PHASE: z.string().optional(),

  // CI/CD
  CI: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  PLAYWRIGHT_TEST: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  SKIP_ENV_VALIDATION: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  // Security
  SECURITY_HEADERS_ENABLED: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  CSP_REPORT_URI: z.string().url().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
};

export const clientEnvSchema = {
  // Base Configuration
  NEXT_PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_WEBSITE_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_WEBSITE_SECONDARY_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default("Example Showcase Company"),
  NEXT_PUBLIC_APP_VERSION: z.string().default("1.0.0"),
  NEXT_PUBLIC_SITE_KEY: z.string().default("showcase"),

  // Analytics & Monitoring
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_ENABLE_ANALYTICS_PRECONNECT: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  // Bot Protection (Cloudflare Turnstile Public Key)
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_ACTION: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_BYPASS: z
    .string()
    .default("false")
    .transform((val) => val === "true"),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: z
    .string()
    .default("true")
    .transform((val) => val === "true"),

  // Development Tools
  NEXT_PUBLIC_DISABLE_REACT_SCAN: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  NEXT_PUBLIC_DISABLE_DEV_TOOLS: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  NEXT_PUBLIC_TEST_MODE: z
    .string()
    .default("false")
    .transform((val) => val === "true"),

  // Internationalization
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("en"),
  NEXT_PUBLIC_SUPPORTED_LOCALES: z.string().default("en,zh"),
  NEXT_PUBLIC_ENABLE_CN_FONT_SUBSET: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  // Security
  NEXT_PUBLIC_SECURITY_MODE: z
    .enum(["strict", "moderate", "relaxed"])
    .default("strict"),

  // UI tuning
  NEXT_PUBLIC_NAV_VARIANT: z.string().optional(),
  NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS: z.coerce.number().optional(),

  // Deployment Platform
  NEXT_PUBLIC_DEPLOYMENT_PLATFORM: z
    .enum(["cloudflare", "development", "self-hosted"])
    .optional(),
};

export const runtimeEnv = {
  // Server
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
  AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
  AIRTABLE_TABLE_NAME: process.env.AIRTABLE_TABLE_NAME,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  TURNSTILE_ALLOWED_HOSTS: process.env.TURNSTILE_ALLOWED_HOSTS,
  TURNSTILE_ALLOWED_ACTIONS: process.env.TURNSTILE_ALLOWED_ACTIONS,
  TURNSTILE_EXPECTED_ACTION: process.env.TURNSTILE_EXPECTED_ACTION,
  TURNSTILE_BYPASS: process.env.TURNSTILE_BYPASS,
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY:
    process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,
  CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_ANALYTICS_API_TOKEN: process.env.CLOUDFLARE_ANALYTICS_API_TOKEN,
  CLOUDFLARE_ANALYTICS_HOSTNAME: process.env.CLOUDFLARE_ANALYTICS_HOSTNAME,
  OPS_DASHBOARD_ACCESS_KEY: process.env.OPS_DASHBOARD_ACCESS_KEY,
  LOG_LEVEL: process.env.LOG_LEVEL,
  CONTENT_ENABLE_DRAFTS: process.env.CONTENT_ENABLE_DRAFTS,
  DEPLOYMENT_PLATFORM: process.env.DEPLOYMENT_PLATFORM,
  DEPLOY_TARGET: process.env.DEPLOY_TARGET,
  CF_PAGES: process.env.CF_PAGES,
  GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION,
  YANDEX_VERIFICATION: process.env.YANDEX_VERIFICATION,
  RATE_LIMIT_PEPPER: process.env.RATE_LIMIT_PEPPER,
  RATE_LIMIT_PEPPER_PREVIOUS: process.env.RATE_LIMIT_PEPPER_PREVIOUS,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  ALLOW_MEMORY_RATE_LIMIT: process.env.ALLOW_MEMORY_RATE_LIMIT,
  NODE_ENV: process.env.NODE_ENV,
  APP_ENV: process.env.APP_ENV,
  NEXT_PHASE: process.env.NEXT_PHASE,
  CI: process.env.CI,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  PLAYWRIGHT_TEST: process.env.PLAYWRIGHT_TEST,
  SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
  SECURITY_HEADERS_ENABLED: process.env.SECURITY_HEADERS_ENABLED,
  CSP_REPORT_URI: process.env.CSP_REPORT_URI,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,

  // Client
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_WEBSITE_BASE_URL: process.env.NEXT_PUBLIC_WEBSITE_BASE_URL,
  NEXT_PUBLIC_WEBSITE_SECONDARY_BASE_URL:
    process.env.NEXT_PUBLIC_WEBSITE_SECONDARY_BASE_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_SITE_KEY: process.env.NEXT_PUBLIC_SITE_KEY,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_ENABLE_ANALYTICS_PRECONNECT:
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_PRECONNECT,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_TURNSTILE_ACTION: process.env.NEXT_PUBLIC_TURNSTILE_ACTION,
  NEXT_PUBLIC_TURNSTILE_BYPASS: process.env.NEXT_PUBLIC_TURNSTILE_BYPASS,
  NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING:
    process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING:
    process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING,
  NEXT_PUBLIC_DISABLE_REACT_SCAN: process.env.NEXT_PUBLIC_DISABLE_REACT_SCAN,
  NEXT_PUBLIC_DISABLE_DEV_TOOLS: process.env.NEXT_PUBLIC_DISABLE_DEV_TOOLS,
  NEXT_PUBLIC_TEST_MODE: process.env.NEXT_PUBLIC_TEST_MODE,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_SUPPORTED_LOCALES: process.env.NEXT_PUBLIC_SUPPORTED_LOCALES,
  NEXT_PUBLIC_ENABLE_CN_FONT_SUBSET:
    process.env.NEXT_PUBLIC_ENABLE_CN_FONT_SUBSET,
  NEXT_PUBLIC_SECURITY_MODE: process.env.NEXT_PUBLIC_SECURITY_MODE,
  NEXT_PUBLIC_NAV_VARIANT: process.env.NEXT_PUBLIC_NAV_VARIANT,
  NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS:
    process.env.NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS,
  NEXT_PUBLIC_DEPLOYMENT_PLATFORM: process.env.NEXT_PUBLIC_DEPLOYMENT_PLATFORM,
};

function readRawEnvValue(key: string): string | undefined {
  if (typeof process === "undefined") {
    return undefined;
  }

  return process.env[key];
}

function shouldSkipEnvValidation(): boolean {
  return readRawEnvValue("SKIP_ENV_VALIDATION") === "true";
}

const PUBLIC_RUNTIME_ENV_READERS = {
  NODE_ENV: () => process.env.NODE_ENV,
  NEXT_PUBLIC_BASE_URL: () => process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_SITE_URL: () => process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_WEBSITE_BASE_URL: () => process.env.NEXT_PUBLIC_WEBSITE_BASE_URL,
  NEXT_PUBLIC_WEBSITE_SECONDARY_BASE_URL: () =>
    process.env.NEXT_PUBLIC_WEBSITE_SECONDARY_BASE_URL,
  NEXT_PUBLIC_APP_NAME: () => process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_VERSION: () => process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_SITE_KEY: () => process.env.NEXT_PUBLIC_SITE_KEY,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: () =>
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_ENABLE_ANALYTICS_PRECONNECT: () =>
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_PRECONNECT,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: () =>
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_TURNSTILE_ACTION: () => process.env.NEXT_PUBLIC_TURNSTILE_ACTION,
  NEXT_PUBLIC_TURNSTILE_BYPASS: () => process.env.NEXT_PUBLIC_TURNSTILE_BYPASS,
  NEXT_PUBLIC_ENABLE_ANALYTICS: () => process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: () =>
    process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: () =>
    process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING,
  NEXT_PUBLIC_DISABLE_REACT_SCAN: () =>
    process.env.NEXT_PUBLIC_DISABLE_REACT_SCAN,
  NEXT_PUBLIC_DISABLE_DEV_TOOLS: () =>
    process.env.NEXT_PUBLIC_DISABLE_DEV_TOOLS,
  NEXT_PUBLIC_TEST_MODE: () => process.env.NEXT_PUBLIC_TEST_MODE,
  NEXT_PUBLIC_DEFAULT_LOCALE: () => process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_SUPPORTED_LOCALES: () =>
    process.env.NEXT_PUBLIC_SUPPORTED_LOCALES,
  NEXT_PUBLIC_ENABLE_CN_FONT_SUBSET: () =>
    process.env.NEXT_PUBLIC_ENABLE_CN_FONT_SUBSET,
  NEXT_PUBLIC_SECURITY_MODE: () => process.env.NEXT_PUBLIC_SECURITY_MODE,
  NEXT_PUBLIC_NAV_VARIANT: () => process.env.NEXT_PUBLIC_NAV_VARIANT,
  NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS: () =>
    process.env.NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS,
  NEXT_PUBLIC_DEPLOYMENT_PLATFORM: () =>
    process.env.NEXT_PUBLIC_DEPLOYMENT_PLATFORM,
} as const satisfies Record<string, () => string | undefined>;

export type PublicRuntimeEnvKey = keyof typeof PUBLIC_RUNTIME_ENV_READERS;

// 创建类型安全的环境变量配置
export const env = createEnv({
  server: serverEnvSchema,
  client: clientEnvSchema,
  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv,
  /**
   * Run `build` or `dev` with SKIP_ENV_VALIDATION to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: shouldSkipEnvValidation(),
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});

// 提供类型安全的环境变量访问函数
export function getEnvVar(
  key: keyof typeof env,
): string | boolean | number | undefined {
  return env[key];
}

function readProcessEnvValue(key: keyof typeof env): string | undefined {
  return readRawEnvValue(key);
}

function readValidatedEnvValue(key: keyof typeof env) {
  try {
    return env[key];
  } catch {
    return undefined;
  }
}

type RuntimeNodeEnv = "development" | "test" | "production";
type RuntimeAppEnv =
  | "local"
  | "development"
  | "test"
  | "preview"
  | "production";

function coerceRuntimeNodeEnv(
  value: string | undefined,
): RuntimeNodeEnv | undefined {
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }
  return undefined;
}

function coerceRuntimeAppEnv(
  value: string | undefined,
): RuntimeAppEnv | undefined {
  if (
    value === "local" ||
    value === "development" ||
    value === "test" ||
    value === "preview" ||
    value === "production"
  ) {
    return value;
  }
  return undefined;
}

export function getRuntimeEnvString(key: keyof typeof env): string | undefined {
  const runtimeValue = readProcessEnvValue(key);
  if (runtimeValue !== undefined) {
    return runtimeValue;
  }

  const value = readValidatedEnvValue(key);
  return typeof value === "string" ? value : undefined;
}

export function getRuntimeEnvBoolean(
  key: keyof typeof env,
): boolean | undefined {
  const runtimeValue = readProcessEnvValue(key);
  if (runtimeValue !== undefined) {
    return runtimeValue === "true";
  }

  const value = readValidatedEnvValue(key);
  return typeof value === "boolean" ? value : undefined;
}

export function getRuntimeEnvNumber(key: keyof typeof env): number | undefined {
  const runtimeValue = readProcessEnvValue(key);
  if (runtimeValue !== undefined) {
    const parsed = Number(runtimeValue);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  const value = readValidatedEnvValue(key);
  return typeof value === "number" ? value : undefined;
}

export function getPublicRuntimeEnvString(
  key: PublicRuntimeEnvKey,
): string | undefined {
  return PUBLIC_RUNTIME_ENV_READERS[key]();
}

export function getPublicRuntimeEnvBoolean(
  key: PublicRuntimeEnvKey,
): boolean | undefined {
  const value = getPublicRuntimeEnvString(key);

  if (value === undefined) {
    return undefined;
  }

  return value === "true";
}

export function getPublicRuntimeEnvNumber(
  key: PublicRuntimeEnvKey,
): number | undefined {
  const value = getPublicRuntimeEnvString(key);

  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function isPublicRuntimeDevelopment(): boolean {
  return getPublicRuntimeEnvString("NODE_ENV") === "development";
}

export function isPublicRuntimeProduction(): boolean {
  return getPublicRuntimeEnvString("NODE_ENV") === "production";
}

export function getRuntimeNodeEnv(): RuntimeNodeEnv | undefined {
  return coerceRuntimeNodeEnv(getRuntimeEnvString("NODE_ENV"));
}

export function getRuntimeAppEnv(): RuntimeAppEnv | undefined {
  return coerceRuntimeAppEnv(getRuntimeEnvString("APP_ENV"));
}

export function isRuntimeDevelopment(): boolean {
  return getRuntimeNodeEnv() === "development";
}

export function isRuntimeProduction(): boolean {
  return getRuntimeNodeEnv() === "production";
}

export function isRuntimeTest(): boolean {
  return getRuntimeNodeEnv() === "test";
}

export function isRuntimeCi(): boolean {
  return getRuntimeEnvString("CI") === "true";
}

export function isRuntimePlaywright(): boolean {
  return getRuntimeEnvBoolean("PLAYWRIGHT_TEST") === true;
}

export function isRuntimeProductionBuildPhase(): boolean {
  return getRuntimeEnvString("NEXT_PHASE") === "phase-production-build";
}

export function isRuntimeCloudflare(): boolean {
  return (
    getRuntimeEnvString("DEPLOYMENT_PLATFORM") === "cloudflare" ||
    getRuntimeEnvString("DEPLOY_TARGET") === "cloudflare" ||
    getRuntimeEnvString("NEXT_PUBLIC_DEPLOYMENT_PLATFORM") === "cloudflare"
  );
}

export function isSecureAppEnv(): boolean {
  const appEnv = getRuntimeAppEnv();
  return appEnv === "production" || appEnv === "preview";
}

// 提供必需环境变量检查（仅用于字符串类型的环境变量）
export function requireEnvVar(key: keyof typeof env): string {
  const value = env[key];
  if (!value || typeof value === "boolean" || typeof value === "number") {
    throw new Error(
      `Required environment variable ${key} is not set or is not a string`,
    );
  }
  return value;
}

// 常用环境变量的便捷访问器
export const envUtils = {
  isDevelopment: () => env.NODE_ENV === "development",
  isProduction: () => env.NODE_ENV === "production",
  isTest: () => env.NODE_ENV === "test",
  // Turnstile相关
  getTurnstileSecret: () => requireEnvVar("TURNSTILE_SECRET_KEY"),
  getTurnstileSiteKey: () => requireEnvVar("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),

  // Resend相关
  getResendApiKey: () => requireEnvVar("RESEND_API_KEY"),

  // Airtable相关
  getAirtableToken: () => requireEnvVar("AIRTABLE_API_KEY"),
  getAirtableBaseId: () => requireEnvVar("AIRTABLE_BASE_ID"),
} as const;
