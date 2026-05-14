# 内容和 SEO 字段合同

这个 starter 把页面正文、翻译文案、站点配置和 Next.js SEO metadata 分在不同地方。不要把它们混成一个“内容文件”来理解。

这份合同说明：什么内容改哪里，MDX frontmatter 每个字段负责什么，以及 SEO 最后由哪一层生成。

## 内容归属表

| 内容类型 | 负责文件 | 说明 |
| --- | --- | --- |
| 页面正文 | `content/pages/{locale}/*.mdx` | About、Contact、Privacy、Terms 这类页面的正文、页面级标题、页面级 FAQ 和页面级 SEO 输入。 |
| UI labels / section copy | `messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json` | 导航、按钮、表单提示、组件区块文案等 UI 文案。 |
| 品牌 / 联系方式事实 | `src/config/single-site.ts` | 公司名、网站名、域名、电话、邮箱、社交链接、默认 SEO 标题和描述等站点事实。 |
| sitemap / robots route policy | `src/config/single-site-seo.ts` | 哪些公开页面进 sitemap、默认 lastmod、sitemap priority / changeFrequency、robots 禁止抓取路径。 |
| 产品市场事实 | `src/config/single-site-product-catalog.ts` 和 `src/constants/product-specs/**` | 市场、产品系列、规格、交付、认证、MOQ、包装、供货能力等产品事实。 |

## MDX frontmatter 字段

当前 `content/pages/{locale}/*.mdx` 的字段不是随便填的。它们会被内容检查、页面渲染、metadata 或 JSON-LD 间接使用。

### 当前页面应有的基础字段

这些字段在当前内容里属于基础合同。新增或替换页面时，默认要保留同样的语义：

| 字段 | 职责 |
| --- | --- |
| `locale` | 当前示例页面保留的语言标记。如果继续保留，要和所在目录 `content/pages/{locale}/` 对上；但当前运行时真正的语言来源是目录、content manifest 和 i18n routing，不是这个 frontmatter 字段。 |
| `title` | 给页面自身使用的标题。它偏内容标题，不等同于最终浏览器 `<title>`。 |
| `description` | 页面内容简介。通常用于摘要、卡片或作为 SEO 描述的基础输入。 |
| `slug` | 页面路径名，例如 `about`。当前默认要求英文和中文保持同步。 |
| `publishedAt` | 页面首次发布时间。不要把每次改文案都写成重新发布。 |
| `updatedAt` | 买家能看到的页面内容改动时间。正文、标题、FAQ、重要 SEO 摘要改了，都要同步更新。 |
| `lastReviewed` | 最近一次被人工复核的时间。尤其适合法务、信任、上线敏感内容。 |
| `draft` | 是否草稿。公开页面一般是 `false`。 |
| `seo.title` | 页面级 SEO 标题输入。它会和站点 title template 一起生成最终标题。 |
| `seo.description` | 页面级 SEO 描述输入。它面向搜索结果和社交预览摘要。 |

示例：

```yaml
locale: 'zh'
title: '关于这个展示型网站 starter'
description: '了解这个 starter 为什么存在、适合谁、不适合谁，以及公开上线前必须替换什么。'
slug: 'about'
publishedAt: '2024-01-10'
updatedAt: '2026-05-05'
lastReviewed: '2026-05-05'
draft: false
seo:
  title: '关于这个展示型网站 starter'
  description: '展示型网站 starter 的身份、适用对象、边界和公开上线前替换要求。'
```

### 当前内容已经使用的可选字段

这些字段不是每个 MDX 页面都必须有，但当前内容里已经实际使用。是否添加，要看页面是否真的需要。

| 字段 | 当前用途 |
| --- | --- |
| `author` | 作者或负责团队。当前 About、Privacy、Terms 使用了它。 |
| `layout` | 页面布局标记。当前部分页面使用 `default`。 |
| `showToc` | 是否展示目录。当前较长的 About、Privacy、Terms 使用了它。 |
| `heroTitle` | 页面首屏主标题。当前 About 使用。 |
| `heroSubtitle` | 页面首屏副标题。当前 About 使用。 |
| `heroDescription` | 页面首屏说明。当前 About 使用。 |
| `seo.keywords` | 页面级关键词数组。当前 About、Capabilities、How it works、Privacy、Terms 等页面使用。 |
| `seo.ogImage` | 页面社交分享预览图。当前 About 使用 `/images/about-og.jpg`，部分页面使用 `/images/og-image.jpg`。 |
| `faq` | 页面自己的 FAQ。当前 About、Contact、Custom Project Support 等页面使用。FAQ 的 JSON-LD 也应从页面自己的 FAQ 派生。 |
| `aboutSections` | About 页面专用区块数据。不要把它当成所有页面通用字段。 |

