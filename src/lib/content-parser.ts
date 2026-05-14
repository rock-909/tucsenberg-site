/**
 * Content Management System - Parser Functions
 *
 * This module provides functions for parsing MDX files with frontmatter
 * and retrieving content files from directories.
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml, { type LoadOptions } from "js-yaml";
import { isRuntimeCloudflare, isRuntimeProduction } from "@/lib/env";
import {
  getAllContentEntries,
  getContentEntry,
  getContentEntriesByType,
  type ContentEntry,
} from "@/lib/content-manifest";
import {
  ContentError,
  ContentValidationError,
  type ContentMetadata,
  type ContentType,
  type Locale,
  type ParsedContent,
} from "@/types/content.types";
import {
  CONTENT_DIR,
  PAGES_DIR,
  getValidationConfig,
  POSTS_DIR,
  PRODUCTS_DIR,
  shouldFilterDraft,
  validateFilePath,
} from "@/lib/content-utils";
import {
  validateContentMetadata,
  type ValidationConfig,
} from "@/lib/content-validation";
import { logger } from "@/lib/logger";
import { CONTENT_LIMITS } from "@/constants/app-constants";

type YamlWithSafeLoad = typeof yaml & {
  safeLoad?: (str: string, opts?: LoadOptions) => unknown;
};

const yamlWithSafeLoad: YamlWithSafeLoad = yaml as YamlWithSafeLoad;
// js-yaml v4 移除了 safeLoad，但 gray-matter 等旧依赖仍可能调用该 API。
// 这里统一将 safeLoad 映射到 load，避免在解析 frontmatter 时抛出兼容性错误。
if (!yamlWithSafeLoad.safeLoad) {
  yamlWithSafeLoad.safeLoad = (str: string, opts?: LoadOptions) =>
    yamlWithSafeLoad.load(str, opts);
}

function inferContentTypeFromDir(contentDir: string): ContentType {
  const resolved = path.resolve(contentDir);

  if (resolved === path.resolve(POSTS_DIR)) return "posts";
  if (resolved === path.resolve(PAGES_DIR)) return "pages";
  if (resolved === path.resolve(PRODUCTS_DIR)) return "products";

  return "pages";
}

function findManifestEntry(
  filePath: string,
  type: ContentType,
): ContentEntry | undefined {
  const normalized = path.normalize(filePath);
  const slug = path.basename(normalized, path.extname(normalized));
  const locale = path.basename(path.dirname(normalized));
  if (locale) {
    const entry = getContentEntry(type, locale as Locale, slug);
    if (entry) return entry;
  }
  return getAllContentEntries().find(
    (entry) => entry.filePath === filePath || entry.relativePath === filePath,
  );
}

function parseManifestEntry<T extends ContentMetadata>(
  entry: ContentEntry,
): ParsedContent<T> {
  return {
    slug: entry.slug,
    metadata: entry.metadata as T,
    content: entry.content,
    filePath: entry.filePath,
  };
}

/**
 * Parser options for content file parsing
 */
export interface ParseContentOptions {
  strictMode?: boolean;
  validationConfig?: ValidationConfig;
}

/**
 * Get validation config with production strictMode override.
 * Reads from content.json, then applies production strictMode if in production.
 */
function getProductionValidationConfig(): ValidationConfig {
  const config = getValidationConfig();
  const isProduction = isRuntimeProduction();

  const merged: ValidationConfig = {
    strictMode: isProduction || (config.strictMode ?? false),
    requireSlug: config.requireSlug ?? true,
    requireLocale: config.requireLocale ?? false,
    requireAuthor: config.requireAuthor ?? false,
    requireDescription: config.requireDescription ?? false,
    requireTags: config.requireTags ?? false,
    requireCategories: config.requireCategories ?? false,
  };

  if (config.maxTitleLength !== undefined)
    merged.maxTitleLength = config.maxTitleLength;
  if (config.maxDescriptionLength !== undefined)
    merged.maxDescriptionLength = config.maxDescriptionLength;
  if (config.maxExcerptLength !== undefined)
    merged.maxExcerptLength = config.maxExcerptLength;
  if (config.products !== undefined) merged.products = config.products;

  return merged;
}

/**
 * Parse MDX file with frontmatter
 */
export function parseContentFile<T extends ContentMetadata = ContentMetadata>(
  filePath: string,
  type: ContentType,
  options: ParseContentOptions = {},
): Promise<ParsedContent<T>> {
  if (isRuntimeCloudflare()) {
    return Promise.resolve().then(() =>
      parseManifestContentFile<T>(filePath, type),
    );
  }
  return parseFileSystemContentFile<T>(filePath, type, options);
}

function parseManifestContentFile<T extends ContentMetadata>(
  filePath: string,
  type: ContentType,
): ParsedContent<T> {
  const entry = findManifestEntry(filePath, type);
  if (entry === undefined || entry.type !== type) {
    throw new ContentError(
      `Content file not found: ${filePath}`,
      "FILE_NOT_FOUND",
    );
  }
  return parseManifestEntry<T>(entry);
}

