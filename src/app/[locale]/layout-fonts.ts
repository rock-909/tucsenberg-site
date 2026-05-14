import { IBM_Plex_Mono, IBM_Plex_Sans, Inter } from "next/font/google";

/**
 * Primary sans token.
 */
export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "600"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
});

/**
 * Secondary sans token used as a system-like fallback in the design stack.
 */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Monospace token for specs, standards, and proof metrics.
 */
export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
});

/**
 * Get font class names string for html element.
 * Returns CSS variable classes for the full Tucsenberg font stack.
 */
export function getFontClassNames(): string {
  return [ibmPlexSans.variable, inter.variable, ibmPlexMono.variable].join(" ");
}
