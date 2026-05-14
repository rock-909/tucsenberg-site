/**
 * 测试相关常量定义 - 主入口文件
 * 重新导出所有拆分的测试常量，保持向后兼容性
 * 遵循项目编码标准，提高测试代码的可维护性
 */

// ==================== 基础测试常量 ====================

/** 测试基础数字常量 */
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

  // 数学运算
  DIVISION_BY_TWO: 2,

  // 百分比
  PERCENTAGE_FULL: 100,
  HALF_PERCENTAGE: 50,

  // 角度
  FULL_CIRCLE_DEGREES: 360,
  RIGHT_ANGLE_DEGREES: 90,

  // 浮点数测试
  FLOAT_DECIMAL_ONE: 0.1,
  FLOAT_DECIMAL_TWO: 0.2,

  // 内存大小（MB）
  MEMORY_SIZE_50MB: 50,
  MEMORY_SIZE_100MB: 100,
  MEMORY_SIZE_200MB: 200,

  // 字节转换
  BYTES_PER_KB: 1024,
} as const;

/** 测试超时常量 (毫秒) */
export const TEST_TIMEOUT_CONSTANTS = {
  /** 标准测试超时 - 1000ms */
  STANDARD: TEST_BASE_NUMBERS.MILLISECONDS_PER_SECOND,

  /** 扩展测试超时 - 1100ms */
  EXTENDED: TEST_BASE_NUMBERS.MILLISECONDS_PER_SECOND + 100,

  /** 快速测试超时 - 500ms */
  QUICK: 500,

  /** 长测试超时 - 5000ms */
  LONG: 5000,

  /** 极长测试超时 - 10000ms */
  VERY_LONG: 10000,

  /** 网络测试超时 - 3000ms */
  NETWORK: 3000,

  /** 短延迟 - 100ms */
  SHORT_DELAY: 100,

  /** 中等延迟 - 250ms */
  MEDIUM_DELAY: 250,

  /** 长延迟 - 500ms */
  LONG_DELAY: 500,
} as const;

/** 测试迭代和计数常量 */
export const TEST_COUNT_CONSTANTS = {
  /** 微小计数 - 3 */
  TINY: 3,

  /** 小计数 - 2 */
  SMALL: TEST_BASE_NUMBERS.SMALL_COUNT,

  /** 中等计数 - 5 */
  MEDIUM: TEST_BASE_NUMBERS.MEDIUM_COUNT,

  /** 大计数 - 10 */
  LARGE: TEST_BASE_NUMBERS.LARGE_COUNT,

  /** 超大计数 - 20 */
  VERY_LARGE: TEST_BASE_NUMBERS.VERY_LARGE_COUNT,

  /** 巨大计数 - 25 */
  HUGE: TEST_BASE_NUMBERS.HUGE_COUNT,

  /** 完整百分比 - 100 */
  PERCENTAGE_FULL: TEST_BASE_NUMBERS.PERCENTAGE_FULL,

  /** 最大标签数 - 5 */
  MAX_TAGS: TEST_BASE_NUMBERS.MEDIUM_COUNT,
} as const;

/** 测试百分比常量 */
export const TEST_PERCENTAGE_CONSTANTS = {
  /** 完整 - 100% */
  FULL: TEST_BASE_NUMBERS.PERCENTAGE_FULL,

  /** 一半 - 50% */
  HALF: TEST_BASE_NUMBERS.HALF_PERCENTAGE,
} as const;

// ==================== UI测试常量 ====================

/** 测试透明度常量 */
export const TEST_OPACITY_CONSTANTS = {
  /** 完全透明 */
  TRANSPARENT: 0,

  /** 低透明度 - 0.3 */
  LOW: 0.3,

  /** 中等透明度 - 0.5 */
  MEDIUM: 0.5,

  /** 高透明度 - 0.8 */
  HIGH: 0.8,

  /** 完全不透明 */
  OPAQUE: 1,
} as const;

/** 测试角度常量 */
export const TEST_ANGLE_CONSTANTS = {
  /** 完整圆周 - 360度 */
  FULL_CIRCLE: TEST_BASE_NUMBERS.FULL_CIRCLE_DEGREES,

  /** 半圆 - 180度 */
  HALF_CIRCLE:
    TEST_BASE_NUMBERS.FULL_CIRCLE_DEGREES / TEST_BASE_NUMBERS.DIVISION_BY_TWO,

  /** 直角 - 90度 */
  RIGHT_ANGLE: TEST_BASE_NUMBERS.RIGHT_ANGLE_DEGREES,
} as const;

// 测试屏幕尺寸常量已移动到 test-ui-constants.ts

// 测试内容限制常量已移动到 test-ui-constants.ts

// 测试样本常量和特殊常量已移动到 test-ui-constants.ts

// ==================== 性能测试常量 ====================
// Web Vitals 常量已移动到 test-web-vitals-constants.ts

// ==================== 单独导出常用常量 ====================

// 导出常用的测试常量以便直接使用
export {
  TEST_CONTENT_LIMITS,
  TEST_SAMPLE_CONSTANTS,
  TEST_SCREEN_CONSTANTS,
  TEST_SPECIAL_CONSTANTS,
} from "./test-ui-constants";
