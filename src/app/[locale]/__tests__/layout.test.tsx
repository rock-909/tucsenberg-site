import type React from "react";
import { cleanup, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAsyncPage } from "@/test/render-async-page";
import LocaleLayout, { generateMetadata } from "../layout";

// Mock dependencies using vi.hoisted - must be before module imports
const {
  mockSetRequestLocale,
  mockNotFound,
  mockGenerateLocaleMetadata,
  mockGeneratePageStructuredData,
  mockRuntimeEnv,
} = vi.hoisted(() => ({
  mockSetRequestLocale: vi.fn(),
  mockNotFound: vi.fn(),
  mockGenerateLocaleMetadata: vi.fn(),
  mockGeneratePageStructuredData: vi.fn(),
  mockRuntimeEnv: {
    NODE_ENV: "development",
    PLAYWRIGHT_TEST: false,
    NEXT_PUBLIC_TEST_MODE: "false",
    NEXT_PUBLIC_DISABLE_DEV_TOOLS: false,
    NEXT_PUBLIC_DISABLE_REACT_SCAN: false,
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async ({ namespace }: { namespace: string }) => {
    const translations: Record<string, string> = {
      systemStatus: "System online",
      contactSales: "Contact sales",
      skipToContent:
        namespace === "accessibility"
          ? "Skip to main content"
          : "skipToContent",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      selectLanguage: "Select language",
      home: namespace === "navigation" ? "Home" : namespace,
    };

    return (key: string) => translations[key] ?? key;
  }),
  setRequestLocale: mockSetRequestLocale,
}));

vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/app/[locale]/layout-metadata", () => ({
  generateLocaleMetadata: mockGenerateLocaleMetadata,
}));

vi.mock("@/lib/page-structured-data", () => ({
  generatePageStructuredData: mockGeneratePageStructuredData,
}));

vi.mock("@/app/[locale]/layout-fonts", () => ({
  getFontClassNames: () => "font-class",
}));

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(async () => ({ common: { ok: "OK" } })),
}));

vi.mock("@/lib/env", () => ({
  env: mockRuntimeEnv,
  getRuntimeEnvBoolean: (key: string) => {
    if (key === "NEXT_PUBLIC_DISABLE_DEV_TOOLS") {
      return mockRuntimeEnv.NEXT_PUBLIC_DISABLE_DEV_TOOLS;
    }
    if (key === "NEXT_PUBLIC_DISABLE_REACT_SCAN") {
      return mockRuntimeEnv.NEXT_PUBLIC_DISABLE_REACT_SCAN;
    }
    return undefined;
  },
  getRuntimeEnvString: (key: string) => {
    if (key === "NODE_ENV") {
      return mockRuntimeEnv.NODE_ENV;
    }
    if (key === "NEXT_PUBLIC_TEST_MODE") {
      return mockRuntimeEnv.NEXT_PUBLIC_TEST_MODE;
    }
    return undefined;
  },
}));

vi.mock("@/lib/i18n/client-messages", () => ({
  loadClientMessages: vi.fn(async () => ({ navigation: { home: "Home" } })),
}));

vi.mock("@/lib/structured-data", () => ({
  generateJSONLD: () => JSON.stringify({ ok: true }),
}));

vi.mock("@/components/attribution-bootstrap", () => ({
  AttributionBootstrap: () => <div data-testid="attribution-bootstrap" />,
}));

vi.mock("@/components/cookie/lazy-cookie-consent-island", () => ({
  LazyCookieConsentIsland: () => <div data-testid="cookie-consent" />,
}));

vi.mock("@/components/footer", () => ({
  Footer: ({ statusSlot }: { statusSlot?: React.ReactNode }) => (
    <footer data-testid="footer">{statusSlot}</footer>
  ),
}));

