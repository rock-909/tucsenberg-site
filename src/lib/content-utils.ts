/**
 * Content Management System - Utility Functions
 *
 * This module provides utility functions for content management,
 * including path validation, configuration, and constants.
 */
import fs from "fs";
import path from "path";
import { ContentError, type ContentConfig } from "@/types/content.types";
import type { ValidationConfig } from "@/lib/content-validation";
import { getRuntimeEnvBoolean, getRuntimeEnvString } from "@/lib/env";
import { logger } from "@/lib/logger";
import { COUNT_TEN } from "@/constants";
import { COUNT_160 } from "@/constants/count";
import { LOCALES_CONFIG } from "@/config/paths/locales-config";

// Content directory paths
export const CONTENT_DIR = path.join(process.cwd(), "content");
export const POSTS_DIR = path.join(CONTENT_DIR, "posts");
export const PAGES_DIR = path.join(CONTENT_DIR, "pages");
export const PRODUCTS_DIR = path.join(CONTENT_DIR, "products");
export const CONFIG_DIR = path.join(CONTENT_DIR, "config");

// Allowed file extensions for security
export const ALLOWED_EXTENSIONS = [".md", ".mdx", ".json"];

/**
 * Determine if drafts should be enabled based on environment.
 *
 * Priority order:
 * 1. CONTENT_ENABLE_DRAFTS env var (explicit override)
 * 2. NODE_ENV === 'development' (default dev behavior)
 * 3. content.json enableDrafts setting (config file)
 *
 * In production builds, drafts are disabled by default unless explicitly enabled.
 */
function resolveDraftsEnabled(configValue?: boolean): boolean {
  const envOverride = getRuntimeEnvString("CONTENT_ENABLE_DRAFTS");
  if (envOverride !== undefined) {
    return getRuntimeEnvBoolean("CONTENT_ENABLE_DRAFTS") === true;
  }

  if (getRuntimeEnvString("NODE_ENV") === "development") {
    return true;
  }

  return configValue ?? false;
}

// Default content configuration
const DEFAULT_CONFIG: ContentConfig = {
  defaultLocale: LOCALES_CONFIG.defaultLocale,
  supportedLocales: [...LOCALES_CONFIG.locales],
  postsPerPage: COUNT_TEN,
  enableDrafts: resolveDraftsEnabled(),
  enableSearch: true,
  enableComments: false,
  autoGenerateExcerpt: true,
  excerptLength: COUNT_160,
  dateFormat: "YYYY-MM-DD",
  timeZone: "UTC",
};

/**
 * Merge content configuration using an explicit field whitelist.
 *
 * 这样可以确保：
 * - 只有 ContentConfig 中声明的字段会被覆盖；
 * - content.json 中多出来的键不会静默"注入"到运行时代码；
 * - Semgrep 不再看到宽泛的 "{ ...DEFAULT_CONFIG, ...config }" 合并模式。
 */
function mergeContentConfig(
  baseConfig: ContentConfig,
  override: Partial<ContentConfig>,
): ContentConfig {
  return {
    defaultLocale: override.defaultLocale ?? baseConfig.defaultLocale,
    supportedLocales: override.supportedLocales ?? baseConfig.supportedLocales,
    postsPerPage: override.postsPerPage ?? baseConfig.postsPerPage,
    enableDrafts: resolveDraftsEnabled(override.enableDrafts),
    enableSearch: override.enableSearch ?? baseConfig.enableSearch,
    autoGenerateExcerpt:
      override.autoGenerateExcerpt ?? baseConfig.autoGenerateExcerpt,
    excerptLength: override.excerptLength ?? baseConfig.excerptLength,
    dateFormat: override.dateFormat ?? baseConfig.dateFormat,
    timeZone: override.timeZone ?? baseConfig.timeZone,
    enableComments: override.enableComments ?? baseConfig.enableComments,
  };
}

/**
 * Validate and normalize file path to prevent directory traversal attacks
 * @param filePath - The file path to validate
 * @param allowedBaseDir - The base directory that file access is restricted to
 * @returns Validated and normalized absolute path
 * @throws ContentError if path is invalid or outside allowed directory
 */
