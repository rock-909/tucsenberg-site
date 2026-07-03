/**
 * 安全相关常量定义
 * 集中管理安全配置和限制，确保应用安全性
 * 遵循项目安全编码指南和最佳实践
 */

// ==================== 安全基础常量 ====================

/** 安全基础数字常量 */
const SECURITY_BASE_NUMBERS = {
  // 加密相关
  AES_KEY_LENGTH: 256,
  SHA_HASH_LENGTH: 256,

  // 限制相关
  MAX_ATTEMPTS: 3,
  RATE_LIMIT_WINDOW: 60, // 秒

  // 超时相关
  SESSION_TIMEOUT_MINUTES: 30,
  TOKEN_EXPIRY_HOURS: 24,

  // 大小限制
  MAX_FILE_SIZE_MB: 10,
  MAX_UPLOAD_SIZE_MB: 50,
} as const;

// ==================== 加密和哈希常量 ====================

/** 加密算法常量 */
export const ENCRYPTION_CONSTANTS = {
  /** AES-256 密钥长度 (位) */
  AES_KEY_LENGTH: SECURITY_BASE_NUMBERS.AES_KEY_LENGTH,

  /** SHA-256 哈希长度 (位) */
  SHA_HASH_LENGTH: SECURITY_BASE_NUMBERS.SHA_HASH_LENGTH,

  /** 推荐的盐长度 (字节) */
  SALT_LENGTH: 32,

  /** PBKDF2 迭代次数 */
  PBKDF2_ITERATIONS: 100000,

  /** JWT 密钥最小长度 (字节) */
  JWT_SECRET_MIN_LENGTH: 32,
} as const;

// ==================== 访问控制常量 ====================

/** 访问控制和限制常量 */
export const ACCESS_CONTROL_CONSTANTS = {
  /** 最大登录尝试次数 */
  MAX_LOGIN_ATTEMPTS: SECURITY_BASE_NUMBERS.MAX_ATTEMPTS,

  /** 账户锁定时间 (分钟) */
  ACCOUNT_LOCKOUT_MINUTES: 15,

  /** 密码最小长度 */
  PASSWORD_MIN_LENGTH: 8,

  /** 密码最大长度 */
  PASSWORD_MAX_LENGTH: 128,

  /** 用户名最小长度 */
  USERNAME_MIN_LENGTH: 3,

  /** 用户名最大长度 */
  USERNAME_MAX_LENGTH: 50,
} as const;

// ==================== 会话和令牌常量 ====================

/** 会话管理常量 */
export const SESSION_CONSTANTS = {
  /** 会话超时时间 (分钟) */
  TIMEOUT_MINUTES: SECURITY_BASE_NUMBERS.SESSION_TIMEOUT_MINUTES,

  /** 令牌过期时间 (小时) */
  TOKEN_EXPIRY_HOURS: SECURITY_BASE_NUMBERS.TOKEN_EXPIRY_HOURS,

  /** 刷新令牌过期时间 (天) */
  REFRESH_TOKEN_EXPIRY_DAYS: 7,

  /** 记住我功能过期时间 (天) */
  REMEMBER_ME_EXPIRY_DAYS: 30,

  /** 会话ID长度 (字节) */
  SESSION_ID_LENGTH: 32,
} as const;

// ==================== 速率限制常量 ====================

/** 速率限制常量 */
export const RATE_LIMIT_CONSTANTS = {
  /** 速率限制窗口时间 (秒) */
  WINDOW_SECONDS: SECURITY_BASE_NUMBERS.RATE_LIMIT_WINDOW,

  /** API 每分钟最大请求数 */
  API_REQUESTS_PER_MINUTE: 60,

  /** 登录每小时最大尝试次数 */
  LOGIN_ATTEMPTS_PER_HOUR: 10,

  /** 密码重置每天最大次数 */
  PASSWORD_RESET_PER_DAY: 3,

  /** 文件上传每小时最大次数 */
  FILE_UPLOAD_PER_HOUR: 20,
} as const;

// ==================== 文件安全常量 ====================

