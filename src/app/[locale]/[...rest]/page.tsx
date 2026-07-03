import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export function generateMetadata(): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
    },
  };
}

/**
 * Catch-all route for unmatched paths under /[locale]/...
 *
 * Without this, Next.js renders its default 404 page instead of
 * the custom not-found.tsx in the [locale] segment. This ensures
 * users see the localized 404 page with a "Go Home" button.
 *
 * cacheComponents requires generateStaticParams to return at least
 * one entry. The placeholder paths will call notFound() during
 * pre-render, which Next.js handles by generating 404 pages.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale,
    rest: ["__not-found-placeholder"],
  }));
}

export default function CatchAllNotFound() {
  notFound();
}
