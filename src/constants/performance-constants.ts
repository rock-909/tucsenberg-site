// 自包含的常量定义，不引入未使用的外部时间单位

/**
 * 性能监控常量定义
 * 集中管理性能监控间隔相关的魔法数字
 * 遵循项目编码标准，提高代码可维护性和可读性
 */

// ==================== 基础时间常量 ====================

/** 基础时间单位常量 */
const TIME_BASE = {
  /** 毫秒每秒 */
  MS_PER_SECOND: 1000,
  /** 秒每分钟 */
  SECONDS_PER_MINUTE: 60,
  /** 分钟每小时 */
  MINUTES_PER_HOUR: 60,
} as const;

/** 基础数字常量 - 避免magic numbers */
const BASE_NUMBERS = {
  /** 基础计数 */
  THREE: 3,
  FIVE: 5,
  TEN: 10,
  THIRTY: 30,
} as const;

/** 时间单位常量 */
const TIME_UNITS = {
  /** 1秒 = 1000毫秒 */
  SECOND: TIME_BASE.MS_PER_SECOND,
  /** 1分钟 = 60000毫秒 */
  MINUTE: TIME_BASE.SECONDS_PER_MINUTE * TIME_BASE.MS_PER_SECOND,
  /** 1小时 = 3600000毫秒 */
  HOUR:
    TIME_BASE.MINUTES_PER_HOUR *
    TIME_BASE.SECONDS_PER_MINUTE *
    TIME_BASE.MS_PER_SECOND,
} as const;

// ==================== 性能监控间隔常量 ====================

/** 性能监控时间间隔 */
export const MONITORING_INTERVALS = {
  /** 指标更新间隔: 3秒 */
  METRICS_UPDATE: BASE_NUMBERS.THREE * TIME_UNITS.SECOND,

  /** 报告发送间隔: 5分钟 */
  REPORT_SEND: BASE_NUMBERS.FIVE * TIME_UNITS.MINUTE,

  /** 诊断检查间隔: 10秒 */
  DIAGNOSTIC_CHECK: BASE_NUMBERS.TEN * TIME_UNITS.SECOND,

  /** 缓存清理间隔: 30分钟 */
  CACHE_CLEANUP: BASE_NUMBERS.THIRTY * TIME_UNITS.MINUTE,

  /** 性能采样间隔: 1秒 */
  PERFORMANCE_SAMPLING: TIME_UNITS.SECOND,
} as const;
