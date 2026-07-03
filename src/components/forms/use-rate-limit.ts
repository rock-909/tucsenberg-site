"use client";

import { useEffect, useRef, useState } from "react";
import { FIVE_MINUTES_MS } from "@/constants/time";
import { useCurrentTime } from "@/hooks/use-current-time";
import { getPublicRuntimeEnvNumber } from "@/lib/public-runtime-env";

/**
 * 获取配置的冷却时间（毫秒）
 * 支持通过环境变量覆盖，用于测试
 */
function getConfiguredCooldownMs(): number {
  const envValue =
    getPublicRuntimeEnvNumber("NEXT_PUBLIC_CONTACT_FORM_COOLDOWN_MS") ??
    Number.NaN;

  if (Number.isFinite(envValue) && envValue > 0) {
    return envValue;
  }

  return FIVE_MINUTES_MS;
}

/**
 * 管理表单提交的速率限制状态
 * @returns 速率限制状态和更新函数
 */
export function useRateLimit() {
  const [lastSubmissionTime, setLastSubmissionTime] = useState<Date | null>(
    null,
  );
  const rateLimitResetTimeoutRef = useRef<number | null>(null);

  // 使用自定义 hook 获取当前时间，每 5 秒更新一次（足够用于速率限制 UI）
  const currentTime = useCurrentTime(5000, lastSubmissionTime !== null);

  const RATE_LIMIT_WINDOW = getConfiguredCooldownMs();

  // 计算是否处于速率限制状态
  const isRateLimited = Boolean(
    lastSubmissionTime &&
    currentTime - lastSubmissionTime.getTime() < RATE_LIMIT_WINDOW,
  );

  // 管理速率限制重置定时器
  useEffect(() => {
    let timeoutId: number | null = null;

    // 清理之前的定时器
    if (rateLimitResetTimeoutRef.current !== null) {
      window.clearTimeout(rateLimitResetTimeoutRef.current);
      rateLimitResetTimeoutRef.current = null;
    }

    if (lastSubmissionTime) {
      const elapsed = Date.now() - lastSubmissionTime.getTime();
      const remaining = RATE_LIMIT_WINDOW - elapsed;

      if (remaining <= 0) {
        // 使用 setTimeout 避免在 effect 中同步 setState
        timeoutId = window.setTimeout(() => {
          setLastSubmissionTime(null);
        }, 0);
        rateLimitResetTimeoutRef.current = timeoutId;
      } else {
        timeoutId = window.setTimeout(() => {
          setLastSubmissionTime(null);
        }, remaining);
        rateLimitResetTimeoutRef.current = timeoutId;
      }
    }

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        rateLimitResetTimeoutRef.current = null;
      }
    };
  }, [lastSubmissionTime, RATE_LIMIT_WINDOW]);

  // 记录提交时间
  const recordSubmission = () => {
    setLastSubmissionTime(new Date());
  };

  return {
    isRateLimited,
    lastSubmissionTime,
    recordSubmission,
    setLastSubmissionTime,
  };
}
