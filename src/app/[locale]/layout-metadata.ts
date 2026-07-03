import type { Metadata } from "next";
import { SITE_CONFIG } from "@/config/paths";
import { ONE } from "@/constants";
import { getRuntimeEnvString } from "@/lib/env";

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
  // await params 是 Next.js 16 的要求，但解析很快
  await params;
  const metadataBaseUrl = SITE_CONFIG.baseUrl || "http://localhost:3000";

  return {
    metadataBase: new URL(metadataBaseUrl),
    title: {
      default: SITE_CONFIG.seo.defaultTitle,
      template: SITE_CONFIG.seo.titleTemplate,
    },
    description: SITE_CONFIG.seo.defaultDescription,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -ONE,
        "max-image-preview": "large",
        "max-snippet": -ONE,
      },
    },
    verification: {
      google: getRuntimeEnvString("GOOGLE_SITE_VERIFICATION"),
      yandex: getRuntimeEnvString("YANDEX_VERIFICATION"),
    },
  };
}
