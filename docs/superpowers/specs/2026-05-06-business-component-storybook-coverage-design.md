# Business Component Storybook Coverage Design

## 目标

把当前 `component:governance` 里的 business component / section missing story warning 变成可执行的 Storybook 补齐计划。

原始设计只交付设计和计划，不补 `.stories.tsx`，不改组件代码，不改 scanner 规则。后续执行时可按 owner 的 PR 策略选择分批 PR 或一个 PR 闭环。

## 当前事实

2026-05-06 在当前 workspace 重新运行：

```bash
pnpm component:governance
```

结果：

```text
[component-governance] passed: 0 error(s), 33 warning(s)
```

附件里记录的是 31 个 warning；当前 live scan 多出 2 个：

- `src/components/contact/contact-form.tsx`
- `src/components/forms/contact-form.tsx`

所以后续实施以当前运行结果的 33 个 warning 为准。

这些 warning 不是 release blocker。它们说明这些业务组件和 section 已经进入 Storybook backlog，后续应补同路径 `.stories.tsx`，让人可以单独看组件状态、长文案、中文文案、移动端和视觉质量。

## 范围

要清掉的 warning 分三个 review batch：

| Review batch | 范围 | 数量 | 目标 warning 数 |
| --- | --- | ---: | ---: |
| Batch 1 | Contact / forms / footer | 14 | 33 -> 19 |
| Batch 2 | Products | 6 | 19 -> 13 |
| Batch 3 | Sections | 13 | 13 -> 0 |

如果 owner 要求一个 PR 推进，仍按这三个 batch 组织提交说明和 reviewer checklist，不把 33 个 story 混成一坨不可审的变更。

## 不做什么

- 不把 warning 改成 hard error。
- 不通过改 scanner 白名单来清掉 warning。
- 不做页面级 Storybook 全覆盖。
- 不引入 Storybook MCP 直连；项目文档已说明 Storybook MCP 归本机 MCPHub 管。
- 不把 story 写成第二套假的组件实现。
- 不引入旧客户、旧品牌、旧产品事实。
- 不改业务行为，除非为了让现有 Server Component 可被 Storybook 稳定预览而做同步 view extraction。

## 设计原则

### 1. Story 文件可以匹配 scanner，组件仍要真实

scanner 只检查同路径 story 文件是否存在。例如：

```text
src/components/products/spec-table.tsx
src/components/products/spec-table.stories.tsx
```

但 story 不能为了过 scanner 写一套假 UI。它必须 import production component，或者 import 为 Storybook 抽出来的 production view component。

### 2. Server Component 不直接塞进 Storybook

当前项目是 Next.js App Router。Next 文档说明 layout/page 默认是 Server Components；需要状态、事件、浏览器 API 时才使用 Client Components。`"use client"` 是 client/server module graph 的边界，而且 client props 需要可序列化。

这里的影响是：

- `getTranslations`、`next-intl/server`、JSON-LD 生成、Server Action 这类 server 逻辑不要硬塞到 Storybook。
- 对 async Server Component，优先抽出同步 view component，让 story 用稳定 fixture 渲染 view。
- wrapper 组件继续负责加载翻译、拼数据、JSON-LD 或 route-level 行为。

这可以减少 Storybook build 风险，也避免为了预览把大块 UI 标成 `"use client"`。

### 3. 状态矩阵比文件数量更重要

目标不是简单增加 33 个空 story。每个 story 至少要覆盖当前组件最容易回归的状态：

- 默认状态。
- pending / disabled / success / error，适用于表单。
- empty / few / many / overflow，适用于产品和表格。
- English long copy / Chinese long copy，适用于营销区块。
- mobile or narrow canvas，适用于布局风险高的 section。

### 4. fixture 是 starter 示例，不是业务真相

Storybook fixture 可以放在组件附近，例如：

- `src/components/forms/contact-form-story-fixtures.ts`
- `src/components/products/product-story-fixtures.ts`
- `src/components/sections/section-story-fixtures.ts`

fixture 只服务视觉和状态审查。它不能成为产品事实、品牌事实或上线内容来源。

## 批次设计

### PR 1: Contact / forms / footer

目标是让询盘链路可以被单独查看。

范围：

- `src/components/contact/*.tsx`
- `src/components/forms/**/*.tsx`
- `src/components/footer/Footer.tsx`

关键状态：

- 表单默认状态。
- 表单 pending / disabled。
- submit success。
- validation error。
- processing error / validation error。
- Turnstile placeholder / unavailable fallback。
- optional company。
- long English / long Chinese labels and placeholders。
- footer 默认列、长链接、社交链接、status slot、theme toggle slot。

