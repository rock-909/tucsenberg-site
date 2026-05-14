import { vi } from "vitest";

// Mock CSS imports to avoid PostCSS processing in tests
vi.mock("@/app/globals.css", () => ({ default: {} }));

// Mock server-only to prevent import errors in test environment
vi.mock("server-only", () => ({}));

// Mock MDX importers to prevent Vite from resolving @content imports in test environment
// This is necessary because @content/* paths reference actual MDX files that may not exist
// or should not be loaded during unit/integration tests
vi.mock("@/lib/mdx-importers.generated", () => ({
  postImporters: {
    en: {},
    es: {},
    zh: {},
  },
  productImporters: {
    en: {},
    es: {},
    zh: {},
  },
  pageImporters: {
    en: {},
    es: {},
    zh: {},
  },
}));

const googleFontMocks = vi.hoisted(() => {
  type GoogleFontOptions = {
    variable: string;
    subsets: string[];
    weight: string[];
    display: string;
  };

  const createGoogleFontMock = (fontFamily: string, className: string) =>
    vi.fn((options: GoogleFontOptions) => ({
      variable: options.variable,
      className,
      style: { fontFamily },
      options,
    }));

  return {
    IBM_Plex_Sans: createGoogleFontMock("IBM Plex Sans", "ibm-plex-sans"),
    Inter: createGoogleFontMock("Inter", "inter"),
    IBM_Plex_Mono: createGoogleFontMock("IBM Plex Mono", "ibm-plex-mono"),
  };
});

// Mock next/font/google for Tucsenberg font stack.
vi.mock("next/font/google", () => ({
  IBM_Plex_Sans: googleFontMocks.IBM_Plex_Sans,
  Inter: googleFontMocks.Inter,
  IBM_Plex_Mono: googleFontMocks.IBM_Plex_Mono,
}));

vi.mock("next/font/local", () => ({
  default: vi.fn(() => ({
    variable: "--font-figtree",
    className: "font-local",
    style: { fontFamily: "Figtree" },
  })),
}));
