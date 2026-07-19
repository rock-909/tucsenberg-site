"use client";

import {
  type CSSProperties,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { IDLE_CALLBACK_TIMEOUT_LONG } from "@/constants/time";
import { TURNSTILE_WIDGET_HEIGHT_PX } from "@/constants/turnstile-constants";
import { requestIdleCallback } from "@/lib/idle-callback";
import { LazyIslandErrorBoundary } from "@/components/ui/lazy-island-error-boundary";
import { TurnstileRescueLine } from "@/components/security/turnstile-rescue-line";

const TURNSTILE_PLACEHOLDER_CLASS_NAME =
  "h-[var(--turnstile-placeholder-height)] w-full animate-pulse rounded-md bg-muted";

type TurnstilePlaceholderStyle = CSSProperties & {
  "--turnstile-placeholder-height": string;
};

interface LazyTurnstileLabels {
  unavailable: string;
  loadFailed: string;
  devBypass: string;
  testMode: string;
  rescueBeforeEmail: string;
  rescueAfterEmail: string;
  rescueSubject: string;
}

interface LazyTurnstileProps {
  onSuccess?: (token: string) => void;
  onError?: (reason?: string) => void;
  onExpire?: () => void;
  onLoad?: () => void;
  onReadyRef?: (reset: () => void) => (() => void) | void;
  className?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  tabIndex?: number;
  id?: string;
  cData?: string;
  labels: LazyTurnstileLabels;
}

const TurnstileWidget = lazy(() =>
  import("@/components/security/turnstile").then((mod) => ({
    default: mod.TurnstileWidget,
  })),
);

function createTurnstilePlaceholderStyle(
  size: NonNullable<LazyTurnstileProps["size"]>,
): TurnstilePlaceholderStyle {
  const placeholderHeight =
    size === "compact"
      ? TURNSTILE_WIDGET_HEIGHT_PX.compact
      : TURNSTILE_WIDGET_HEIGHT_PX.normal;

  return {
    "--turnstile-placeholder-height": `${placeholderHeight}px`,
  };
}

/**
 * 延迟渲染逻辑
 * - 优先：进入视口（IntersectionObserver）
 * - 退化：空闲时加载（requestIdleCallback timeout）
 */
function useLazyRender(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let io: IntersectionObserver | null = null;
    let cancelled = false;
    let cleanupIdle: () => void = () => undefined;

    const enableRender = () => {
      if (cancelled) return;
      setShouldRender(true);
      io?.disconnect();
      io = null;
    };

    if (!shouldRender) {
      const el = containerRef.current;

      if (typeof IntersectionObserver !== "undefined" && el) {
        io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                enableRender();
                break;
              }
            }
          },
          { rootMargin: "200px" },
        );

        io.observe(el);
      }

      cleanupIdle = requestIdleCallback(enableRender, {
        fallbackDelay: IDLE_CALLBACK_TIMEOUT_LONG,
        timeout: IDLE_CALLBACK_TIMEOUT_LONG,
      });
    }

    return () => {
      cancelled = true;
      cleanupIdle();
      io?.disconnect();
    };
  }, [containerRef, shouldRender]);

  return shouldRender;
}

function buildLazyTurnstileWidgetProps(args: {
  props: LazyTurnstileProps;
  labelText: LazyTurnstileLabels;
  theme: NonNullable<LazyTurnstileProps["theme"]>;
  size: NonNullable<LazyTurnstileProps["size"]>;
}) {
  const { props, labelText, theme, size } = args;
  return {
    className: props.className ?? "w-full",
    theme,
    size,
    labels: {
      unavailable: labelText.unavailable,
      devBypass: labelText.devBypass,
      testMode: labelText.testMode,
      rescueBeforeEmail: labelText.rescueBeforeEmail,
      rescueAfterEmail: labelText.rescueAfterEmail,
      rescueSubject: labelText.rescueSubject,
    },
    ...(props.onSuccess ? { onSuccess: props.onSuccess } : {}),
    ...(props.onError ? { onError: props.onError } : {}),
    ...(props.onExpire ? { onExpire: props.onExpire } : {}),
    ...(props.onLoad ? { onLoad: props.onLoad } : {}),
    ...(props.onReadyRef ? { onReadyRef: props.onReadyRef } : {}),
    ...(props.tabIndex !== undefined ? { tabIndex: props.tabIndex } : {}),
    ...(props.id !== undefined ? { id: props.id } : {}),
    ...(props.cData !== undefined ? { cData: props.cData } : {}),
  };
}

/**
 * 延迟加载 Turnstile CAPTCHA 组件
 * 优先在进入视口时加载，退化为空闲时加载
 */
export function LazyTurnstile(props: LazyTurnstileProps) {
  const { onError, className, theme = "auto", size = "normal", labels } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldRender = useLazyRender(containerRef);
  const placeholderStyle = createTurnstilePlaceholderStyle(size);
  const placeholder = (
    <div className={TURNSTILE_PLACEHOLDER_CLASS_NAME} aria-hidden="true" />
  );
  const failureFallback = (
    <output
      className={`turnstile-fallback ${className ?? "w-full"}`}
      aria-live="polite"
    >
      <div className="text-sm text-[var(--error-foreground)]">
        {labels.loadFailed}
      </div>
      <TurnstileRescueLine
        beforeEmail={labels.rescueBeforeEmail}
        afterEmail={labels.rescueAfterEmail}
        subject={labels.rescueSubject}
      />
    </output>
  );
  const handleLazyError = () => {
    onError?.(labels.loadFailed);
  };
  const turnstileProps = buildLazyTurnstileWidgetProps({
    props,
    labelText: labels,
    theme,
    size,
  });

  return (
    <div className="space-y-2" ref={containerRef} style={placeholderStyle}>
      {shouldRender ? (
        <LazyIslandErrorBoundary
          fallback={failureFallback}
          onError={handleLazyError}
        >
          <Suspense fallback={placeholder}>
            <TurnstileWidget {...turnstileProps} />
          </Suspense>
        </LazyIslandErrorBoundary>
      ) : (
        placeholder
      )}
    </div>
  );
}
