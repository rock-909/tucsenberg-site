/**
 * Server Action 工具函数
 * Defines shared result types without declaring a Server Action.
 */

/**
 * Server Action 执行结果基础类型
 */
export interface ServerActionResult<T = unknown> {
  /** 操作是否成功 */
  success: boolean;
  /** 返回数据（成功时） */
  data?: T | undefined;
  /** 稳定错误码（失败时优先消费） */
  errorCode?: string | undefined;
  /** 错误信息（失败时） */
  error?: string | undefined;
  /** 详细错误信息（失败时） */
  details?: string[] | undefined;
  /** 操作时间戳 */
  timestamp: string;
}
