/**
 * 测试UI相关常量定义
 * 包含透明度、角度、屏幕尺寸、内容限制等UI相关常量
 */

// ==================== 测试屏幕尺寸常量 ====================

/** 测试屏幕尺寸常量 */
export const TEST_SCREEN_CONSTANTS = {
  /** 移动端宽度 - 768px */
  MOBILE_WIDTH: 768,

  /** 平板宽度 - 1024px */
  TABLET_WIDTH: 1024,

  /** 桌面宽度 - 1280px */
  DESKTOP_WIDTH: 1280,

  /** 标准高度 - 768px */
  STANDARD_HEIGHT: 768,

  /** 小屏断点 - 640px */
  BREAKPOINT_SM: 640,

  /** 中屏断点 - 768px */
  BREAKPOINT_MD: 768,

  /** 大屏断点 - 1024px */
  BREAKPOINT_LG: 1024,

  /** 超大屏断点 - 1280px */
  BREAKPOINT_XL: 1280,
} as const;

// ==================== 测试内容限制常量 ====================

/** 测试内容限制常量 */
export const TEST_CONTENT_LIMITS = {
  /** 标题最大长度 - 60 */
  TITLE_MAX: 60,

  /** 描述最大长度 - 160 */
  DESCRIPTION_MAX: 160,

  /** 短文本最大长度 - 20 */
  SHORT_TEXT_MAX: 20,

  /** 中等文本最大长度 - 250 */
  MEDIUM_TEXT_MAX: 250,

  /** 长文本最大长度 - 500 */
  LONG_TEXT_MAX: 500,

  /** 最大文件大小 - 1024KB */
  MAX_FILE_SIZE: 1024,

  /** 最大嵌套回调 - 3 */
  MAX_NESTED_CALLBACKS: 3,

  /** 函数最大行数 - 80 */
  FUNCTION_MAX_LINES: 80,

  /** 文件最大行数 - 500 */
  FILE_MAX_LINES: 500,

  /** 最大复杂度 - 10 */
  MAX_COMPLEXITY: 10,

  /** SEO标题最大长度 - 60 */
  SEO_TITLE_MAX_LENGTH: 60,

  /** SEO描述最大长度 - 160 */
  SEO_DESCRIPTION_MAX_LENGTH: 160,
} as const;

// ==================== 测试数值样本常量 ====================

/** 测试数值样本常量 */
export const TEST_SAMPLE_CONSTANTS = {
  /** 小数测试值 - 123.7 */
  DECIMAL_SAMPLE: 123.7,

  /** 负小数测试值 - -5.2 */
  NEGATIVE_DECIMAL: -5.2,

  /** 大整数测试值 - 999999 */
  LARGE_INTEGER: 1000000,

  /** 小整数测试值 - 42 */
  SMALL_INTEGER: 42,

  /** 整数样本测试值 - 1234 */
  INTEGER_SAMPLE: 1234,

  /** 百分比样本测试值 - 96 */
  PERCENTAGE_SAMPLE: 96,

  /** 货币样本测试值 - 1234.56 */
  CURRENCY_SAMPLE: 1234.56,

  /** 精度样本测试值 - 123.456 */
  PRECISION_SAMPLE: 123.456,

  /** 零值测试 */
  ZERO_VALUE: 0,

  /** 单位值测试 */
  UNIT_VALUE: 1,

  /** 价格测试值 - 99.99 */
  PRICE_SAMPLE: 99.99,
} as const;

// ==================== 测试特殊数值常量 ====================

/** 测试特殊数值常量 */
export const TEST_SPECIAL_CONSTANTS = {
  /** 十六进制大数 - 0x80000000 */
  HEX_LARGE_NUMBER: 0x80000000,

  /** 负数测试值 - -100 */
  NEGATIVE_VALUE: -100,

  /** 单位值 */
  UNIT: 1,

  /** 负单位值 */
  NEGATIVE_UNIT: -1,
} as const;