/** 文件安全常量 */
export const FILE_SECURITY_CONSTANTS = {
  /** 最大文件大小 (MB) */
  MAX_FILE_SIZE_MB: SECURITY_BASE_NUMBERS.MAX_FILE_SIZE_MB,

  /** 最大上传大小 (MB) */
  MAX_UPLOAD_SIZE_MB: SECURITY_BASE_NUMBERS.MAX_UPLOAD_SIZE_MB,

  /** 允许的文件扩展名 */
  ALLOWED_EXTENSIONS: [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".pdf",
    ".txt",
    ".md",
    ".mdx",
  ] as const,

  /** 禁止的文件扩展名 */
  FORBIDDEN_EXTENSIONS: [
    ".exe",
    ".bat",
    ".cmd",
    ".scr",
    ".com",
    ".pif",
    ".vbs",
    ".js",
  ] as const,

  /** 文件名最大长度 */
  FILENAME_MAX_LENGTH: 255,

  /** 路径最大深度 */
  PATH_MAX_DEPTH: 10,
} as const;

// ==================== 输入验证常量 ====================

/** 输入验证常量 */
export const INPUT_VALIDATION_CONSTANTS = {
  /** 文本输入最大长度 */
  TEXT_MAX_LENGTH: 1000,

  /** 标题最大长度 */
  TITLE_MAX_LENGTH: 200,

  /** 描述最大长度 */
  DESCRIPTION_MAX_LENGTH: 500,

  /** URL 最大长度 */
  URL_MAX_LENGTH: 2048,

  /** 邮箱最大长度 */
  EMAIL_MAX_LENGTH: 254,

  /** 电话号码最大长度 */
  PHONE_MAX_LENGTH: 20,
} as const;

// ==================== 内容安全策略常量 ====================

/** 内容安全策略常量 */
export const CSP_CONSTANTS = {
  /** 脚本源白名单 */
  SCRIPT_SRC_WHITELIST: [
    "'self'",
    "'unsafe-inline'", // 仅在必要时使用
    "https://trusted-cdn.com",
  ] as const,

  /** 样式源白名单 */
  STYLE_SRC_WHITELIST: [
    "'self'",
    "'unsafe-inline'", // 仅在必要时使用
    "https://fonts.googleapis.com",
  ] as const,

  /** 图片源白名单 */
  IMG_SRC_WHITELIST: ["'self'", "data:", "https:"] as const,

  /** 连接源白名单 */
  CONNECT_SRC_WHITELIST: ["'self'", "https://api.trusted-service.com"] as const,
} as const;

// ==================== 安全头部常量 ====================

/** 安全HTTP头部常量 */
export const SECURITY_HEADERS_CONSTANTS = {
  /** X-Frame-Options 值 */
  X_FRAME_OPTIONS: "DENY",

  /** X-Content-Type-Options 值 */
  X_CONTENT_TYPE_OPTIONS: "nosniff",

  /** X-XSS-Protection 值 */
  X_XSS_PROTECTION: "1; mode=block",

  /** Referrer-Policy 值 */
  REFERRER_POLICY: "strict-origin-when-cross-origin",

  /** Strict-Transport-Security 最大年龄 (秒) */
  HSTS_MAX_AGE: 31536000, // 1年

  /** Permissions-Policy 指令 */
  PERMISSIONS_POLICY: "geolocation=(), microphone=(), camera=()",
} as const;

// ==================== 导出所有安全常量 ====================

/** 所有安全常量的统一导出 */
export const SECURITY_CONSTANTS = {
  ENCRYPTION: ENCRYPTION_CONSTANTS,
  ACCESS_CONTROL: ACCESS_CONTROL_CONSTANTS,
  SESSION: SESSION_CONSTANTS,
  RATE_LIMIT: RATE_LIMIT_CONSTANTS,
  FILE_SECURITY: FILE_SECURITY_CONSTANTS,
  INPUT_VALIDATION: INPUT_VALIDATION_CONSTANTS,
  CSP: CSP_CONSTANTS,
  HEADERS: SECURITY_HEADERS_CONSTANTS,
} as const;

/** 安全常量类型定义 */
export type SecurityConstants = typeof SECURITY_CONSTANTS;
export type EncryptionConstants = typeof ENCRYPTION_CONSTANTS;
export type AccessControlConstants = typeof ACCESS_CONTROL_CONSTANTS;
export type SessionConstants = typeof SESSION_CONSTANTS;
export type RateLimitConstants = typeof RATE_LIMIT_CONSTANTS;
export type FileSecurityConstants = typeof FILE_SECURITY_CONSTANTS;
export type InputValidationConstants = typeof INPUT_VALIDATION_CONSTANTS;
export type CspConstants = typeof CSP_CONSTANTS;
export type SecurityHeadersConstants = typeof SECURITY_HEADERS_CONSTANTS;
