"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { logger } from "@/lib/logger";
import {
  getPublicRuntimeEnvBoolean,
  getPublicRuntimeEnvString,
  isPublicRuntimeDevelopment,
} from "@/lib/env";
import { StatusCallout } from "@/components/ui/status-callout";

/**
 * 使用全局 logger（开发环境输出，生产环境静默）
 */

interface TurnstileLabels {
  unavailable: string;
  devBypass: string;
  testMode: string;
}

interface TurnstileProps {
  onSuccess?: (_token: string) => void;
  onError?: (_error: string) => void;
  onExpire?: () => void;
  onLoad?: () => void;
  className?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  tabIndex?: number;
  id?: string;
  action?: string;
  cData?: string;
  labels?: TurnstileLabels;
}

interface TurnstileStatusProps {
  className: string | undefined;
  label: string;
}

const DEFAULT_TURNSTILE_LABELS = {
  unavailable: "Security verification is temporarily unavailable.",
  devBypass: "Dev mode: Turnstile verification bypassed",
  testMode: "Bot protection disabled in test mode",
} satisfies TurnstileLabels;

function TurnstileBypassStatus({ className, label }: TurnstileStatusProps) {
  return (
    <StatusCallout
      className={`turnstile-bypass ${className ?? ""}`}
      data-testid="turnstile-bypass"
      tone="warning"
    >
      {label}
    </StatusCallout>
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

function TurnstileUnavailableStatus({
  className,
  label,
}: TurnstileStatusProps) {
  return (
    <StatusCallout
      className={`turnstile-fallback ${className ?? ""}`}
      tone="warning"
    >
      {label}
    </StatusCallout>
  );
}

/**
 * Cloudflare Turnstile CAPTCHA component
 */
export function TurnstileWidget({
  onSuccess,
  onError,
  onExpire,
  onLoad,
  className,
  theme = "auto",
  size = "normal",
  tabIndex,
  id,
  action = getPublicRuntimeEnvString("NEXT_PUBLIC_TURNSTILE_ACTION") ||
    "contact_form",
  cData,
  labels,
}: TurnstileProps) {
  const siteKey = getPublicRuntimeEnvString("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  const isBypassMode =
    isPublicRuntimeDevelopment() &&
    getPublicRuntimeEnvBoolean("NEXT_PUBLIC_TURNSTILE_BYPASS") === true;
  const isTestMode =
    getPublicRuntimeEnvBoolean("NEXT_PUBLIC_TEST_MODE") === true;
  const bypassTriggeredRef = useRef(false);
  const labelText = labels ?? DEFAULT_TURNSTILE_LABELS;

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (!isBypassMode || bypassTriggeredRef.current) return;
    bypassTriggeredRef.current = true;
    logger.warn("[DEV] Turnstile bypass mode enabled");
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- Turnstile dev bypass is an external widget adapter state, not a user event.
    if (onSuccess) {
      onSuccess("TURNSTILE_BYPASS_TOKEN");
    }
  }, [isBypassMode, onSuccess]);

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

  // Conditional returns after all hooks
  if (isBypassMode) {
    return (
      <TurnstileBypassStatus
        className={className}
        label={labelText.devBypass}
      />
    );
  }

  if (isTestMode) {
    return (
      <TurnstileMockStatus className={className} label={labelText.testMode} />
    );
  }

  if (!siteKey) {
    return (
      <TurnstileUnavailableStatus
        className={className}
        label={labelText.unavailable}
      />
    );
  }

  const handleSuccess = (token: string) => {
    if (onSuccess) {
      onSuccess(token);
    }
  };

  const handleError = (error: string) => {
    logger.error("Turnstile error:", error);
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

  const handleLoad = () => {
    if (onLoad) {
      onLoad();
    }
  };

  return (
    <div className={`turnstile-container ${className || ""}`}>
      <Turnstile
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onError={handleError}
        onExpire={handleExpire}
        onLoad={handleLoad}
        options={{
          theme,
          size,
          tabIndex,
          action,
          cData,
        }}
        id={id}
      />
    </div>
  );
}

/**
 * Hook for managing Turnstile state
 */
export function useTurnstile() {
  const [isVerified, setIsVerified] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, _setError] = useState<string | null>(null);
  const [isLoading, _setIsLoading] = useState(false);

  const handleSuccessCallback = useCallback((verificationToken: string) => {
    setToken(verificationToken);
    setIsVerified(true);
    _setError(null);
    _setIsLoading(false);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    _setError(errorMessage);
    setIsVerified(false);
    setToken(null);
    _setIsLoading(false);
  }, []);

  const handleExpire = useCallback(() => {
    setIsVerified(false);
    setToken(null);
    _setError(null);
    _setIsLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    _setIsLoading(true);
    _setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsVerified(false);
    setToken(null);
    _setError(null);
    _setIsLoading(false);
  }, []);

  return {
    isVerified,
    token,
    error,
    isLoading,
    handlers: {
      onSuccess: handleSuccessCallback,
      onError: handleError,
      onExpire: handleExpire,
      onLoad: handleLoad,
    },
    reset,
  };
}

// Re-export for convenience
export { Turnstile } from "@marsidev/react-turnstile";
