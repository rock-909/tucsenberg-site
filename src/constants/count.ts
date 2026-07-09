/**
 * 计数与数值常量定义
 *
 * 这个文件包含基础计数和通用数值常量。
 * 领域特定的常量应该放在各自的文件中：
 * - 验证限制 → ./validation-limits.ts
 * - 时间常量 → ./time.ts
 */

// -- 进制和编码相关 --
/** 十六进制基数 (用于 parseInt/toString(16)、nonce/salt 字节长度等) */
export const HEX_RADIX = 16 as const;

// -- 验证相关 --
/** 电话号码最大位数 */
export const PHONE_MAX_DIGITS = 15 as const;
/** 默认图标尺寸 (px) */
export const DEFAULT_ICON_SIZE = 20 as const;
