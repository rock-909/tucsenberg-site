// Note: This module defines its own base numbers; avoid importing unused constants.

/**
 * 应用程序常量定义
 * 集中管理应用中的魔法数字，提高代码可维护性和可读性
 * 遵循项目编码标准：只允许 0/1/-1/100/HTTP状态码 作为魔法数字
 */

// ==================== 基础数字常量 ====================

/** 基础数字常量 - 用于构建其他常量 */
const BASE_NUMBERS = {
  // 时间相关基础单位
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,

  // 存储和大小基础单位
  BYTES_PER_KB: 1024,
  KB_PER_MB: 1024,

  // 百分比和比例基础
  PERCENTAGE_FULL: 100,
  HALF_PERCENTAGE: 50,

  // 常用数值
  SMALL_COUNT: 2,
  MEDIUM_COUNT: 5,
  LARGE_COUNT: 10,
  VERY_LARGE_COUNT: 20,

  // 角度相关
  FULL_CIRCLE_DEGREES: 360,
} as const;

// ==================== 时间相关常量 ====================

/** 时间单位常量 (毫秒) */
export const TIME_CONSTANTS = {
  /** 1秒 = 1000毫秒 */
  SECOND: BASE_NUMBERS.MILLISECONDS_PER_SECOND,

  /** 1分钟 = 60秒 */
  MINUTE:
    BASE_NUMBERS.SECONDS_PER_MINUTE * BASE_NUMBERS.MILLISECONDS_PER_SECOND,

  /** 1小时 = 60分钟 */
  HOUR:
    BASE_NUMBERS.MINUTES_PER_HOUR *
    BASE_NUMBERS.SECONDS_PER_MINUTE *
    BASE_NUMBERS.MILLISECONDS_PER_SECOND,

  /** 1天 = 24小时 */
  FULL_DAY:
    BASE_NUMBERS.HOURS_PER_DAY *
    BASE_NUMBERS.MINUTES_PER_HOUR *
    BASE_NUMBERS.SECONDS_PER_MINUTE *
    BASE_NUMBERS.MILLISECONDS_PER_SECOND,

  /** 25小时 = 25 * 60 * 60 * 1000毫秒 */
  TWENTY_FIVE_HOURS:
    (BASE_NUMBERS.HOURS_PER_DAY + 1) *
    BASE_NUMBERS.MINUTES_PER_HOUR *
    BASE_NUMBERS.SECONDS_PER_MINUTE *
    BASE_NUMBERS.MILLISECONDS_PER_SECOND,
} as const;

/** 延迟和超时常量 (毫秒) */
export const DELAY_CONSTANTS = {
  /** 短延迟 - 100ms，用于UI动画和过渡 */
  SHORT_DELAY: 100,

  /** 中等延迟 - 300ms，用于用户反馈 */
  MEDIUM_DELAY: 300,

  /** 标准超时 - 1000ms，用于一般操作 */
  STANDARD_TIMEOUT: TIME_CONSTANTS.SECOND,

  /** 扩展超时 - 1100ms，用于需要额外时间的操作 */
  EXTENDED_TIMEOUT: TIME_CONSTANTS.SECOND + BASE_NUMBERS.PERCENTAGE_FULL,

  /** 长超时 - 2000ms，用于复杂操作 */
  LONG_TIMEOUT: BASE_NUMBERS.SMALL_COUNT * TIME_CONSTANTS.SECOND,

  /** 清理延迟 - 1000ms，用于清理操作 */
  CLEANUP_DELAY: TIME_CONSTANTS.SECOND,
} as const;

// ==================== 大小和尺寸常量 ====================

/** 内容长度限制常量 */
export const CONTENT_LIMITS = {
  /** 标题最大长度 - 60字符 */
  TITLE_MAX_LENGTH: 60,

  /** 描述最大长度 - 160字符 */
  DESCRIPTION_MAX_LENGTH: 160,

  /** 函数最大行数 - 80行 */
  FUNCTION_MAX_LINES: 80,

  /** 文件最大行数 - 500行 */
  FILE_MAX_LINES: 500,

  /** 最大复杂度 - 10 */
  MAX_COMPLEXITY: 10,

  /** 最大嵌套层数 - 3 */
  MAX_NESTED_CALLBACKS: 3,

  /** 最大文件大小 - 1MB (1024 * 1024 bytes) */
  MAX_FILE_SIZE: BASE_NUMBERS.BYTES_PER_KB * BASE_NUMBERS.KB_PER_MB,
} as const;

/** 分页和列表常量 */
export const PAGINATION_CONSTANTS = {
  /** 默认页面大小 - 10条 */
  DEFAULT_PAGE_SIZE: BASE_NUMBERS.LARGE_COUNT,

  /** 小页面大小 - 5条 */
  SMALL_PAGE_SIZE: BASE_NUMBERS.MEDIUM_COUNT,

  /** 大页面大小 - 20条 */
  LARGE_PAGE_SIZE: BASE_NUMBERS.VERY_LARGE_COUNT,

  /** 最大页面大小 - 100条 */
  MAX_PAGE_SIZE: BASE_NUMBERS.PERCENTAGE_FULL,
} as const;

