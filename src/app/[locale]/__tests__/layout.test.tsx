import type React from "react";
import { cleanup, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAsyncPage } from "@/test/render-async-page";
import LocaleLayout, { generateMetadata } from "../layout";

// Mock dependencies using vi.hoisted - must be before module imports
const {
  mockGetFontClassNames,
  mockSetRequestLocale,
  mockNotFound,
  mockGenerateLocaleMetadata,
  mockGeneratePageStructuredData,
} = vi.hoisted(() => ({
  mockGetFontClassNames: vi.fn(() => ""),
  mockSetRequestLocale: vi.fn(),
  mockNotFound: vi.fn(),
  mockGenerateLocaleMetadata: vi.fn(),
  mockGeneratePageStructuredData: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async ({ namespace }: { namespace: string }) => {
    const translations: Record<string, string> = {
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
  usePathname: () => "/en",
}));

vi.mock("@/components/motion/light-motion-provider", () => ({
  LightMotionProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/motion/page-transition", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/navigation/navigation-progress-bar", () => ({
  NavigationProgressBar: () => null,
}));

vi.mock("@/app/[locale]/layout-metadata", () => ({
  generateLocaleMetadata: mockGenerateLocaleMetadata,
}));

vi.mock("@/lib/page-structured-data", () => ({
  generatePageStructuredData: mockGeneratePageStructuredData,
}));

vi.mock("@/app/[locale]/layout-fonts", () => ({
  getFontClassNames: mockGetFontClassNames,
}));

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(async () => ({ common: { ok: "OK" } })),
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

vi.mock("@/components/footer/Footer", () => ({
  Footer: ({ themeToggleSlot }: { themeToggleSlot?: React.ReactNode }) => (
    <footer data-testid="footer">{themeToggleSlot}</footer>
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
  LazyThemeSwitcher: () => <button data-testid="footer-theme-toggle" />,
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
    vi.clearAllMocks();
    mockGetFontClassNames.mockReturnValue("");
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

  describe("font class wiring", () => {
    it("uses the layout font class helper for the html element", async () => {
      mockGetFontClassNames.mockReturnValue("font-contract-sentinel");

      const page = await LocaleLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ locale: "en" }),
      });

      expect(mockGetFontClassNames).toHaveBeenCalledTimes(1);
      expect(page.props.className).toBe("font-contract-sentinel");
    });
  });

  describe("layout shell", () => {
    it("keeps the core layout shell stable without development-tool scripts", async () => {
      const page = await LocaleLayout({
        children: <div>Child</div>,
        params: Promise.resolve({ locale: "en" }),
      });

      await renderAsyncPage(page);

      expect(screen.getByText("Skip to main content")).toBeInTheDocument();
      expect(document.querySelectorAll("script")).toHaveLength(0);
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
  });
});
