"use client";

import { useEffect } from "react";

const ATTRIBUTION_PARAM_PATTERN = /(?:^|[?&])(utm_|gclid=|fbclid=|msclkid=)/i;
const ATTRIBUTION_FLUSH_EVENTS = ["storage", "visibilitychange"] as const;

type AttributionModule = Pick<
  typeof import("@/lib/marketing/utm"),
  "flushPendingAttribution" | "storeAttributionData"
>;
type AttributionModuleLoader = () => Promise<AttributionModule>;
type AttributionFlushHandler = AttributionModule["flushPendingAttribution"];

interface AttributionBootstrapProps {
  loadModule?: AttributionModuleLoader;
}

export function loadAttributionModule() {
  return import("@/lib/marketing/utm");
}

export function shouldLoadAttribution(search: string) {
  return ATTRIBUTION_PARAM_PATTERN.test(search);
}

export function registerAttributionFlushListeners(
  flushPendingAttribution: AttributionFlushHandler,
) {
  for (const eventName of ATTRIBUTION_FLUSH_EVENTS) {
    window.addEventListener(eventName, flushPendingAttribution);
  }

  return () => {
    for (const eventName of ATTRIBUTION_FLUSH_EVENTS) {
      window.removeEventListener(eventName, flushPendingAttribution);
    }
  };
}

export function AttributionBootstrap({
  loadModule = loadAttributionModule,
}: AttributionBootstrapProps) {
  useEffect(() => {
    if (!shouldLoadAttribution(window.location.search)) {
      return undefined;
    }

    let cancelled = false;
    let removeFlushListeners: (() => void) | undefined;

    loadModule()
      .then(({ flushPendingAttribution, storeAttributionData }) => {
        if (!cancelled) {
          storeAttributionData();
          removeFlushListeners = registerAttributionFlushListeners(
            flushPendingAttribution,
          );
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      removeFlushListeners?.();
    };
  }, [loadModule]);

  return null;
}
