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

  const createGoogleFontMock = (
    fontFamily: string,
    variable: string,
    className: string,
  ) =>
    vi.fn((_options: GoogleFontOptions) => ({
      variable,
      className,
      style: { fontFamily },
    }));

  return {
    IBM_Plex_Sans: createGoogleFontMock(
      "IBM Plex Sans",
      "__variable_ibm_plex_sans",
      "__className_ibm_plex_sans",
    ),
    Inter: createGoogleFontMock(
      "Inter",
      "__variable_inter",
      "__className_inter",
    ),
    IBM_Plex_Mono: createGoogleFontMock(
      "IBM Plex Mono",
      "__variable_ibm_plex_mono",
      "__className_ibm_plex_mono",
    ),
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
    variable: "__variable_local_font",
    className: "__className_local_font",
    style: { fontFamily: "Local Font" },
  })),
}));
