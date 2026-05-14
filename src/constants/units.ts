// 直接定义基础常量，避免循环依赖
const BYTES_PER_KB = 1024 as const;
const BYTES_PER_MB = 1048576 as const; // 1MB in bytes
const MS_PER_HOUR = 3600000 as const; // 1 hour in milliseconds

/**
 * 通用时间与容量单位常量
 */
export const SECOND_MS = 1000 as const;
export const HOUR_MS = MS_PER_HOUR; // 60 * 60 * 1000

export const KB = BYTES_PER_KB;
export const MB = BYTES_PER_MB; // BYTES_PER_KB * BYTES_PER_KB
