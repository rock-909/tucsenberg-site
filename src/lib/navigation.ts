/**
 * Navigation Configuration and Utilities
 *
 * This module provides navigation configuration, route definitions,
 * and utility functions for the responsive navigation system.
 */
import type { Locale } from "@/types/i18n";
import { LOCALES_CONFIG } from "@/config/paths/locales-config";
import { BREAKPOINT_MD, BREAKPOINT_XL } from "@/constants/breakpoints";
import { BYTES_PER_KB } from "@/constants/core";
import { COUNT_250 } from "@/constants/count";
import { PERCENTAGE_FULL } from "@/constants/decimal";
import {
  SINGLE_SITE_NAVIGATION,
  type SiteNavigationItem,
} from "@/config/single-site-navigation";

export type NavigationItem = SiteNavigationItem;

// Main navigation is authored in `src/config/single-site.ts`; this wrapper keeps
// existing consumers pinned to the active single-site source.
export const mainNavigation: NavigationItem[] = SINGLE_SITE_NAVIGATION;

// Mobile navigation configuration (can be different from main nav)
export const mobileNavigation: NavigationItem[] = mainNavigation;

// Utility function to check if a path is active
export function isActivePath(currentPath: string, itemPath: string): boolean {
  // Handle empty string as root path
  let cleanCurrentPath = currentPath || "/";

  // Remove locale prefix for comparison using safe string matching
  for (const locale of LOCALES_CONFIG.locales) {
    const localePrefix = `/${locale}`;
    if (cleanCurrentPath.startsWith(localePrefix)) {
      cleanCurrentPath = cleanCurrentPath.slice(localePrefix.length) || "/";
      break;
    }
  }

  const cleanItemPath = itemPath === "/" ? "/" : itemPath;

  // Handle root path matching
  if (cleanItemPath === "/") {
    return cleanCurrentPath === "/";
  }

  // Ensure we match complete path segments, not partial matches
  // Add trailing slash to both paths for comparison to avoid partial matches
  const normalizedCurrentPath = cleanCurrentPath.endsWith("/")
    ? cleanCurrentPath
    : `${cleanCurrentPath}/`;
  const normalizedItemPath = cleanItemPath.endsWith("/")
    ? cleanItemPath
    : `${cleanItemPath}/`;

  return normalizedCurrentPath.startsWith(normalizedItemPath);
}

// Utility function to get localized href
export function getLocalizedHref(href: string, locale: Locale): string {
  if (
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return href;
  }

  // For root path, return just the locale
  if (href === "/") {
    return `/${locale}`;
  }

  // For other paths, prepend locale
  return `/${locale}${href}`;
}

// Navigation breakpoints
export const NAVIGATION_BREAKPOINTS = Object.freeze({
  mobile: BREAKPOINT_MD,
  tablet: BYTES_PER_KB,
  desktop: BREAKPOINT_XL,
} as const);

// Animation durations
export const NAVIGATION_ANIMATIONS = Object.freeze({
  mobileMenuToggle: COUNT_250,
  dropdownFade: PERCENTAGE_FULL,
  hoverTransition: PERCENTAGE_FULL,
} as const);

// ARIA labels and accessibility
export const NAVIGATION_ARIA = Object.freeze({
  mainNav: "Main navigation",
  mobileMenuButton: "Toggle mobile menu",
  mobileMenu: "Mobile navigation menu",
  languageSelector: "Language selector",
  themeSelector: "Theme selector",
  skipToContent: "Skip to main content",
} as const);
