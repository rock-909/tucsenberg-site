// Aggregated constants entrypoint. Avoid self-imports to prevent circular deps.

/**
 * 常量模块统一导出
 * 提供项目中所有常量的集中访问点
 *
 * 模块结构:
 * - ./validation-limits.ts - 验证限制和约束常量
 * - ./count.ts            - 基础计数和数值常量
 * - ./time.ts             - 时间相关常量
 * - ./hex.ts              - 十六进制常量
 * - ./decimal.ts          - 小数常量
 */

// ============================================================================
// 验证限制常量 (新增领域模块)
// ============================================================================
export {
  // Lead pipeline
  MAX_LEAD_EMAIL_LENGTH,
  MAX_LEAD_COMPANY_LENGTH,
  MAX_LEAD_NAME_LENGTH,
  MIN_LEAD_SUBJECT_LENGTH,
  MAX_LEAD_SUBJECT_LENGTH,
  MIN_LEAD_MESSAGE_LENGTH,
  MAX_LEAD_MESSAGE_LENGTH,
  MAX_LEAD_PRODUCT_NAME_LENGTH,
  MAX_LEAD_REQUIREMENTS_LENGTH,
  MAX_LEAD_COUNTRY_LENGTH,
  MAX_LEAD_PART_NUMBERS_LENGTH,
  MAX_LEAD_QUANTITY_LENGTH,
  MAX_LEAD_SHUTDOWN_LENGTH,
  MAX_LEAD_SOURCE_CONTEXT_LENGTH,
  AES_KEY_LENGTH_BITS,
  PBKDF2_ITERATIONS,
  SALT_BYTE_LENGTH,
  AES_IV_BYTE_LENGTH,
} from "./validation-limits";

// ============================================================================
// 时间相关常量
// ============================================================================
export {
  DAYS_PER_WEEK,
  HOURS_PER_DAY,
  MINUTES_PER_HOUR,
  SECONDS_PER_MINUTE,
  DAYS_PER_MONTH,
  DAYS_PER_YEAR,
  MONTHS_PER_YEAR,
  WEEKS_PER_MONTH,
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_HOUR,
  MILLISECONDS_PER_MINUTE,
  MILLISECONDS_PER_HOUR,
  HALF_SECOND_MS,
  TWO_HUNDRED_MS,
  FOUR_HUNDRED_MS,
  ONE_SECOND_MS,
  TWO_SECONDS_MS,
  THREE_SECONDS_MS,
  FIVE_SECONDS_MS,
  TEN_SECONDS_MS,
  THIRTY_SECONDS_MS,
  MINUTE_MS,
  FIVE_MINUTES_MS,
  TEN_MINUTES_MS,
} from "./time";

// ============================================================================
// 十六进制常量
// ============================================================================
export {
  HEX_BYTE_MAX,
  HEX_NIBBLE_MAX,
  HEX_MASK_6_BITS,
  HEX_MASK_BIT_6,
  HEX_MASK_HIGH_BIT,
  HEX_MASK_LOW_NIBBLE,
  HEX_PNG_SIGNATURE_1,
  HEX_PNG_SIGNATURE_2,
  HEX_PNG_SIGNATURE_3,
  HEX_PNG_SIGNATURE_4,
  HEX_PNG_SIGNATURE_5,
  HEX_PNG_SIGNATURE_6,
  HEX_JPEG_MARKER_1,
  HEX_JPEG_SOI,
  HEX_PDF_MARKER,
  HEX_PDF_SIGNATURE_1,
  HEX_ZIP_SIGNATURE,
  HEX_ZIP_LOCAL_HEADER_3,
  HEX_ZIP_LOCAL_HEADER_4,
  HEX_VALUE_3,
  HEX_VALUE_8,
} from "./hex";

// ============================================================================
// 计数与数值常量
// ============================================================================
export {
  // 基础计数
  COUNT_ZERO,
  COUNT_ONE,
  COUNT_TWO,
  COUNT_THREE,
  COUNT_4,
  COUNT_FIVE,
  COUNT_SIX,
  COUNT_SEVEN,
  COUNT_EIGHT,
  COUNT_NINE,
  COUNT_TEN,
  // 进制和编码
  HEX_RADIX,
  BASE36_RADIX,
  // 安全相关
  OTP_DEFAULT_LENGTH,
  VERIFY_CODE_DEFAULT_LENGTH,
  SHORT_ID_LENGTH,
  AES_GCM_IV_BYTES,
  TOKEN_DEFAULT_LENGTH,
  API_KEY_TOKEN_LENGTH,
  SESSION_TOKEN_LENGTH,
  // 验证相关
  PHONE_MAX_DIGITS,
  DEFAULT_ICON_SIZE,
  // 监控阈值
  UPTIME_UNHEALTHY_THRESHOLD,
  UPTIME_DEGRADED_THRESHOLD,
  // 文件大小
  MAX_FILENAME_LENGTH,
  // HTTP 相关
  HTTP_SERVER_ERROR_UPPER,
  // 时间相关
  RESPONSE_TIME_DEGRADED_MS,
  LCP_GOOD_THRESHOLD_MS,
  // 尺寸和数量
  COUNT_120,
  COUNT_160,
  COUNT_250,
  COUNT_700,
  COUNT_1600,
  COUNT_3600,
  COUNT_300000,
  // 大容量数值
  BYTES_PER_MB,
  MS_PER_HOUR,
} from "./count";

