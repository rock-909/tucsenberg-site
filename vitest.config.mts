/// <reference types="vitest" />
import { resolve } from "path";
import { defineConfig } from "vitest/config";

const debugTestOutput = process.env.VITEST_DEBUG_OUTPUT === "true";

export default defineConfig({
  test: {
    // 测试环境配置 - 使用标准 jsdom 环境
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000",
        pretendToBeVisual: true,
        resources: "usable",
        runScripts: "dangerously",
      },
    },

    // 全局设置
    globals: true,

    // SSR 配置 - 修复 Sentry 依赖解析问题
    server: {
      deps: {
        inline: [
          "@sentry/nextjs",
          "@sentry/core",
          "@sentry/utils",
          "@sentry/node",
        ],
      },
    },

    // 设置文件
    setupFiles: ["./src/test/setup.ts"],

    // 测试文件匹配模式 - 优化分离策略
    include: [
      "src/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "src/**/__tests__/**/*.{js,jsx,ts,tsx}",
      "tests/architecture/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "tests/integration/**/*.{test,spec}.{js,jsx,ts,tsx}",
    ],

    // 排除文件 - 严格分离浏览器测试
    exclude: [
      "node_modules",
      ".next",
      "dist",
      "build",
      "coverage",
      "**/*.d.ts",
      "**/*.stories.{js,jsx,ts,tsx}",
      // 排除setup文件和工具文件
      "**/setup.{js,jsx,ts,tsx}",
      "**/test-utils.{js,jsx,ts,tsx}",
      "**/__tests__/**/setup.{js,jsx,ts,tsx}",
      "**/__tests__/**/test-utils.{js,jsx,ts,tsx}",
      // 排除Mock文件 - 这些是Mock模块，不是测试文件
      "**/__tests__/**/mocks/**/*.{js,jsx,ts,tsx}",
      "**/mocks/**/*.{js,jsx,ts,tsx}",
      // 严格排除浏览器测试文件
      "**/*.browser.{test,spec}.{js,jsx,ts,tsx}",
      "tests/browser/**/*",
      "tests/e2e/**/*",
      // 排除性能测试文件
      "**/*.performance.{test,spec}.{js,jsx,ts,tsx}",
    ],

    // 覆盖率配置 - 最简配置
    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      // 将覆盖率输出目录统一至 reports/coverage，便于与其它报告汇总
      reportsDirectory: "./reports/coverage",
      // json: 提供逐行命中数据，供 CI diff-line coverage 使用
      reporter: ["text", "html", "json-summary", "json"],
      exclude: [
        "node_modules/",
        ".next/",
        "dist/",
        "build/",
        "coverage/",
        "**/*.d.ts",
        "**/*.stories.{js,jsx,ts,tsx}",
        "**/*.test.{js,jsx,ts,tsx}",
        "**/*.spec.{js,jsx,ts,tsx}",
        "src/test/**",
        "scripts/**",
        "**/__mocks__/**",
        "**/test-utils/**",
        // 排除配置文件，避免污染覆盖率
        "next.config.ts",
        "tailwind.config.js",
        "postcss.config.mjs",
        "eslint.config.mjs",
        "playwright.config.ts",
        "commitlint.config.js",
        "translation.config.js",
        "tsconfig.json",
        "vitest.config.mts",
        "lefthook.yml",
        "semgrep.yml",
        "mdx-components.tsx",
        "src/middleware.ts",
        "instrumentation.ts",
        "instrumentation-client.ts",
        "sentry.*.config.ts",
        // 排除自动生成的文件
        "**/*.generated.*",
        "content/config/**",
        "**/*.tsbuildinfo",
        // 排除报告和文档目录
        "reports/**",
        "docs/**",
        "test-results/**",
        // 排除静态数据/配置组件，避免拉低覆盖率
        "src/components/i18n/locale-switcher/config.ts",
        "src/components/shared/animations/showcase-config.tsx",
        // 排除纯类型定义文件（无运行时代码）
        "src/types/**/*.d.ts",
        "src/types/i18n.ts",
        "src/types/mdx.ts",
        "src/types/content.ts",
        // 注意：src/types/index.ts, test-types.ts, react19.ts 包含运行时函数，不排除
      ],
      // 覆盖率阈值由 scripts/quality-gate.js 统一管理
      // Vitest 仅生成报告数据，不执行阈值检查
    },

    // 测试超时设置 - 适应 CI 环境
    testTimeout: 12000, // 从 8000ms 增加到 12000ms，适应 CI 环境资源限制
    hookTimeout: 6000, // 从 4000ms 增加到 6000ms

    // 并发设置 - 优化 CI 环境性能
    pool: "threads",

    // 添加测试重试机制 - 仅用于已知 flaky 测试，应在具体测试上使用 test.retry()
    // retry: 2, // 已移除全局 retry，遇到 flaky 测试应修复根因或局部声明

    // 报告器配置
    reporters: debugTestOutput ? ["verbose", "json"] : ["default", "json"],
    outputFile: {
      json: "./reports/test-results.json",
    },

    // 环境变量
    env: {
      NODE_ENV: "test",
    },

    // 性能配置 - 增强缓存和性能监控
    logHeapUsage: debugTestOutput,
    isolate: true,

    // 依赖优化 - 提高模块解析性能
    deps: {
      optimizer: {
        client: {
          enabled: true, // 启用Web依赖优化
        },
        ssr: {
          enabled: true, // 启用SSR依赖优化
        },
      },
    },

    // UI配置 - 默认关闭以避免端口监听需求
    ui: false,
    open: false,
  },

  // 路径别名配置 - 统一使用单一别名符合规则要求
  resolve: {
    alias: [
      // Stub CSS imports to avoid PostCSS processing in tests (must come before @ alias)
      {
        find: "@/app/globals.css",
        replacement: resolve(__dirname, "./src/test/css-stub.ts"),
      },
      // Stub MDX imports so `vitest related` can analyze graphs without an MDX plugin.
      {
        find: /^.*\.mdx$/u,
        replacement: resolve(__dirname, "./src/test/mdx-stub.ts"),
      },
      // Fix directory import resolution in Vitest for packages that import "next/font/local"
      { find: "next/font/local", replacement: "next/font/local/index.js" },
      // Content path alias (must match tsconfig.json paths for consistency)
      { find: "@content", replacement: resolve(__dirname, "./content") },
      // Main path aliases
      { find: "@messages", replacement: resolve(__dirname, "./messages") },
      { find: "@", replacement: resolve(__dirname, "./src") },
    ],
  },

  // 定义全局变量 - React 19 兼容性增强
  define: {
    "process.env.NODE_ENV": '"test"',
    // React 19 并发特性支持
    "global.window": "globalThis",
    "typeof window": '"object"',
    __DEV__: true,
    __EXPERIMENTAL__: true,
    // React 19 兼容性：在模块加载前预设全局变量
    "globalThis.IS_REACT_ACT_ENVIRONMENT": "true",
    // 确保 React DOM 能够正确初始化
    "globalThis.window": "globalThis",
  },
});
