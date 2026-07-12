import path from "path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";
import { getSecurityHeaders } from "./src/config/security";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env["ANALYZE"] === "true",
});

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: ["remark-frontmatter"],
    rehypePlugins: [],
  },
});

const isCloudflare =
  process.env.DEPLOYMENT_PLATFORM === "cloudflare" ||
  process.env.DEPLOY_TARGET === "cloudflare";
const nextConfig: NextConfig = {
  // Keep the same build ID across containers serving the same commit, but do
  // not reuse one fixed ID across releases. This avoids stale _next asset
  // confusion while preserving deterministic multi-container deploys.
  generateBuildId: async () => {
    const { execSync } = await import("child_process");
    try {
      return execSync("git rev-parse --short HEAD", {
        encoding: "utf-8",
      }).trim();
    } catch {
      return (
        process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) ??
        process.env.GITHUB_SHA?.slice(0, 7) ??
        "local-dev"
      );
    }
  },

  // Exclude test/report artifacts from OpenNext bundle
  outputFileTracingExcludes: {
    "/*": [
      "./reports/**",
      "./coverage/**",
      "./test-results/**",
      "./.lighthouseci/**",
      "./tests/e2e/.playwright/**",
      "./playwright-report/**",
      "./.playwright/**",
    ],
  },

  /* config options here */

  // Enable Next.js 16 Cache Components mode.
  // 2026-04-26: One product FAQ helper keeps a Cache Components boundary for
  // build correctness, but runtime tag invalidation is not part of launch.
  // Content updates flow through redeploys.
  // See open-next.config.ts and wrangler.jsonc: no R2/D1/DO cache stack.
  cacheComponents: true,

  // Keep HTTP compression enabled for `next start` and self-hosted previews.
  compress: true,

  // Turbopack 配置 - 明确指定项目根目录
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "@content": path.resolve(__dirname, "content"),
    },
  },

  // Configure pageExtensions to include markdown and MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  // Cloudflare deploy artifacts prioritize bundle size; disable browser source maps there.
  productionBrowserSourceMaps: !isCloudflare,

  images: {
    // Starter baseline: Cloudflare builds must not require Images,
    // Transformations, Polish, Mirage, R2, or a custom image loader. Derived
    // customer projects can opt into those lanes only with separate deployed
    // Cloudflare proof.
    ...(isCloudflare ? { unoptimized: true } : {}),
  },

  // Next.js Compiler 配置
  compiler: {
    // 生产环境移除 console 语句，但保留 error 和 warn 级别
    // 这有助于减少生产环境的包大小并避免潜在的信息泄露
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"], // 保留 console.error 和 console.warn
          }
        : false, // 开发环境保留所有 console 语句
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    // Next.js 16 已移除 testProxy 配置 - 使用 next/experimental/testing/server 替代
    // 旧配置: testProxy: process.env.CI === 'true',
    // 新方式: 在测试文件中使用 unstable_doesProxyMatch() 和相关 API
    // 内联关键CSS（experimental.inlineCss）在当前构建链路下会引入 FOUC，导致首屏 CLS/Performance 显著劣化
    // 先禁用以稳定 CI 的 Lighthouse 质量门禁（后续可在 Next.js/Turbopack 修复后再评估开启）
    inlineCss: false,
  },

  // 解决 Turbopack + OpenTelemetry 依赖问题
  // 这些包已经在 Next.js 15 的默认外部包列表中
  // 但 Turbopack 在处理它们时遇到问题，所以我们暂时移除这个配置
  // 让 Next.js 使用默认的外部包处理方式

  // Webpack 配置 - 仅用于 resolve.alias/externals
  // Next.js 16 默认使用 Turbopack，此配置仅在 build:webpack 兜底时生效
  webpack: (config, { isServer }) => {
    // Path alias configuration for @/ -> src/
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
      "@messages": path.resolve(__dirname, "messages"),
      "@content": path.resolve(__dirname, "content"),
    };

    // 服务端将部分重型依赖标记为 external，避免捆绑到通用 chunk 触发初始化顺序问题
    if (isServer) {
      // 保持 Node.js 运行时从 node_modules 动态加载
      // 避免在构建期/收集阶段加载第三方库内部复杂依赖
      // 尤其是 airtable 等 SDK
      // 说明：commonjs 形式 external 不会影响运行时 require/import
      (config.externals ||= [] as unknown[]).push({
        airtable: "commonjs airtable",
      });
    }

    return config;
  },

  headers() {
    const securityHeaders = getSecurityHeaders();

    // CDN 缓存策略（H-001 LCP 优化）
    // 为静态资源设置长期缓存，提升性能和 LCP
    const cdnCacheHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];
    const pdfNoindexHeaders = [
      {
        key: "X-Robots-Tag",
        value: "noindex",
      },
    ];
    const nonProductionNoindexHeaders = [
      {
        key: "X-Robots-Tag",
        value: "noindex, nofollow",
      },
    ];
    const shouldNoindexPublicPages = process.env.APP_ENV !== "production";

    const headerConfigs = [
      // 安全头部应用到所有路径
      ...(securityHeaders.length > 0
        ? [
            {
              source: "/:path*",
              headers: securityHeaders,
            },
          ]
        : []),
      ...(shouldNoindexPublicPages
        ? [
            {
              source: "/:path*",
              headers: nonProductionNoindexHeaders,
            },
          ]
        : []),
      // PDF downloads are buyer aids, not SEO landing pages.
      {
        source: "/downloads/:path*.pdf",
        headers: pdfNoindexHeaders,
      },
      // CDN 缓存策略应用到静态资源
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|pdf|woff|woff2|ttf|otf)",
        headers: cdnCacheHeaders,
      },
    ];

    return headerConfigs;
  },
};

// Export final config with all plugins applied
export default withBundleAnalyzer(withNextIntl(withMDX(nextConfig)));
