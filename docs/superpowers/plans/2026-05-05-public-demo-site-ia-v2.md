# Public Demo Site IA V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current starter into a public demo starter site with four clear public pages, a demoted contact entry, useful blog content, and a separately verified footer theme switcher fix.

**Architecture:** Keep existing App Router and locale structure. Use typed configuration for navigation and route truth, MDX for page prose/SEO/FAQ, split translation files for shared UI chrome, and focused Server Components for Home/Products/Blog/About page presentation. Fix the footer theme switcher before the content rewrite so a real UI bug is not hidden inside a broad redesign.

**Tech Stack:** Next.js 16 App Router, Cache Components, React 19, TypeScript, next-intl split messages, MDX content pipeline, Tailwind CSS v4, Vitest, Playwright.

---

## Scope notes

This plan implements `/Users/Data/workspace/showcase-website-starter/docs/superpowers/specs/2026-05-05-public-demo-site-ia-v2-design.md`.

There are two workstreams:

1. **Bug fix:** footer theme switcher is currently delayed behind a long idle timeout and can look broken. This gets its own task and verification.
2. **Public site IA/content rewrite:** Home, Products, Blog, About, navigation, and supporting copy are rewritten around the approved public demo starter direction.

Do not commit the existing generated `next-env.d.ts` noise unless a later step intentionally normalizes it. It currently changes only:

```diff
- import "./.next/types/routes.d.ts";
+ import "./.next/dev/types/routes.d.ts";
```

## Files map

### Task 1: Footer theme switcher bug

- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/ui/lazy-theme-switcher.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/ui/__tests__/lazy-theme-switcher.test.tsx`
- Optionally inspect: `/Users/Data/workspace/showcase-website-starter/src/components/ui/theme-switcher.tsx`
- Optionally inspect: `/Users/Data/workspace/showcase-website-starter/tests/e2e/safe-navigation.spec.ts`

Responsibility: make the footer theme switcher render promptly and verify that behavior with a focused regression test.

### Task 2: Navigation and route truth

- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/paths/types.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/paths/paths-config.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/single-site-links.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/single-site-navigation.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/single-site-seo.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/lib/content/page-dates.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/lib/navigation.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/app/sitemap.ts` only if existing helpers require explicit blog handling after the route config change
- Modify tests:
  - `/Users/Data/workspace/showcase-website-starter/src/lib/content/__tests__/page-dates.test.ts`
  - `/Users/Data/workspace/showcase-website-starter/tests/e2e/navigation.spec.ts`
  - `/Users/Data/workspace/showcase-website-starter/tests/e2e/basic-navigation.spec.ts`

Responsibility: add Blog as a first-class public route, reduce primary navigation to Home/Products/Blog/About, and keep Contact as a separate header action.

### Task 3: Blog route and starter articles

- Create: `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/blog/page.tsx`
- Create: `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/blog/[slug]/page.tsx`
- Create: `/Users/Data/workspace/showcase-website-starter/src/lib/blog/starter-blog.ts`
- Create: `/Users/Data/workspace/showcase-website-starter/src/lib/blog/__tests__/starter-blog.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/en/critical.json`
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/zh/critical.json`
- Regenerate if needed: `/Users/Data/workspace/showcase-website-starter/messages/en.json`
- Regenerate if needed: `/Users/Data/workspace/showcase-website-starter/messages/zh.json`
- Regenerate if needed: `/Users/Data/workspace/showcase-website-starter/public/messages/en/critical.json`
- Regenerate if needed: `/Users/Data/workspace/showcase-website-starter/public/messages/zh/critical.json`
- Add or update E2E:
  - `/Users/Data/workspace/showcase-website-starter/tests/e2e/navigation.spec.ts`

Responsibility: create a real Blog listing and article detail route with 3-4 starter-aligned launch education articles.

### Task 4: Home page rewrite

- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/single-site-page-expression.ts`
- Modify existing section components where reuse is still useful:
  - `/Users/Data/workspace/showcase-website-starter/src/components/sections/hero-section.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/sections/starter-boundary-section.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/sections/chain-section.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/sections/products-section.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/sections/final-cta.tsx`
- Create small new sections only if existing sections cannot express the approved journey:
  - `/Users/Data/workspace/showcase-website-starter/src/components/sections/home-problem-section.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/sections/home-capability-preview-section.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/en/critical.json`
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/zh/critical.json`
- Update tests:
  - `/Users/Data/workspace/showcase-website-starter/tests/e2e/homepage.spec.ts`
  - `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/__tests__/page.test.tsx`

Responsibility: make Home tell the approved journey: pain, answer, capabilities, start path, action.

### Task 5: Products page rewrite

- Modify or replace: `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/products/page.tsx`
- Create if needed: `/Users/Data/workspace/showcase-website-starter/src/components/products/starter-capability-card.tsx`
- Create if needed: `/Users/Data/workspace/showcase-website-starter/src/components/products/technical-proof-card.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/en/critical.json`
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/zh/critical.json`
- Update tests:
  - `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/products/__tests__/page.test.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/products/__tests__/products-page.test.tsx`
  - `/Users/Data/workspace/showcase-website-starter/tests/e2e/product-family-contact-handoff.spec.ts` if it depends on old product card text or selectors

Responsibility: make Products explain result capabilities plus technical proof, without becoming a raw technical documentation page.

### Task 6: About page content rewrite

- Modify: `/Users/Data/workspace/showcase-website-starter/content/pages/en/about.mdx`
- Modify: `/Users/Data/workspace/showcase-website-starter/content/pages/zh/about.mdx`
- Modify if shell assumptions need to change: `/Users/Data/workspace/showcase-website-starter/src/components/content/about-page-shell.tsx`
- Update tests:
  - `/Users/Data/workspace/showcase-website-starter/src/components/content/__tests__/about-page-shell.test.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/about/__tests__/page.test.tsx`
  - `/Users/Data/workspace/showcase-website-starter/tests/e2e/about-page-rendering.spec.ts`

Responsibility: make About a starter identity and boundary page, not a fictional company profile.

### Task 7: Contact action and supporting chrome copy

- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/layout/header.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/layout/mobile-navigation.tsx`
- Modify if footer should demote old pages into resource columns:
  - `/Users/Data/workspace/showcase-website-starter/src/config/single-site.ts`
  - `/Users/Data/workspace/showcase-website-starter/src/config/footer-links.ts`
- Modify contact content only if copy conflicts with the approved role:
  - `/Users/Data/workspace/showcase-website-starter/content/pages/en/contact.mdx`
  - `/Users/Data/workspace/showcase-website-starter/content/pages/zh/contact.mdx`
- Update tests:
  - `/Users/Data/workspace/showcase-website-starter/src/components/layout/__tests__/header.test.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/layout/__tests__/mobile-navigation.test.tsx`
  - `/Users/Data/workspace/showcase-website-starter/tests/e2e/contact-form-smoke.spec.ts`

Responsibility: ensure Contact is visible as a quick action beside the language switcher and still lands on `/contact`.

### Task 8: Final verification and documentation alignment

- Modify if needed: `/Users/Data/workspace/showcase-website-starter/docs/website/README.md`
- Modify if needed: `/Users/Data/workspace/showcase-website-starter/docs/website/新项目替换清单.md`
- Run verification commands listed below.
- Create final commit or PR after review.

Responsibility: prove the site meets the approved design and the repo checks still pass.

---

## Task 1: Fix footer theme switcher render delay

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/ui/lazy-theme-switcher.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/ui/__tests__/lazy-theme-switcher.test.tsx`

- [ ] **Step 1: Write the failing test**

