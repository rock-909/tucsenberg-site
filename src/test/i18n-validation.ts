/**
 * 企业级国际化验证工具
 * 提供翻译完整性检查、质量验证和同步机制
 */
import { PERCENTAGE_FULL, ZERO } from "@/constants";
import { routing } from "@/i18n/routing";

// 测试环境检测
const isTestEnvironment =
  typeof process !== "undefined" && process.env.NODE_ENV === "test";

type KnownLocale = "en" | "zh";
type TranslationsMap = Partial<Record<KnownLocale, Record<string, unknown>>>;

function isKnownLocale(l: string): l is KnownLocale {
  return l === "en" || l === "zh";
}

function getByLocale(
  translations: TranslationsMap,
  locale: string,
): Record<string, unknown> | undefined {
  if (locale === "en") return translations.en;
  if (locale === "zh") return translations.zh;
  return undefined;
}

export interface TranslationValidationResult {
  isValid: boolean;
  errors: TranslationError[];
  warnings: TranslationWarning[];
  coverage: number;
  missingKeys: string[];
  inconsistentKeys: string[];
}

interface TranslationError {
  type: "missing_key" | "type_mismatch" | "invalid_format" | "empty_value";
  key: string;
  locale: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
}

interface TranslationWarning {
  type:
    | "untranslated"
    | "length_mismatch"
    | "format_inconsistency"
    | "placeholder_mismatch";
  key: string;
  locale: string;
  message: string;
  suggestion?: string;
}

function processMockTranslation(params: {
  locale: string;
  getMockTranslation: (locale: string) => unknown;
  translations: Record<string, Record<string, unknown>>;
  errors: TranslationError[];
}): void {
  const { locale, getMockTranslation, translations, errors } = params;
  const mockData = getMockTranslation(locale);

  if (!mockData) {
    errors.push({
      type: "missing_key",
      key: "translation_file",
      locale,
      message: `Translation file for locale ${locale} not found`,
      severity: "critical",
    });
    return;
  }

  if (!isKnownLocale(locale)) {
    return;
  }

  // 验证Mock数据格式
  if (typeof mockData === "string") {
    errors.push({
      type: "invalid_format",
      key: "translation_file",
      locale,
      message: `Translation file for locale ${locale} contains malformed data: expected object, got string`,
      severity: "critical",
    });
    return;
  }

  if (locale === "en") {
    translations.en = mockData as Record<string, unknown>;
  } else if (locale === "zh") {
    translations.zh = mockData as Record<string, unknown>;
  }
}

/**
 * 加载所有语言的翻译文件
 */
async function loadTranslations(
  errors: TranslationError[],
): Promise<TranslationsMap> {
  const translations: TranslationsMap = {};

  // 在测试环境中使用Mock数据
  if (isTestEnvironment) {
    try {
      // 动态导入Mock翻译数据
      const { getMockTranslation } =
        await import("@/lib/__tests__/mocks/translations");

      for (const locale of routing.locales) {
        processMockTranslation({
          locale,
          getMockTranslation,
          translations,
          errors,
        });
      }
    } catch {
      // 如果Mock导入失败，回退到原始逻辑
      return loadProductionTranslations(errors);
    }
  } else {
    return loadProductionTranslations(errors);
  }

  return translations;
}

/**
 * 生产环境翻译文件加载
 */
async function loadProductionTranslations(
  errors: TranslationError[],
): Promise<TranslationsMap> {
  const translations: TranslationsMap = {};

  for (const locale of routing.locales) {
    try {
      const messages = await import(`../../messages/${locale}.json`);
      if (!isKnownLocale(locale)) continue;
      if (locale === "en") translations.en = messages.default;
      else translations.zh = messages.default;
    } catch {
      errors.push({
        type: "missing_key",
        key: "translation_file",
        locale,
        message: `Translation file for locale ${locale} not found`,
        severity: "critical",
      });
    }
  }

  return translations;
}

/**
 * 计算翻译覆盖率
 */
function calculateCoverage(
  allKeys: Set<string>,
  missingKeys: string[],
): number {
  const totalKeys = allKeys.size * routing.locales.length;
  const missingCount = missingKeys.length;

  if (allKeys.size === ZERO) {
    return PERCENTAGE_FULL;
  }

  if (totalKeys > ZERO) {
    return ((totalKeys - missingCount) / totalKeys) * PERCENTAGE_FULL;
  }

  return PERCENTAGE_FULL;
}