export function validateFilePath(
  filePath: string,
  allowedBaseDir: string,
): string {
  if (!filePath || typeof filePath !== "string") {
    throw new ContentError(
      "Invalid file path: path must be a non-empty string",
      "INVALID_PATH",
    );
  }

  // Normalize the path to resolve any relative components
  const normalizedPath = path.normalize(filePath);

  // Check for directory traversal attempts
  if (normalizedPath.includes("..")) {
    throw new ContentError(
      "Invalid file path: directory traversal detected",
      "DIRECTORY_TRAVERSAL",
    );
  }

  // Convert to absolute path
  const absolutePath = path.isAbsolute(normalizedPath)
    ? normalizedPath
    : path.join(allowedBaseDir, normalizedPath);

  // Ensure the resolved path is within the allowed base directory
  const resolvedPath = path.resolve(absolutePath);
  const resolvedBaseDir = path.resolve(allowedBaseDir);

  const relative = path.relative(resolvedBaseDir, resolvedPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ContentError(
      `File path outside allowed directory: ${resolvedPath}`,
      "PATH_OUTSIDE_BASE",
    );
  }

  // Check if file extension is allowed
  const ext = path.extname(resolvedPath);
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ContentError(
      `File extension not allowed: ${ext}. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`,
      "INVALID_EXTENSION",
    );
  }

  return absolutePath;
}

/**
 * Get content configuration
 */
export function getContentConfig(): ContentConfig {
  try {
    const configPath = path.join(CONFIG_DIR, "content.json");
    // Validate config file path for security
    const validatedConfigPath = validateFilePath(configPath, CONTENT_DIR);

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedConfigPath is validated by validateFilePath (no path traversal)
    if (fs.existsSync(validatedConfigPath)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedConfigPath is validated by validateFilePath (no path traversal)
      const configContent = fs.readFileSync(validatedConfigPath, "utf-8");
      const config = JSON.parse(configContent) as Partial<ContentConfig>;

      // 通过显式字段白名单方式合并配置，防止在 ContentConfig 之外静默注入额外键
      const mergedConfig = mergeContentConfig(DEFAULT_CONFIG, config);

      return mergedConfig;
    }
  } catch (error) {
    logger.warn("Failed to load content config, using defaults", { error });
  }

  return DEFAULT_CONFIG;
}

/**
 * Check if drafts would be published in production build.
 * Logs warning during build if drafts are enabled in production mode.
 */
export function warnIfDraftsInProduction(): void {
  const config = getContentConfig();

  if (config.enableDrafts && getRuntimeEnvString("NODE_ENV") === "production") {
    logger.warn(
      "CONTENT_WARNING: Drafts are enabled in production build. " +
        "Draft content may be exposed to users. " +
        "Set CONTENT_ENABLE_DRAFTS=false or remove the env var to disable.",
    );
  }
}

/**
 * Check if content is a draft and whether it should be filtered.
 */
export function shouldFilterDraft(isDraft?: boolean): boolean {
  const config = getContentConfig();
  return isDraft === true && !config.enableDrafts;
}

function buildMergedValidationConfig(
  validation: Partial<ValidationConfig>,
): ValidationConfig {
  const merged: ValidationConfig = {
    strictMode: validation.strictMode ?? false,
    requireSlug: validation.requireSlug ?? true,
    requireLocale: validation.requireLocale ?? false,
    requireAuthor: validation.requireAuthor ?? false,
    requireDescription: validation.requireDescription ?? false,
    requireTags: validation.requireTags ?? false,
    requireCategories: validation.requireCategories ?? false,
  };

  if (validation.maxTitleLength !== undefined) {
    merged.maxTitleLength = validation.maxTitleLength;
  }
  if (validation.maxDescriptionLength !== undefined) {
    merged.maxDescriptionLength = validation.maxDescriptionLength;
  }
  if (validation.maxExcerptLength !== undefined) {
    merged.maxExcerptLength = validation.maxExcerptLength;
  }
  if (validation.products !== undefined) {
    merged.products = validation.products;
  }

  return merged;
}

/**
 * Get validation configuration from content.json.
 * Falls back to sensible defaults if config file is unavailable.
 */
export function getValidationConfig(): ValidationConfig {
  const fallback: ValidationConfig = {
    strictMode: false,
    requireSlug: true,
    requireLocale: false,
    requireAuthor: false,
    requireDescription: false,
    requireTags: false,
    requireCategories: false,
  };

  try {
    const configPath = path.join(CONFIG_DIR, "content.json");
    const validatedConfigPath = validateFilePath(configPath, CONTENT_DIR);

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedConfigPath is validated by validateFilePath (no path traversal)
    if (!fs.existsSync(validatedConfigPath)) return fallback;

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedConfigPath is validated by validateFilePath (no path traversal)
    const configContent = fs.readFileSync(validatedConfigPath, "utf-8");
    const config = JSON.parse(configContent) as Record<string, unknown>;
    const validation = config["validation"] as
      | Partial<ValidationConfig>
      | undefined;
    if (!validation) return fallback;

    return buildMergedValidationConfig(validation);
  } catch (error) {
    logger.warn("Failed to load validation config, using defaults", { error });
  }
  return fallback;
}
