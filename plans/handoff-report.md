# Tucsenberg Site Handoff Report

日期：2026-07-02

## 结果范围

本分支把 starter 切到 Tucsenberg 英文单语言 B2B 站：

- 公开语言：`en` only，`localePrefix: "never"`。
- Phase 1 页面：`/`、`/products`、5 个产品详情页、`/oem-wholesale`、2 个 guide、`/about`、`/request-quote`、`/contact`。
- 法务页：`/warranty`、`/privacy`、`/terms`。
- 不部署；只完成本地构建、Cloudflare/OpenNext build 和本地生产渲染检查。

## Catalog 映射方案

选择：复用原来的 `/products/[market]` catalog 机制，把 `market` 从地区维度重映射为 5 条产品线。

原因：

- 可以继续复用现有动态路由、sitemap、metadata、breadcrumb、Product JSON-LD、catalog 测试和 profile materialization 边界。
- 不新增并行产品路由系统，后续维护只需要看 `single-site-product-catalog.ts`、`product-specs` 和 `tucsenberg-product-pages.ts`。
- 原 `market` 命名保留为实现细节；公开 URL 已经是产品线 slug。

| 公开 URL slug | catalog market | family slug | specs source | 页面正文源 |
| --- | --- | --- | --- | --- |
| `abs-flood-barriers` | ABS Interlocking Boxwall | `abs-boxwall` | `ABS_FLOOD_BARRIER_SPECS` | `TUCSENBERG_PRODUCT_PAGES.abs-flood-barriers` |
| `aluminum-flood-gates` | Aluminum Flood Gates | `aluminum-gates` | `ALUMINUM_FLOOD_GATE_SPECS` | `TUCSENBERG_PRODUCT_PAGES.aluminum-flood-gates` |
| `absorbent-flood-bags` | Absorbent Flood Bags | `absorbent-bags` | `ABSORBENT_FLOOD_BAG_SPECS` | `TUCSENBERG_PRODUCT_PAGES.absorbent-flood-bags` |
| `flood-tube-dams` | Water & Air-Filled Tube Dams | `tube-dams` | `FLOOD_TUBE_DAM_SPECS` | `TUCSENBERG_PRODUCT_PAGES.flood-tube-dams` |
| `frp-flood-barriers` | FRP Composite Planks | `frp-planks` | `FRP_FLOOD_BARRIER_SPECS` | `TUCSENBERG_PRODUCT_PAGES.frp-flood-barriers` |

主要落点：

- `src/config/single-site-product-catalog.ts`
- `src/constants/product-specs/tucsenberg-product-lines.ts`
- `src/constants/product-specs/market-spec-registry.ts`
- `src/constants/tucsenberg-product-pages.ts`
- `src/app/[locale]/products/[market]/page.tsx`

## 文案一致性说明

实施原则是：外部文案源只读，站内正文尽量逐字搬运。

有一个上线约束冲突已处理并保留说明：

- 外部源 `/Users/Data/workspace/tucsenberg/内容/文案/products-abs-flood-barriers.md` 有标题 `Not the $30 kit you saw on Amazon`。
- 目标规格同时要求全站不能出现任何价格数字。
- 站内改为 `Not the disposable kit you saw on Amazon`，避免公开页面出现 `$30`。
- 这是唯一主动偏离源文案的位置。原因是源文案和禁词规则冲突；需要 owner 最终确认保留该替代标题，或给一个新的无价格数字标题。

## TODO-OWNER 清单

