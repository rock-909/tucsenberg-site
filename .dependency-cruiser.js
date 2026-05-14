// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("node:path");

module.exports = {
  forbidden: [
    // === 层边界规则（Task 016 — 防止重构回退） ===
    {
      name: "no-lib-to-components-or-app",
      severity: "error",
      comment:
        "src/lib 不能依赖 src/components 或 src/app — lib 层必须独立于 UI 层",
      from: { path: "^src/lib/" },
      to: { path: "^src/(app|components)/" },
    },
    {
      name: "no-components-to-app",
      severity: "error",
      comment:
        "src/components 不能依赖 src/app — components 层不能反向依赖 app 层",
      from: { path: "^src/components/" },
      to: { path: "^src/app/" },
    },
    {
      name: "no-config-to-components",
      severity: "error",
      comment: "src/config 不能依赖 src/components — config 层必须与 UI 层解耦",
      from: { path: "^src/config/" },
      to: { path: "^src/components/" },
    },
    {
      name: "no-cross-route-import",
      severity: "error",
      comment: "不同路由目录不能直接导入彼此 — 共享逻辑应抽到 src/lib",
      from: { path: "^src/app/\\[locale\\]/([^/]+)/" },
      to: {
        path: "^src/app/\\[locale\\]/[^/]+/",
        pathNot: "^src/app/\\[locale\\]/$1/",
      },
    },
    {
      name: "no-non-test-imports-api-routes",
      severity: "error",
      comment:
        "非测试文件不能直接导入 API 路由实现 — 使用 fetch 或 server actions 代替",
      from: {
        path: "^src/",
        pathNot:
          "\\.(spec|test|stories)\\.(js|ts|tsx)$|/__tests__/|^src/app/api/",
      },
      to: { path: "^src/app/api/" },
    },
    {
      name: "no-circular",
      severity: "error",
      comment: "禁止循环依赖 - 防止模块间相互引用导致的架构问题",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment: "检测孤立文件 - 识别未被引用的代码文件（已优化减少误报）",
      from: {
        orphan: true,
        pathNot: [
          // 测试文件
          "\\.(d\\.ts|spec\\.ts|test\\.ts|stories\\.ts|stories\\.tsx)$",
          // 类型定义目录和文件
          "^src/types/",
          ".*-types\\.(ts|tsx)$",
          // 测试工具和模板
          "^src/test/",
          "^src/testing/",
          "test-utils\\.(ts|tsx)$",
          "setup\\.(ts|tsx)$",
          // 测试常量
          "^src/constants/test-",
          // Next.js页面文件（文件系统路由）
          "^src/app/.*/page\\.tsx$",
          "^src/app/page\\.tsx$",
          "^src/app/.*/route\\.(ts|tsx)$",
          "^src/app/.*/head\\.tsx$",
          "^src/app/head\\.tsx$",
          // Next.js布局和字体配置
          "^src/app/.*/layout-fonts\\.(ts|tsx)$",
          // 配置文件
          "^src/config/",
          // Mock文件
          "/mocks/",
          // 工具文件（可能通过动态导入使用）
          "^src/lib/.*\\.(ts|tsx)$",
          // 常量文件（可能通过动态导入使用）
          "^src/constants/.*\\.(ts|tsx)$",
          // 服务文件（可能通过动态导入使用）
          "^src/services/.*\\.(ts|tsx|js|jsx)$",
          // UI组件（可能通过动态导入使用）
          "^src/components/ui/.*\\.(ts|tsx)$",
          "^src/components/loading-.*\\.(ts|tsx)$",
          "^src/components/theme-provider\\.(ts|tsx)$",
          // 开发工具组件（开发环境专用）
          "^src/components/dev-tools/.*\\.(ts|tsx)$",
          // 展示和演示组件（可能通过动态导入使用）
          "^src/components/examples/.*\\.(ts|tsx)$",
          "^src/components/shared/under-construction.*\\.(ts|tsx)$",
          // CTA组件（可能通过动态导入使用）
          "^src/components/home/cta/.*\\.(ts|tsx)$",
          // Hook文件（可能通过动态导入使用）
          "^src/hooks/.*\\.(ts|tsx)$",
          // 可访问性测试组件（测试专用）
          "^src/app/.*/accessibility-test/.*\\.(ts|tsx)$",
          // 数据和配置文件（可能通过动态导入使用）
          "/data\\.(ts|tsx|js|jsx)$",
          ".*-config\\.(ts|tsx)$",
        ].join("|"),
      },
      to: {},
    },
    {
      name: "feature-isolation",
      severity: "error",
      comment: "特性间依赖隔离 - 确保功能模块间的清晰边界",
      from: { path: "^src/features/[^/]+" },
      to: {
        path: "^src/features/(?!\\1)[^/]+",
        pathNot: "^src/(shared|lib|components|utils|types|hooks)",
      },
    },
    {
      name: "no-external-to-internal",
      severity: "error",
      comment: "禁止外部依赖直接访问内部模块",
      from: { pathNot: "^src/" },
      to: { path: "^src/lib/internal" },
    },
    {
      name: "no-test-imports-in-production",
      severity: "error",
      comment: "禁止生产代码导入测试文件",
      from: {
        pathNot: "\\.(spec|test|stories)\\.(js|ts|tsx)$",
      },
      to: {
        path: "\\.(spec|test|stories)\\.(js|ts|tsx)$",
      },
    },
    {
      name: "no-test-support-imports-in-production",
      severity: "error",
      comment: "禁止生产代码导入 src/test、src/testing 或 test-* 常量",
      from: {
        path: "^src/(app|components|config|hooks|i18n|lib|services)/",
        pathNot: "\\.(spec|test|stories)\\.(js|ts|tsx)$|/__tests__/",
      },
      to: {
        path: "^src/(test|testing)/|^src/constants/test-",
      },
    },
    {
      name: "no-dev-dependencies-in-production",
      severity: "error",
      comment: "禁止生产代码导入开发依赖",
      from: {
        path: "^src/",
        pathNot: "\\.(spec|test|stories)\\.(js|ts|tsx)$",
      },
      to: {
        dependencyTypes: ["npm-dev"],
      },
    },
    // === 跨域依赖规则（显式域匹配，避免跨规则反向引用） ===
    {
      name: "no-cross-domain-direct-access:web-vitals",
      severity: "error",
      comment:
        "web-vitals 域应避免直接依赖其他 lib 域（试点已稳定，升级为 error）",
      from: {
        path: "^src/lib/web-vitals/",
      },
      to: {
        path: [
          "^src/lib/security(?:/|-)",
          "^src/lib/i18n(?:/|-)",
          "^src/lib/locale-storage",
          "^src/lib/performance-monitoring",
          "^src/lib/theme-analytics",
          "^src/lib/content(?:-query|-)",
          "^src/lib/resend",
          "^src/lib/airtable",
        ].join("|"),
        // 豁免类型定义和常量
        pathNot: [
          "/types\\.(ts|tsx)$",
          "/constants\\.(ts|tsx)$",
          "/index\\.(ts|tsx)$",
        ].join("|"),
      },
    },
    {
      name: "no-shipped-blog-routes-to-newsletter-island",
      severity: "error",
      comment:
        "已上线 blog routes 不得重新依赖 BlogNewsletter client island（含可达依赖）",
      from: {
        path: [
          "^src/app/\\[locale\\]/blog/page\\.tsx$",
          "^src/app/\\[locale\\]/blog/\\[slug\\]/page\\.tsx$",
        ].join("|"),
      },
      to: {
        path: "^src/components/blog/blog-newsletter\\.tsx$",
        reachable: true,
      },
    },
    {
      name: "no-shipped-product-routes-to-inquiry-islands",
      severity: "error",
      comment:
        "已上线 product routes 不得重新依赖 ProductActions / InquiryDrawer / ProductInquiryForm（含可达依赖）",
      from: {
        path: [
          "^src/app/\\[locale\\]/products/page\\.tsx$",
          "^src/app/\\[locale\\]/products/\\[market\\]/page\\.tsx$",
        ].join("|"),
      },
      to: {
        path: [
          "^src/components/products/product-actions\\.tsx$",
          "^src/components/products/inquiry-drawer\\.tsx$",
          "^src/components/products/product-inquiry-form\\.tsx$",
        ].join("|"),
        reachable: true,
      },
    },
    {
      name: "web-vitals-no-ui-deps",
      severity: "error",
      comment:
        "web-vitals 域不依赖 UI/Page 层（试点收紧为 error，保障无 UI 反向依赖）",
      from: {
        path: "^src/lib/web-vitals/",
      },
      to: {
        path: "^src/(app|components)/",
        pathNot: "/(types|constants)\\.(ts|tsx)$",
      },
    },
    {
      name: "i18n-no-ui-deps",
      severity: "warn",
      comment: "i18n 域不依赖 UI/Page 层（新扩面灰度）",
      from: {
        path: "^src/lib/i18n",
      },
      to: {
        path: "^src/(app|components)/",
        pathNot: "/(types|constants)\\.(ts|tsx)$",
      },
    },
    {
      name: "no-relative-cross-layer-imports",
      severity: "error",
      comment: "禁止相对路径跨层导入 - 必须使用@/别名",
      from: { path: "^src/" },
      to: {
        path: "\\.\\./",
        pathNot: "\\.(spec|test|stories)\\.(js|ts|tsx)$",
      },
    },
    {
      name: "enforce-domain-boundaries",
      severity: "error",
      comment:
        "强制域边界（试点升级）- web-vitals 跨域直接阻断，保持稳定后扩面",
      from: { path: "^src/lib/web-vitals/" },
      to: {
        path: "^src/lib/(?!web-vitals/)[^/]+/",
        pathNot: ["^src/lib/security/object-guards.ts$"].join("|"),
      },
    },
    {
      name: "i18n-domain-boundaries",
      severity: "warn",
      comment: "i18n 域跨域依赖提示（灰度扩面）",
      from: { path: "^src/lib/i18n/" },
      to: {
        path: "^src/lib/(?!i18n/)[^/]+/",
      },
    },
    {
      name: "no-barrel-export-dependencies",
      severity: "warn",
      comment: "避免通过 barrel 导出建立依赖（豁免通用聚合出口）",
      from: {
        path: "^src/",
        pathNot: "^src/(app|components|scripts)/",
      },
      to: {
        path: "index\\.(ts|js)$",
        pathNot: [
          "^src/app/",
          "^src/components/",
          "^src/constants/index\\.(ts|js)$",
          "^src/types/index\\.(ts|js)$",
          "^src/lib/web-vitals/index\\.(ts|js)$",
        ].join("|"),
      },
    },
  ],
  options: {
    tsConfig: {
      fileName: path.join(__dirname, "tsconfig.json"),
    },
    doNotFollow: {
      path: "node_modules|\\.(spec|test|stories)\\.(js|ts|tsx)$",
    },
    exclude: {
      path: "\\.(spec|test|stories)\\.(js|ts|tsx)$|node_modules",
    },
    tsPreCompilationDeps: true,
    preserveSymlinks: false,
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
        theme: {
          graph: {
            bgcolor: "transparent",
            splines: "ortho",
            rankdir: "TB",
            fontname: "Helvetica",
            fontsize: "9",
          },
          modules: [
            {
              criteria: { source: "^src/app" },
              attributes: { fillcolor: "#ffcccc", style: "filled" },
            },
            {
              criteria: { source: "^src/components" },
              attributes: { fillcolor: "#ccffcc", style: "filled" },
            },
            {
              criteria: { source: "^src/lib" },
              attributes: { fillcolor: "#ccccff", style: "filled" },
            },
            {
              criteria: { source: "^src/features" },
              attributes: { fillcolor: "#ffffcc", style: "filled" },
            },
          ],
        },
      },
    },
  },
};
