/**
 * 时间相关常量
 *
 * 🎯 用途：时间单位、时间间隔等时间相关的常量定义
 * 📝 注意：与 @/lib/units 工具库配合使用，处理时间转换
 */

// ============================================================================
// 基础时间单位
// ============================================================================

export const DAYS_PER_WEEK = 7 as const;
export const HOURS_PER_DAY = 24 as const;
export const MINUTES_PER_HOUR = 60 as const;
export const SECONDS_PER_MINUTE = 60 as const;

// ============================================================================
// 扩展时间单位
// ============================================================================

export const DAYS_PER_MONTH = 30 as const;
export const DAYS_PER_YEAR = 365 as const;
export const MONTHS_PER_YEAR = 12 as const;
export const WEEKS_PER_MONTH = 4 as const;

// ============================================================================
// 毫秒时间常量
// ============================================================================

export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_HOUR = 3_600 as const;
export const MILLISECONDS_PER_MINUTE = 60000;
export const MILLISECONDS_PER_HOUR = 3600000 as const;

// ============================================================================
// 常用时间间隔 (毫秒)
// ============================================================================

export const HALF_SECOND_MS = 500;
const SIX_HUNDRED_MS = 600;
export const TWO_HUNDRED_MS = 200;
export const FOUR_HUNDRED_MS = 400;
export const ONE_SECOND_MS = 1000;
const TWELVE_HUNDRED_MS = 1200;
const FIFTEEN_HUNDRED_MS = 1500;
export const TWO_SECONDS_MS = 2000;
export const THREE_SECONDS_MS = 3000;
export const FIVE_SECONDS_MS = 5000;
export const TEN_SECONDS_MS = 10000;
export const THIRTY_SECONDS_MS = 30000;
export const MINUTE_MS = 60000;
export const FIVE_MINUTES_MS = 300000;
export const TEN_MINUTES_MS = 600000;

// ============================================================================
// 性能优化相关时间常量
// ============================================================================

/** requestIdleCallback fallback延迟（当浏览器不支持时使用setTimeout） */
export const IDLE_CALLBACK_FALLBACK_DELAY = SIX_HUNDRED_MS;
/** requestIdleCallback超时时间（用于确保回调最终执行） */
export const IDLE_CALLBACK_TIMEOUT = TWELVE_HUNDRED_MS;
/** requestIdleCallback超时时间（较长版本，用于非关键任务） */
export const IDLE_CALLBACK_TIMEOUT_LONG = FIFTEEN_HUNDRED_MS;
