/**
 * Blur placeholder utilities for Next.js Image component.
 *
 * For static local images, Next.js automatically generates blurDataURL at build time
 * when using static imports. For dynamic paths (e.g., from MDX frontmatter), we provide
 * a lightweight shimmer placeholder as a fallback.
 *
 * Performance strategy:
 * - Prefer static imports for critical above-the-fold images when possible
 * - Use shimmer placeholder for dynamic/remote images to improve perceived LCP
 * - CSS-based blur filter provides instant visual feedback while image loads
 *
 * Note: Base64 strings are pre-computed constants (not Buffer.from at runtime)
 * to prevent the Node.js Buffer polyfill (~5KB) from entering the client bundle.
 */

/**
 * Pre-computed base64 of the shimmer SVG (animated gradient, 10x10).
 * Equivalent to Buffer.from(SHIMMER_SVG.trim()).toString("base64") but avoids
 * pulling Buffer into the client bundle.
 */
const SHIMMER_BASE64 =
  "PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjpyZ2IoMjI5LDIzMSwyMzUpO3N0b3Atb3BhY2l0eToxIj4KICAgICAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvZmZzZXQiIHZhbHVlcz0iLTI7MSIgZHVyPSIxLjVzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgogICAgICA8L3N0b3A+CiAgICAgIDxzdG9wIG9mZnNldD0iNTAlIiBzdHlsZT0ic3RvcC1jb2xvcjpyZ2IoMjQzLDI0NCwyNDYpO3N0b3Atb3BhY2l0eToxIj4KICAgICAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvZmZzZXQiIHZhbHVlcz0iLTE7MiIgZHVyPSIxLjVzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgogICAgICA8L3N0b3A+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6cmdiKDIyOSwyMzEsMjM1KTtzdG9wLW9wYWNpdHk6MSI+CiAgICAgICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib2Zmc2V0IiB2YWx1ZXM9IjA7MyIgZHVyPSIxLjVzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgogICAgICA8L3N0b3A+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9InVybCgjZykiLz4KPC9zdmc+";

/** Static shimmer placeholder encoded as data URL */
export const SHIMMER_BLUR_DATA_URL = `data:image/svg+xml;base64,${SHIMMER_BASE64}`;

/**
 * Pre-computed base64 of the neutral gray SVG (solid gray, 10x10).
 * Simpler and lighter than shimmer, appropriate when animation isn't desired.
 */
const NEUTRAL_BASE64 =
  "PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJyZ2IoMjI5LDIzMSwyMzUpIi8+Cjwvc3ZnPg==";

/** Static neutral gray placeholder */
export const NEUTRAL_BLUR_DATA_URL = `data:image/svg+xml;base64,${NEUTRAL_BASE64}`;

/**
 * Image placeholder configuration for Next.js Image component.
 */
interface BlurPlaceholderConfig {
  placeholder: "blur";
  blurDataURL: string;
}

/**
 * Get blur placeholder configuration for dynamic image paths.
 *
 * @param variant - Placeholder style: 'shimmer' for animated, 'neutral' for static
 * @returns Configuration object to spread into Next.js Image props
 *
 * @example
 * ```tsx
 * <Image
 *   src={dynamicImagePath}
 *   alt="Product image"
 *   {...getBlurPlaceholder('shimmer')}
 * />
 * ```
 */
export function getBlurPlaceholder(
  variant: "shimmer" | "neutral" = "neutral",
): BlurPlaceholderConfig {
  return {
    placeholder: "blur",
    blurDataURL:
      variant === "shimmer" ? SHIMMER_BLUR_DATA_URL : NEUTRAL_BLUR_DATA_URL,
  };
}
