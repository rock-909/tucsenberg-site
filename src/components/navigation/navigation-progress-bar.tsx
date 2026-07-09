"use client";

import { useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

const PROGRESS_START = 18;
const PROGRESS_CAP = 92;
const PROGRESS_TRICKLE_MS = 380;
const PROGRESS_COMPLETE_MS = 220;
const PROGRESS_HIDE_MS = 180;
const PROGRESS_MIN_VISIBLE_MS = 280;

function isInternalNavigationLink(anchor: HTMLAnchorElement): boolean {
  if (anchor.target === "_blank") {
    return false;
  }

  const href = anchor.getAttribute("href");
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }

  try {
    const target = new URL(href, window.location.href);
    const current = new URL(window.location.href);

    if (target.origin !== current.origin) {
      return false;
    }

    return !(
      target.pathname === current.pathname && target.search === current.search
    );
  } catch {
    return false;
  }
}

/** Modifier/button state a click must satisfy to trigger route progress. */
interface NavigationClickState {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * Decide whether a link click should start the route progress bar.
 *
 * Modifier clicks (Cmd/Ctrl/Shift/Alt), auxiliary buttons, already-handled
 * clicks, and downloads open a new tab or trigger no navigation, so the current
 * pathname never changes and `finish()` would never fire — leaving the bar
 * stuck. Only a plain primary-button click on an internal link starts it.
 */
export function shouldStartNavigationProgress(
  event: NavigationClickState,
  anchor: HTMLAnchorElement,
): boolean {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.hasAttribute("download")) return false;

  return isInternalNavigationLink(anchor);
}

function getCurrentRouteKey(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function getNextProgressValue(current: number): number {
  if (current >= PROGRESS_CAP) {
    return current;
  }

  const increment = 4 + Math.random() * 6;
  return Math.min(current + increment, PROGRESS_CAP);
}

export function NavigationProgressBar() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickleTimerRef = useRef<number | undefined>(undefined);
  const hideTimerRef = useRef<number | undefined>(undefined);
  const startedAtRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);
  const hasMountedRef = useRef(false);
  const currentRouteKeyRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (trickleTimerRef.current !== undefined) {
      window.clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = undefined;
    }

    if (hideTimerRef.current !== undefined) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = undefined;
    }
  }, []);

  const finish = useEffectEvent(() => {
    if (!isActiveRef.current) {
      return;
    }

    clearTimers();
    isActiveRef.current = false;
    setProgress(100);

    const elapsed =
      startedAtRef.current === null
        ? PROGRESS_MIN_VISIBLE_MS
        : Date.now() - startedAtRef.current;
    const remainingVisible = Math.max(PROGRESS_MIN_VISIBLE_MS - elapsed, 0);

    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
      startedAtRef.current = null;
    }, remainingVisible + PROGRESS_HIDE_MS);
  });

  const start = useEffectEvent(() => {
    if (reducedMotion) {
      return;
    }

    clearTimers();
    isActiveRef.current = true;
    startedAtRef.current = Date.now();
    setVisible(true);
    setProgress(PROGRESS_START);

    trickleTimerRef.current = window.setInterval(() => {
      setProgress(getNextProgressValue);
    }, PROGRESS_TRICKLE_MS);
  });

  useEffect(() => {
    currentRouteKeyRef.current = getCurrentRouteKey();

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    finish();
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const { target } = event;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (!shouldStartNavigationProgress(event, anchor)) {
        return;
      }

      start();
    };

    const handlePopState = () => {
      const nextRouteKey = getCurrentRouteKey();
      if (currentRouteKeyRef.current === nextRouteKey) {
        return;
      }

      currentRouteKeyRef.current = nextRouteKey;
      start();
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, [clearTimers]);

  if (reducedMotion || !visible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden pt-[env(safe-area-inset-top,0px)]"
      data-testid="navigation-progress-bar"
    >
      <div
        className={cn(
          "bg-primary h-full w-full origin-left shadow-[0_0_8px_color-mix(in_oklch,var(--primary)_35%,transparent)]",
          progress >= 100 ? "transition-none" : "transition-transform ease-out",
        )}
        data-testid="navigation-progress-bar-fill"
        style={{
          transform: `scaleX(${progress / 100})`,
          transitionDuration: `${progress >= 100 ? 0 : PROGRESS_COMPLETE_MS}ms`,
        }}
      />
    </div>
  );
}
