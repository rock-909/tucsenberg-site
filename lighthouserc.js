/**
 * Lighthouse CI 配置 - 性能监控（替代 size-limit）
 *
 * 迁移说明：
 * Next.js 16 官方移除了构建输出中的 size/First Load JS 指标，
 * 因为在 RSC 架构下这些指标不准确。官方推荐使用 Lighthouse 测量真实性能。
 *
 * 监控策略：
 * 1. Core Web Vitals (LCP, FCP, CLS, TBT)
 * 2. Bundle 大小监控 (total-byte-weight, bootup-time)
 * 3. 未使用 JavaScript 检测 (unused-javascript)
 *
 * 阶段性阈值规划：
 * - Phase 0: Performance 0.68, LCP 5200ms, TBT 800ms (已完成)
 * - Phase 1: Performance 0.85, LCP 4500ms, TBT 200ms (已完成)
 * - Phase 2: total-byte-weight 512KB→515KB 字体减重 (已完成)
 * - Phase 3: total-byte-weight 490KB 黄债治理 (当前)
 *
 * Budget governance:
 * - 继续保留全局 total-byte-weight warning，作为当前黄债信号。
 * - Route-class budget target 记录在
 *   docs/技术难题/Lighthouse预算治理.md.
 * - route-class 目标升成硬断言前，必须先用多次 16 页 full sweep 证明不会制造
 *   false red。
 *
 * 更新时间：2026-05-24 (Wave 3 budget governance)
 */

// 关键 URL 优先策略：CI_DAILY=true 时运行全部 URL，否则仅运行首页。
// Lighthouse 是手动性能证明，不接入默认 CI 或 git hook。
const isDaily = process.env.CI_DAILY === "true";

// 本站 localePrefix 为 'never'（src/config/paths/locales-config.ts），正式 URL
// 不带 locale 段：`/en/x` 会 302 到 `/x`。直接请求无前缀地址，才不会把每一页都
// 变成一次重定向测量。owner 确认后续加语种时，再按当时的前缀策略调整。
const criticalUrls = ["http://localhost:3000/"];

// Every canonical public route the site actually ships: the 11 static pages
// plus all five product-market pages. tests/unit/scripts/
// lighthouse-route-contract.test.ts keeps this list matched to the page and
// product registries, so a new route cannot quietly go unmeasured.
const allUrls = [
  ...criticalUrls,
  "http://localhost:3000/products",
  "http://localhost:3000/oem-wholesale",
  "http://localhost:3000/guides/flood-barrier-materials-guide",
  "http://localhost:3000/guides/flood-barrier-specifications",
  "http://localhost:3000/about",
  "http://localhost:3000/request-quote",
  "http://localhost:3000/contact",
  "http://localhost:3000/warranty",
  "http://localhost:3000/privacy",
  "http://localhost:3000/terms",
  "http://localhost:3000/products/abs-flood-barriers",
  "http://localhost:3000/products/aluminum-flood-gates",
  "http://localhost:3000/products/absorbent-flood-bags",
  "http://localhost:3000/products/flood-tube-dams",
  "http://localhost:3000/products/frp-flood-barriers",
];

const sharedLighthouseAssertions = {
  // 当前 stacked PR 的 CI 里，/en 首页在 GitHub runner 上实际落在
  // 0.75~0.79 区间；0.82 仍然会把 runner 抖动误判成产品回归。
  // 暂时把硬门槛放到 0.78，继续保留 LCP / TBT / 字节预算等细项约束。
  // 这不是最终目标值，后续性能收口后仍应重新抬回 0.82+。
  "categories:performance": [
    "error",
    { minScore: 0.78, aggregationMethod: "optimistic" },
  ],
  "categories:accessibility": ["error", { minScore: 0.9 }],
  "categories:best-practices": ["error", { minScore: 0.9 }],
  "first-contentful-paint": ["error", { maxNumericValue: 2000 }],
  // Phase 1: LCP ≤4500ms（实测 2429-4331ms，有安全余量）
  "largest-contentful-paint": ["error", { maxNumericValue: 4500 }],
  // CLS ≤0.15（实测接近 0，符合 Good CWV 标准；Phase 3 可考虑收紧）
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.15 }],
  // GitHub runner 下 /en 页当前 best-run TBT 已实测到 259.5ms / 341ms。
  // 250ms 继续作为硬门槛会把 CI 抖动放大成系统性红灯。
  // 暂时放宽到 350ms，仍明显低于真正的坏值（>500ms），
  // 并继续使用 optimistic 聚合降低冷启动噪声。
  "total-blocking-time": [
    "error",
    { maxNumericValue: 350, aggregationMethod: "optimistic" },
  ],
  "speed-index": ["error", { maxNumericValue: 3000 }],
  // 'first-meaningful-paint' 已废弃，Lighthouse 不再产出该数值，移除以避免 NaN 断言
  // CI冷启动下TTI波动较大，允许最高6s，线下优化后可再收紧
  interactive: ["error", { maxNumericValue: 6000 }],

  // ==================== Bundle 大小监控（替代 size-limit）====================
  // Phase 3：总传输大小收紧至 490KB。
  // 这条继续作为全局 yellow-debt 信号；route-class 目标先记录在
  // docs/技术难题/Lighthouse预算治理.md，暂不升成硬失败。
  "total-byte-weight": ["warn", { maxNumericValue: 490000 }],

  // JavaScript 启动时间：4s 阈值（解析、编译、执行时间）
  "bootup-time": ["warn", { maxNumericValue: 4000 }],

  // 未使用的 JavaScript：150KB 警告阈值（帮助识别 tree-shaking 问题）
  "unused-javascript": ["warn", { maxNumericValue: 153600 }],

  // 主线程工作时间：4s 阈值
  "mainthread-work-breakdown": ["warn", { maxNumericValue: 4000 }],
};

const indexablePageAssertions = {
  ...sharedLighthouseAssertions,
  "categories:seo": ["error", { minScore: 0.9 }],
};

module.exports = {
  ci: {
    collect: {
      url: isDaily ? allUrls : criticalUrls,
      // APP_ENV=production is required, not cosmetic: without it the runtime
      // emits `noindex` and every SEO assertion fails on measurement setup
      // rather than on real page quality. Dynamic routes read it at request
      // time, so it must be set on the server; static pages bake `robots` in
      // at build time, so it must also be set on the build. Leaving that to
      // whoever runs the command did not work — `pnpm website:check` ends in a
      // bare `pnpm build`, and measuring on top of that leftover scored 9
      // routes at 0.69 with `is-crawlable: Page is blocked from indexing`.
      // The `website:lighthouse` script now runs the production build itself,
      // which also means it writes `.next` — see the parallel-build warning in
      // AGENTS.md / CLAUDE.md.
      startServerCommand: "APP_ENV=production pnpm start",
      startServerReadyPattern: "Local:",
      startServerReadyTimeout: 60000,
      // 使用 3 次运行配合 optimistic 聚合，更好地过滤 CI 冷启动噪声
      numberOfRuns: 3,
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: "^(?!.*\\/products\\/[^/]+$).*$",
          assertions: indexablePageAssertions,
        },
        {
          // Product-detail pages carry the shared budget without the SEO
          // category gate; the pattern covers every slug, not one sample.
          matchingUrlPattern: "/products/[^/]+$",
          assertions: sharedLighthouseAssertions,
        },
      ],
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