示例：

```yaml
author: 'Showcase Website Starter Team'
layout: 'default'
showToc: true
heroTitle: '一个面向真实公开上线准备的展示型网站 starter'
heroSubtitle: '不是虚构公司介绍'
heroDescription: '这个页面解释 starter 是什么、适合谁，以及公开上线前哪些内容必须变成真实事实。'
seo:
  keywords: ['展示型网站 starter', 'starter 边界', '公开上线网站']
  ogImage: '/images/about-og.jpg'
faq:
  - id: starter-purpose
    question: '这是已经完成的客户官网吗？'
    answer: '不是。这是带可运行结构和可替换示例内容的 starter demo。'
```

## 图片语义

不要把所有图片都塞进 MDX frontmatter。不同图片有不同职责。

| 图片类型 | 放在哪里 | 说明 |
| --- | --- | --- |
| `seo.ogImage` | MDX frontmatter 的 `seo.ogImage` | 社交分享预览图 / Open Graph 图。它给搜索引擎、社交平台、聊天软件生成链接预览用。它不是产品卡片缩略图，也不是正文内图片。 |
| 产品 / 服务卡片图片 | 通常在产品配置、服务配置或规格配置里 | 用在买家可见的列表卡片、产品入口、市场页或详情页。不要试图用一个 MDX `seo.ogImage` 统一解决。 |
| MDX 内联图片 | MDX 正文里 | 属于页面正文内容，跟段落、说明、案例图一起维护。 |

client launch 前，如果 `seo.ogImage` 仍指向 starter 示例图，例如 `/images/og-image.jpg` 或 `/images/about-og.jpg`，要替换成真实项目自己的分享图。

## SEO 生成职责

SEO 最终输出不是只由 MDX 决定。当前职责分工如下：

| SEO 输出 | 当前来源 |
| --- | --- |
| Base metadata title / description | `src/app/[locale]/layout-metadata.ts` 和 `src/config/single-site.ts` 里的 site config。 |
| Sitemap entries / alternates | `src/app/sitemap.ts`、`src/config/single-site-seo.ts`、`src/i18n/routing.ts`。 |
| Robots policy | `src/app/robots.ts`、`src/config/single-site-seo.ts`。 |
| Page JSON-LD | 页面级 SEO component 和 structured-data helper，例如 `src/components/seo/**`、`src/lib/page-structured-data.ts`、`src/lib/structured-data-generators.ts`。 |
| Canonical / hreflang key-route validation | `tests/e2e/seo-validation.spec.ts` 覆盖关键页面的 SEO 合同；它不是自动覆盖全站每个页面和路径的完整 SEO 证明，除非继续扩大测试覆盖。 |

换句话说：

- MDX frontmatter 提供页面内容和页面级 SEO 输入。
- `layout-metadata.ts` 负责站点级默认 metadata。
- `sitemap.ts` 和 `robots.ts` 负责搜索引擎抓取入口。
- JSON-LD 由页面级组件和 structured-data helper 生成，不要在 MDX 里手写一坨 schema。
- canonical 和 hreflang 的关键页面合同，要用 E2E SEO 测试证明。新增页面或新路径要么纳入现有测试覆盖，要么单独做页面级证明。

## 替换规则

- 各语言目录下的 `slug` 默认保持同步，例如 `content/pages/en/about.mdx` 和 `content/pages/zh/about.mdx` 都用 `slug: 'about'`。除非未来明确采用 localized pathname 策略，否则不要私自改成一边 `about`、一边 `guanyu`。
- buyer-visible 内容改了，要更新 `updatedAt`。这里的 buyer-visible 包括正文、标题、FAQ、页面摘要、重要产品或服务说明。
- 法务、信任、上线敏感内容被 owner 或相关负责人复核后，要更新 `lastReviewed`。
- client launch 前要替换 starter 的 `seo.ogImage` 示例图，不要把 starter 分享图当成客户真实资产。
- 不要把 starter MDX 里的法律声明当作已获 owner review 的最终声明。Privacy、Terms、信任承诺、交付承诺都必须由真实 owner 或法律负责人确认。

## 验证命令

内容和 slug 合同改动后，运行：

```bash
pnpm content:check
pnpm test -- tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts
```

release-facing SEO 证明可以再补：

```bash
pnpm exec playwright test tests/e2e/seo-validation.spec.ts
```

这条 Playwright 命令更重，偏上线前证明。没有真的运行时，不要在报告里说它已经通过。