async function parseFileSystemContentFile<T extends ContentMetadata>(
  filePath: string,
  type: ContentType,
  options: ParseContentOptions,
): Promise<ParsedContent<T>> {
  try {
    const validatedPath = validateFilePath(filePath, CONTENT_DIR);
    const fileContent = await readValidatedContentFile(validatedPath, filePath);
    const { frontmatter, content } = parseMdxSource(fileContent);
    const validationConfig =
      options.validationConfig ?? getProductionValidationConfig();
    const validation = validateContentMetadata(
      frontmatter,
      type,
      validationConfig,
    );
    logValidationResult(filePath, validation, options.strictMode);

    if (options.strictMode && !validation.isValid) {
      throw new ContentValidationError(
        `Content validation failed for ${filePath}`,
        validation.errors,
        filePath,
      );
    }

    const slug =
      (frontmatter["slug"] as string) ??
      path.basename(filePath, path.extname(filePath));

    return {
      slug,
      metadata: frontmatter as T,
      content,
      filePath: validatedPath,
    };
  } catch (error) {
    if (
      error instanceof ContentError ||
      error instanceof ContentValidationError
    ) {
      throw error;
    }
    throw new ContentError(
      `Failed to parse content file: ${filePath}. ${error instanceof Error ? error.message : "Unknown error"}`,
      "PARSE_ERROR",
    );
  }
}

async function readValidatedContentFile(
  validatedPath: string,
  originalPath: string,
): Promise<string> {
  const fileExists = await fs.promises
    .access(validatedPath)
    .then(() => true)
    .catch(() => false);
  if (!fileExists) {
    throw new ContentError(
      `Content file not found: ${originalPath}`,
      "FILE_NOT_FOUND",
    );
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedPath已通过validateFilePath安全验证，防止路径遍历攻击
  const fileContent = await fs.promises.readFile(validatedPath, "utf-8");

  if (fileContent.length > CONTENT_LIMITS.MAX_FILE_SIZE) {
    throw new ContentError(
      `Content file too large: ${fileContent.length} bytes (max: ${CONTENT_LIMITS.MAX_FILE_SIZE})`,
      "FILE_TOO_LARGE",
    );
  }

  return fileContent;
}

function parseMdxSource(fileContent: string): {
  frontmatter: Record<string, unknown>;
  content: string;
} {
  const { data: frontmatter, content } = matter(fileContent, {
    engines: {
      yaml: (source: string) => yaml.load(source) as Record<string, unknown>,
    },
  });

  return { frontmatter, content };
}

/**
 * Log validation results with appropriate severity
 */
function logValidationResult(
  filePath: string,
  validation: { isValid: boolean; errors: string[]; warnings: string[] },
  strictMode?: boolean,
): void {
  if (!validation.isValid) {
    const logMethod = strictMode ? logger.error : logger.warn;
    logMethod("Content validation failed", {
      file: filePath,
      errors: validation.errors,
      warnings: validation.warnings,
    });
  } else if (validation.warnings.length > 0) {
    logger.info("Content validation warnings", {
      file: filePath,
      warnings: validation.warnings,
    });
  }
}

/**
 * Parse content file with draft filtering
 */
export async function parseContentFileWithDraftFilter<
  T extends ContentMetadata = ContentMetadata,
>(
  filePath: string,
  type: ContentType,
  options: ParseContentOptions = {},
): Promise<ParsedContent<T> | null> {
  const parsed = await parseContentFile<T>(filePath, type, options);

  // Filter out drafts based on configuration
  if (shouldFilterDraft(parsed.metadata.draft)) {
    logger.info("Filtering draft content", {
      file: filePath,
      slug: parsed.slug,
    });
    return null;
  }

  return parsed;
}

/**
 * Get all content files in a directory
 */
export async function getContentFiles(
  contentDir: string,
  locale?: Locale,
): Promise<string[]> {
  if (isRuntimeCloudflare()) {
    const type = inferContentTypeFromDir(contentDir);
    return getContentEntriesByType(type, locale).map((entry) => entry.filePath);
  }

  // When a locale is provided, read from the locale-specific subdirectory
  // (e.g. content/pages/en, content/posts/zh). This matches the actual
  // content layout under the content/ directory.
  const baseDir = locale ? path.join(contentDir, locale) : contentDir;

  // Validate the base content directory to guard against path traversal.
  const validatedContentDir = validateFilePath(baseDir, CONTENT_DIR);

  const dirExists = await fs.promises
    .access(validatedContentDir)
    .then(() => true)
    .catch(() => false);
  if (!dirExists) {
    logger.warn("Content directory does not exist", {
      dir: validatedContentDir,
    });
    return [];
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- validatedContentDir已通过validateFilePath安全验证，防止路径遍历攻击
  const files = await fs.promises.readdir(validatedContentDir);
  return files.flatMap((file) => {
    const ext = path.extname(file);
    const isValidExtension = [".md", ".mdx"].includes(ext);
    if (!isValidExtension) {
      return [];
    }

    // For locale-specific subdirectories, most files will not contain the
    // locale in the filename (e.g. about.mdx under /en). We still keep the
    // original safeguard that allows files with an explicit ".<locale>."
    // suffix and files without any locale suffix.
    if (!locale) {
      return [path.join(validatedContentDir, file)];
    }

    const normalized = file.toLowerCase();
    const hasExplicitLocale = normalized.includes(`.${locale.toLowerCase()}.`);
    const hasNoLocaleSuffix =
      !normalized.includes(".en.") && !normalized.includes(".zh.");
    return hasExplicitLocale || hasNoLocaleSuffix
      ? [path.join(validatedContentDir, file)]
      : [];
  });
}