| 位置 | 待 owner 提供/确认 | 当前处理 |
| --- | --- | --- |
| `content/pages/en/about.mdx` | Owner 英文名、照片、第一人称段落 | 保留 `TODO-OWNER` |
| `src/config/single-site.ts` | 电话或 WhatsApp 可点击兜底号码 | `phone: "TODO-OWNER"`；页面展示 `@Tucsenberg (business account)` |
| `src/constants/product-specs/tucsenberg-product-lines.ts` | TB-TD500 section weight | 表格保留 `TODO-OWNER` |
| `src/constants/tucsenberg-product-pages.ts` | TB-TD500 section weight | 表格保留 `TODO-OWNER` |
| `content/pages/en/privacy.mdx` | 最终 analytics/cookie 设置 | 保留 `TODO-OWNER` |
| `content/pages/en/terms.mdx` | 法务终审 | 保留 `TODO-OWNER` |
| `content/pages/en/warranty.mdx` | 法务终审 | 保留 `TODO-OWNER` |
| ABS 产品页标题 | `$30` 源文案和禁价格数字规则冲突 | 站内用无价格数字标题，需 owner 确认 |

## 检查摘要

已运行并通过：

```text
pnpm type-check
pnpm lint:check
pnpm test
pnpm brand:check
pnpm content:check
pnpm build
pnpm website:build:cf
```

补充渲染检查：

```text
本地生产服务器：pnpm exec next start -p 3131
页面检查：16 个页面最终 HTTP 200，并包含对应主标题/核心文案。
PDF 检查：/downloads/spec-sheet-tb-ag.pdf 返回 X-Robots-Tag: noindex。
en-only 检查：/zh 返回 404，且不再渲染 `简体中文`、`hrefLang="zh"`、`/zh` language fallback。
```

页面覆盖：

```text
/
/products
/products/abs-flood-barriers
/products/aluminum-flood-gates
/products/absorbent-flood-bags
/products/flood-tube-dams
/products/frp-flood-barriers
/oem-wholesale
/guides/flood-barrier-materials-guide
/guides/flood-barrier-specifications
/about
/request-quote
/contact
/warranty
/privacy
/terms
```

禁词检查使用的公开源范围：

```text
rg -n -i "Western|tariff|customs data|BS\s*851188|FM\s*2510|FEMA|keeps your house dry|[$€£]\s*[0-9]" src content messages public \
  --glob '!**/*.test.ts' \
  --glob '!**/*.test.tsx' \
  --glob '!**/__tests__/**' \
  --glob '!src/lib/content-manifest.generated.ts' \
  --glob '!public/downloads/*.pdf'
```

结果：零命中。

说明：

- `src/lib/content-manifest.generated.ts` 是内容生成物，正文来自 `content/pages/en/*.mdx`；源文件已通过同一禁词检查。
- 测试 fixture 和旧 profile 示例不作为公开站点输出面。
- PDF 文件来自 owner 物料目录，本轮只验证下载可访问和 `noindex` 响应头；未改 PDF 内容。

## 上线前待 owner 项

上线前至少需要确认：

1. 域名 DNS / Cloudflare 站点配置。
2. 生产域名上线签署后，再把生产环境 `NEXT_PUBLIC_SITE_URL` 指向 `https://tucsenberg.com`；开发/CI 阶段继续用公开 Cloudflare preview URL。
3. `sales@tucsenberg.com` 是否已经能收发。
4. WhatsApp 可点击号码或 username 深链上线口径。
5. Turnstile site key / secret key。
6. Airtable 或最终 lead sink 凭据和字段映射。
7. Resend 或最终邮件发送凭据。
8. Analytics 是否启用；若启用，更新 privacy/cookie 文案。
9. 法务页终审：privacy、terms、warranty。
10. About 页面真人信息：英文名、照片、第一人称段落。
11. TB-TD500 section weight。
12. ABS 产品页无价格数字替代标题是否接受。

## 已知非阻塞说明

- `pnpm build` 和 `pnpm website:build:cf` 都会显示 Next.js `middleware` deprecation warning；这是本 starter 现有 Cloudflare/OpenNext 决策边界，未在本轮迁移到 proxy。
- 构建时会显示 `Resend API key missing - email service will be disabled`；本轮不部署，生产凭据属于上线前 owner 配置项。
- OpenNext build 有依赖包内的 `-0` comparison warning；构建完成且 worker 已生成。
