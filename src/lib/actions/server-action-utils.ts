/**
 * Server Action 工具函数
 * 提供 Server Actions 的通用工具函数，不包含 'use server' 指令
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

/**
 * Server Action 错误类型
 */
export interface ServerActionError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 详细信息 */
  details?: string[] | undefined;
  /** 原始错误 */
  cause?: Error | undefined;
}

/**
 * 表单数据验证结果
 */
export interface FormValidationResult<T = Record<string, unknown>> {
  /** 验证是否通过 */
  success: boolean;
  /** 验证后的数据（成功时） */
  data?: T | undefined;
  /** 验证错误（失败时） */
  errors?: string[] | undefined;
}

/**
 * Server Action 函数类型
 */
export type ServerAction<TInput, TOutput> = (
  previousState: ServerActionResult<TOutput> | null,
  input: TInput,
) => Promise<ServerActionResult<TOutput>>;

/**
 * 创建标准化的 Server Action 错误响应
 */
export function createErrorResult(
  error: string | ServerActionError,
  details?: string[],
): ServerActionResult<never> {
  const errorMessage = typeof error === "string" ? error : error.message;
  const errorDetails =
    typeof error === "string" ? details : error.details || details;

  return {
    success: false,
    errorCode: typeof error === "string" ? undefined : error.code,
    error: errorMessage,
    details: errorDetails,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建标准化的 Server Action 成功响应
 */
export function createSuccessResult<T>(
  data: T,
  message?: string,
): ServerActionResult<T> {
  return {
    success: true,
    data,
    error: message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建带日志记录的 Server Action 错误响应
 */
export function createErrorResultWithLogging(
  error: string | ServerActionError,
  details?: string[],
  logger?: { error: (message: string, meta?: unknown) => void },
): ServerActionResult<never> {
  const errorObj =
    typeof error === "string" ? { code: "UNKNOWN", message: error } : error;

  if (logger) {
    logger.error("Server Action error", {
      code: errorObj.code,
      message: errorObj.message,
      details: details || errorObj.details,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    success: false,
    errorCode: errorObj.code,
    error: errorObj.message,
    details: details || errorObj.details || undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建带日志记录的 Server Action 成功响应
 */
export function createSuccessResultWithLogging<T>(
  data: T,
  message?: string,
  logger?: { info: (message: string, meta?: unknown) => void },
): ServerActionResult<T> {
  const result = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (logger) {
    logger.info("Server Action success", {
      message: message || "Operation completed successfully",
      timestamp: result.timestamp,
    });
  }

  return result;
}

/**
 * Server Action 错误处理装饰器
 * 统一处理 Server Action 中的异常
 */
export function withErrorHandling<TInput, TOutput>(
  action: (
    previousState: ServerActionResult<TOutput> | null,
    input: TInput,
  ) => Promise<ServerActionResult<TOutput>>,
): ServerAction<TInput, TOutput> {
  return async (
    previousState: ServerActionResult<TOutput> | null,
    input: TInput,
  ): Promise<ServerActionResult<TOutput>> => {
    try {
      return await action(previousState, input);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      return createErrorResult({
        code: "SERVER_ACTION_ERROR",
        message: errorMessage,
        cause: error instanceof Error ? error : undefined,
      });
    }
  };
}

/**
 * 从 FormData 中安全提取字符串值
 */
export function getFormDataString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * 从 FormData 中安全提取布尔值
 */
export function getFormDataBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "true" || value === "on" || value === "1";
}

/**
 * 验证字段是否为必需且为空
 */
function validateRequiredField(
  key: string,
  value: string,
  required?: boolean,
): string | null {
  if (required && !value) {
    return `${key} is required`;
  }
  return null;
}

/**
 * 验证邮箱格式
 */
function validateEmailField(key: string, value: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return `${key} must be a valid email address`;
  }
  return null;
}

/**
 * 验证字段长度
 */
function validateFieldLength(
  key: string,
  value: string,
  rules: { minLength?: number; maxLength?: number },
): string[] {
  const errors: string[] = [];

  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`${key} must be at least ${rules.minLength} characters long`);
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(
      `${key} must be no more than ${rules.maxLength} characters long`,
    );
  }

  return errors;
}

/**
 * 验证字段模式
 */
function validateFieldPattern(
  key: string,
  value: string,
  pattern?: RegExp,
): string | null {
  if (pattern && !pattern.test(value)) {
    return `${key} format is invalid`;
  }
  return null;
}

/**
 * 设置字段数据值
 */
function setFieldValue<T extends Record<string, unknown>>(
  data: T,
  context: {
    formData: FormData;
    key: string;
    value: string;
    type?: "string" | "number" | "boolean" | "email";
  },
): void {
  if (context.type === "boolean") {
    // nosemgrep: object-injection-sink-dynamic-property — 键来自固定schema定义，已在遍历时限定，避免对象注入噪音
    (data as Record<string, unknown>)[context.key] = getFormDataBoolean(
      context.formData,
      context.key,
    );
  } else {
    // nosemgrep: object-injection-sink-dynamic-property — 键来自固定schema定义，已在遍历时限定，避免对象注入噪音
    (data as Record<string, unknown>)[context.key] = context.value;
  }
}

/**
 * 验证单个字段的所有规则
 */
function validateSingleField(
  key: string,
  value: string,
  rules: {
    required?: boolean;
    type?: "string" | "number" | "boolean" | "email";
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  },
): string[] {
  const fieldErrors: string[] = [];

  // 检查必需字段
  const requiredError = validateRequiredField(key, value, rules.required);
  if (requiredError) {
    fieldErrors.push(requiredError);
    return fieldErrors; // 如果必需字段为空，直接返回
  }

  // 如果字段为空且不是必需的，跳过验证
  if (!value && !rules.required) {
    return fieldErrors;
  }

  // 类型验证
  if (rules.type === "email" && value) {
    const emailError = validateEmailField(key, value);
    if (emailError) fieldErrors.push(emailError);
  }

  // 长度验证
  const lengthOptions: { minLength?: number; maxLength?: number } = {};
  if (rules.minLength !== undefined) lengthOptions.minLength = rules.minLength;
  if (rules.maxLength !== undefined) lengthOptions.maxLength = rules.maxLength;
  const lengthErrors = validateFieldLength(key, value, lengthOptions);
  fieldErrors.push(...lengthErrors);

  // 模式验证
  const patternError = validateFieldPattern(key, value, rules.pattern);
  if (patternError) fieldErrors.push(patternError);

  return fieldErrors;
}

/**
 * 基础表单数据验证工具
 */
export function validateFormData<T extends Record<string, unknown>>(
  formData: FormData,
  schema: Record<
    keyof T,
    {
      required?: boolean;
      type?: "string" | "number" | "boolean" | "email";
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
    }
  >,
): FormValidationResult<T> {
  const errors: string[] = [];
  const data = {} as T;

  for (const [key, rules] of Object.entries(schema)) {
    const value = getFormDataString(formData, key);

    // 验证字段
    const fieldErrors = validateSingleField(key, value, rules);
    errors.push(...fieldErrors);

    // 如果验证通过，设置数据值
    if (fieldErrors.length === 0 || (!rules.required && !value)) {
      const fieldValueOptions: {
        formData: FormData;
        key: string;
        value: string;
        type?: "string" | "number" | "boolean" | "email";
      } = {
        formData,
        key,
        value,
      };
      if (rules.type !== undefined) fieldValueOptions.type = rules.type;
      setFieldValue(data, fieldValueOptions);
    }
  }

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}