Change `/Users/Data/workspace/showcase-website-starter/src/components/ui/__tests__/lazy-theme-switcher.test.tsx` so the first test expects a short idle delay instead of the existing 30 second delay.

Use this expected assertion:

```tsx
expect(mockRequestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
  fallbackDelay: 1200,
  timeout: 1200,
});
```

Also update the test name to:

```tsx
it("renders the footer switcher after a short idle callback", async () => {
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm vitest run src/components/ui/__tests__/lazy-theme-switcher.test.tsx
```

Expected result before implementation:

```text
FAIL src/components/ui/__tests__/lazy-theme-switcher.test.tsx
expected ... fallbackDelay: 1200 ... received ... fallbackDelay: 30000
```

- [ ] **Step 3: Implement the short delay**

Edit `/Users/Data/workspace/showcase-website-starter/src/components/ui/lazy-theme-switcher.tsx`.

Replace the import:

```tsx
import { THIRTY_SECONDS_MS } from "@/constants/time";
```

with:

```tsx
import { IDLE_CALLBACK_FALLBACK_DELAY } from "@/constants/time";
```

Replace:

```tsx
return requestIdleCallback(() => setShouldRender(true), {
  fallbackDelay: THIRTY_SECONDS_MS,
  timeout: THIRTY_SECONDS_MS,
});
```

with:

```tsx
return requestIdleCallback(() => setShouldRender(true), {
  fallbackDelay: IDLE_CALLBACK_FALLBACK_DELAY,
  timeout: IDLE_CALLBACK_FALLBACK_DELAY,
});
```

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
pnpm vitest run src/components/ui/__tests__/lazy-theme-switcher.test.tsx
```

Expected:

```text
PASS src/components/ui/__tests__/lazy-theme-switcher.test.tsx
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/components/ui/lazy-theme-switcher.tsx src/components/ui/__tests__/lazy-theme-switcher.test.tsx
git commit -m "fix: render footer theme switcher promptly"
```

---

## Task 2: Update route and navigation truth

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/paths/types.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/paths/paths-config.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/single-site-links.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/single-site-navigation.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/single-site-seo.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/lib/content/page-dates.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/lib/content/__tests__/page-dates.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/e2e/navigation.spec.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/e2e/basic-navigation.spec.ts`

- [ ] **Step 1: Add a failing route config test for Blog**

Edit `/Users/Data/workspace/showcase-website-starter/src/lib/content/__tests__/page-dates.test.ts`.

Add `blog` to the route expectations:

```tsx
const nonMdxPages = new Set(["", getCanonicalPath("products")]);
const representativePageContracts = [
  { path: "", isMdx: false },
  { path: "/blog", isMdx: false },
  { path: "/products", isMdx: false },
  { path: "/about", isMdx: true },
  { path: "/contact", isMdx: true },
] as const;
```

Also add:

```tsx
expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).toContain("blog");
expect(isMdxDrivenPage(getCanonicalPath("blog"))).toBe(false);
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm vitest run src/lib/content/__tests__/page-dates.test.ts
```

Expected failure:

```text
Unknown page type: blog
```

- [ ] **Step 3: Add Blog to path types and path config**

In `/Users/Data/workspace/showcase-website-starter/src/config/paths/types.ts`, add `"blog"` to `PageType`:

```ts
export type PageType =
  | "home"
  | "capabilities"
  | "howItWorks"
  | "about"
  | "contact"
  | "products"
  | "blog"
  | "privacy"
  | "terms"
  | "customProject";
```

In `/Users/Data/workspace/showcase-website-starter/src/config/paths/paths-config.ts`, add:

```ts
blog: Object.freeze({
  en: "/blog",
  zh: "/blog",
}),
```

Place it near `products` and `about`.

- [ ] **Step 4: Add Blog to single-site links**

In `/Users/Data/workspace/showcase-website-starter/src/config/single-site-links.ts`, add:

```ts
blog: getCanonicalPath("blog"),
```

inside `SINGLE_SITE_ROUTE_HREFS`.

- [ ] **Step 5: Reduce main navigation to four items**

Replace `/Users/Data/workspace/showcase-website-starter/src/config/single-site-navigation.ts` `SINGLE_SITE_NAVIGATION` with:

```ts
export const SINGLE_SITE_NAVIGATION: SiteNavigationItem[] = [
  {
    key: "home",
    href: SINGLE_SITE_ROUTE_HREFS.home,
    translationKey: "navigation.home",
  },
  {
    key: "products",
    href: SINGLE_SITE_ROUTE_HREFS.products,
    translationKey: "navigation.products",
  },
  {
    key: "blog",
    href: SINGLE_SITE_ROUTE_HREFS.blog,
    translationKey: "navigation.blog",
  },
  {
    key: "about",
    href: SINGLE_SITE_ROUTE_HREFS.about,
    translationKey: "navigation.about",
  },
];
```

- [ ] **Step 6: Add navigation labels**

In `/Users/Data/workspace/showcase-website-starter/messages/en/critical.json`, under `navigation`, add or update:

```json
"blog": "Blog",
"contactSales": "Contact"
```

In `/Users/Data/workspace/showcase-website-starter/messages/zh/critical.json`, under `navigation`, add or update:

```json
"blog": "博客",
"contactSales": "联系我们"
```

- [ ] **Step 7: Update sitemap route truth**

In `/Users/Data/workspace/showcase-website-starter/src/config/single-site-seo.ts`, add `"blog"` to `SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES`:

```ts
export const SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES = [
  "home",
  "about",
  "products",
  "blog",
  "contact",
  "privacy",
  "terms",
  "capabilities",
  "howItWorks",
  "customProject",
] as const satisfies readonly PageType[];
```

Add blog to `SINGLE_SITE_STATIC_SITEMAP_PAGE_CONFIG_BY_ROUTE`:

```ts
blog: { changeFrequency: "weekly", priority: 0.85 },
```

Add blog to `SINGLE_SITE_STATIC_PAGE_LASTMOD_BY_ROUTE`:

```ts
blog: SINGLE_SITE_STATIC_LASTMOD_ISO,
```

- [ ] **Step 8: Update navigation E2E expectations**

In `/Users/Data/workspace/showcase-website-starter/tests/e2e/navigation.spec.ts`, update the "should display all main navigation links" test to assert only:

```ts
await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
await expect(nav.getByRole("link", { name: "Products" })).toBeVisible();
await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible();
await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
await expect(nav.getByRole("link", { name: "Capabilities" })).toHaveCount(0);
await expect(nav.getByRole("link", { name: "How It Works" })).toHaveCount(0);
await expect(nav.getByRole("link", { name: "Custom" })).toHaveCount(0);
await expect(nav.getByRole("link", { name: "Contact" })).toHaveCount(0);
```

Update the route navigation loop to test `/en/products`, `/en/blog`, and `/en/about`:

```ts
const routeChecks = [
  { href: "/en/products", pattern: /\/en\/products$/ },
  { href: "/en/blog", pattern: /\/en\/blog$/ },
  { href: "/en/about", pattern: /\/en\/about$/ },
] as const;
```

- [ ] **Step 9: Run focused checks**

Run:

```bash
pnpm vitest run src/lib/content/__tests__/page-dates.test.ts
pnpm type-check
```

Expected:

```text
PASS src/lib/content/__tests__/page-dates.test.ts
tsc --noEmit exits 0
```

- [ ] **Step 10: Commit**

Run:

```bash
git add src/config/paths/types.ts src/config/paths/paths-config.ts src/config/single-site-links.ts src/config/single-site-navigation.ts src/config/single-site-seo.ts src/lib/content/page-dates.ts src/lib/content/__tests__/page-dates.test.ts tests/e2e/navigation.spec.ts tests/e2e/basic-navigation.spec.ts messages/en/critical.json messages/zh/critical.json
pnpm i18n:full
git add messages public/messages
git commit -m "feat: simplify public navigation"
```

