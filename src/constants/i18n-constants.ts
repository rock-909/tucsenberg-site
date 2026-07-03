// 自包含的常量定义，不引入未使用的外部时间单位

/**
 * i18n系统常量定义
 * 集中管理所有魔法数字，提高代码可维护性和可读性
 */

// ==================== 基础数字常量 ====================

/** 基础数字常量 */
const BASE_NUMBERS = {
  // 时间相关
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_YEAR: 365,

  // 缓存和计数
  CACHE_MINUTES_5: 5,
  CACHE_SECONDS_30: 30,
  CACHE_MINUTES_30: 30,

  // 存储和大小
  BYTES_PER_KB: 1024,
  MB_SIZE_10: 10,

  // 监控和采样
  SAMPLE_RATE_5: 5,
  SAMPLE_RATE_10: 10,
  PERCENTAGE_100: 100,
} as const;

// ==================== 时间相关常量 ====================

/** 时间单位常量 (毫秒) */
export const TIME_UNITS = {
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
  DAY:
    BASE_NUMBERS.HOURS_PER_DAY *
    BASE_NUMBERS.MINUTES_PER_HOUR *
    BASE_NUMBERS.SECONDS_PER_MINUTE *
    BASE_NUMBERS.MILLISECONDS_PER_SECOND,
  /** 1年 = 365天 */
  YEAR:
    BASE_NUMBERS.DAYS_PER_YEAR *
    BASE_NUMBERS.HOURS_PER_DAY *
    BASE_NUMBERS.MINUTES_PER_HOUR *
    BASE_NUMBERS.SECONDS_PER_MINUTE *
    BASE_NUMBERS.MILLISECONDS_PER_SECOND,
} as const;

/** 缓存和存储时间配置 */
export const CACHE_DURATIONS = {
  /** Cookie最大存储时间: 1年 */
  COOKIE_MAX_AGE: TIME_UNITS.YEAR,
  /** 翻译缓存时间: 5分钟 */
  TRANSLATION_CACHE: BASE_NUMBERS.CACHE_MINUTES_5 * TIME_UNITS.MINUTE,
  /** 性能数据缓存: 30秒 */
  PERFORMANCE_CACHE: BASE_NUMBERS.CACHE_SECONDS_30 * TIME_UNITS.SECOND,
  /** 监控数据保留: 1小时 */
  MONITORING_RETENTION: TIME_UNITS.HOUR,
} as const;

/** UI动画和延迟时间 */
export const UI_TIMINGS = {
  /** 语言切换动画时间 */
  LANGUAGE_SWITCH_ANIMATION: 2000,
  /** 加载延迟时间 */
  LOADING_DELAY: 500,
  /** 错误提示显示时间 */
  ERROR_DISPLAY_DURATION: 5000,
  /** 成功提示显示时间 */
  SUCCESS_DISPLAY_DURATION: 2000,
} as const;

// ==================== 性能和质量阈值 ====================

/** 性能监控阈值 */
export const PERFORMANCE_THRESHOLDS = {
  /** 优秀性能阈值 */
  EXCELLENT: 95,
  /** 良好性能阈值 */
  GOOD: 80,
  /** 一般性能阈值 */
  FAIR: 60,
  /** 差性能阈值 */
  POOR: 40,
  /** 最大响应时间 (毫秒) */
  MAX_RESPONSE_TIME: 1000,
  /** 最大内存使用 (MB) */
  MAX_MEMORY_USAGE: 100,
} as const;

/** 翻译质量评分权重 */
export const QUALITY_WEIGHTS = {
  /** 语法错误惩罚 */
  GRAMMAR_PENALTY: 10,
  /** 一致性错误惩罚 */
  CONSISTENCY_PENALTY: 15,
  /** 术语错误惩罚 */
  TERMINOLOGY_PENALTY: 12,
  /** 流畅性错误惩罚 */
  FLUENCY_PENALTY: 8,
  /** 长度差异惩罚 */
  LENGTH_PENALTY: 5,
  /** 占位符错误惩罚 */
  PLACEHOLDER_PENALTY: 20,
} as const;

/** 翻译质量评分系数 */
export const QUALITY_SCORING = {
  /** 质量评分惩罚系数 */
  ISSUE_PENALTY_FACTOR: 0.1,
  /** 质量趋势分数范围 - 最小值 */
  TREND_SCORE_MIN: 0.7,
  /** 质量趋势分数范围 - 变化幅度 */
  TREND_SCORE_RANGE: 0.3,
  /** 质量趋势键数量 - 基础值 */
  TREND_KEY_COUNT_BASE: 50,
  /** 质量趋势键数量 - 变化范围 */
  TREND_KEY_COUNT_RANGE: 100,
  /** 严重问题惩罚分数 */
  CRITICAL_PENALTY: 20,
  /** 警告问题惩罚分数 */
  WARNING_PENALTY: 5,
} as const;

/** 翻译质量检查阈值 */
export const QUALITY_CHECK_THRESHOLDS = {
  /** 高质量阈值 */
  HIGH_QUALITY: 30,
  /** 中等质量阈值 */
  MEDIUM_QUALITY: 20,
  /** 低质量阈值 */
  LOW_QUALITY: 10,
  /** 术语一致性检查阈值 */
  TERMINOLOGY_CONSISTENCY: 10,
} as const;