这批最可能需要轻微结构调整：`ContactFormContainer` 现在直接使用 `useContactForm`、`useActionState`、Turnstile 和 server action。为了让 Storybook 稳定预览，建议抽出 `ContactFormContainerView`，把真实 hook 留在 container 里。

验收：

```text
Given 当前 component governance 有 33 个 warning
When PR 1 story 覆盖 contact/forms/footer 并运行 component governance
Then 结果仍是 0 error，warning 数降到 19
```

### PR 2: Products

目标是证明产品展示组件适合 starter 派生项目复用。

范围：

- `src/components/products/catalog-breadcrumb.tsx`
- `src/components/products/family-section.tsx`
- `src/components/products/market-series-card.tsx`
- `src/components/products/product-specs.tsx`
- `src/components/products/spec-table.tsx`
- `src/components/products/sticky-family-nav.tsx`

关键状态：

- 产品卡片默认和长标题。
- 中文长标题。
- empty specs returns null 的边界说明。
- few / many spec rows。
- 宽表格横向滚动。
- family nav overflow。
- breadcrumb products root / market detail。

`CatalogBreadcrumb` 是 async Server Component，包含 `next-intl/server` 和 JSON-LD。建议抽出同步 `CatalogBreadcrumbView`，story 只展示 breadcrumb UI，现有测试继续覆盖 JSON-LD builder。

验收：

```text
Given PR 1 后还剩 19 个 warning
When PR 2 story 覆盖 products 组件并运行 component governance
Then 结果仍是 0 error，warning 数降到 13
```

### PR 3: Sections

目标是清掉 section 层 Storybook backlog，并让首页关键区块有可视化审查面。

范围：

- `src/components/sections/chain-section.tsx`
- `src/components/sections/faq-accordion.tsx`
- `src/components/sections/faq-section.tsx`
- `src/components/sections/final-cta-view.tsx`
- `src/components/sections/hero-section-view.tsx`
- `src/components/sections/homepage-section-shell.tsx`
- `src/components/sections/products-section-view.tsx`
- `src/components/sections/quality-section-view.tsx`
- `src/components/sections/resources-section.tsx`
- `src/components/sections/sample-cta.tsx`
- `src/components/sections/scenarios-section-view.tsx`
- `src/components/sections/starter-boundary-section-view.tsx`
- `src/components/sections/starter-boundary-section.tsx`

关键状态：

- hero / product / quality / scenarios / final CTA view 的 default、long copy、Chinese copy、narrow canvas。
- FAQ accordion collapsed / expanded。
- FAQ section without JSON-LD in story。
- homepage shell with and without action slot。
- resources grid with long labels。
- chain/process section with five steps and long step copy。
- sample CTA long Chinese copy。
- starter boundary default and long item list。

已有部分 section story 文件使用 view component，但 scanner 现在要求 view 文件自己也有同路径 story。例如已有 `hero-section.stories.tsx`，但还缺 `hero-section-view.stories.tsx`。PR 3 应补齐这些 matching story，而不是删掉已有 story。

验收：

```text
Given PR 2 后还剩 13 个 warning
When PR 3 story 覆盖 sections 并运行 component governance
Then 结果是 0 error，0 warning
```

## 质量门槛

每个 PR 至少运行：

```bash
pnpm component:governance:test
pnpm component:governance
pnpm storybook:build
pnpm component:check
```

如果该 PR 抽出 view component 或改 production `.tsx`，再运行：

```bash
pnpm type-check
pnpm lint:check
```

如果改到 section 渲染结构，运行对应 focused test，例如：

```bash
pnpm exec vitest run src/components/sections/__tests__/hero-section.test.tsx
```

## 主要风险

1. 表单 story 直接 import hook/container，可能把 server action 或 Turnstile runtime 带进 Storybook。
   - 处理：抽 view，story 渲染 view，container 保留真实 hook。

2. async Server Component story build 不稳定。
   - 处理：抽同步 view，server wrapper 只负责翻译和数据拼装。

3. 为了降 warning 修改 scanner。
   - 处理：禁止 scanner 白名单式修复。除非组件确实不应该在 backlog 内，否则补 story 或调整真实组件边界。

4. Storybook fixture 变成业务事实。
   - 处理：fixture 命名和注释说明它只用于 Storybook review，不用于 production 内容。

## 完成定义

三批都完成后：

- `pnpm component:governance` 输出 `0 error(s), 0 warning(s)`。
- `pnpm component:check` 通过。
- 所有新增 story import 真实 production component 或 production view component。
- 没有新增 raw Tailwind palette / raw hex / 直接 Radix import 违规。
- 没有为了 Storybook 把大块 server UI 改成 client component。
