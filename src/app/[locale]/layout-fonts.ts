import localFont from "next/font/local";

/**
 * Primary sans token — Figtree (variable, 300-900)
 *
 * Uses a checked-in Latin subset so builds stay deterministic
 * without depending on the Google Fonts network path.
 */
export const figtree = localFont({
  src: "./Figtree-Latin.woff2",
  variable: "--font-figtree",
  display: "swap",
  preload: true,
});

/**
 * Monospace fallback token
 *
 * Used for spec values, step numbers, standards, proof metrics.
 * We intentionally avoid a network-fetched secondary font here so builds
 * remain stable when Google Fonts is unreachable in CI or pre-push hooks.
 */
export const jetbrainsMono = {
  variable: "--font-jetbrains-mono",
  className: "",
  style: {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
} as const;

/**
 * Get font class names string for html element.
 * Returns CSS variable classes for Figtree + JetBrains Mono.
 */
export function getFontClassNames(): string {
  return `${figtree.variable} ${jetbrainsMono.variable}`;
}
