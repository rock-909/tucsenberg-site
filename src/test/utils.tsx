/**
 * 测试工具函数
 * 提供自定义渲染器和测试辅助函数
 *
 * ## 快速开始
 *
 * ### 基础使用
 *
 * ```typescript
 * import { renderWithIntl } from '@/test/utils';
 *
 * // 使用默认集中 mock 消息渲染组件
 * renderWithIntl(<MyComponent />);
 * ```
 *
 * ### 覆写消息
 *
 * ```typescript
 * // 覆写特定命名空间的消息
 * renderWithIntl(<MyComponent />, 'en', {
 *   navigation: { home: 'Custom Home' }
 * });
 *
 * // 深度合并 - 其他 navigation key 保持默认
 * renderWithIntl(<MyComponent />, 'en', {
 *   common: {
 *     loading: 'Custom Loading...',
 *     // 其他 common key (error, success 等) 保持默认
 *   }
 * });
 * ```
 *
 * ### 创建 mock 翻译函数
 *
 * ```typescript
 * import { createMockTranslations } from '@/test/utils';
 *
 * // 使用默认集中 mock
 * const t = createMockTranslations();
 *
 * // 覆写特定 key (扁平格式)
 * const t = createMockTranslations({
 *   'navigation.home': 'Custom Home',
 *   'common.loading': 'Custom Loading...'
 * });
 * ```
 *
 * ## 集中 Mock 消息
 *
 * 所有默认 mock 消息现在集中管理在 `src/test/constants/mock-messages.ts`。
 *
 * ### 可用的命名空间
 *
 * - `common`: 通用 UI 文本 (loading, error, success, cancel, etc.)
 * - `navigation`: 导航链接 (home, about, contact, services, etc.)
 * - `accessibility`: 无障碍文本 (skipToContent, openMenu, etc.)
 * - `theme`: 主题相关 (toggle, light, dark, system, etc.)
 * - `language`: 语言切换 (toggle, selectLanguage, english, chinese, etc.)
 * - `errorBoundary`: 错误边界 (title, description, tryAgain)
 * - `seo`: SEO 元数据 (title, description, siteName, pages, etc.)
 * - `footer`: 页脚内容 (sections, platform, etc.)
 * - `underConstruction`: 施工中页面 (title, subtitle, comingSoon, etc.)
 *
 * ### 局部覆写特定命名空间
 *
 * ```typescript
 * renderWithIntl(<Component />, 'en', {
 *   navigation: { home: 'Custom Home' },
 *   theme: { light: 'Light mode' },
 * });
 * ```
 *
 * ## 验证命令
 *
 * 测试完成后,运行以下命令验证:
 *
 * ```bash
 * # 运行测试
 * pnpm test
 *
 * # 运行特定测试文件
 * pnpm vitest run path/to/test.tsx
 *
 * # 类型检查
 * pnpm type-check
 *
 * # Lint 检查
 * pnpm lint
 *
 * # 完整验证 (类型 + lint + 测试)
 * pnpm verify
 * ```
 *
 * ## 迁移指南
 *
 * 如果你的测试文件仍在使用旧的 `@/components/layout/__tests__/test-utils`,
 * 请���以下步骤迁移:
 *
 * ### 步骤 1: 更新导入
 *
 * ```typescript
 * // 迁移前
 * import { renderWithProviders, mockMessages } from '@/components/layout/__tests__/test-utils';
 *
 * // 迁移后
 * import { renderWithIntl } from '@/test/utils';
 * import { combinedMessages } from '@/test/constants/mock-messages';
 * ```
 *
 * ### 步骤 2: 更新函数调用
 *
 * ```typescript
 * // 迁移前
 * renderWithProviders(<Component />);
 *
 * // 迁移后
 * renderWithIntl(<Component />);
 * ```
 *
 * ### 步骤 3: 清理内联 mock
 *
 * ```typescript
 * // 迁移前 - 内联 mock 翻译
 * vi.mock('next-intl', () => ({
 *   useTranslations: vi.fn(() => (key: string) => {
 *     const translations: Record<string, string> = {
 *       'navigation.home': 'Home',
 *       'navigation.about': 'About',
 *       // ... 重复定义
 *     };
 *     return translations[key] || key;
 *   }),
 * }));
 *
 * // 迁移后 - 使用集中 mock
 * import { createMockTranslations } from '@/test/utils';
 *
 * vi.mock('next-intl', () => ({
 *   useTranslations: vi.fn(() => createMockTranslations()),
 * }));
 * ```
 *
 * ## 更多信息
 *
 * 详细的盘点报告和架构说明,请参考:
 * - `docs/test-mock-inventory.md` - 完整的 mock 现状盘点
 *
 * @see src/test/constants/mock-messages.ts - 集中 mock 消息定义
 */

import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { vi } from "vitest";
import { combinedMessages } from "@/test/constants/mock-messages";

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

// 国际化测试工具
/**
 * 创建 mock 翻译函数
 * 现在默认使用集中的 mock 消息,也可以传入自定义翻译覆写
 *
 * @param translations - 可选的自定义翻译,会与默认集中 mock 深度合并
 * @returns Mock 翻译函数
 *
 * @example
 * ```typescript
 * // 使用默认集中 mock
 * const t = createMockTranslations();
 *
 * // 覆写特定 key
 * const t = createMockTranslations({
 *   'navigation.home': 'Custom Home'
 * });
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

  const defaultTranslations = flattenMessages(combinedMessages);
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