/** 翻译验证阈值 */
export const VALIDATION_THRESHOLDS = {
  /** 空翻译惩罚 */
  EMPTY_TRANSLATION_PENALTY: 50,
  /** 占位符不匹配惩罚 */
  PLACEHOLDER_MISMATCH_PENALTY: 20,
  /** 长度差异阈值 */
  LENGTH_DIFFERENCE_THRESHOLD: 15,
  /** 最小长度比例 */
  MIN_LENGTH_RATIO: 0.3,
  /** 最大长度比例 */
  MAX_LENGTH_RATIO: 3,
  /** 相似度阈值 */
  SIMILARITY_THRESHOLD: 0.6,
  /** 质量及格分数 */
  PASSING_SCORE: 70,
  /** 优秀质量分数 */
  EXCELLENT_SCORE: 90,
} as const;

// ==================== 本地化检测配置 ====================

/** 语言检测置信度阈值 */
export const DETECTION_CONFIDENCE = {
  /** 高置信度阈值 */
  HIGH: 0.8,
  /** 中等置信度阈值 */
  MEDIUM: 0.6,
  /** 低置信度阈值 */
  LOW: 0.3,
  /** 最小可接受置信度 */
  MIN_ACCEPTABLE: 0.2,
  /** 地理位置检测权重 */
  GEO_WEIGHT: 0.7,
  /** 浏览器语言检测权重 */
  BROWSER_WEIGHT: 0.5,
  /** 用户历史权重 */
  HISTORY_WEIGHT: 0.9,
} as const;

/** 语言检测评分系数 */
export const DETECTION_SCORING = {
  /** 完全匹配加分 */
  EXACT_MATCH_BONUS: 0.9,
  /** 部分匹配加分 */
  PARTIAL_MATCH_BONUS: 0.5,
  /** 地区匹配加分 */
  REGION_MATCH_BONUS: 0.3,
  /** 默认语言权重 */
  DEFAULT_LANGUAGE_WEIGHT: 0.1,
  /** 用户偏好权重 */
  USER_PREFERENCE_WEIGHT: 0.95,
} as const;

// ==================== 缓存和存储配置 ====================

/** 缓存大小限制 */
export const CACHE_LIMITS = {
  /** 最大缓存条目数 */
  MAX_CACHE_ENTRIES: 100,
  /** 翻译历史记录数 */
  MAX_TRANSLATION_HISTORY: 50,
  /** 检测历史记录数 */
  MAX_DETECTION_HISTORY: 30,
  /** 性能数据点数 */
  MAX_PERFORMANCE_DATA_POINTS: 1000,
} as const;

/** 数据清理配置 */
export const CLEANUP_CONFIG = {
  /** 缓存清理间隔 (毫秒) */
  CACHE_CLEANUP_INTERVAL: BASE_NUMBERS.CACHE_MINUTES_30 * TIME_UNITS.MINUTE,
  /** 过期数据清理间隔 (毫秒) */
  EXPIRED_DATA_CLEANUP: TIME_UNITS.HOUR,
  /** 最大日志文件大小 (字节) */
  MAX_LOG_FILE_SIZE:
    BASE_NUMBERS.MB_SIZE_10 *
    BASE_NUMBERS.BYTES_PER_KB *
    BASE_NUMBERS.BYTES_PER_KB, // 10MB
} as const;

// ==================== 监控和报告配置 ====================

/** 监控采样配置 */
export const MONITORING_CONFIG = {
  /** 性能采样率 (%) */
  PERFORMANCE_SAMPLE_RATE: BASE_NUMBERS.SAMPLE_RATE_10,
  /** 错误采样率 (%) */
  ERROR_SAMPLE_RATE: BASE_NUMBERS.PERCENTAGE_100,
  /** 用户行为采样率 (%) */
  USER_BEHAVIOR_SAMPLE_RATE: BASE_NUMBERS.SAMPLE_RATE_5,
  /** 监控数据上报间隔 (毫秒) */
  REPORTING_INTERVAL: BASE_NUMBERS.CACHE_MINUTES_5 * TIME_UNITS.MINUTE,
} as const;

/** 报告阈值配置 */
export const REPORTING_THRESHOLDS = {
  /** 错误率报警阈值 (%) */
  ERROR_RATE_ALERT: 5,
  /** 响应时间报警阈值 (毫秒) */
  RESPONSE_TIME_ALERT: 2000,
  /** 内存使用报警阈值 (%) */
  MEMORY_USAGE_ALERT: 80,
  /** CPU使用报警阈值 (%) */
  CPU_USAGE_ALERT: 70,
} as const;

// ==================== UI和用户体验配置 ====================

/** UI百分比和比例 */
export const UI_RATIOS = {
  /** 加载进度满值 */
  PROGRESS_MAX: 100,
  /** 透明度: 高 */
  OPACITY_HIGH: 0.8,
  /** 透明度: 中 */
  OPACITY_MEDIUM: 0.5,
  /** 透明度: 低 */
  OPACITY_LOW: 0.1,
  /** 成功率显示阈值 */
  SUCCESS_RATE_DISPLAY: 95,
  /** 警告显示阈值 */
  WARNING_DISPLAY: 80,
} as const;

/** 分页和列表配置 */
export const PAGINATION_CONFIG = {
  /** 默认每页条目数 */
  DEFAULT_PAGE_SIZE: 10,
  /** 最大每页条目数 */
  MAX_PAGE_SIZE: 100,
  /** 搜索结果最大数量 */
  MAX_SEARCH_RESULTS: 50,
} as const;