---

## Task 3: Add Blog listing and starter articles

**Files:**
- Create: `/Users/Data/workspace/showcase-website-starter/src/lib/blog/starter-blog.ts`
- Create: `/Users/Data/workspace/showcase-website-starter/src/lib/blog/__tests__/starter-blog.test.ts`
- Create: `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/blog/page.tsx`
- Create: `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/blog/[slug]/page.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/en/critical.json`
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/zh/critical.json`

- [ ] **Step 1: Write the blog content model test**

Create `/Users/Data/workspace/showcase-website-starter/src/lib/blog/__tests__/starter-blog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  getStarterBlogArticle,
  getStarterBlogArticles,
} from "@/lib/blog/starter-blog";

describe("starter blog content", () => {
  it("provides launch education articles in both locales", () => {
    const enArticles = getStarterBlogArticles("en");
    const zhArticles = getStarterBlogArticles("zh");

    expect(enArticles).toHaveLength(4);
    expect(zhArticles).toHaveLength(4);
    expect(enArticles.map((article) => article.slug)).toEqual(
      zhArticles.map((article) => article.slug),
    );
    expect(enArticles[0]?.title).toContain("launch");
    expect(zhArticles[0]?.title).toContain("上线");
  });

  it("loads a single article by slug", () => {
    const article = getStarterBlogArticle("en", "prepare-before-launch");

    expect(article.title).toBe("What to prepare before launching your first showcase website");
    expect(article.sections).toHaveLength(4);
  });

  it("throws for unknown slugs", () => {
    expect(() => getStarterBlogArticle("en", "missing")).toThrow(
      "Unknown starter blog article: missing",
    );
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm vitest run src/lib/blog/__tests__/starter-blog.test.ts
```

Expected:

```text
FAIL Cannot find module '@/lib/blog/starter-blog'
```

- [ ] **Step 3: Implement starter blog content**

Create `/Users/Data/workspace/showcase-website-starter/src/lib/blog/starter-blog.ts`:

```ts
import type { Locale } from "@/config/paths/types";

export interface StarterBlogSection {
  heading: string;
  body: string;
}

export interface StarterBlogArticle {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingTime: string;
  sections: readonly StarterBlogSection[];
}

const EN_ARTICLES: readonly StarterBlogArticle[] = [
  {
    slug: "prepare-before-launch",
    title: "What to prepare before launching your first showcase website",
    description:
      "A practical checklist for brand facts, page content, images, contact details, and deployment ownership.",
    publishedAt: "2026-05-05",
    readingTime: "4 min read",
    sections: [
      {
        heading: "Start with confirmed facts",
        body: "Before design polish, confirm the company name, domain, contact email, phone, legal body, and the basic offer you need to present.",
      },
      {
        heading: "Prepare real content assets",
        body: "A starter can provide structure, but it cannot invent real product photos, team proof, customer references, or legal commitments.",
      },
      {
        heading: "Decide the inquiry path",
        body: "Choose where form submissions go, who replies, what response time is realistic, and what details visitors should provide.",
      },
      {
        heading: "Prove deployment separately",
        body: "A local build is not a launch proof. Use preview deployment, form canary checks, analytics access, and owner signoff before going public.",
      },
    ],
  },
  {
    slug: "showcase-site-pages",
    title: "A showcase site is more than a homepage",
    description:
      "The minimum public site needs a clear home, product or service explanation, contact path, trust boundary, and legal basics.",
    publishedAt: "2026-05-05",
    readingTime: "3 min read",
    sections: [
      {
        heading: "Home explains the path",
        body: "The homepage should help visitors understand the problem, the answer, the core capabilities, and the next action.",
      },
      {
        heading: "Products explain what people get",
        body: "A product page should group capabilities by outcome first, then add technical proof where it helps trust.",
      },
      {
        heading: "About explains identity and boundaries",
        body: "For a starter demo, the about page should be honest about what this is, who it fits, and what must be replaced.",
      },
      {
        heading: "Contact completes the path",
        body: "The contact page is the quick conversion route. It should say what to expect and make the next step easy.",
      },
    ],
  },
  {
    slug: "why-cloudflare",
    title: "Why Cloudflare is the recommended deployment path",
    description:
      "Cloudflare keeps the starter close to the deployment path it is designed to prove, while optional compatibility can stay secondary.",
    publishedAt: "2026-05-05",
    readingTime: "3 min read",
    sections: [
      {
        heading: "Use one default deployment truth",
        body: "A starter should have one recommended deployment path. For this project, Cloudflare is the default path and other platforms are compatibility options.",
      },
      {
        heading: "Keep preview proof separate",
        body: "Preview deployment proves more than local build output. It checks routing, assets, runtime assumptions, and form behavior closer to production.",
      },
      {
        heading: "Connect traffic visibility",
        body: "A public site needs owner-facing visibility. Traffic information should be real, access-controlled, and clearly separate from marketing copy.",
      },
      {
        heading: "Do not overpromise portability",
        body: "Compatibility is useful, but the public starter should not promise every platform as a first-class launch path.",
      },
    ],
  },
  {
    slug: "replace-starter-content",
    title: "How to replace starter brand, content, images, and contact details",
    description:
      "A safe replacement order for turning the demo starter into a real project website.",
    publishedAt: "2026-05-05",
    readingTime: "4 min read",
    sections: [
      {
        heading: "Replace identity first",
        body: "Start with company name, domain, email, phone, address, social links, and default SEO identity.",
      },
      {
        heading: "Replace the offer story",
        body: "Rewrite pages around the real product, service, audience, proof, and next action. Do not leave starter examples in buyer-visible areas.",
      },
      {
        heading: "Replace visual proof",
        body: "Use real logos, product images, screenshots, certificates, or diagrams. Placeholder visuals are acceptable only before launch.",
      },
      {
        heading: "Replace operational settings",
        body: "Connect forms, Turnstile, email or CRM, analytics, Cloudflare zone details, and deployment secrets before public launch.",
      },
    ],
  },
];

const ZH_ARTICLES: readonly StarterBlogArticle[] = [
  {
    slug: "prepare-before-launch",
    title: "第一个展示型网站上线前要准备什么",
    description:
      "按顺序准备品牌事实、页面内容、图片、联系方式和部署归属，避免上线前才发现基础材料缺失。",
    publishedAt: "2026-05-05",
    readingTime: "4 分钟阅读",
    sections: [
      {
        heading: "先确认真实事实",
        body: "在追求视觉之前，先确认公司名、域名、联系邮箱、电话、法务主体，以及网站要展示的核心产品或服务。",
      },
      {
        heading: "准备真实内容资产",
        body: "starter 可以提供结构，但不能替你生成真实产品图片、团队证明、客户参考或法律承诺。",
      },
      {
        heading: "决定询盘路径",
        body: "确认表单提交到哪里、谁来回复、合理响应时间是什么、访客应该提供哪些信息。",
      },
      {
        heading: "部署证明要单独看",
        body: "本地构建通过不等于可以上线。上线前要看预览部署、表单 canary、流量面板权限和 owner 确认。",
      },
    ],
  },
  {
    slug: "showcase-site-pages",
    title: "展示型网站不只是一个首页",
    description:
      "最小公开网站也需要清楚首页、产品或服务说明、联系路径、信任边界和基础法律页面。",
    publishedAt: "2026-05-05",
    readingTime: "3 分钟阅读",
    sections: [
      {
        heading: "首页讲清路径",
        body: "首页应该让访客理解问题、答案、核心能力和下一步行动，而不是堆满模块。",
      },
      {
        heading: "产品页讲清得到什么",
        body: "产品页先按结果能力分组，再补充必要技术证明，这样非技术访客也能读懂。",
      },
      {
        heading: "关于页讲清身份和边界",
        body: "对于 starter demo，关于页应该诚实说明它是什么、适合谁、上线前还要替换什么。",
      },
      {
        heading: "联系页完成转化路径",
        body: "联系页是快速行动入口，应该说明访客会得到什么回应，并降低填写门槛。",
      },
    ],
  },
  {
    slug: "why-cloudflare",
    title: "为什么这个 starter 推荐 Cloudflare 部署",
    description:
      "Cloudflare 是默认部署真相，其他平台可以保留兼容，但不作为第一承诺。",
    publishedAt: "2026-05-05",
    readingTime: "3 分钟阅读",
    sections: [
      {
        heading: "默认部署路径只能有一个",
        body: "starter 应该有一个清楚的推荐部署路径。本项目默认使用 Cloudflare，其他平台作为兼容选项。",
      },
      {
        heading: "预览部署要单独证明",
        body: "预览部署比本地构建更接近真实运行，可以检查路由、资源、运行时假设和表单行为。",
      },
      {
        heading: "流量可见性要真实接入",
        body: "公开网站需要 owner 能看到真实流量信息，而且访问权限要受控，不能只写在营销文案里。",
      },
      {
        heading: "不要过度承诺跨平台",
        body: "兼容性有价值，但公开 starter 不应该把所有平台都当成默认上线承诺。",
      },
    ],
  },
  {
    slug: "replace-starter-content",
    title: "如何替换 starter 的品牌、内容、图片和联系方式",
    description:
      "把 demo starter 改成真实项目网站时，按这个顺序替换更稳。",
    publishedAt: "2026-05-05",
    readingTime: "4 分钟阅读",
    sections: [
      {
        heading: "先替换身份",
        body: "从公司名、域名、邮箱、电话、地址、社交链接和默认 SEO 身份开始。",
      },
      {
        heading: "再替换业务叙事",
        body: "围绕真实产品、服务、受众、证据和下一步行动重写页面，不要把 starter 示例留在访客可见区域。",
      },
      {
        heading: "替换视觉证明",
        body: "使用真实 logo、产品图片、截图、证书或说明图。占位图只能用于上线前。",
      },
      {
        heading: "替换运营配置",
        body: "公开上线前要接通表单、Turnstile、邮件或 CRM、流量面板、Cloudflare zone 和部署密钥。",
      },
    ],
  },
];

const ARTICLES_BY_LOCALE = {
  en: EN_ARTICLES,
  zh: ZH_ARTICLES,
} as const satisfies Record<Locale, readonly StarterBlogArticle[]>;

export function getStarterBlogArticles(locale: Locale): readonly StarterBlogArticle[] {
  return ARTICLES_BY_LOCALE[locale];
}

export function getStarterBlogArticle(
  locale: Locale,
  slug: string,
): StarterBlogArticle {
  const article = getStarterBlogArticles(locale).find((item) => item.slug === slug);
  if (!article) {
    throw new Error(`Unknown starter blog article: ${slug}`);
  }
  return article;
}

export function getStarterBlogSlugs(): readonly string[] {
  return EN_ARTICLES.map((article) => article.slug);
}
```

- [ ] **Step 4: Create Blog listing page**

Create `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/blog/page.tsx`:

```tsx
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import { getLocalizedPath } from "@/config/paths";
import { Link } from "@/i18n/routing";
import {
  generateMetadataForPath,
  type Locale as SeoLocale,
} from "@/lib/seo-metadata";
import { getStarterBlogArticles } from "@/lib/blog/starter-blog";

interface BlogPageProps {
  params: Promise<LocaleParam>;
}

const BLOG_COPY = {
  en: {
    title: "Launch guides for your first showcase website",
    description:
      "Practical articles for turning this starter into a real public website.",
    eyebrow: "Starter blog",
    cta: "Read guide",
  },
  zh: {
    title: "从 0 到上线的展示型网站指南",
    description: "用这些文章理解如何把 starter 改成真实公开网站。",
    eyebrow: "Starter 博客",
    cta: "阅读指南",
  },
} as const;

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const copy = BLOG_COPY[locale];

  return generateMetadataForPath({
    locale: locale as SeoLocale,
    pageType: "blog",
    path: getLocalizedPath("blog", locale),
    config: {
      title: copy.title,
      description: copy.description,
    },
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const copy = BLOG_COPY[locale];
  const articles = getStarterBlogArticles(locale);

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-12 md:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          {copy.eyebrow}
        </p>
        <h1 className="text-heading mb-4">{copy.title}</h1>
        <p className="text-body text-muted-foreground">{copy.description}</p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <p className="mb-3 text-sm text-muted-foreground">
              {article.publishedAt} · {article.readingTime}
            </p>
            <h2 className="mb-3 text-xl font-semibold tracking-[-0.01em]">
              {article.title}
            </h2>
            <p className="mb-5 text-sm leading-6 text-muted-foreground">
              {article.description}
            </p>
            <Link
              href={{
                pathname: "/blog/[slug]",
                params: { slug: article.slug },
              }}
              className="inline-flex text-sm font-semibold text-primary hover:underline"
            >
              {copy.cta}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Blog article detail page**

Create `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/blog/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { LocaleParam } from "@/app/[locale]/generate-static-params";
import { Link } from "@/i18n/routing";
import {
  generateMetadataForPath,
  type Locale as SeoLocale,
} from "@/lib/seo-metadata";
import {
  getStarterBlogArticle,
  getStarterBlogSlugs,
} from "@/lib/blog/starter-blog";

interface BlogArticlePageProps {
  params: Promise<LocaleParam & { slug: string }>;
}

const BACK_COPY = {
  en: "Back to blog",
  zh: "返回博客",
} as const;

export function generateStaticParams() {
  return ["en", "zh"].flatMap((locale) =>
    getStarterBlogSlugs().map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getStarterBlogArticle(locale, slug);

  return generateMetadataForPath({
    locale: locale as SeoLocale,
    pageType: "blog",
    path: `/blog/${article.slug}`,
    config: {
      title: article.title,
      description: article.description,
    },
  });
}

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let article;
  try {
    article = getStarterBlogArticle(locale, slug);
  } catch {
    notFound();
  }

  return (
    <article className="mx-auto max-w-[760px] px-6 py-12 md:py-16">
      <Link
        href="/blog"
        className="mb-8 inline-flex text-sm font-semibold text-primary hover:underline"
      >
        {BACK_COPY[locale]}
      </Link>
      <header className="mb-10">
        <p className="mb-3 text-sm text-muted-foreground">
          {article.publishedAt} · {article.readingTime}
        </p>
        <h1 className="text-heading mb-4">{article.title}</h1>
        <p className="text-body text-muted-foreground">
          {article.description}
        </p>
      </header>
      <div className="space-y-8">
        {article.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-3 text-2xl font-semibold">{section.heading}</h2>
            <p className="text-base leading-7 text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm vitest run src/lib/blog/__tests__/starter-blog.test.ts
pnpm type-check
```

Expected:

```text
PASS src/lib/blog/__tests__/starter-blog.test.ts
tsc --noEmit exits 0
```

- [ ] **Step 7: Commit**

Run:

```bash
git add src/lib/blog src/app/'[locale]'/blog messages/en/critical.json messages/zh/critical.json
pnpm i18n:full
git add messages public/messages
git commit -m "feat: add starter launch blog"
```

---

## Task 4: Rewrite Home around the approved journey

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/en/critical.json`
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/zh/critical.json`
- Modify as needed: `/Users/Data/workspace/showcase-website-starter/src/components/sections/*.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/e2e/homepage.spec.ts`

- [ ] **Step 1: Add failing homepage E2E assertions**

In `/Users/Data/workspace/showcase-website-starter/tests/e2e/homepage.spec.ts`, update "should display hero section with correct content" to assert the new journey headline and core copy:

```ts
await expect(
  page.getByRole("heading", {
    level: 1,
    name: /No website yet\? Start with a deployable showcase-site foundation/i,
  }),
).toBeVisible();
await expect(
  page.getByText(/No structure, no content plan, no deployment path/i),
).toBeVisible();
await expect(
  page.getByRole("link", { name: /View starter capabilities/i }),
).toBeVisible();
```

- [ ] **Step 2: Run the homepage E2E file and confirm it fails**

Run:

```bash
pnpm playwright test tests/e2e/homepage.spec.ts --project=chromium
```

Expected failure:

```text
No website yet? Start with a deployable showcase-site foundation not found
```

- [ ] **Step 3: Update English home copy**

In `/Users/Data/workspace/showcase-website-starter/messages/en/critical.json`, update `home.hero`:

```json
"eyebrow": "Reusable starter for first public websites",
"title": "No website yet? Start with a deployable showcase-site foundation.",
"subtitle": "This starter gives you the first real structure: pages, content replacement surfaces, inquiry paths, multilingual copy, and a Cloudflare-ready launch base.",
"cta": {
  "primary": "Contact us",
  "secondary": "View starter capabilities"
}
```

Update `home.starterBoundary`:

```json
"title": "The hard part is not one page. It is the whole path to public launch.",
"description": "Many projects start with no structure, no content plan, no deployment path, no inquiry flow, and no multilingual baseline. This starter turns those missing pieces into a working foundation.",
"listLabel": "What the starter gives you",
"items": [
  {
    "title": "A clear public structure",
    "description": "Home, products, blog, about, contact, privacy, and terms routes are already organized around a real showcase-site path."
  },
  {
    "title": "A replacement surface",
    "description": "Brand facts, page copy, products or services, SEO text, images, and legal details have known places to replace."
  },
  {
    "title": "An inquiry path",
    "description": "The contact route, form flow, basic anti-abuse controls, and lead-handling path are ready to connect to a real owner."
  },
  {
    "title": "A launch foundation",
    "description": "Cloudflare deployment, quality checks, and owner-facing traffic visibility are treated as part of the starter, not as afterthoughts."
  }
],
"primary": "View starter capabilities",
"secondary": "Contact us"
```

Update `home.chain`:

```json
"title": "From zero to a public demo foundation.",
"subtitle": "Use the starter in a practical order instead of guessing what a first website needs.",
"step1": {
  "title": "Replace identity",
  "desc": "Confirm company name, domain, contact details, legal body, logo, and basic SEO identity."
},
"step2": {
  "title": "Replace content",
  "desc": "Rewrite the pages around your real product, service, audience, proof, images, and next action."
},
"step3": {
  "title": "Connect inquiries",
  "desc": "Route form submissions to a real email, Airtable, CRM, or other lead destination."
},
"step4": {
  "title": "Deploy preview",
  "desc": "Use the Cloudflare path to prove routing, assets, runtime assumptions, and form behavior."
},
"step5": {
  "title": "Confirm launch",
  "desc": "Check real content, legal copy, analytics visibility, canary submissions, and owner signoff."
}
```

- [ ] **Step 4: Update Chinese home copy**

In `/Users/Data/workspace/showcase-website-starter/messages/zh/critical.json`, update matching keys:

```json
"eyebrow": "给第一个公开网站用的可复用 starter",
"title": "还没有网站？先从一套可上线的展示站基础开始。",
"subtitle": "这个 starter 先把真实基础准备好：页面结构、内容替换面、询盘路径、多语言文案，以及 Cloudflare 上线基础。",
"cta": {
  "primary": "联系我们",
  "secondary": "查看 starter 能力"
}
```

Update `home.starterBoundary`:

```json
"title": "难点不是做一个页面，而是走完整个公开上线路径。",
"description": "很多项目一开始没有结构、没有内容计划、没有部署路径、没有询盘流程，也没有多语言基础。这个 starter 把这些缺口先变成可运行的基础。",
"listLabel": "这个 starter 提供什么",
"items": [
  {
    "title": "清楚的公开网站结构",
    "description": "首页、产品、博客、关于、联系、隐私和条款路由已经围绕展示型网站路径组织好。"
  },
  {
    "title": "明确的替换面",
    "description": "品牌事实、页面文案、产品或服务、SEO 文案、图片和法务内容都有明确替换位置。"
  },
  {
    "title": "可接通的询盘路径",
    "description": "联系页、表单流程、基础防滥用控制和线索处理路径已经准备好接入真实 owner。"
  },
  {
    "title": "上线基础",
    "description": "Cloudflare 部署、质量检查和 owner 可看的流量信息被当成 starter 的一部分，而不是上线后再补。"
  }
],
"primary": "查看 starter 能力",
"secondary": "联系我们"
```

Update `home.chain`:

```json
"title": "从 0 到一套公开 demo 基础。",
"subtitle": "按真实上线顺序使用 starter，不再猜第一个网站到底缺什么。",
"step1": {
  "title": "替换身份",
  "desc": "确认公司名、域名、联系方式、法务主体、logo 和基础 SEO 身份。"
},
"step2": {
  "title": "替换内容",
  "desc": "围绕真实产品、服务、受众、证据、图片和下一步行动重写页面。"
},
"step3": {
  "title": "接通询盘",
  "desc": "把表单提交接到真实邮箱、Airtable、CRM 或其他线索目的地。"
},
"step4": {
  "title": "部署预览",
  "desc": "用 Cloudflare 路径证明路由、资源、运行时假设和表单行为。"
},
"step5": {
  "title": "确认上线",
  "desc": "检查真实内容、法务文案、流量可见性、canary 提交和 owner 确认。"
}
```

- [ ] **Step 5: Adjust CTA links if needed**

If the hero secondary CTA still points to Products through `HOMEPAGE_SECTION_LINKS.products`, keep it.

If any home section CTA still points to `/how-it-works`, change it to products or blog:

```tsx
primary: {
  label: t("primary"),
  href: SINGLE_SITE_ROUTE_HREFS.products,
},
```

- [ ] **Step 6: Run focused checks**

Run:

```bash
pnpm i18n:full
pnpm playwright test tests/e2e/homepage.spec.ts --project=chromium
pnpm type-check
```

Expected:

```text
homepage.spec.ts passes
tsc --noEmit exits 0
```

- [ ] **Step 7: Commit**

Run:

```bash
git add messages public/messages src/components/sections tests/e2e/homepage.spec.ts
git commit -m "feat: rewrite home starter journey"
```

---

## Task 5: Rewrite Products around result capabilities plus technical proof

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/products/page.tsx`
- Create if helpful: `/Users/Data/workspace/showcase-website-starter/src/components/products/starter-capability-card.tsx`
- Create if helpful: `/Users/Data/workspace/showcase-website-starter/src/components/products/technical-proof-card.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/en/critical.json`
- Modify: `/Users/Data/workspace/showcase-website-starter/messages/zh/critical.json`
- Modify tests under `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/products/__tests__/`

- [ ] **Step 1: Add failing Products page test**

Open `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/products/__tests__/products-page.test.tsx`.

Add assertions that the page exposes:

```tsx
expect(await screen.findByText(/Showcase-site foundation/i)).toBeInTheDocument();
expect(screen.getByText(/Technical proof/i)).toBeInTheDocument();
expect(screen.getByText(/Cloudflare/i)).toBeInTheDocument();
```

Use the existing async page render helper in that test file. If it does not exist, use:

```tsx
const element = await ProductsPage({
  params: Promise.resolve({ locale: "en" }),
});
render(element);
```

- [ ] **Step 2: Run the focused Products tests and confirm failure**

Run:

```bash
pnpm vitest run 'src/app/[locale]/products/__tests__/*.test.tsx'
```

Expected:

```text
FAIL ... Showcase-site foundation not found
```

- [ ] **Step 3: Replace product catalog landing content with starter capability content**

In `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/products/page.tsx`, keep metadata and breadcrumb/JSON-LD, but replace market cards with local arrays using translations.

Use sections:

```tsx
const RESULT_CAPABILITY_KEYS = [
  "siteFoundation",
  "replacementSurface",
  "inquiryPath",
  "launchPath",
] as const;

const TECHNICAL_PROOF_KEYS = [
  "next",
  "cloudflare",
  "i18n",
  "quality",
  "security",
  "traffic",
] as const;
```

Render result cards:

```tsx
{RESULT_CAPABILITY_KEYS.map((key) => (
  <div key={key} className="rounded-2xl border border-border bg-card p-6">
    <h2 className="mb-3 text-xl font-semibold">
      {t(`starterCapabilities.${key}.title`)}
    </h2>
    <p className="text-sm leading-6 text-muted-foreground">
      {t(`starterCapabilities.${key}.description`)}
    </p>
  </div>
))}
```

Render technical proof cards:

```tsx
{TECHNICAL_PROOF_KEYS.map((key) => (
  <li key={key} className="rounded-xl border border-border bg-background p-4">
    <h3 className="font-semibold">{t(`technicalProof.${key}.title`)}</h3>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">
      {t(`technicalProof.${key}.description`)}
    </p>
  </li>
))}
```

- [ ] **Step 4: Add English product copy**

In `/Users/Data/workspace/showcase-website-starter/messages/en/critical.json`, under `catalog`, add:

```json
"starterCapabilities": {
  "siteFoundation": {
    "title": "Showcase-site foundation",
    "description": "Home, Products, Blog, About, Contact, legal pages, navigation, and responsive layout are already connected."
  },
  "replacementSurface": {
    "title": "Content replacement surface",
    "description": "Brand facts, page copy, product or service entries, SEO, images, and multilingual text have clear places to replace."
  },
  "inquiryPath": {
    "title": "Inquiry path",
    "description": "The contact page, form flow, basic anti-abuse controls, and lead handling path are ready for a real owner."
  },
  "launchPath": {
    "title": "Launch path",
    "description": "Cloudflare is the recommended deployment route, with optional compatibility kept secondary and traffic visibility treated as a real surface."
  }
},
"technicalProofTitle": "Technical proof",
"technicalProofDescription": "The starter includes the technical baseline a public demo needs without making the product page a developer manual.",
"technicalProof": {
  "next": {
    "title": "Next.js app foundation",
    "description": "App Router, Server Components first, metadata, localized routes, and production build checks."
  },
  "cloudflare": {
    "title": "Cloudflare deployment path",
    "description": "Cloudflare and OpenNext stay the recommended deployment truth for this starter."
  },
  "i18n": {
    "title": "Multilingual content",
    "description": "English and Chinese navigation, page copy, metadata, and article content stay aligned."
  },
  "quality": {
    "title": "Quality checks",
    "description": "Type, lint, content, component, website, and build checks remain part of the launch path."
  },
  "security": {
    "title": "Form security basics",
    "description": "Contact and inquiry paths include validation, anti-abuse controls, and explicit runtime configuration."
  },
  "traffic": {
    "title": "Traffic visibility",
    "description": "Owner-facing traffic information is treated as a real protected surface, not marketing decoration."
  }
}
```

- [ ] **Step 5: Add Chinese product copy**

In `/Users/Data/workspace/showcase-website-starter/messages/zh/critical.json`, under `catalog`, add matching keys:

```json
"starterCapabilities": {
  "siteFoundation": {
    "title": "展示站基础",
    "description": "首页、产品、博客、关于、联系、法律页面、导航和响应式布局已经连成一套。"
  },
  "replacementSurface": {
    "title": "内容替换面",
    "description": "品牌事实、页面文案、产品或服务、SEO、图片和多语言文字都有明确替换位置。"
  },
  "inquiryPath": {
    "title": "询盘路径",
    "description": "联系页、表单流程、基础防滥用控制和线索处理路径已经准备好接入真实 owner。"
  },
  "launchPath": {
    "title": "上线路径",
    "description": "Cloudflare 是推荐部署路径，可选兼容保留为次级，流量可见性被当成真实功能面。"
  }
},
"technicalProofTitle": "技术证明",
"technicalProofDescription": "starter 保留公开 demo 需要的技术基础，但不会把产品页写成开发者手册。",
"technicalProof": {
  "next": {
    "title": "Next.js 应用基础",
    "description": "App Router、Server Components 优先、metadata、本地化路由和生产构建检查。"
  },
  "cloudflare": {
    "title": "Cloudflare 部署路径",
    "description": "Cloudflare 和 OpenNext 是这个 starter 的推荐部署真相。"
  },
  "i18n": {
    "title": "多语言内容",
    "description": "中英文导航、页面文案、metadata 和文章内容保持同步。"
  },
  "quality": {
    "title": "质量检查",
    "description": "类型、lint、内容、组件、website 和 build 检查继续属于上线链路。"
  },
  "security": {
    "title": "表单安全基础",
    "description": "联系和询盘路径包含校验、防滥用控制和明确运行时配置。"
  },
  "traffic": {
    "title": "流量可见性",
    "description": "owner 可看的流量信息是受保护的真实功能面，不是营销装饰。"
  }
}
```

- [ ] **Step 6: Run focused checks**

Run:

```bash
pnpm i18n:full
pnpm vitest run 'src/app/[locale]/products/__tests__/*.test.tsx'
pnpm type-check
```

Expected:

```text
Products tests pass
tsc --noEmit exits 0
```

- [ ] **Step 7: Commit**

Run:

```bash
git add 'src/app/[locale]/products/page.tsx' src/components/products messages public/messages
git add 'src/app/[locale]/products/__tests__'
git commit -m "feat: rewrite products as starter capabilities"
```

---

## Task 6: Rewrite About as starter identity and boundary

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/content/pages/en/about.mdx`
- Modify: `/Users/Data/workspace/showcase-website-starter/content/pages/zh/about.mdx`
- Modify tests:
  - `/Users/Data/workspace/showcase-website-starter/src/components/content/__tests__/about-page-shell.test.tsx`
  - `/Users/Data/workspace/showcase-website-starter/tests/e2e/about-page-rendering.spec.ts`

- [ ] **Step 1: Add failing E2E assertion**

In `/Users/Data/workspace/showcase-website-starter/tests/e2e/about-page-rendering.spec.ts`, add:

```ts
await expect(
  page.getByRole("heading", {
    level: 1,
    name: /showcase website starter designed for real public launch/i,
  }),
).toBeVisible();
await expect(page.getByText(/not a fictional company profile/i)).toBeVisible();
```

- [ ] **Step 2: Run the about E2E and confirm failure**

Run:

```bash
pnpm playwright test tests/e2e/about-page-rendering.spec.ts --project=chromium
```

Expected:

```text
showcase website starter designed for real public launch not found
```

- [ ] **Step 3: Rewrite English About MDX**

Replace `/Users/Data/workspace/showcase-website-starter/content/pages/en/about.mdx` with a starter identity page.

Use this frontmatter core:

```yaml
---
locale: 'en'
title: 'About this showcase website starter'
description: 'Learn why this starter exists, who it fits, who it does not fit, and what must be replaced before launch.'
slug: 'about'
publishedAt: '2024-01-10'
updatedAt: '2026-05-05'
author: 'Showcase Website Starter Team'
layout: 'default'
showToc: true
lastReviewed: '2026-05-05'
draft: false
heroTitle: 'A showcase website starter designed for real public launch preparation'
heroSubtitle: 'Not a fictional company profile'
heroDescription: 'This page explains what the starter is, who it fits, and what must still become real before a public launch.'
seo:
  title: 'About this showcase website starter'
  description: 'Starter identity, fit, boundaries, and replacement requirements for a public showcase website foundation.'
  keywords: ['showcase website starter', 'starter boundary', 'public launch website']
  ogImage: '/images/about-og.jpg'
aboutSections:
  valuesTitle: 'What this starter is designed to protect'
  values:
    quality:
      title: 'Launch structure'
      description: 'The starter keeps pages, navigation, inquiry paths, and replacement work in one clear public-site structure.'
    innovation:
      title: 'Reusable foundation'
      description: 'It provides a working foundation that can be adapted without rebuilding every route and component from zero.'
    service:
      title: 'Owner clarity'
      description: 'The site makes visible what a real owner must confirm before launch.'
    integrity:
      title: 'Honest boundary'
      description: 'It is not an empty shell, but it is also not a finished client website.'
  statLabels:
    yearsExperience: 'Starter baseline'
    countriesServed: 'Locales'
    happyClients: 'Replacement surfaces'
    productsDelivered: 'Launch path'
  cta:
    title: 'Review the starter capabilities'
    description: 'See what the starter includes before replacing it with real business facts and assets.'
    button: 'View products'
faq:
  - id: starter-purpose
    question: "Is this a finished client website?"
    answer: "No. This is a reusable starter demo with working structure and replaceable example content."
  - id: who-fits
    question: "Who is this starter for?"
    answer: "It fits projects that do not yet have a public website and need a fast, clear showcase-site foundation."
  - id: what-to-replace
    question: "What must be replaced before launch?"
    answer: "Replace business facts, page content, images, legal copy, form routing, secrets, and deployment settings."
---
```

Use this body:

```md
## Why this starter exists

Many projects do not just lack pages. They lack a complete public launch foundation: a clear site structure, content ownership, inquiry flow, deployment path, and owner-facing visibility.

This starter gives those pieces a working shape before a real project replaces the example content.

## Who it fits

- Projects with no current website.
- Teams that need a public showcase foundation quickly.
- Sites that need multilingual content, inquiry flow, and Cloudflare deployment basics.
- Owners who want a reusable starting point instead of a blank visual shell.

## Who it does not fit

- Projects with a complete custom brand system already finished.
- Sites that need complex commerce, accounts, or backend workflows in the first version.
- Teams looking for a design-only template with no launch workflow.

## Honest boundary

This starter is not an empty shell. It has real routes, components, content structure, form paths, and deployment assumptions.

It is also not a finished client website. A real launch still needs confirmed business facts, real images, legal copy, form destinations, secrets, Cloudflare settings, and deployed smoke proof.
```

- [ ] **Step 4: Rewrite Chinese About MDX**

Replace `/Users/Data/workspace/showcase-website-starter/content/pages/zh/about.mdx` with the Chinese equivalent.

Use this frontmatter core:

```yaml
---
locale: 'zh'
title: '关于这个展示型网站 starter'
description: '了解这个 starter 为什么存在、适合谁、不适合谁，以及公开上线前必须替换什么。'
slug: 'about'
publishedAt: '2024-01-10'
updatedAt: '2026-05-05'
author: 'Showcase Website Starter Team'
layout: 'default'
showToc: true
lastReviewed: '2026-05-05'
draft: false
heroTitle: '一个面向真实公开上线准备的展示型网站 starter'
heroSubtitle: '不是虚构公司介绍'
heroDescription: '这个页面解释 starter 是什么、适合谁，以及公开上线前哪些内容必须变成真实事实。'
seo:
  title: '关于这个展示型网站 starter'
  description: '展示型网站 starter 的身份、适用对象、边界和公开上线前替换要求。'
  keywords: ['展示型网站 starter', 'starter 边界', '公开上线网站']
  ogImage: '/images/about-og.jpg'
aboutSections:
  valuesTitle: '这个 starter 保护什么'
  values:
    quality:
      title: '上线结构'
      description: 'starter 把页面、导航、询盘路径和替换工作放进一套清楚的公开网站结构里。'
    innovation:
      title: '可复用基础'
      description: '它提供一套可运行基础，真实项目可以在此基础上替换，而不是每条路由和组件都从零开始。'
    service:
      title: 'Owner 清晰度'
      description: '网站把真实 owner 上线前必须确认的事项摆在明面上。'
    integrity:
      title: '诚实边界'
      description: '它不是空壳模板，但也不是已经完成的客户网站。'
  statLabels:
    yearsExperience: 'Starter 基线'
    countriesServed: '语言版本'
    happyClients: '替换面'
    productsDelivered: '上线链路'
  cta:
    title: '查看 starter 能力'
    description: '先了解 starter 包含什么，再把它替换成真实业务事实和资产。'
    button: '查看产品'
faq:
  - id: starter-purpose
    question: "这是已经完成的客户官网吗？"
    answer: "不是。这是带可运行结构和可替换示例内容的 starter demo。"
  - id: who-fits
    question: "这个 starter 适合谁？"
    answer: "适合还没有公开网站、需要快速获得展示型网站基础的项目。"
  - id: what-to-replace
    question: "上线前必须替换什么？"
    answer: "要替换业务事实、页面内容、图片、法务文案、表单流向、密钥和部署设置。"
---
```

Use this body:

```md
## 为什么需要这个 starter

很多项目缺的不是一个页面，而是一套完整的公开上线基础：清楚的网站结构、内容归属、询盘流程、部署路径和 owner 可见的信息。

这个 starter 先把这些部分做成可运行形态，再让真实项目替换示例内容。

## 适合谁

- 当前还没有网站的项目。
- 需要快速获得公开展示基础的团队。
- 需要多语言内容、询盘路径和 Cloudflare 部署基础的网站。
- 想从可复用基础开始，而不是从空白视觉壳开始的 owner。

## 不适合谁

- 已经有完整定制品牌系统的项目。
- 第一版就需要复杂交易、账号或后台工作流的网站。
- 只想要视觉模板、不需要上线工作流的团队。

## 诚实边界

这个 starter 不是空壳。它有真实路由、组件、内容结构、表单路径和部署假设。

但它也不是最终客户网站。真实上线仍然需要确认过的业务事实、真实图片、法务文案、表单接收方、密钥、Cloudflare 设置和部署 smoke 证明。
```

- [ ] **Step 5: Update About shell test copy**

In `/Users/Data/workspace/showcase-website-starter/src/components/content/__tests__/about-page-shell.test.tsx`, change `baseMetadata.title` and related expected text so tests no longer assert `Example Showcase Company`.

Use:

```ts
title: "About this showcase website starter",
description: "Reusable showcase website starter boundary",
heroTitle: "A showcase website starter designed for real public launch preparation",
heroSubtitle: "Not a fictional company profile",
heroDescription: "This page explains starter identity and boundaries.",
```

Update the structured data assertion:

```ts
expect(aboutNode.name).toBe("About this showcase website starter");
```

- [ ] **Step 6: Run focused checks**

Run:

```bash
pnpm vitest run src/components/content/__tests__/about-page-shell.test.tsx
pnpm playwright test tests/e2e/about-page-rendering.spec.ts --project=chromium
pnpm type-check
```

Expected:

```text
About tests pass
tsc --noEmit exits 0
```

- [ ] **Step 7: Commit**

Run:

```bash
git add content/pages/en/about.mdx content/pages/zh/about.mdx src/components/content/__tests__/about-page-shell.test.tsx tests/e2e/about-page-rendering.spec.ts
git commit -m "feat: rewrite about starter boundary"
```

---

## Task 7: Final contact action and chrome alignment

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/layout/header.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/layout/mobile-navigation.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/layout/__tests__/header.test.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/layout/__tests__/mobile-navigation.test.tsx`
- Modify if needed: `/Users/Data/workspace/showcase-website-starter/content/pages/en/contact.mdx`
- Modify if needed: `/Users/Data/workspace/showcase-website-starter/content/pages/zh/contact.mdx`

- [ ] **Step 1: Add header test for Contact as action, not nav item**

In `/Users/Data/workspace/showcase-website-starter/src/components/layout/__tests__/header.test.tsx`, set:

```ts
const MAIN_NAV_ITEMS = [
  { key: "home", href: "/", label: "Home" },
  { key: "products", href: "/products", label: "Products" },
  { key: "blog", href: "/blog", label: "Blog" },
  { key: "about", href: "/about", label: "About" },
];
```

Add test:

```tsx
it("renders contact as a utility action instead of a main nav item", async () => {
  await renderAsyncComponent(
    Header({
      locale: "en",
      mainNavItems: MAIN_NAV_ITEMS,
      contactSalesLabel: "Contact",
    }),
  );

  const nav = screen.getByTestId("header-desktop-nav");
  expect(nav).not.toHaveTextContent("Contact");
  expect(screen.getByTestId("header-cta")).toHaveAttribute("href", "/contact");
  expect(screen.getByTestId("header-contact-sales-label")).toHaveTextContent(
    "Contact",
  );
});
```

- [ ] **Step 2: Run header tests and confirm current behavior**

Run:

```bash
pnpm vitest run src/components/layout/__tests__/header.test.tsx
```

Expected:

```text
PASS after Task 2 nav changes, or FAIL if Contact still appears in nav
```

If it already passes, this task is still useful as regression coverage.

- [ ] **Step 3: Adjust header control order if needed**

The approved layout says Contact should sit beside language switching. If current order shows language first and contact second, that is acceptable only if visually adjacent. If product review says contact should appear before language, change `HeaderUtilityControls` to render:

```tsx
<Button variant="default" size="sm" asChild className="header-cta-desktop-only">
  <Link
    href={SINGLE_SITE_HOME_LINK_TARGETS.contact}
    prefetch={false}
    data-testid="header-cta"
  >
    <span data-testid="header-contact-sales-label" translate="no">
      {contactSalesLabel}
    </span>
  </Link>
</Button>
<div className="header-full-desktop-only h-10 w-28 items-center justify-end">
  <LanguageToggleIsland locale={locale} />
</div>
```

Keep the mobile menu button visible on small screens.

- [ ] **Step 4: Update mobile navigation tests**

In `/Users/Data/workspace/showcase-website-starter/src/components/layout/__tests__/mobile-navigation.test.tsx`, update the mocked `mockItems` to only:

```ts
const mockItems = [
  { key: "home", href: "/", translationKey: "navigation.home" },
  { key: "products", href: "/products", translationKey: "navigation.products" },
  { key: "blog", href: "/blog", translationKey: "navigation.blog" },
  { key: "about", href: "/about", translationKey: "navigation.about" },
];
```

Add assertion that the CTA still points to `/contact`:

```tsx
expect(screen.getByRole("link", { name: /contact/i })).toHaveAttribute(
  "href",
  expect.stringContaining("/contact"),
);
```

- [ ] **Step 5: Run focused checks**

Run:

```bash
pnpm vitest run src/components/layout/__tests__/header.test.tsx src/components/layout/__tests__/mobile-navigation.test.tsx
pnpm type-check
```

Expected:

```text
Header and mobile navigation tests pass
tsc --noEmit exits 0
```

- [ ] **Step 6: Commit**

Run:

```bash
git add src/components/layout src/components/layout/__tests__ content/pages/en/contact.mdx content/pages/zh/contact.mdx
git commit -m "feat: align contact as header action"
```

---

## Task 8: Final verification and cleanup

**Files:**
- Modify docs only if implementation changed public replacement responsibilities:
  - `/Users/Data/workspace/showcase-website-starter/docs/website/README.md`
  - `/Users/Data/workspace/showcase-website-starter/docs/website/新项目替换清单.md`

- [ ] **Step 1: Run translation and content checks**

Run:

```bash
pnpm i18n:full
pnpm content:check
pnpm website:content:readiness
```

Expected:

```text
all commands exit 0
```

- [ ] **Step 2: Run source checks**

Run:

```bash
pnpm type-check
pnpm lint:check
pnpm test
```

Expected:

```text
all commands exit 0
```

- [ ] **Step 3: Run browser-facing checks**

Run:

```bash
pnpm playwright test tests/e2e/navigation.spec.ts tests/e2e/homepage.spec.ts tests/e2e/about-page-rendering.spec.ts --project=chromium
```

Expected:

```text
all selected Playwright tests pass
```

- [ ] **Step 4: Run website-level check**

Run:

```bash
pnpm website:check
```

Expected:

```text
website:check exits 0
```

- [ ] **Step 5: Build proof**

Run only after the focused checks pass:

```bash
pnpm build
pnpm build:cf
```

Expected:

```text
both builds exit 0
```

Do not run `pnpm build` and `pnpm build:cf` in parallel because they share `.next`.

- [ ] **Step 6: Final self-review**

Run:

```bash
git status --short
git diff --stat main...HEAD
git diff --check
rg -n "Example Showcase Company|Capabilities|How It Works|Custom" src/app src/components messages content/pages tests/e2e
```

Expected:

```text
git diff --check has no whitespace errors
remaining legacy terms are only in allowed legacy routes, docs, or fallback examples
```

- [ ] **Step 7: Commit final docs/check alignment if needed**

If Step 1-6 required doc updates, commit them:

```bash
git add docs/website
git commit -m "docs: align public demo starter guidance"
```

If no docs changed, do not create an empty commit.

---

## Plan self-review

- Spec coverage:
  - Four-item nav: Task 2.
  - Contact beside language as action to `/contact`: Task 2 and Task 7.
  - Home journey rewrite: Task 4.
  - Products result capabilities plus technical proof: Task 5.
  - Blog launch education hub: Task 3.
  - About starter boundary rewrite: Task 6.
  - Footer theme switcher bug: Task 1.
  - Multilingual copy: Tasks 2-6 plus i18n checks.
- Placeholder scan:
  - No `TBD` or unfinished implementation placeholder remains.
  - "if needed" appears only where the spec intentionally leaves implementation details open; each step still has concrete default code or verification.
- Type consistency:
  - `PageType` includes `blog` before route helpers use `getCanonicalPath("blog")`.
  - Blog functions consistently use `Locale` from route config and `StarterBlogArticle`.
  - Navigation labels use `navigation.blog` and existing `navigation.contactSales`.

## Execution handoff

Plan complete and saved to `/Users/Data/workspace/showcase-website-starter/docs/superpowers/plans/2026-05-05-public-demo-site-ia-v2.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints.

Recommended choice: **Subagent-Driven**, because the plan has independent slices: theme bug, navigation, blog, Home, Products, About, contact chrome, and verification.
