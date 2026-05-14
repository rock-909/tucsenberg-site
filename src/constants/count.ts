/**
 * 计数与数值常量定义
 *
 * 这个文件包含基础计数和通用数值常量。
 * 领域特定的常量应该放在各自的文件中：
 * - 验证限制 → ./validation-limits.ts
 * - 时间常量 → ./time.ts
 */

// ============================================================================
// 基础计数常量
// ============================================================================

export const COUNT_ZERO = 0 as const;
export const COUNT_ONE = 1 as const;
export const COUNT_TWO = 2 as const;
export const COUNT_THREE = 3 as const;
export const COUNT_4 = 4 as const;
export const COUNT_FIVE = 5 as const;
export const COUNT_SIX = 6 as const;
export const COUNT_SEVEN = 7 as const;
export const COUNT_EIGHT = 8 as const;
export const COUNT_NINE = 9 as const;
export const COUNT_TEN = 10 as const;

// ============================================================================
// 常用数值常量 (按使用场景分组)
// ============================================================================

// -- 进制和编码相关 --
/** 十六进制基数 (用于 parseInt/toString(16)、nonce/salt 字节长度等) */
export const HEX_RADIX = 16 as const;
/** Base36 进制基数 (用于生成短 ID) */
export const BASE36_RADIX = 36 as const;

// -- 安全相关 --
/** OTP 默认长度 */
export const OTP_DEFAULT_LENGTH = 6 as const;
/** 验证码默认长度 */
export const VERIFY_CODE_DEFAULT_LENGTH = 8 as const;
/** 短 ID 截取长度 */
export const SHORT_ID_LENGTH = 9 as const;
/** AES-GCM IV 字节长度 */
export const AES_GCM_IV_BYTES = 12 as const;
/** Token 默认长度 */
export const TOKEN_DEFAULT_LENGTH = 32 as const;
/** API Key token 长度 */
export const API_KEY_TOKEN_LENGTH = 48 as const;
/** Session token 长度 */
export const SESSION_TOKEN_LENGTH = 64 as const;

// -- 验证相关 --
/** 电话号码最大位数 */
export const PHONE_MAX_DIGITS = 15 as const;
/** 默认图标尺寸 (px) */
export const DEFAULT_ICON_SIZE = 20 as const;

// -- 监控阈值 --
/** 服务可用性：低于此值判定为 unhealthy (95%) */
export const UPTIME_UNHEALTHY_THRESHOLD = 95 as const;
/** 服务可用性：低于此值判定为 degraded (99%) */
export const UPTIME_DEGRADED_THRESHOLD = 99 as const;

// -- 文件大小限制 --
/** 文件名最大长度 (255 = 0xFF) */
export const MAX_FILENAME_LENGTH = 255 as const;

// -- HTTP 相关 --
/** HTTP 5xx 错误码上界 (用于 code >= 500 && code < 600 判断) */
export const HTTP_SERVER_ERROR_UPPER = 600 as const;

// -- 时间相关 (毫秒) --
/** 响应时间 degraded 阈值 (2000ms) */
export const RESPONSE_TIME_DEGRADED_MS = 2000 as const;
/** LCP "Good" 阈值 (2500ms) */
export const LCP_GOOD_THRESHOLD_MS = 2500 as const;

// -- 尺寸和数量限制 --
/** Logo 尺寸相关 */
export const COUNT_120 = 120 as const;
/** 内容截断长度 */
export const COUNT_160 = 160 as const;
/** 导航预加载延迟 */
export const COUNT_250 = 250 as const;
/** 组件模板尺寸 */
export const COUNT_700 = 700 as const;
/** Top Loader 尺寸 */
export const COUNT_1600 = 1600 as const;
/** 秒每小时 */
export const COUNT_3600 = 3600 as const;
/** 5分钟 (毫秒) */
export const COUNT_300000 = 300000 as const;

// ============================================================================
// 大容量数值 (文件大小和时间相关)
// ============================================================================

/** 1MB in bytes (1024 * 1024) */
export const BYTES_PER_MB = 1048576 as const;
/** 1 hour in milliseconds (60 * 60 * 1000) */
export const MS_PER_HOUR = 3600000 as const;
