/**
 * 测试工具函数：Provider 包装的 render，以及 next-intl 的翻译 mock。
 *
 * 翻译走 `@/test/i18n-messages`，那里读的是生产运行时用的同一份合成消息。
 * 这里曾经挂着一份手写的 `mock-messages.ts`，声称"基于物理消息包合成结果
 * 提取"，实测 172 个叶子键里有 153 个在真实消息包中根本不存在（navigation
 * 下是 Pricing / Login / AI Apps / Ecommerce 这类 starter 残留）。
 *
 * 要覆写就传扁平 key：`createMockTranslations({ "navigation.home": "X" })`。
 * 覆写不存在的 key 会直接抛错——覆写是用来改真实文案的，不是用来发明文案的。
 */

import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { vi } from "vitest";
import { getFlatMessages, lookupMessage } from "@/test/i18n-messages";

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
  const messages = getFlatMessages();

  // 覆写只能覆写真实存在的 key。放行不存在的 key 就等于让测试自己发明文案，
  // 这正是这份工具刚清掉的那种问题——手写目录里 172 个键有 153 个是虚构的。
  const unknownKeys = Object.keys(translations ?? {}).filter(
    (key) => !messages.has(key),
  );
  if (unknownKeys.length > 0) {
    throw new Error(
      `createMockTranslations: 这些 key 在真实消息包里不存在，覆写它们证明不了任何事：${unknownKeys.join(", ")}`,
    );
  }

  for (const [key, value] of Object.entries(translations ?? {})) {
    messages.set(key, value);
  }

  return vi.fn((key: string) => lookupMessage(messages, key));
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
