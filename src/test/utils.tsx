/**
 * 测试工具函数：Provider 包装的 render，以及 next-intl 的翻译 mock。
 *
 * 翻译 mock 的默认消息来自 `getComposedMessages("en")` —— 生产运行时用的
 * 同一份合成消息。这里曾经挂着一份手写的 `mock-messages.ts`，声称"基于物理
 * 消息包合成结果提取"，实测 172 个叶子键里有 153 个在真实消息包中根本不存在
 * （navigation 下是 Pricing / Login / AI Apps / Ecommerce 这类 starter 残留）。
 * 用它写的断言证明的是虚构文案，改动真实文案不会让任何测试变红。
 *
 * 要覆写就传扁平 key：`createMockTranslations({ "navigation.home": "X" })`。
 */

import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { vi } from "vitest";
import { getComposedMessages } from "@/lib/i18n/composed-messages";

// import { ThemeProvider } from 'next-themes';

// 国际化Provider Mock
const MockIntlProvider = ({
  children,
  locale = "en",
}: {
  children: React.ReactNode;
  locale?: string;
}) => {
  return (
    <div data-testid="intl-provider" data-locale={locale}>
      {children}
    </div>
  );
};

// 主题Provider配置
interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: string;
  themes?: string[];
}

const MockThemeProvider = ({
  children,
  theme = "light",
  themes = ["light", "dark", "system"],
}: ThemeProviderProps) => {
  return (
    <div
      data-testid="theme-provider"
      data-theme={theme}
      data-themes={themes.join(",")}
    >
      {children}
    </div>
  );
};

// 所有Provider的组合
interface AllTheProvidersProps {
  children: React.ReactNode;
  locale?: string;
  theme?: string;
  themes?: string[];
}

const AllTheProviders = ({
  children,
  locale = "en",
  theme = "light",
  themes = ["light", "dark", "system"],
}: AllTheProvidersProps) => {
  return (
    <MockIntlProvider locale={locale}>
      <MockThemeProvider theme={theme} themes={themes}>
        {children}
      </MockThemeProvider>
    </MockIntlProvider>
  );
};

// 自定义渲染函数
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  locale?: string;
  theme?: string;
  themes?: string[];
  wrapper?: React.ComponentType<unknown>;
}

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) => {
  const {
    locale = "en",
    theme = "light",
    themes = ["light", "dark", "system"],
    wrapper,
    ...renderOptions
  } = options;

  const Wrapper =
    wrapper ||
    (({ children }: { children: React.ReactNode }) => (
      <AllTheProviders locale={locale} theme={theme} themes={themes}>
        {children}
      </AllTheProviders>
    ));

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * 创建 mock 翻译函数。默认消息＝真实合成消息包，不是手写清单。
 *
 * @param translations - 可选的扁平 key 覆写
 * @returns Mock 翻译函数
 *
 * @example
 * ```typescript
 * const t = createMockTranslations();
 * const t = createMockTranslations({ "navigation.home": "Custom Home" });
 * ```
 */
export const createMockTranslations = (
  translations?: Record<string, string>,
) => {
  // 扁平化集中 mock 消息为 key-value 映射
  const flattenMessages = (
    obj: Record<string, unknown>,
    prefix = "",
  ): Record<string, string> => {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "string") {
        result[fullKey] = value;
      } else if (typeof value === "object" && value !== null) {
        Object.assign(
          result,
          flattenMessages(value as Record<string, unknown>, fullKey),
        );
      }
    }

    return result;
  };

  const defaultTranslations = flattenMessages(getComposedMessages("en"));
  const mergedTranslations = translations
    ? { ...defaultTranslations, ...translations }
    : defaultTranslations;

  return vi.fn((key: string) => {
    const safeTranslations = new Map(Object.entries(mergedTranslations));
    return safeTranslations.get(key) || key;
  });
};

export const createMockUseTranslations = (
  translations?: Record<string, string>,
) => {
  const translate = createMockTranslations(translations);

  return vi.fn((namespace?: string) =>
    vi.fn((key: string) => translate(namespace ? `${namespace}.${key}` : key)),
  );
};

// 重新导出render函数
export { customRender as render };

// 重新导出testing-library的所有工具
export * from "@testing-library/react";