vi.mock("@/components/layout/header", () => ({
  Header: () => <header data-testid="header" />,
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/ui/lazy-theme-switcher", () => ({
  LazyThemeSwitcher: () => <button data-testid="theme-switcher" />,
}));

vi.mock("@/config/footer-links", () => ({
  FOOTER_COLUMNS: [],
  FOOTER_STYLE_TOKENS: {},
}));

vi.mock("@/i18n/locale-utils", () => ({
  coerceLocale: (locale: string) => locale,
  isLocale: (locale: string) => locale === "en" || locale === "zh",
}));

vi.mock("@/lib/navigation", () => ({
  mainNavigation: [
    { key: "home", href: "/", translationKey: "navigation.home" },
  ],
}));

vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
}));

describe("LocaleLayout", () => {
  beforeEach(() => {
    cleanup();
    document
      .querySelectorAll('script[data-testid="dev-script"]')
      .forEach((script) => script.remove());
    vi.clearAllMocks();
    mockRuntimeEnv.NODE_ENV = "development";
    mockRuntimeEnv.PLAYWRIGHT_TEST = false;
    mockRuntimeEnv.NEXT_PUBLIC_TEST_MODE = "false";
    mockRuntimeEnv.NEXT_PUBLIC_DISABLE_DEV_TOOLS = false;
    mockRuntimeEnv.NEXT_PUBLIC_DISABLE_REACT_SCAN = false;
    mockGeneratePageStructuredData.mockResolvedValue({
      organizationData: { "@type": "Organization" },
      websiteData: { "@type": "WebSite" },
    });
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  describe("generateMetadata", () => {
    it("should export generateMetadata from layout-metadata", () => {
      expect(generateMetadata).toBe(mockGenerateLocaleMetadata);
    });
  });

  describe("locale validation", () => {
    it("should have valid locale configuration", async () => {
      // Import routing config to verify locale setup
      const { routing } = await import("@/i18n/routing");

      expect(routing.locales).toContain("en");
      expect(routing.locales).toContain("zh");
      expect(routing.defaultLocale).toBe("en");
    });
  });

  describe("dev script gating", () => {
    it("keeps the core layout shell stable when dev script toggles are off", async () => {
      const page = await LocaleLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ locale: "en" }),
      });

      await renderAsyncPage(page);

      expect(screen.getByText("Skip to main content")).toBeInTheDocument();
      const scriptSources = Array.from(
        document.querySelectorAll<HTMLScriptElement>(
          'script[data-testid="dev-script"]',
        ),
        (script) => script.getAttribute("src"),
      );
      expect(scriptSources).toEqual([
        "https://unpkg.com/react-scan@0.5.6/dist/auto.global.js",
        "https://unpkg.com/react-grab@0.1.33/dist/index.global.js",
        "https://unpkg.com/@react-grab/mcp@0.1.33/dist/client.global.js",
      ]);
      expect(mockSetRequestLocale).toHaveBeenCalledWith("en");
    });

    it("renders the skip link from the accessibility namespace", async () => {
      const page = await LocaleLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ locale: "zh" }),
      });

      await renderAsyncPage(page);

      expect(screen.getByText("Skip to main content")).toBeInTheDocument();
    });

    it("disables all dev scripts when dev tools are disabled", async () => {
      mockRuntimeEnv.NEXT_PUBLIC_DISABLE_DEV_TOOLS = true;

      const page = await LocaleLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ locale: "en" }),
      });

      await renderAsyncPage(page);

      expect(
        document.querySelectorAll('script[data-testid="dev-script"]'),
      ).toHaveLength(0);
    });

    it("disables all dev scripts when browser test mode is enabled", async () => {
      mockRuntimeEnv.NEXT_PUBLIC_TEST_MODE = "true";

      const page = await LocaleLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ locale: "en" }),
      });

      await renderAsyncPage(page);

      expect(
        document.querySelectorAll('script[data-testid="dev-script"]'),
      ).toHaveLength(0);
    });
  });
});