/**
 * 验证空翻译文件
 */
function validateEmptyTranslations(
  allKeys: Set<string>,
  translations: Record<string, unknown>,
  errors: TranslationError[],
): void {
  if (allKeys.size === ZERO && Object.keys(translations).length > ZERO) {
    const allEmpty = Object.values(translations).every(
      (trans) => trans && Object.keys(trans).length === ZERO,
    );

    if (allEmpty) {
      const hasEmptyFileError = errors.some((e) =>
        e.message.includes("All translation files are empty"),
      );

      if (!hasEmptyFileError) {
        errors.push({
          type: "empty_value",
          key: "all_translations",
          locale: "all",
          message: "All translation files are empty",
          severity: "critical",
        });
      }
    }
  }
}

/**
 * 验证翻译文件的完整性和质量
 */
export async function validateTranslations(): Promise<TranslationValidationResult> {
  const errors: TranslationError[] = [];
  const warnings: TranslationWarning[] = [];
  const missingKeys: string[] = [];
  const inconsistentKeys: string[] = [];

  try {
    const translations = await loadTranslations(errors);

    // 获取所有翻译键
    const allKeys = new Set<string>();
    Object.values(translations).forEach((translation) => {
      extractKeys(translation).forEach((key) => allKeys.add(key));
    });

    // 验证每个语言的翻译完整性
    validateTranslationCompleteness({
      translations,
      allKeys,
      errors,
      warnings,
      missingKeys,
    });

    // 计算覆盖率
    const coverage = calculateCoverage(allKeys, missingKeys);

    // 验证空翻译文件
    validateEmptyTranslations(allKeys, translations, errors);

    // 判断有效性
    const criticalErrors = errors.filter(
      (e) => e.severity === "critical" || e.severity === "high",
    );
    const isValid = criticalErrors.length === ZERO;

    return {
      isValid,
      errors,
      warnings,
      coverage,
      missingKeys,
      inconsistentKeys,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          type: "invalid_format",
          key: "validation",
          locale: "all",
          message: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          severity: "critical",
        },
      ],
      warnings: [],
      coverage: ZERO,
      missingKeys: [],
      inconsistentKeys: [],
    };
  }
}

/**
 * 提取对象中的所有键路径
 */
function extractKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...extractKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * 获取嵌套对象的值
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = obj;
  // 更宽松的安全检查，支持更多特殊字符和Unicode
  // 包括：字母、数字、下划线、连字符、中文、日文、韩文、拉丁扩展字符等
  const safe =
    /^[a-z0-9_\-\u00a0-\u024f\u1e00-\u1eff\u2000-\u206f\u2070-\u209f\u20a0-\u20cf\u2100-\u214f\u2190-\u21ff\u2200-\u22ff\u2300-\u23ff\u2460-\u24ff\u2500-\u257f\u2580-\u259f\u25a0-\u25ff\u2600-\u26ff\u2700-\u27bf\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u3100-\u312f\u3130-\u318f\u3190-\u319f\u31a0-\u31bf\u31c0-\u31ef\u31f0-\u31ff\u3200-\u32ff\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\ua000-\ua48f\ua490-\ua4cf\uac00-\ud7af\uf900-\ufaff\ufe30-\ufe4f\ufe50-\ufe6f\uff00-\uffef]+$/i;
  for (const seg of segments) {
    if (!safe.test(seg)) return undefined;
    if (
      current &&
      typeof current === "object" &&
      current !== null &&
      !Array.isArray(current)
    ) {
      // nosemgrep: object-injection-sink-reflect-api -- 路径段已通过严格字符集校验
      current = Reflect.get(current as Record<string, unknown>, seg);
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * 验证翻译完整性
 */
function validateTranslationCompleteness(params: {
  translations: TranslationsMap;
  allKeys: Set<string>;
  errors: TranslationError[];
  warnings: TranslationWarning[];
  missingKeys: string[];
}): void {
  const { translations, allKeys, errors, warnings, missingKeys } = params;
  for (const locale of routing.locales) {
    const translation = getByLocale(translations, locale);
    if (!translation) continue;

    const localeKeys = new Set(extractKeys(translation));

    // 检查缺失的键
    for (const key of allKeys) {
      if (!localeKeys.has(key)) {
        missingKeys.push(`${locale}.${key}`);
        errors.push({
          type: "missing_key",
          key,
          locale,
          message: `Missing translation for key: ${key}`,
          severity: "high",
        });
      }
    }

    // 检查翻译质量
    validateTranslationQuality({
      translation,
      locale,
      localeKeys,
      translations,
      errors,
      warnings,
    });
  }
}

/**
 * 验证翻译质量
 */
function validateTranslationQuality(params: {
  translation: Record<string, unknown>;
  locale: string;
  localeKeys: Set<string>;
  translations: TranslationsMap;
  errors: TranslationError[];
  warnings: TranslationWarning[];
}): void {
  const { translation, locale, localeKeys, translations, errors, warnings } =
    params;
  for (const key of localeKeys) {
    const value = getNestedValue(translation, key);

    // 检查空值
    if (!value || (typeof value === "string" && value.trim() === "")) {
      errors.push({
        type: "empty_value",
        key,
        locale,
        message: `Empty translation value for key: ${key}`,
        severity: "medium",
      });
    }

    // 检查是否未翻译（与其他语言相同）
    if (typeof value === "string") {
      checkUntranslatedContent({ value, key, locale, translations, warnings });
      checkPlaceholderConsistency({
        value,
        key,
        locale,
        translations,
        warnings,
      });
    }
  }
}

/**
 * 检查未翻译内容
 */
function checkUntranslatedContent(params: {
  value: string;
  key: string;
  locale: string;
  translations: TranslationsMap;
  warnings: TranslationWarning[];
}): void {
  const { value, key, locale, translations, warnings } = params;
  const otherLocales = routing.locales.filter((l) => l !== locale);
  for (const otherLocale of otherLocales) {
    const otherTrans = getByLocale(translations, otherLocale) || {};
    const otherValue = getNestedValue(otherTrans, key);
    if (value === otherValue && key !== "home.title") {
      warnings.push({
        type: "untranslated",
        key,
        locale,
        message: `Possibly untranslated: same value as ${otherLocale}`,
        suggestion: `Consider translating "${value}" to ${locale}`,
      });
    }
  }
}

/**
 * 检查占位符一致性
 */
function checkPlaceholderConsistency(params: {
  value: string;
  key: string;
  locale: string;
  translations: TranslationsMap;
  warnings: TranslationWarning[];
}): void {
  const { value, key, locale, translations, warnings } = params;
  const placeholders = value.match(/\{[^}]+\}/g) || [];
  const refLocale: KnownLocale = routing.locales.includes("en") ? "en" : "zh";
  const refTrans = getByLocale(translations, refLocale) || {};
  const referencePlaceholders = getNestedValue(refTrans, key);
  if (typeof referencePlaceholders === "string") {
    const refPlaceholders = referencePlaceholders.match(/\{[^}]+\}/g) || [];

    // 检查占位符数量
    if (placeholders.length !== refPlaceholders.length) {
      warnings.push({
        type: "placeholder_mismatch",
        key,
        locale,
        message: `Placeholder count mismatch: expected ${refPlaceholders.length}, got ${placeholders.length}`,
        suggestion: `Ensure all placeholders are present: ${refPlaceholders.join(", ")}`,
      });
    }

    // 检查占位符名称一致性
    const refPlaceholderSet = new Set(refPlaceholders);
    const currentPlaceholderSet = new Set(placeholders);
    const missingPlaceholders = refPlaceholders.filter(
      (p) => !currentPlaceholderSet.has(p),
    );
    const extraPlaceholders = placeholders.filter(
      (p) => !refPlaceholderSet.has(p),
    );

    if (missingPlaceholders.length > 0 || extraPlaceholders.length > 0) {
      warnings.push({
        type: "placeholder_mismatch",
        key,
        locale,
        message: `Placeholder name mismatch: missing ${missingPlaceholders.join(", ")}, extra ${extraPlaceholders.join(", ")}`,
        suggestion: `Use exact placeholders: ${refPlaceholders.join(", ")}`,
      });
    }
  }
}
