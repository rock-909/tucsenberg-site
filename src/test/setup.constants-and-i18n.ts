import React from "react";
import { vi } from "vitest";

// Mock app constants - 使用importOriginal保留所有原始常量
vi.mock("@/constants/app-constants", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
  };
});

// Mock unified constants entry point - 使用importOriginal保留所有原始常量
vi.mock("@/constants", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
  };
});

// Mock i18n constants - 使用importOriginal保留所有原始常量
vi.mock("@/constants/i18n-constants", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
  };
});

// Mock next-intl - 提供实际的翻译映射和基础 Provider
const mockTranslations: Record<string, string> = {
  "navigation.home": "Home",
  "navigation.about": "About",
  "navigation.services": "Services",
  "navigation.products": "Products",
  "navigation.contact": "Contact",
};

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const safeTranslations = new Map(Object.entries(mockTranslations));
    return safeTranslations.get(key) || key;
  }),
  useLocale: vi.fn(() => "en"),
  useMessages: vi.fn(() => ({})),
  useFormatter: vi.fn(() => ({
    dateTime: vi.fn(),
    number: vi.fn(),
    relativeTime: vi.fn(),
  })),
  NextIntlClientProvider: ({
    children,
  }: {
    children: React.ReactNode;
    locale?: string;
    messages?: Record<string, unknown>;
  }) => React.createElement(React.Fragment, null, children),
}));

// Mock next-intl/server
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() => (key: string) => key),
  getLocale: vi.fn(() => "en"),
  getMessages: vi.fn(() => ({})),
  getFormatter: vi.fn(() => ({
    dateTime: vi.fn(),
    number: vi.fn(),
    relativeTime: vi.fn(),
  })),
  setRequestLocale: vi.fn(),
  getRequestConfig: vi.fn(() => ({})),
  unstable_setRequestLocale: vi.fn(),
}));

// Mock @/i18n/routing - 提供完整的路由Mock配置
vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "zh"],
    defaultLocale: "en",
    pathnames: {
      "/": "/",
      "/about": "/about",
      "/contact": "/contact",
      "/products": "/products",
      "/privacy": "/privacy",
    },
  },
  Link: ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
    themes: ["light", "dark", "system"],
    systemTheme: "light",
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
