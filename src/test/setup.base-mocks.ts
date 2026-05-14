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

// Mock next/font/google for Tucsenberg font stack.
vi.mock("next/font/google", () => ({
  IBM_Plex_Sans: vi.fn(() => ({
    variable: "--font-ibm-plex-sans",
    className: "ibm-plex-sans",
    style: { fontFamily: "IBM Plex Sans" },
  })),
  Inter: vi.fn(() => ({
    variable: "--font-inter",
    className: "inter",
    style: { fontFamily: "Inter" },
  })),
  IBM_Plex_Mono: vi.fn(() => ({
    variable: "--font-ibm-plex-mono",
    className: "ibm-plex-mono",
    style: { fontFamily: "IBM Plex Mono" },
  })),
}));

vi.mock("next/font/local", () => ({
  default: vi.fn(() => ({
    variable: "--font-ibm-plex-sans",
    className: "font-local",
    style: { fontFamily: "IBM Plex Sans" },
  })),
}));
