/**
 * Route parsing utilities for i18n navigation
 *
 * Provides functions to parse and normalize pathnames for use with next-intl's
 * Link component, handling both static and dynamic routes.
 */
import type { ComponentProps } from "react";
import { DYNAMIC_PATHS_CONFIG } from "@/config/paths/paths-config";
import type { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing-config";

/**
 * Type for Link href prop, extracted from next-intl's Link component.
 * Supports both string paths and objects with pathname + params for dynamic routes.
 */
export type LinkHref = ComponentProps<typeof Link>["href"];

/**
 * Dynamic route pattern configuration.
 * Maps URL patterns to their corresponding Link href builders.
 */
interface DynamicRoutePattern {
  /** Regex pattern to match the URL */
  pattern: RegExp;
  /** Function to build the Link href from regex match groups */
  buildHref: (match: RegExpMatchArray) => LinkHref;
}

type DynamicRouteKey = keyof typeof DYNAMIC_PATHS_CONFIG;

function routePatternToRegex(pattern: string): RegExp {
  const escaped = escapeRegExp(pattern).replace(/\\\[([^/]+?)\\\]/g, "([^/]+)");
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
  // eslint-disable-next-line security/detect-non-literal-regexp -- patterns come from trusted static route config
  return new RegExp(`^${escaped}$`);
}

const DYNAMIC_ROUTE_BUILDERS: Record<
  DynamicRouteKey,
  (match: RegExpMatchArray) => LinkHref
> = {
  productMarket: (match) => ({
    pathname: DYNAMIC_PATHS_CONFIG.productMarket.pattern,
    params: { market: match[1]! },
  }),
  blogArticle: (match) => ({
    pathname: DYNAMIC_PATHS_CONFIG.blogArticle.pattern,
    params: { slug: match[1]! },
  }),
  membraneProduct: (match) => ({
    pathname: DYNAMIC_PATHS_CONFIG.membraneProduct.pattern,
    params: { product: match[1]! },
  }),
  compatibleBrand: (match) => ({
    pathname: DYNAMIC_PATHS_CONFIG.compatibleBrand.pattern,
    params: { brand: match[1]! },
  }),
};

/**
 * Dynamic route patterns for matching actual URLs to route patterns.
 *
 * When a user navigates between locales, the current URL (e.g., `/products/europe`)
 * needs to be mapped back to its route pattern (e.g., `/products/[market]`) with params.
 *
 * Order matters: more-specific patterns (more segments) must come first
 * to avoid false matches by shorter patterns.
 *
 * @example
 * // URL: /products/europe
 * // Matches pattern: /^\/products\/([^/]+)$/
 * // Returns: { pathname: "/products/[market]", params: { market: "europe" } }
 */
export const DYNAMIC_ROUTE_PATTERNS: readonly DynamicRoutePattern[] = (
  Object.entries(DYNAMIC_PATHS_CONFIG) as Array<
    [DynamicRouteKey, (typeof DYNAMIC_PATHS_CONFIG)[DynamicRouteKey]]
  >
).map(([key, config]) => ({
  pattern: routePatternToRegex(config.pattern),
  buildHref: DYNAMIC_ROUTE_BUILDERS[key],
}));

/**
 * Regex to match and strip locale prefixes from pathnames.
 *
 * NOTE: When adding new locales to the application, this regex
 * must be updated to include them.
 *
 * @example
 * "/en/about".replace(LOCALE_PREFIX_RE, "") // → "/about"
 * "/zh/products/europe".replace(LOCALE_PREFIX_RE, "") // → "/products/europe"
 * "/about".replace(LOCALE_PREFIX_RE, "") // → "/about" (no change)
 */
function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const LOCALE_PREFIX_PATTERN = routing.locales
  .map((locale) => escapeRegExp(locale))
  .join("|");

// nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
// eslint-disable-next-line security/detect-non-literal-regexp -- locales come from trusted static routing config
export const LOCALE_PREFIX_RE = new RegExp(
  `^\\/(${LOCALE_PREFIX_PATTERN})(?=\\/|$)`,
);

/**
 * Normalizes a pathname by stripping the locale prefix and handling edge cases.
 * Ensures consistent pathname format for Link href construction.
 *
 * @param pathname - Pathname from usePathname() (no query/hash, may have locale prefix)
 * @returns Normalized pathname without locale prefix (guaranteed to start with '/' or be '/')
 *
 * @example
 * normalizePathnameForLink("/en/about")  // → "/about"
 * normalizePathnameForLink("/zh/")       // → "/"
 * normalizePathnameForLink("")           // → "/"
 * normalizePathnameForLink("/about")     // → "/about"
 */
export function normalizePathnameForLink(pathname: string): string {
  const normalized = pathname === "" ? "/" : pathname;
  const withLeadingSlash = normalized.startsWith("/")
    ? normalized
    : `/${normalized}`;
  const stripped = withLeadingSlash.replace(LOCALE_PREFIX_RE, "");
  return stripped === "" ? "/" : stripped;
}

/**
 * Parses a pathname to build the appropriate href for next-intl's Link component.
 *
 * Handles both:
 * - Static routes: Returns the pathname string directly
 * - Dynamic routes: Returns an object with pathname pattern and params
 *
 * @param currentPathname - Current pathname from usePathname()
 * @returns LinkHref suitable for the Link component's href prop
 *
 * @example
 * // Static route
 * parsePathnameForLink("/en/about")
 * // → "/about"
 *
 * // Dynamic route
 * parsePathnameForLink("/zh/products/europe")
 * // → { pathname: "/products/[market]", params: { market: "europe" } }
 */
export function parsePathnameForLink(currentPathname: string): LinkHref {
  const pathname = normalizePathnameForLink(currentPathname);

  for (const { pattern, buildHref } of DYNAMIC_ROUTE_PATTERNS) {
    const match = pathname.match(pattern);
    if (match?.[1]) {
      return buildHref(match);
    }
  }

  // Static routes - cast required because usePathname returns runtime string
  // while LinkHref expects typed route literals. This cast relies on the
  // assumption that users navigate through app routes; invalid URLs will
  // still work but won't have type checking benefits.
  return pathname as LinkHref;
}