// ============================================================================
// 小数常量
// ============================================================================
export {
  DEC_0_001,
  DEC_0_01,
  DEC_0_02,
  DEC_0_05,
  DEC_0_08,
  DEC_0_1,
  DEC_0_15,
  DEC_0_2,
  DEC_0_25,
  DEC_0_3,
  DEC_0_4,
  DEC_0_5,
  DEC_0_6,
  DEC_0_65,
  DEC_0_7,
  DEC_0_75,
  DEC_0_8,
  DEC_0_9,
  DEC_0_94,
  DEC_0_95,
  DEC_0_96,
  DEC_0_99,
  DEC_1_1,
  DEC_1_5,
  PERCENTAGE_QUARTER,
  PERCENTAGE_HALF,
  PERCENTAGE_FULL,
  OFFSET_NEGATIVE_MEDIUM,
  OFFSET_NEGATIVE_LARGE,
  OFFSET_NEGATIVE_EXTRA_LARGE,
  OFFSET_NEGATIVE_MASSIVE,
} from "./decimal";

// ============================================================================
// 响应式断点常量
// ============================================================================
export {
  BREAKPOINT_SM,
  BREAKPOINT_MD,
  BREAKPOINT_LG,
  BREAKPOINT_XL,
  BREAKPOINT_2XL,
  BREAKPOINTS,
} from "./breakpoints";
export type { BreakpointKey } from "./breakpoints";

// ============================================================================
// Legacy compatibility facade.
// Prefer local literals or domain-named constants instead of generic ZERO/ONE
// in new production code.
// ============================================================================
export {
  ZERO,
  ONE,
  HTTP_OK,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_PAYLOAD_TOO_LARGE,
  HTTP_INTERNAL_ERROR,
  HTTP_SERVICE_UNAVAILABLE,
  BREAKPOINT_FULL_HD,
  ANIMATION_DURATION_NORMAL,
  ANIMATION_DURATION_SLOW,
  ANIMATION_DURATION_VERY_SLOW,
  BYTES_PER_KB,
  ANGLE_90_DEG,
  ANGLE_360_DEG,
} from "./core";

// ============================================================================
// 单位工具常量
// ============================================================================
export { SECOND_MS, HOUR_MS, KB, MB } from "./units";

// ============================================================================
// 国际化常量
// ============================================================================
export {
  TIME_UNITS,
  CACHE_DURATIONS,
  UI_TIMINGS,
  PERFORMANCE_THRESHOLDS,
  QUALITY_WEIGHTS,
  QUALITY_SCORING,
  QUALITY_CHECK_THRESHOLDS,
  VALIDATION_THRESHOLDS,
  DETECTION_CONFIDENCE,
  DETECTION_SCORING,
  CACHE_LIMITS,
  CLEANUP_CONFIG,
  MONITORING_CONFIG,
  REPORTING_THRESHOLDS,
  UI_RATIOS,
  PAGINATION_CONFIG,
} from "./i18n-constants";

// ============================================================================
// 应用程序常量
// ============================================================================
export {
  TIME_CONSTANTS,
  DELAY_CONSTANTS,
  CONTENT_LIMITS,
  PAGINATION_CONSTANTS,
  OPACITY_CONSTANTS,
  PERCENTAGE_CONSTANTS,
  PERFORMANCE_CONSTANTS,
  DEBUG_CONSTANTS,
} from "./app-constants";
export type {
  AppConstants,
  TimeConstants,
  DelayConstants,
  ContentLimits,
  PaginationConstants,
  OpacityConstants,
  PercentageConstants,
  PerformanceConstants,
  DebugConstants,
} from "./app-constants";

// ============================================================================
// 安全相关常量
// ============================================================================
export {
  ENCRYPTION_CONSTANTS,
  ACCESS_CONTROL_CONSTANTS,
  SESSION_CONSTANTS,
  RATE_LIMIT_CONSTANTS,
  FILE_SECURITY_CONSTANTS,
  INPUT_VALIDATION_CONSTANTS,
  CSP_CONSTANTS,
  SECURITY_HEADERS_CONSTANTS,
} from "./security-constants";
export type {
  SecurityConstants,
  EncryptionConstants,
  AccessControlConstants,
  SessionConstants,
  RateLimitConstants,
  FileSecurityConstants,
  InputValidationConstants,
  CspConstants,
  SecurityHeadersConstants,
} from "./security-constants";

// ============================================================================
// SEO相关常量
// ============================================================================
export {
  SEO_PRIORITY_CONSTANTS,
  SITEMAP_CHANGEFREQ_CONSTANTS,
  URL_GENERATION_CONSTANTS,
} from "./seo-constants";
export type {
  SeoConstants,
  SeoPriorityConstants,
  SitemapChangefreqConstants,
  UrlGenerationConstants,
} from "./seo-constants";

// ============================================================================
// 重新导出主要常量对象
// ============================================================================
export { APP_CONSTANTS } from "./app-constants";
export { SECURITY_CONSTANTS } from "./security-constants";
export { SEO_CONSTANTS } from "./seo-constants";
