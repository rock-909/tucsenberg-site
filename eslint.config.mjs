import { fixupConfigRules } from "@eslint/compat";
import js from "@eslint/js";
// Next.js ESLint configs - 使用官方推荐的直接导入方式
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import promisePlugin from "eslint-plugin-promise";
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";
import securityPlugin from "eslint-plugin-security";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments/configs";

const security = securityPlugin.default ?? securityPlugin;
const promise = promisePlugin.default ?? promisePlugin;
// Only values that appear as bare numeric literals in lintable production code
// are kept. Unused ignore entries were removed so no-magic-numbers keeps its
// teeth; re-add a value here only when a real production literal needs it.
const MAGIC_NUMBER_IGNORE_LIST = [
  // 基础数字
  0, 1, -1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  // 常见小数字
  12, 14, 16, 18, 20, 22, 24, 25, 30, 32, 36, 40, 50,
  // 百分比相关
  60, 64, 90, 100,
  // 尺寸和像素
  120, 128, 150, 190, 250, 256, 300, 360,
  // 大数字和时间（含 365 = 天/年）
  365, 1000, 1024, 4000, 5000, 60000, 300000,
];

export default [
  {
    name: "ignores",
    ignores: [
      "performance-audit/**",
      "reports/**",
      ".next/**",
      ".trash-next-artifacts/**",
      ".context/**",
      ".stryker-tmp/**",
      "coverage/**",
      "dist/**",
      "build/**",
      "storybook-static/**",
      ".codex/**",
      ".omx/**",
      ".eslintcache-audit",
      // Semgrep fixtures are rule-test inputs, not application source.
      "tests/semgrep/targets/**",
      "tests/semgrep/drafts/**",
      // Auto-generated files
      "src/lib/*.generated.ts",
    ],
  },
  // Base JavaScript configuration
  js.configs.recommended,

  // Next.js configuration - 直接 spread 官方配置 (避免 FlatCompat 循环引用问题)
  ...fixupConfigRules(nextVitals),
  ...fixupConfigRules(nextTs),

  // Import resolver settings for @/* alias (TypeScript + Node)
  {
    name: "import-resolver-settings",
    files: ["**/*.{js,jsx,ts,tsx}"],
    settings: {
      "import/resolver": {
        typescript: { project: ["./tsconfig.json"] },
        node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      },
    },
  },

  // React You Might Not Need An Effect - strict preset (all 10 rules as error)
  // Includes: no-empty-effect, no-adjust-state-on-prop-change, no-reset-all-state-on-prop-change,
  // no-event-handler, no-pass-live-state-to-parent, no-pass-data-to-parent, no-pass-ref-to-parent,
  // no-initialize-state, no-chain-state-updates, no-derived-state
  {
    name: "react-you-might-not-need-an-effect-config",
    files: ["**/*.{js,jsx,ts,tsx}"],
    ...reactYouMightNotNeedAnEffect.configs.strict,
  },

  // Theme switcher exception for SSR hydration pattern
  {
    name: "theme-switcher-ssr-exception",
    files: ["**/theme-switcher.tsx", "**/horizontal-theme-toggle-simple.tsx"],
    plugins: {
      "react-you-might-not-need-an-effect": reactYouMightNotNeedAnEffect,
    },
    rules: {
      // next-themes 推荐的 SSR 水合模式需要在 useEffect 中初始化 mounted 状态
      "react-you-might-not-need-an-effect/no-initialize-state": "off",
    },
  },

  // Mobile navigation route change handler exception
  {
    name: "mobile-navigation-route-exception",
    files: ["**/mobile-navigation.tsx"],
    plugins: {
      "react-you-might-not-need-an-effect": reactYouMightNotNeedAnEffect,
    },
    rules: {
      // Next.js 路由变化时关闭菜单是合理的 useEffect 用例
      "react-you-might-not-need-an-effect/no-event-handler": "off",
    },
  },

  // SSR-compatible hooks and components exception
  {
    name: "ssr-hooks-exception",
    files: [
      "**/locale-storage-hooks.ts",
      "**/use-breakpoint.ts",
      "**/use-reduced-motion.ts",
      "**/use-scroll-shadow.ts",
      "**/use-web-vitals-diagnostics.ts",
    ],
    plugins: {
      "react-you-might-not-need-an-effect": reactYouMightNotNeedAnEffect,
    },
    rules: {
      // SSR 兼容性模式：使用 lazy initializer 或 useEffect 安全访问浏览器 API
      "react-you-might-not-need-an-effect/no-initialize-state": "off",
      // Web Vitals 诊断需要在 useEffect 中初始化历史数据
      "react-you-might-not-need-an-effect/no-pass-data-to-parent": "off",
    },
  },

  // Accessibility: prefersReducedMotion is a system media query, not a component prop
  // When user preference changes, updating visibility state is a valid a11y pattern
  {
    name: "intersection-observer-a11y-exception",
    files: ["**/use-intersection-observer.ts"],
    plugins: {
      "react-you-might-not-need-an-effect": reactYouMightNotNeedAnEffect,
    },
    rules: {
      "react-you-might-not-need-an-effect/no-adjust-state-on-prop-change":
        "off",
    },
  },

  // React hooks call-ordering correctness. exhaustive-deps is upgraded to error
  // in the progressive block; require-await / no-unused-vars / prefer-const /
  // no-duplicate-imports are set once in the ultra-strict block below.
  {
    name: "react-hooks-correctness",
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "error",
    },
  },

  // Security configuration
  {
    name: "security-config",
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      security,
    },
    rules: {
      ...security.configs.recommended.rules,
      // 噪音过大且 TS 无法表达上下文：由 Semgrep（ERROR gate）承担代码级对象注入扫描
      "security/detect-object-injection": "off",
      "security/detect-non-literal-regexp": "error",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "error",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-non-literal-require": "error",
      "security/detect-possible-timing-attacks": "error",
      "security/detect-pseudoRandomBytes": "error",
    },
  },

  // 安全模块加强规则（禁 any、需显式错误处理）
  {
    name: "security-hardened",
    files: ["src/lib/security/**/*.{ts,tsx}"],
    plugins: {
      promise,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-throw-literal": "error",
      "promise/always-return": "off",
      "promise/catch-or-return": ["error", { allowFinally: true }],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  // 测试目录放宽复杂度但禁用 jest 导入
  {
    name: "tests-relaxed-but-no-jest",
    files: [
      "**/__tests__/**/*.{ts,tsx,js,jsx}",
      "tests/**/*.{ts,tsx,js,jsx}",
      "**/*.{test,spec}.{ts,tsx,js,jsx}",
    ],
    rules: {
      complexity: "off",
      "max-params": "off",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "jest",
              message: "项目使用 Vitest，禁止引入 jest.* API",
            },
            {
              name: "@jest/globals",
              message: "项目使用 Vitest，禁止引入 jest.* API",
            },
            {
              name: "@/components/layout/__tests__/test-utils",
              message: "🚫 已迁移到集中测试工具，请使用 @/test/utils 替代",
            },
          ],
          patterns: [
            {
              group: ["@jest/*"],
              message: "项目使用 Vitest，禁止引入 jest.* API",
            },
          ],
        },
      ],
    },
  },

  // CSS-First Responsive Design - Discourage useBreakpoint for layout
  {
    name: "css-first-responsive-design",
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [
      // Allow useBreakpoint in its own file and tests
      "**/hooks/use-breakpoint.ts",
      "**/hooks/__tests__/use-breakpoint.test.ts",
      // Legacy ResponsiveLayout tests during migration
      "**/components/__tests__/responsive-layout.test.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "@/hooks/use-breakpoint",
              message:
                "⚠️ CSS-First Responsive: Prefer Tailwind responsive classes (sm:, md:, lg:) for layout. " +
                "useBreakpoint is approved only for: (1) interaction logic requiring width detection, " +
                "(2) analytics/tracking.",
            },
          ],
        },
      ],
    },
  },

  // 超严格质量保障配置 - 零妥协标准
  {
    name: "ultra-strict-quality-config",
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // 🔒 复杂度控制：企业级标准
      complexity: ["error", 15], // 企业级标准：复杂度限制15
      "max-depth": ["error", 3], // 降低到3层，强制扁平化
      "max-lines-per-function": [
        "error",
        { max: 120, skipBlankLines: true, skipComments: true },
      ], // 企业级标准：函数长度限制120行（跳过空行与注释）
      "max-params": ["error", 3], // 降低到3个参数，强制对象传参
      "max-nested-callbacks": ["error", 2], // 降低到2层，强制Promise/async
      "max-lines": [
        "error",
        { max: 500, skipBlankLines: true, skipComments: true },
      ], // 调整到500行并跳过空行与注释
      "max-statements": ["error", 20], // 降低到20个语句，强制逻辑简化

      // 🔒 代码质量规则：零容忍标准
      "no-console": "error", // 完全禁止console，强制使用logger
      "no-debugger": "error",
      "no-alert": "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-duplicate-imports": "error",
      "no-unused-expressions": "error",
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-undef": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": "error",

      // 🔒 新增严格规则：强制代码质量
      "no-empty": "error", // 禁止空代码块
      "no-empty-function": "error", // 禁止空函数
      "no-implicit-coercion": "error", // 禁止隐式类型转换
      "no-magic-numbers": [
        "error",
        {
          ignore: MAGIC_NUMBER_IGNORE_LIST,
          ignoreArrayIndexes: true, // 数组索引豁免
          ignoreDefaultValues: true, // 默认值豁免
          ignoreNumericLiteralTypes: true, // 类型域字面量豁免
          ignoreEnums: true, // 枚举值豁免
          ignoreReadonlyClassProperties: true, // 只读类属性豁免
          ignoreTypeIndexes: true, // 类型索引豁免
          enforceConst: true,
          detectObjects: false, // 关闭对象检测，减少噪音
        },
      ],

      // Best practices (最严格)
      eqeqeq: ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-throw-literal": "error",
      "no-unmodified-loop-condition": "error",
      "no-useless-call": "error",
      "no-useless-concat": "error",
      "no-useless-return": "error",
      "prefer-promise-reject-errors": "error",
      radix: "error",
      yoda: "error",

      // 安全相关 (最严格)
      "no-new-wrappers": "error",
      "no-proto": "error",
      "no-return-assign": "error",
      "no-void": "error",
      "no-with": "error",
      "require-await": "error",

      // 代码风格 (最严格)
      "array-callback-return": "error",
      "block-scoped-var": "error",
      "consistent-return": "error",
      "default-case": "error", // 升级为error - switch语句必须有default case
      "default-case-last": "error",
      "dot-notation": [
        "error",
        {
          allowKeywords: true,
          allowPattern: "^[a-zA-Z_$][a-zA-Z0-9_$]*$", // Allow flexible property access for better DX
        },
      ],
      "guard-for-in": "error",
      "no-caller": "error",
      "no-constructor-return": "error",
      "no-else-return": "error",
      "no-extend-native": "error",
      "no-extra-bind": "error",
      "no-implicit-globals": "error",
      "no-iterator": "error",
      "no-labels": "error",
      "no-lone-blocks": "error",
      "no-loop-func": "error",
      "no-multi-assign": "error",
      "no-new": "error",
      "no-object-constructor": "error",
      "no-octal-escape": "error",
      "no-param-reassign": "error",
      "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
      "no-restricted-syntax": [
        "error",
        "ForInStatement",
        "LabeledStatement",
        "WithStatement",
      ],
      "no-shadow": "error",
      "no-ternary": "off", // 允许三元运算符，但要谨慎使用
      "no-underscore-dangle": "error",
      "no-unneeded-ternary": "error",
      "no-unused-private-class-members": "error",
      "prefer-arrow-callback": "error",
      "prefer-destructuring": [
        "error",
        {
          array: false, // 允许数组索引访问，如 arr[0]
          object: true, // 仍然要求对象解构
        },
      ],
      "prefer-exponentiation-operator": "error",
      "prefer-object-spread": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "prefer-template": "error",

      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // 🔴 全TypeScript项目：严格禁止any类型
      "@typescript-eslint/no-explicit-any": "error",
      // Note: no-unsafe-* rules require type information, handled by Next.js config

      // Note: Some TypeScript rules requiring type information are handled by Next.js config
    },
  },

  // 精简的i18n文件配置 - 仅豁免必要规则
  {
    name: "i18n-overrides",
    files: [
      "src/lib/i18n-*.ts",
      "src/lib/translation-*.ts",
      "src/lib/locale-*.ts",
      "src/components/i18n/*.tsx",
    ],
    plugins: {
      security,
    },
    rules: {
      // 仅豁免i18n特定的必要规则
      "no-magic-numbers": "off", // i18n配置中的数字常量
      "max-lines-per-function": [
        "warn",
        { max: 200, skipBlankLines: true, skipComments: true },
      ], // i18n函数可能较长（跳过空行与注释）
      complexity: ["warn", 20], // i18n逻辑可能复杂
      "security/detect-object-injection": "error", // i18n动态键访问，统一为error级别
      "dot-notation": "off", // i18n键名可能包含特殊字符
      "no-console": ["warn", { allow: ["warn", "error"] }], // 允许i18n调试

      // 保持严格的类型安全和基本规则
      "@typescript-eslint/no-explicit-any": "error", // 恢复严格类型检查
      "no-undef": "error", // 恢复未定义变量检查
      "security/detect-non-literal-regexp": "error", // 恢复安全检查
    },
  },

  // TypeScript类型定义文件配置 - 豁免类型域中的字面量数字
  {
    name: "typescript-types-overrides",
    files: ["src/types/**/*.ts", "src/**/*.d.ts", "**/@types/**/*.ts"],
    rules: {
      // 类型定义中的字面量数字是必要的，不应被视为魔法数字
      "no-magic-numbers": "off", // 类型定义中的字面量类型
      // 类型定义中允许更多参数以表达完整签名
      "max-params": "off",
    },
  },

  // 常量定义文件配置 - 豁免魔法数字规则
  {
    name: "constants-files-overrides",
    files: ["src/constants/**/*.ts", "src/constants/**/*.js"],
    rules: {
      // 常量定义文件中的数字是有意义的常量，不应被视为魔法数字
      "no-magic-numbers": "off", // 常量定义文件豁免魔法数字检查
    },
  },

  // CODEX分层治理 - 测试文件全面豁免魔法数字
  {
    name: "codex-test-files-config",
    files: [
      "**/*.test.{js,jsx,ts,tsx}",
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "tests/**/*.{js,jsx,ts,tsx}",
      "src/test/**/*.{js,jsx,ts,tsx}",
      "src/testing/**/*.{js,jsx,ts,tsx}",
      "e2e/**/*.{js,jsx,ts,tsx}",
      "scripts/__fixtures__/**/*.{js,jsx,ts,tsx}",
      "**/mocks/**/*.{js,jsx,ts,tsx}",
    ],
    plugins: {
      security,
    },
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
        vitest: "readonly",
      },
    },
    rules: {
      // 🎯 渐进式标准：测试文件保持合理限制
      "max-lines-per-function": [
        "warn",
        { max: 700, skipBlankLines: true, skipComments: true },
      ], // 调整为700行并跳过空行与注释，适应大型测试describe块
      complexity: ["warn", 20], // 从25降到20，保持测试逻辑清晰
      "max-nested-callbacks": ["warn", 6], // 从8降到6，控制嵌套深度
      "max-lines": [
        "warn",
        { max: 800, skipBlankLines: true, skipComments: true },
      ], // 从1200降到800，并跳过空行与注释
      "max-statements": ["warn", 50], // 从80降到50，鼓励测试分解
      "max-params": ["warn", 8], // 从10降到8，合理参数数量

      // 测试文件必要的特殊模式（保持不变）
      "no-magic-numbers": "off", // 测试数据需要具体数值
      "no-plusplus": "off", // 循环计数器在测试中常见
      "prefer-arrow-callback": "off", // function表达式在测试中更清晰
      "no-unused-expressions": "off", // expect().toBe() 断言语句
      "no-empty-function": "off", // 空mock函数是合理的
      "prefer-destructuring": "off", // 测试中直接属性访问更直观
      "no-new": "off", // mock对象创建需要
      "require-await": "off", // async测试模式
      "no-throw-literal": "off", // 测试异常抛出
      "no-underscore-dangle": "off", // 私有属性测试访问
      "no-restricted-imports": "off", // 测试文件允许相对路径导入

      // 🎯 行业标准：测试文件允许any类型（Mock对象复杂性）
      "@typescript-eslint/no-explicit-any": "off", // 测试文件允许any类型 - 符合行业标准
      "@typescript-eslint/no-unused-vars": [
        "error", // 保持严格标准，符合coding-standards.md要求
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ], // 强制清理未使用变量，保持代码质量
      "no-unused-vars": [
        "error", // 保持严格标准，与TypeScript规则一致
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ], // 强制清理未使用变量，保持代码整洁
      "@typescript-eslint/no-require-imports": "off", // 测试中可能需要require导入

      // 安全规则统一为error级别
      "security/detect-object-injection": "error", // 测试数据访问，统一为error级别
      "security/detect-unsafe-regex": "warn", // 测试正则表达式
      "no-script-url": "off", // 测试URL可能需要

      // 保持严格的基本语法规则
      "no-undef": "error", // 未定义变量必须修复
      "no-shadow": "off", // 测试文件中Mock变量重复声明是正常模式
      "no-console": ["warn", { allow: ["warn", "error", "info", "log"] }], // 允许测试调试输出

      // React Hooks规则保持启用 - 确保测试代码质量与生产环境一致
      // 'react-hooks/rules-of-hooks': 'error', // 保持默认，遵循coding-standards.md规范
      "@next/next/no-img-element": "off", // 测试中允许使用原生 img 元素
    },
  },

  // CODEX分层治理 - 脚本和开发工具豁免
  {
    name: "codex-scripts-and-dev-tools-config",
    files: [
      // 构建脚本和配置文件（完全豁免魔法数字）
      "scripts/**/*.{js,ts}",
      "config/**/*.{js,ts}",
      ".size-limit.js",
      "next.config.ts",
      "vitest.config.mts",
      "playwright.config.ts",
      "*.config.{js,ts,mjs}",

      // 开发者工具（应用渐进式标准）
      "src/app/**/diagnostics/**/*.{ts,tsx}",
      "src/components/examples/ui-showcase/**/*.{ts,tsx}",
    ],
    plugins: {
      security,
      "react-you-might-not-need-an-effect": reactYouMightNotNeedAnEffect,
    },
    rules: {
      // 🎯 渐进式改进：开发工具保持基本质量标准
      "max-lines-per-function": [
        "warn",
        { max: 250, skipBlankLines: true, skipComments: true },
      ], // 调整为250行并跳过空行与注释，适应开发工具复杂性
      complexity: ["warn", 18], // 从无限制改为18复杂度警告
      "max-lines": [
        "warn",
        { max: 800, skipBlankLines: true, skipComments: true },
      ], // 调整到800行并跳过空行与注释，适应开发工具复杂性
      "max-params": ["warn", 5], // scripts允许少量CLI参数，但仍保留治理信号

      // 构建脚本必要豁免（保持不变）
      "no-console": "off", // 构建脚本需要console输出
      "no-magic-numbers": "off", // 配置文件需要具体数值
      "no-implicit-coercion": "off", // 配置文件类型转换

      // 🔄 渐进改进：开发工具TypeScript规则收紧
      "@typescript-eslint/no-explicit-any": "warn", // 开发工具允许适度使用any（全局对象访问）
      "@typescript-eslint/ban-ts-comment": "warn", // 开发工具允许@ts-nocheck（仅开发环境）
      "@typescript-eslint/no-unused-vars": [
        "error", // 开发工具也保持严格标准
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // 开发工具特定但合理的豁免
      "no-underscore-dangle": ["error", { allow: ["__DEV__"] }],
      "security/detect-object-injection": "warn", // 开发工具动态访问，降级为警告
      "react/no-unescaped-entities": "off", // 开发工具文案允许未转义实体
      "react-you-might-not-need-an-effect/no-event-handler": "warn",
      "react-you-might-not-need-an-effect/no-chain-state-updates": "warn",
      "no-void": "off", // 允许显式丢弃表达式结果
      "no-empty-function": "warn", // 开发工具占位符
      "consistent-return": "warn", // 开发工具复杂逻辑
      "no-param-reassign": "warn", // 开发工具参数修改
      "prefer-destructuring": "warn", // 开发工具属性访问

      // 保持严格的基本语法检查
      "no-undef": ["error", { typeof: true }], // 未定义变量检查
      "no-unused-vars": "warn", // 清理未使用变量

      // 🚀 ESLint修复专用：scripts目录特殊规则
      "@typescript-eslint/no-require-imports": "off", // scripts中允许require导入
      "no-restricted-imports": "off", // scripts中禁用相对路径限制（Node.js环境）
      "security/detect-non-literal-fs-filename": "warn", // 文件系统操作降级为警告
      "security/detect-non-literal-regexp": "warn", // 动态正则表达式降级为警告
      "max-statements": ["warn", 35], // scripts中允许更多语句
      "max-depth": ["warn", 4], // scripts中允许更深嵌套
      "max-nested-callbacks": ["warn", 4], // scripts中允许更多回调嵌套
      "no-plusplus": "off", // scripts中允许++操作符
      "prefer-template": "warn", // scripts中字符串拼接降级为警告
      radix: "warn", // parseInt缺少radix参数降级为警告
      "no-useless-escape": "warn", // 不必要的转义字符降级为警告
      "require-await": "warn", // async函数无await降级为警告
      "default-case": "warn", // switch缺少default降级为警告
      "no-else-return": "warn", // else return降级为警告
    },
  },

  // Legacy script structural baselines - keep guardrails on, but avoid turning
  // existing script debt into anonymous lint noise under --max-warnings 0.
  {
    name: "legacy-script-structural-baselines",
    files: [
      "scripts/quality/checks/content-readiness.js",
      "scripts/quality/checks/content-slugs.js",
      "scripts/quality/checks/current-truth-docs.js",
      "scripts/quality/checks/eslint-disable.js",
      "scripts/quality/checks/release-verify.js",
    ],
    rules: {
      complexity: ["warn", 30],
      "max-lines": [
        "warn",
        { max: 1000, skipBlankLines: true, skipComments: true },
      ],
      "max-statements": ["warn", 45],
    },
  },

  // 🎯 架构重构专用规则 - 禁止新增export *
  {
    name: "architecture-refactor-rules",
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [
      "scripts/**/*.{js,ts}",
      "config/**/*.{js,ts}",
      "*.config.{js,ts,mjs}",
      // 允许常量聚合入口使用 export * 模式（集中 re-export 常量）
      "src/constants/index.ts",
      // 测试文件豁免 - 允许相对路径导入
      "**/*.test.{js,jsx,ts,tsx}",
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "tests/**/*.{js,jsx,ts,tsx}",
      "src/test/**/*.{js,jsx,ts,tsx}",
      "src/testing/**/*.{js,jsx,ts,tsx}",
      "e2e/**/*.{js,jsx,ts,tsx}",
    ],
    rules: {
      // 禁止新增 export * 重新导出 - 命名导出边界的长期约束（非临时规则）
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportAllDeclaration",
          message:
            '🚫 架构重构期间禁止新增 export * 重新导出。请使用命名导出：export { specificExport } from "./module"',
        },
      ],

      // 禁止相对路径导入（强制使用@/别名）+ 禁止直接使用 next/link
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/link",
              message:
                '🚫 Use { Link } from "@/i18n/routing" for locale-aware navigation.',
            },
          ],
          patterns: [
            {
              group: ["../*"],
              message:
                '🚫 请使用 @/ 路径别名替代跨目录相对路径导入，例如：import { something } from "@/lib/module"',
            },
          ],
        },
      ],
    },
  },

  // 🎯 渐进式统一严格标准 - 核心配置增强
  {
    name: "progressive-unified-enhancements",
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // React特化规则（针对AI编码）: exhaustive-deps 升级为 error（Next 默认 warn）。
      // prefer-const / no-var / no-duplicate-imports 统一由 ultra-strict 块设置。
      "react-hooks/exhaustive-deps": "error", // AI容易遗漏依赖，升级为错误

      // 函数命名和结构
      "func-names": ["warn", "as-needed"], // 鼓励命名函数，便于调试
      "no-anonymous-default-export": "off", // 允许匿名默认导出（React组件）

      // 安全增强（针对AI编码）
      "no-eval": "error", // 严格禁止eval
      "no-implied-eval": "error", // 禁止隐式eval
      "no-new-func": "error", // 禁止Function构造函数

      // 类型安全增强（仅适用于TypeScript文件）
      "@typescript-eslint/no-unused-expressions": "error", // 禁止未使用的表达式
      // 注意：prefer-nullish-coalescing 和 prefer-optional-chain 需要类型信息
      // 这些规则由 Next.js TypeScript 配置处理
    },
  },

  // eslint-disable discipline — require rule name + justification
  eslintComments.recommended,
  {
    name: "eslint-comments-strict",
    rules: {
      "@eslint-community/eslint-comments/require-description": "error",
      "@eslint-community/eslint-comments/disable-enable-pair": [
        "error",
        { allowWholeFile: true },
      ],
    },
  },

  // TypeScript files: disable base rules that duplicate TS-aware checks
  // 目的：避免在TS文件上同时触发基础 no-unused-vars/no-undef 与 TS 规则的重复报错
  {
    name: "ts-core-overrides",
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },

  // 🔧 Next.js配置文件特殊规则 - security.ts被next.config.ts使用，需要相对路径导入
  {
    name: "nextjs-config-files",
    files: ["src/config/security.ts"],
    rules: {
      "no-restricted-imports": "off", // Next.js配置编译时路径别名不可用
    },
  },

  // Next.js App Router page.tsx 导出守护 - 禁止非标准命名导出
  {
    name: "nextjs-page-export-guards",
    files: ["src/app/**/page.tsx", "src/app/**/page.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // 匹配所有不在白名单内的命名导出：
          // 允许函数：generateMetadata | generateStaticParams | generateViewport | generateImageMetadata
          // 允许配置常量：revalidate | dynamic | dynamicParams | fetchCache | runtime | preferredRegion | maxDuration
          selector:
            "ExportNamedDeclaration:not(:has(FunctionDeclaration[id.name=/^(generateMetadata|generateStaticParams|generateViewport|generateImageMetadata)$/])):not(:has(VariableDeclaration > VariableDeclarator[id.name=/^(revalidate|dynamic|dynamicParams|fetchCache|runtime|preferredRegion|maxDuration)$/])):not(:has(ExportSpecifier[exported.name=/^(revalidate|dynamic|dynamicParams|fetchCache|runtime|preferredRegion|maxDuration)$/]))",
          message:
            "🚫 app/**/page.tsx 仅允许导出 generateMetadata/generateStaticParams/generateViewport/generateImageMetadata 以及配置常量（revalidate、dynamic、dynamicParams、fetchCache、runtime、preferredRegion、maxDuration）。请将组件或其他导出移到单独文件。",
        },
      ],
    },
  },

  // 测试文件最终覆盖配置 - 确保测试文件规则优先级最高
  {
    name: "test-files-final-override",
    files: [
      "**/*.test.{js,jsx,ts,tsx}",
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "tests/**/*.{js,jsx,ts,tsx}",
      "src/test/**/*.{js,jsx,ts,tsx}",
      "src/testing/**/*.{js,jsx,ts,tsx}",
      "e2e/**/*.{js,jsx,ts,tsx}",
      "scripts/__fixtures__/**/*.{js,jsx,ts,tsx}",
      "**/mocks/**/*.{js,jsx,ts,tsx}",
    ],
    plugins: {
      security,
    },
    rules: {
      // 明确禁用架构规则，确保测试文件可以使用相对路径导入
      "no-restricted-imports": "off",
      "no-restricted-syntax": "off",
      // 安全规则在测试中完全忽略 - 测试文件中的动态对象访问是正常模式
      "security/detect-object-injection": "off",
      // 允许在测试中动态构建正则（常见于匹配断言）；保持为warn以提示潜在风险
      "security/detect-non-literal-regexp": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error", // 测试文件也保持严格标准
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "max-depth": ["warn", 5],

      // 测试文件中的React/Next特定放宽：
      // - 文本中包含未转义的字符在测试快照/渲染中很常见
      // - displayName 在内联测试组件中并非必要
      // - Next.js 链接规则在测试中不强制
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-assign-module-variable": "off",

      // 一些在测试数据构造中常见但对生产代码不建议的模式
      "no-constant-binary-expression": "off",
    },
  },

  // 类型声明与第三方兼容性区域（types）
  {
    name: "types-compatibility-overrides",
    files: ["src/types/**/*.{ts,tsx}"],
    plugins: {
      security,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-require-imports": "off",
      "max-depth": ["warn", 5],
      "security/detect-object-injection": "warn",
    },
  },

  // Scripts directory overrides - Allow more relaxed rules for build/utility scripts
  {
    name: "scripts-directory-overrides",
    files: ["scripts/**/*.{js,ts,mjs}"],
    plugins: {
      security,
    },
    rules: {
      // Allow console statements in scripts
      "no-console": "off",
      // Allow unused variables in error handling
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Allow object injection for dynamic property access
      "security/detect-object-injection": "off",
      // Allow non-literal filesystem operations
      "security/detect-non-literal-fs-filename": "off",
      // Allow unsafe regex patterns
      "security/detect-unsafe-regex": "off",
      // Allow underscore naming conventions
      "no-underscore-dangle": "off",
      // Allow chained assignments
      "no-multi-assign": "off",
      // Allow functions in loops
      "no-loop-func": "off",
      // Allow variable shadowing
      "no-shadow": "off",
      // Allow duplicate keys
      "no-dupe-keys": "off",
      // Allow undefined variables (for dynamic contexts)
      "no-undef": "off",
      // Allow async functions without await
      "require-await": "off",
      // Allow missing default cases
      "default-case": "off",
      // Allow missing radix parameter
      radix: "off",
      // Allow inconsistent returns
      "consistent-return": "off",
      // Allow useless escapes
      "no-useless-escape": "off",
      // Allow parameter reassignment
      "no-param-reassign": "off",
      // Allow direct property access
      "prefer-destructuring": "off",
      // Allow non-literal regex
      "security/detect-non-literal-regexp": "off",
      // Allow @ts-nocheck
      "@typescript-eslint/ban-ts-comment": "off",
      // Allow process.exit in CLI scripts
      "no-process-exit": "off",
    },
  },

  // Prettier configuration (must be last to override conflicting rules)
  prettierConfig,

  // Global ignores
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".trash-next-artifacts/**",
      "out/**",
      "build/**",
      "dist/**",
      ".conductor/**",
      "*.config.js",
      "*.config.mjs",
      "public/**",
      ".env*",
      "coverage/**",
      "*.d.ts",
      "reports/**",
      "backups/**", // 忽略备份文件，减少非目标代码噪声
      ".worktrees/**", // local dependency-lane worktrees and their generated build output
      "jest.setup.js",
      "jest.config.js",
      "tina/__generated__/**", // 忽略TinaCMS生成的文件
      ".dependency-cruiser.js", // 工具配置文件
      ".claude/skills/**", // agent skill 参考脚本，非生产代码
      ".claude/worktrees/**", // temporary git worktree state
      ".agent/**", // repo-local agent runtime assets
      ".agents/**", // repo-local agent skill assets
      ".continue/**", // local editor/agent workspace files
      ".factory/**", // local factory outputs
      ".kiro/**", // local IDE agent assets
      "skills/**", // local skill workspace
      "skills-lock.json", // local skill lockfile
      ".open-next/**", // OpenNext/Cloudflare 构建产物
      ".wrangler/**", // Wrangler 构建产物
    ],
  },
];
