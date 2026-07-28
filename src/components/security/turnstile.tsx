"use client";

import { useCallback, useEffect, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import {
  INQUIRY_TURNSTILE_ACTION,
  TURNSTILE_DUMMY_TEST_TOKEN,
} from "@/constants/turnstile-constants";
import { logger } from "@/lib/logger";
import {
  getPublicRuntimeEnvBoolean,
  getPublicRuntimeEnvString,
  isPublicRuntimeDevelopment,
  isPublicRuntimeProduction,
} from "@/lib/public-runtime-env";

/**
 * 使用全局 logger（开发环境输出，生产环境静默）
 */

/**
 * 控件报告给上层的降级状态。救援提示（那条「改发邮件」）由 `LazyTurnstile`
 * 统一渲染——它是唯一能覆盖「懒加载 chunk 一直挂起、控件根本没挂载」的那一层。
 * 这里只报状态，不选文案。
 */
export type TurnstileDegradedKind = "unavailable" | "failed";

interface TurnstileLabels {
  devBypass: string;
  testMode: string;
}

interface TurnstileProps {
  onSuccess?: (_token: string) => void;
  onError?: (_error: string) => void;
  onExpire?: () => void;
  /** 控件进入降级状态时通知上层，由上层决定展示哪句文案与救援出路。 */
  onDegraded?: (_kind: TurnstileDegradedKind) => void;
  /**
   * Receives a widget `reset()` binder. May return an unregister/cleanup
   * function invoked when the widget unmounts or the binder changes.
   */
  onReadyRef?: (reset: () => void) => (() => void) | void;
  className?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  tabIndex?: number;
  id?: string;
  cData?: string;
  labels: TurnstileLabels;
}

interface TurnstileStatusProps {
  className: string | undefined;
  label: string;
}

function TurnstileBypassStatus({ className, label }: TurnstileStatusProps) {
  return (
    <output
      className={`turnstile-bypass ${className ?? ""}`}
      data-testid="turnstile-bypass"
      aria-live="polite"
    >
      <div className="rounded-md border border-[var(--warning-border)] bg-[var(--warning-muted)] p-3 text-sm text-[var(--warning-foreground)]">
        {label}
      </div>
    </output>
  );
}

function TurnstileMockStatus({ className, label }: TurnstileStatusProps) {
  return (
    <div
      className={`turnstile-mock ${className ?? ""}`}
      data-testid="turnstile-mock"
    >
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export function TurnstileWidget({
  onSuccess,
  onError,
  onExpire,
  onDegraded,
  onReadyRef,
  className,
  theme = "auto",
  size = "normal",
  tabIndex,
  id,
  cData,
  labels,
}: TurnstileProps) {
  const siteKey = getPublicRuntimeEnvString("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  const isBypassMode =
    isPublicRuntimeDevelopment() &&
    getPublicRuntimeEnvBoolean("NEXT_PUBLIC_TURNSTILE_BYPASS") === true;
  const appEnv = getPublicRuntimeEnvString("NEXT_PUBLIC_APP_ENV"),
    isTestMode =
      appEnv !== "production" &&
      (!isPublicRuntimeProduction() || appEnv === "preview") &&
      getPublicRuntimeEnvBoolean("NEXT_PUBLIC_TEST_MODE") === true;
  const autoResolveTriggeredRef = useRef(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const handleReset = useCallback(() => {
    turnstileRef.current?.reset();
  }, []);

  useEffect(() => {
    if (!onReadyRef) {
      return undefined;
    }
    return onReadyRef(handleReset);
  }, [onReadyRef, handleReset]);

  // All hooks must be called before any conditional returns. Dev bypass and
  // test mode both replace the real widget, so they share one settle-once
  // effect instead of two near-identical ones. Bypass wins if both are on.
  useEffect(() => {
    if (autoResolveTriggeredRef.current) return;
    // Bypass and test mode auto-resolve once via onSuccess; no separate load callback.
    if (isBypassMode) {
      autoResolveTriggeredRef.current = true;
      logger.warn("[DEV] Turnstile bypass mode enabled");
      onSuccess?.("TURNSTILE_BYPASS_TOKEN");
    } else if (isTestMode) {
      autoResolveTriggeredRef.current = true;
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent -- Preview test mode must settle the same parent token contract as the external widget callback.
      onSuccess?.(TURNSTILE_DUMMY_TEST_TOKEN);
    }
  }, [isBypassMode, isTestMode, onSuccess]);

  useEffect(() => {
    if (!siteKey && !isBypassMode && !isTestMode) {
      logger.warn(
        "Turnstile site key not configured. Bot protection is disabled.",
      );
      // 缺 site key 是外部配置状态，不是用户动作，只能在 effect 里同步给上层。
      onDegraded?.("unavailable");
      onError?.("Turnstile site key not configured");
    }
  }, [siteKey, isBypassMode, isTestMode, onDegraded, onError]);

  if (isBypassMode) {
    return (
      <TurnstileBypassStatus className={className} label={labels.devBypass} />
    );
  }

  if (isTestMode) {
    return (
      <TurnstileMockStatus className={className} label={labels.testMode} />
    );
  }

  // 缺 site key 时这里不渲染任何提示：状态已经通过 onDegraded 报给上层，
  // 由上层统一出「一句状态 + 一条邮件出路」，避免出现第二处救援提示。
  if (!siteKey) {
    return null;
  }

  const widgetHandlers = {
    onSuccess: (token: string) => onSuccess?.(token),
    onError: (error: string) => {
      logger.error("Turnstile error:", error);
      onDegraded?.("failed");
      onError?.(error);
    },
    onExpire: () => {
      logger.warn("Turnstile token expired");
      onExpire?.();
    },
  };

  return (
    <div className={`turnstile-container ${className || ""}`}>
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        {...widgetHandlers}
        options={{
          theme,
          size,
          tabIndex,
          action: INQUIRY_TURNSTILE_ACTION,
          cData,
        }}
        id={id}
      />
    </div>
  );
}

// Re-export for convenience
export { Turnstile } from "@marsidev/react-turnstile";
