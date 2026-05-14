/**
 * sRGB bridge for src/app/globals.css.
 *
 * Use this file for email templates and non-CSS surfaces only.
 * This is not the brand truth source; browser UI must consume CSS tokens.
 */
export const STATIC_THEME_COLORS = {
  primary: "#004d9e",
  primaryHover: "#003b7a",
  success: "#0f7b5f",
  successLight: "#eefbf4",
  warning: "#9a5a00",
  warningLight: "#fff7dc",
  error: "#b42318",
  text: "#29343b",
  textLight: "#5f6b73",
  muted: "#66727a",
  background: "#fbfcfd",
  contentBackground: "#f3f6f8",
  headerText: "#fbfcfd",
  border: "#dce3e8",
} as const;
