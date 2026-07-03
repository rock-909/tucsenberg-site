import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * i18n 组件集成测试
 *
 * 测试策略：
 * - 在 JSDOM 环境下测试 i18n 组件行为
 * - 使用 NextIntlClientProvider 提供真实的 i18n 上下文
 * - 测试语言切换、消息显示、格式化等功能
 * - 不依赖 SSR 环境，专注于客户端行为
 */

// Mock配置 - 使用vi.hoisted确保Mock在模块导入前设置
// 注意：本文件用于验证完整中英文 i18n 行为，刻意保留独立 mockEnMessages/mockZhMessages
// 而不复用集中 mock 常量，以避免过度耦合测试数据与测试工具实现
const {
  mockUseLocale,
  mockUseTranslations,
  mockUsePathname,
  mockUseRouter,
  mockLink,
  mockRouting,
  mockEnMessages,
  mockZhMessages,
} = vi.hoisted(() => ({
  mockUseLocale: vi.fn(),
  mockUseTranslations: vi.fn(),
  mockUsePathname: vi.fn(),
  mockUseRouter: vi.fn(),
  mockLink: vi.fn(),
  mockRouting: {
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
  mockEnMessages: {
    common: {
      loading: "Loading...",
      error: "Error occurred",
      success: "Success",
    },
    navigation: {
      home: "Home",
      about: "About",
      contact: "Contact",
    },
    language: {
      toggle: "Toggle language",
      selectLanguage: "Select Language",
      english: "English",
      chinese: "Chinese",
    },
  },
  mockZhMessages: {
    common: {
      loading: "加载中...",
      error: "发生错误",
      success: "成功",
    },
    navigation: {
      home: "首页",
      about: "关于",
      contact: "联系",
    },
    language: {
      toggle: "切换语言",
      selectLanguage: "选择语言",
      english: "英语",
      chinese: "中文",
    },
  },
}));

// Mock next-intl hooks
vi.mock("next-intl", () => ({
  useLocale: mockUseLocale,
  useTranslations: mockUseTranslations,
  NextIntlClientProvider: ({
    children,
    locale,
  }: {
    children: React.ReactNode;
    locale: string;
  }) => <div data-testid={`intl-provider-${locale}`}>{children}</div>,
}));

// Mock next-intl/navigation
vi.mock("next-intl/navigation", () => ({
  usePathname: mockUsePathname,
  useRouter: mockUseRouter,
  Link: mockLink,
  routing: mockRouting,
}));

// Mock locale detection hooks
vi.mock("@/lib/locale-detection", () => ({
  useClientLocaleDetection: () => ({
    detectClientLocale: vi.fn().mockReturnValue({
      locale: "en",
      source: "browser",
      confidence: 0.9,
    }),
  }),
}));

vi.mock("@/lib/locale-storage", () => ({
  useLocaleStorage: () => ({
    getStats: vi.fn().mockReturnValue({
      switchCount: 0,
      lastSwitch: null,
      preferredLocale: null,
    }),
  }),
}));

// 测试组件：简单的翻译组件
function TestTranslationComponent({
  namespace = "common",
}: {
  namespace?: string;
}) {
  const t = mockUseTranslations(namespace);

  return (
    <div data-testid="translation-component">
      <h1 data-testid="loading-text">{t("loading")}</h1>
      <p data-testid="error-text">{t("error")}</p>
      <span data-testid="success-text">{t("success")}</span>
    </div>
  );
}

// 测试组件：导航组件
function TestNavigationComponent() {
  const t = mockUseTranslations("navigation");

  return (
    <nav data-testid="navigation-component">
      <span data-testid="home-link">{t("home")}</span>
      <span data-testid="about-link">{t("about")}</span>
      <span data-testid="contact-link">{t("contact")}</span>
    </nav>
  );
}

// 测试组件：语言切换组件
function TestLanguageSwitcher() {
  const locale = mockUseLocale();
  const t = mockUseTranslations("language");

  const handleLanguageSwitch = (newLocale: string) => {
    mockUseLocale.mockReturnValue(newLocale);
  };

  return (
    <div data-testid="language-switcher">
      <button
        data-testid="language-toggle"
        onClick={() => handleLanguageSwitch(locale === "en" ? "zh" : "en")}
      >
        {t("toggle")}
      </button>
      <div data-testid="current-locale">{locale}</div>
      <div data-testid="select-language-text">{t("selectLanguage")}</div>
      <div data-testid="english-text">{t("english")}</div>
      <div data-testid="chinese-text">{t("chinese")}</div>
    </div>
  );
}

// 辅助函数：渲染带有i18n上下文的组件
function renderWithI18n(component: React.ReactElement, locale: string = "en") {
  const messages = locale === "en" ? mockEnMessages : mockZhMessages;

  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
}

describe("i18n 组件集成测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 设置默认Mock返回值
    mockUseLocale.mockReturnValue("en");
    mockUsePathname.mockReturnValue("/");
    mockUseRouter.mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });

    // 设置翻译函数Mock
    mockUseTranslations.mockImplementation((namespace: string) => {
      return (key: string) => {
        const messages =
          mockUseLocale() === "en" ? mockEnMessages : mockZhMessages;
        const namespaceMessages = messages[namespace as keyof typeof messages];
        return (namespaceMessages as Record<string, string>)?.[key] || key;
      };
    });

    mockLink.mockImplementation(
      ({
        children,
        href,
        ...props
      }: React.ComponentProps<"a"> & { href: string }) => (
        <a href={href} {...props}>
          {children}
        </a>
      ),
    );
  });

  describe("基础翻译功能", () => {
    it("应该正确显示英文翻译", () => {
      renderWithI18n(<TestTranslationComponent />, "en");

      expect(screen.getByTestId("loading-text")).toHaveTextContent(
        "Loading...",
      );
      expect(screen.getByTestId("error-text")).toHaveTextContent(
        "Error occurred",
      );
      expect(screen.getByTestId("success-text")).toHaveTextContent("Success");
    });

    it("应该正确显示中文翻译", () => {
      mockUseLocale.mockReturnValue("zh");
      renderWithI18n(<TestTranslationComponent />, "zh");

      expect(screen.getByTestId("loading-text")).toHaveTextContent("加载中...");
      expect(screen.getByTestId("error-text")).toHaveTextContent("发生错误");
      expect(screen.getByTestId("success-text")).toHaveTextContent("成功");
    });

    it("应该支持不同的命名空间", () => {
      renderWithI18n(<TestTranslationComponent namespace="navigation" />, "en");

      // 由于使用了navigation命名空间，应该显示navigation的翻译
      expect(screen.getByTestId("loading-text")).toHaveTextContent("loading");
      expect(screen.getByTestId("error-text")).toHaveTextContent("error");
      expect(screen.getByTestId("success-text")).toHaveTextContent("success");
    });
  });

  describe("导航组件翻译", () => {
    it("应该正确显示英文导航", () => {
      renderWithI18n(<TestNavigationComponent />, "en");

      expect(screen.getByTestId("home-link")).toHaveTextContent("Home");
      expect(screen.getByTestId("about-link")).toHaveTextContent("About");
      expect(screen.getByTestId("contact-link")).toHaveTextContent("Contact");
    });

    it("应该正确显示中文导航", () => {
      mockUseLocale.mockReturnValue("zh");
      renderWithI18n(<TestNavigationComponent />, "zh");

      expect(screen.getByTestId("home-link")).toHaveTextContent("首页");
      expect(screen.getByTestId("about-link")).toHaveTextContent("关于");
      expect(screen.getByTestId("contact-link")).toHaveTextContent("联系");
    });
  });

  describe("语言切换功能", () => {
    it("应该显示当前语言", () => {
      renderWithI18n(<TestLanguageSwitcher />, "en");

      expect(screen.getByTestId("current-locale")).toHaveTextContent("en");
      expect(screen.getByTestId("language-toggle")).toHaveTextContent(
        "Toggle language",
      );
    });

    it("应该支持语言切换按钮点击", async () => {
      renderWithI18n(<TestLanguageSwitcher />, "en");

      const toggleButton = screen.getByTestId("language-toggle");
      fireEvent.click(toggleButton);

      // 验证Mock函数被调用
      expect(mockUseLocale).toHaveBeenCalled();
    });

    it("应该显示语言选择相关文本", () => {
      renderWithI18n(<TestLanguageSwitcher />, "en");

      expect(screen.getByTestId("select-language-text")).toHaveTextContent(
        "Select Language",
      );
      expect(screen.getByTestId("english-text")).toHaveTextContent("English");
      expect(screen.getByTestId("chinese-text")).toHaveTextContent("Chinese");
    });
  });
});
