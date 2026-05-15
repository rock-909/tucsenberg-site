import type { Metadata } from "next";
import { LOCALES_CONFIG, SITE_CONFIG } from "@/config/paths";
import { isPublicSeoLocale } from "@/config/paths/locales-config";
import { ONE } from "@/constants";
import { getRuntimeEnvString } from "@/lib/env";

function buildLayoutRobots(locale: string): Metadata["robots"] {
  const isKnownLocale = LOCALES_CONFIG.locales.includes(
    locale as (typeof LOCALES_CONFIG.locales)[number],
  );
  const shouldIndex = isKnownLocale ? isPublicSeoLocale(locale) : true;

  return {
    index: shouldIndex,
    follow: shouldIndex,
    googleBot: {
      index: shouldIndex,
      follow: shouldIndex,
      "max-video-preview": -ONE,
      "max-image-preview": "large",
      "max-snippet": -ONE,
    },
  };
}

/**
 * Locale layout metadata (base only).
 *
 * Next.js metadata is shallow-merged: page routes that don't explicitly return
 * `alternates` or `openGraph` may inherit those fields from layouts.
 *
 * This function intentionally avoids returning `alternates` / `openGraph` to
 * prevent polluting all child pages. Per-page metadata should be generated via
 * path-aware helpers (see `generateMetadataForPath`).
 */
export async function generateLocaleMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadataBaseUrl = SITE_CONFIG.baseUrl || "http://localhost:3000";

  return {
    metadataBase: new URL(metadataBaseUrl),
    title: {
      default: SITE_CONFIG.seo.defaultTitle,
      template: SITE_CONFIG.seo.titleTemplate,
    },
    description: SITE_CONFIG.seo.defaultDescription,
    robots: buildLayoutRobots(locale),
    verification: {
      google: getRuntimeEnvString("GOOGLE_SITE_VERIFICATION"),
      yandex: getRuntimeEnvString("YANDEX_VERIFICATION"),
    },
  };
}