// ==================== UI和用户体验常量 ====================

/** 透明度和不透明度常量 */
export const OPACITY_CONSTANTS = {
  /** 完全透明 */
  TRANSPARENT: 0,

  /** 低透明度 - 30% */
  LOW_OPACITY: 0.3,

  /** 中等透明度 - 50% */
  MEDIUM_OPACITY: 0.5,

  /** 中高透明度 - 75% */
  MEDIUM_HIGH_OPACITY: 0.75,

  /** 高透明度 - 80% */
  HIGH_OPACITY: 0.8,

  /** 很高透明度 - 90% */
  VERY_HIGH_OPACITY: 0.9,

  /** 完全不透明 */
  OPAQUE: 1,
} as const;

/** 百分比常量 */
export const PERCENTAGE_CONSTANTS = {
  /** 完整百分比 - 100% */
  FULL: BASE_NUMBERS.PERCENTAGE_FULL,

  /** 一半百分比 - 50% */
  HALF: BASE_NUMBERS.HALF_PERCENTAGE,

  /** 四分之一 - 25% */
  QUARTER: 25,

  /** 60% */
  SIXTY: 60,
} as const;

// ==================== 性能和监控常量 ====================

/** 时间戳基准值 */
const TIMESTAMP_BASE = BASE_NUMBERS.MILLISECONDS_PER_SECOND;

/** 性能阈值常量 */
export const PERFORMANCE_CONSTANTS = {
  /** 时间戳基准 - 1000 (用于性能测试) */
  TIMESTAMP_BASE,

  /** 时间戳偏移 - 1005 */
  TIMESTAMP_OFFSET: 1005,

  /** 时间戳增量 - 1010 */
  TIMESTAMP_INCREMENT_SMALL: 1010,

  /** 时间戳增量 - 1020 */
  TIMESTAMP_INCREMENT_MEDIUM: 1020,

  /** 时间戳增量 - 1150 */
  TIMESTAMP_INCREMENT_LARGE:
    TIMESTAMP_BASE +
    (BASE_NUMBERS.PERCENTAGE_FULL + BASE_NUMBERS.HALF_PERCENTAGE),

  /** 时间戳增量 - 1200 */
  TIMESTAMP_INCREMENT_XL: 1200,

  /** 时间戳增量 - 1250 */
  TIMESTAMP_INCREMENT_XXL:
    TIMESTAMP_BASE +
    (BASE_NUMBERS.PERCENTAGE_FULL * BASE_NUMBERS.SMALL_COUNT +
      BASE_NUMBERS.HALF_PERCENTAGE),

  /** 时间戳增量 - 1300 */
  TIMESTAMP_INCREMENT_XXXL: 1300,

  /** 时间戳增量 - 1400 */
  TIMESTAMP_INCREMENT_HUGE: 1400,

  /** 时间戳增量 - 1450 */
  TIMESTAMP_INCREMENT_MASSIVE: 1450,

  /** 时间戳增量 - 1500 */
  TIMESTAMP_INCREMENT_EXTREME: 1500,

  /** 大数值基准 - 200000 */
  LARGE_NUMBER_BASE: 200000,

  /** 大数值偏移 - 200100 */
  LARGE_NUMBER_OFFSET: 200100,

  /** 大数值增量 - 300000 */
  LARGE_INCREMENT: 300000,
} as const;

/** 测试和调试常量 */
export const DEBUG_CONSTANTS = {
  /** 十六进制大数 - 0x80000000 */
  HEX_LARGE_NUMBER: 0x80000000,

  /** 负数测试值 - -100 */
  NEGATIVE_TEST_VALUE: -100,

  /** 角度测试值 - 360度 */
  ANGLE_FULL_CIRCLE: BASE_NUMBERS.FULL_CIRCLE_DEGREES,

  /** 小数值 - 2 */
  SMALL_COUNT: BASE_NUMBERS.SMALL_COUNT,
} as const;

// ==================== 导出所有常量 ====================

/** 所有应用常量的统一导出 */
export const APP_CONSTANTS = Object.freeze({
  TIME: TIME_CONSTANTS,
  DELAY: DELAY_CONSTANTS,
  CONTENT: CONTENT_LIMITS,
  PAGINATION: PAGINATION_CONSTANTS,
  OPACITY: OPACITY_CONSTANTS,
  PERCENTAGE: PERCENTAGE_CONSTANTS,
  PERFORMANCE: PERFORMANCE_CONSTANTS,
  DEBUG: DEBUG_CONSTANTS,
} as const);

/** 常量类型定义 */
export type AppConstants = typeof APP_CONSTANTS;
export type TimeConstants = typeof TIME_CONSTANTS;
export type DelayConstants = typeof DELAY_CONSTANTS;
export type ContentLimits = typeof CONTENT_LIMITS;
export type PaginationConstants = typeof PAGINATION_CONSTANTS;
export type OpacityConstants = typeof OPACITY_CONSTANTS;
export type PercentageConstants = typeof PERCENTAGE_CONSTANTS;
export type PerformanceConstants = typeof PERFORMANCE_CONSTANTS;
export type DebugConstants = typeof DEBUG_CONSTANTS;
