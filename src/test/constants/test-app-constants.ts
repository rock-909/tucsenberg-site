/**
 * 应用测试常量定义
 * 包含应用特定的测试常量，避免魔法数字
 */

// 直接定义基础数字常量，避免循环导入
const TEST_BASE_NUMBERS = {
  // 时间相关
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  TWENTY_FIVE_HOURS: 25,

  // 计数相关
  SMALL_COUNT: 2,
  MEDIUM_COUNT: 5,
  LARGE_COUNT: 10,
  VERY_LARGE_COUNT: 20,
  HUGE_COUNT: 25,

  // 百分比
  PERCENTAGE_FULL: 100,
  HALF_PERCENTAGE: 50,

  // 角度
  FULL_CIRCLE_DEGREES: 360,
} as const;

// ==================== 时间计算常量 ====================

/** 时间计算相关常量 */
export const TEST_TIME_CALCULATIONS = {
  /** 毫秒基数 - 1000 */
  MILLISECOND_BASE: TEST_BASE_NUMBERS.MILLISECONDS_PER_SECOND,

  /** 时间单位 - 60 */
  TIME_UNIT: TEST_BASE_NUMBERS.SECONDS_PER_MINUTE,

  /** 每天小时数 - 24 */
  HOURS_PER_DAY: TEST_BASE_NUMBERS.HOURS_PER_DAY,

  /** 25小时 */
  TWENTY_FIVE_HOURS: TEST_BASE_NUMBERS.TWENTY_FIVE_HOURS,
} as const;

// ==================== 延迟常量 ====================

/** 延迟相关常量 */
export const TEST_DELAY_VALUES = {
  /** 短延迟 - 100ms */
  SHORT_DELAY: 100,

  /** 中等延迟 - 300ms */
  MEDIUM_DELAY: 300,

  /** 清理延迟 - 1000ms */
  CLEANUP_DELAY: 1000,
} as const;

// ==================== 性能时间戳常量 ====================

/** 性能时间戳常量 */
export const TEST_PERFORMANCE_TIMESTAMPS = {
  /** 基础时间戳 - 1000 */
  BASE: TEST_BASE_NUMBERS.MILLISECONDS_PER_SECOND,

  /** 偏移量 - 1005 */
  OFFSET: 1005,

  /** 小增量 - 1010 */
  INCREMENT_SMALL: 1010,

  /** 中等增量 - 1020 */
  INCREMENT_MEDIUM: 1020,

  /** 大基数 - 200000 */
  LARGE_BASE: 200000,

  /** 大偏移 - 200100 */
  LARGE_OFFSET: 200100,

  /** 超大值 - 300000 */
  EXTRA_LARGE: 300000,
} as const;

// ==================== 应用特定常量 ====================

/** 应用特定测试常量 */
export const TEST_APP_CONSTANTS = {
  // 屏幕尺寸
  /** 平板屏幕宽度 - 1024 */
  SCREEN_WIDTH_TABLET: 1024,

  // 透明度
  /** 中高透明度 - 0.75 */
  OPACITY_MEDIUM_HIGH: 0.75,

  /** 很高透明度 - 0.9 */
  OPACITY_VERY_HIGH: 0.9,

  // 计数
  /** 小计数3 - 3 */
  SMALL_COUNT_THREE: 3,

  /** 中等计数4 - 4 */
  MEDIUM_COUNT_FOUR: 4,

  // 比例
  /** 比例值 - 6.25 */
  RATIO_VALUE: 6.25,

  // 时间相关常量
  /** 时间单位 - 60 */
  TIME_UNIT: TEST_BASE_NUMBERS.SECONDS_PER_MINUTE,

  /** 毫秒基数 - 1000 */
  MILLISECOND_BASE: TEST_BASE_NUMBERS.MILLISECONDS_PER_SECOND,

  /** 每天小时数 - 24 */
  HOURS_PER_DAY: TEST_BASE_NUMBERS.HOURS_PER_DAY,

  // 百分比常量
  /** 一半百分比 - 50 */
  PERCENTAGE_HALF: TEST_BASE_NUMBERS.HALF_PERCENTAGE,

  // 超时相关
  /** 超时基数 - 1000ms */
  TIMEOUT_BASE: TEST_BASE_NUMBERS.MILLISECONDS_PER_SECOND,
} as const;
