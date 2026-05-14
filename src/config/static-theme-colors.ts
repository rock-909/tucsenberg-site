/**
 * sRGB bridge for src/app/globals.css.
 *
 * Use this file for email templates and non-CSS surfaces only.
 * This is not the brand truth source; browser UI must consume CSS tokens.
 */
export const STATIC_THEME_COLORS = {
  primary: "#123B5D",
  primaryHover: "#0B2A43",
  success: "#0F7B5F",
  successLight: "#EEF9F4",
  warning: "#9A5A00",
  warningLight: "#FFF7DC",
  error: "#B42318",
  text: "#0F172A",
  textLight: "#64748B",
  muted: "#64748B",
  background: "#F7FAFC",
  contentBackground: "#FFFFFF",
  headerText: "#FFFFFF",
  border: "#CBD5E1",
} as const;
