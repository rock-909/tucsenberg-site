"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useCookieConsentOptional } from "@/lib/cookie-consent";
import type { CookieConsentContextValue } from "@/lib/cookie-consent/types";
import {
  getPublicRuntimeEnvString,
  isPublicRuntimeProduction,
} from "@/lib/public-runtime-env";

/**
 * Decide whether analytics may run for the current consent state.
 *
 * When the consent context is absent (null) or not yet ready, analytics is
 * denied: GDPR treats an unknown consent decision as "no". Only an explicit,
 * ready, granted decision unlocks analytics.
 */
export function resolveAnalyticsAllowed(
  consent: Pick<CookieConsentContextValue, "ready" | "consent"> | null,
): boolean {
  if (!consent) return false;
  if (!consent.ready) return false;
  return consent.consent.analytics;
}

function ensureGa4QueueInitialized(measurementId: string): void {
  if (!Array.isArray(window.dataLayer)) {
    window.dataLayer = [];
  }
  if (typeof window.gtag !== "function") {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };
  }
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    page_path: window.location.pathname,
    send_page_view: false,
  });
}

export function EnterpriseAnalyticsIsland() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isProd = isPublicRuntimeProduction();
  const gaMeasurementId = getPublicRuntimeEnvString(
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  );
  const cookieConsent = useCookieConsentOptional();

  const analyticsAllowed = resolveAnalyticsAllowed(cookieConsent);

  const gaEnabled = Boolean(gaMeasurementId) && analyticsAllowed && isProd;
  const gaInitRef = useRef(false);

  useEffect(() => {
    if (!gaEnabled || gaInitRef.current) return;
    ensureGa4QueueInitialized(gaMeasurementId!);
    gaInitRef.current = true;
  }, [gaEnabled, gaMeasurementId]);

  useEffect(() => {
    if (!gaEnabled || typeof window.gtag !== "function") return;
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.gtag("config", gaMeasurementId!, {
      page_path: url,
      page_location: window.location.href,
    });
  }, [pathname, searchParams, gaEnabled, gaMeasurementId]);

  if (!analyticsAllowed) return null;

  return (
    <>
      {gaEnabled && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
