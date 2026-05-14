/**
 * CSS-First Responsive Breakpoints
 *
 * Semantic constants aligned with Tailwind CSS v4 breakpoints.
 * These values match the rem-based breakpoints defined in globals.css.
 *
 * @see src/app/globals.css for CSS variable definitions
 * @see .claude/rules/ui-system.md for breakpoint documentation
 */

/** Small devices (640px) - Mobile landscape, small tablets */
export const BREAKPOINT_SM = 640;

/** Medium devices (768px) - Tablets */
export const BREAKPOINT_MD = 768;

/** Large devices (1024px) - Small desktops, tablets landscape */
export const BREAKPOINT_LG = 1024;

/** Extra large devices (1280px) - Desktops */
export const BREAKPOINT_XL = 1280;

/** 2X large devices (1536px) - Large desktops */
export const BREAKPOINT_2XL = 1536;

/**
 * Breakpoint configuration object for programmatic access.
 * Matches Tailwind CSS v4 breakpoint system.
 */
export const BREAKPOINTS = {
  sm: BREAKPOINT_SM,
  md: BREAKPOINT_MD,
  lg: BREAKPOINT_LG,
  xl: BREAKPOINT_XL,
  "2xl": BREAKPOINT_2XL,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
