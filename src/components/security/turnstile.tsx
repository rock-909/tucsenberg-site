"use client";

import { useEffect, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import {
  INQUIRY_TURNSTILE_ACTION,
  TURNSTILE_DUMMY_TEST_TOKEN,
} from "@/constants/turnstile-constants";
import { logger } from "@/lib/logger";
import {
  TurnstileRescueLine,
  type TurnstileRescueLineProps,
} from "@/components/security/turnstile-rescue-line";
import {
  getPublicRuntimeEnvBoolean,
  getPublicRuntimeEnvString,
  isPublicRuntimeDevelopment,
  isPublicRuntimeProduction,
} from "@/lib/public-runtime-env";

/**
 * 使用全局 logger（开发环境输出，生产环境静默）
 */

// Turnstile 正常挑战通常 1-3 秒；15 秒足以排除慢网络的误触发。
const TURNSTILE_RESCUE_TIMEOUT_MS = 15_000;

interface TurnstileLabels {
  unavailable: string;
  devBypass: string;
  testMode: string;
  rescueBeforeEmail: string;
  rescueAfterEmail: string;
  rescueSubject: string;
}

interface TurnstileProps {
  onSuccess?: (_token: string) => void;
  onError?: (_error: string) => void;
  onExpire?: () => void;
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

interface TurnstileUnavailableStatusProps extends TurnstileStatusProps {
  rescue: TurnstileRescueLineProps;
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

/**
 * 挂载即启动救援计时器，拿到第一个令牌就清掉。不等 widget 的加载回调——
 * 脚本加载失败时那些回调一个都不触发，等它等于永远不计时。
 */
function useTurnstileRescueState() {
  const [hasFailed, setHasFailed] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const rescueTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    rescueTimerRef.current = setTimeout(
      () => setHasTimedOut(true),
      TURNSTILE_RESCUE_TIMEOUT_MS,
    );
    return () => clearTimeout(rescueTimerRef.current);
  }, []);

  const markSuccess = () => {
    // 定时器只清这一次。之后过期或提交清令牌都不会重启它，
    // 所以「正常提交后误弹救援行」这条路径从根上不存在。
    clearTimeout(rescueTimerRef.current);
    setHasTimedOut(false);
    setHasFailed(false);
  };

  const markFailed = () => setHasFailed(true);

  return { showRescue: hasFailed || hasTimedOut, markSuccess, markFailed };
}

function TurnstileUnavailableStatus({
  className,
  label,
  rescue,
}: TurnstileUnavailableStatusProps) {
  return (
    <output
      className={`turnstile-fallback ${className ?? ""}`}
      aria-live="polite"
    >
      <div className="text-sm text-[var(--error-foreground)]">{label}</div>
      <TurnstileRescueLine {...rescue} />
    </output>
  );
}

export function TurnstileWidget({
  onSuccess,
  onError,
  onExpire,
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
  const { showRescue, markSuccess, markFailed } = useTurnstileRescueState();
  const rescue = {
    beforeEmail: labels.rescueBeforeEmail,
    afterEmail: labels.rescueAfterEmail,
    subject: labels.rescueSubject,
  };

  useEffect(() => {
    if (!onReadyRef) {
      return undefined;
    }
    return onReadyRef(() => {
      turnstileRef.current?.reset();
    });
  }, [onReadyRef]);

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
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- Missing site key is external widget availability sync; no user event can own this callback.
      if (onError) {
        onError("Turnstile site key not configured");
      }
    }
  }, [siteKey, isBypassMode, isTestMode, onError]);

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

  if (!siteKey) {
    return (
      <TurnstileUnavailableStatus
        className={className}
        label={labels.unavailable}
        rescue={rescue}
      />
    );
  }

  const handleSuccess = (token: string) => {
    markSuccess();
    onSuccess?.(token);
  };

  const handleError = (error: string) => {
    logger.error("Turnstile error:", error);
    markFailed();
    if (onError) {
      onError(error);
    }
  };

  const handleExpire = () => {
    logger.warn("Turnstile token expired");
    if (onExpire) {
      onExpire();
    }
  };

  return (
    <div className={`turnstile-container ${className || ""}`}>
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onError={handleError}
        onExpire={handleExpire}
        options={{
          theme,
          size,
          tabIndex,
          action: INQUIRY_TURNSTILE_ACTION,
          cData,
        }}
        id={id}
      />
      {showRescue ? <TurnstileRescueLine {...rescue} /> : null}
    </div>
  );
}

// Re-export for convenience
export { Turnstile } from "@marsidev/react-turnstile";
