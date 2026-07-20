# Storybook Coverage Map

这个文件说明 Storybook 覆盖的分层目标，避免把 Phase 1 做成无限范围。

## Coverage tiers

### Tier 0: UI primitives

**范围**：`src/components/ui/`

状态：本阶段必须完成。

要求：

- 每个 UI primitive 都要有 Storybook story。
- story 要展示实际会被 review 的状态：default、variant、disabled、invalid、长文本、深色背景等。
- story 必须 import 真实 production component。
- UI primitive 必须同时被 registry、scanner、Storybook 三层治理覆盖。

原因：

- primitives 是后续所有 section 和 business component 的基础。
- AI 最容易重复造按钮、卡片、表单项和 Radix wrapper。
- 先稳住 primitives，后续 redesign 才不会越改越散。

### Tier 1: Business components

**范围**：现有业务组件目录，例如 `src/components/forms/`、`src/components/products/`、`src/components/footer/`、`src/components/navigation/`。
不要引用已删除的目录（例如旧 `trust/`）。
不要引用已退役的 `src/components/contact/`。 <!-- truth-docs:allow-missing -->

状态：后续补齐，不是 Phase 1 blocker。

优先级：

1. 被多个页面复用的组件。
2. 视觉复杂或状态多的组件。
3. 承担转化、信任、询盘、产品展示等关键业务功能的组件。

要求：

- story 展示真实组件，不写 story-only 假实现。
- 能看出 loading、success、error、empty、long-copy 等关键状态。
- 不要求 Phase 1 一次性覆盖全部 business components。

### Tier 2: Sections

**范围**：`src/components/sections/`

状态：后续补齐，不是 Phase 1 blocker。

优先级：

1. hero、CTA、产品展示、信任背书等高转化 section。
2. 视觉结构复杂、容易回归的 section。
3. 会在多个 starter 派生项目里复用的 section。

要求：

- story 用真实 section 和真实布局约束。
- 如果 section 依赖内容数据，使用稳定 fixture，不依赖旧客户项目真相。
- section story 是视觉 review 工具，不是 production API source。

### Tier 3: Pages and flows

**范围**：route page、完整页面状态、跨组件流程。

状态：后续补齐，不是 Phase 1 blocker。

优先级：

1. 首页、产品页、联系页等关键页面。
2. 表单提交前后的完整状态。
3. 多语言和长内容容易影响布局的页面。

要求：

- page stories 或 visual fixtures 必须说明使用的是 starter 示例内容。
- 不把页面 story 当成业务真相源。
- 页面级覆盖可以和 browser smoke、Playwright 或人工 visual review 配合。

## Phase 1 boundary

Phase 1 只把 Tier 0 UI primitives 作为必须完成项。

下面内容明确是 follow-up backlog：

- business component 全覆盖；
- section story 全覆盖；
- page story 全覆盖；
- 每个业务状态的完整视觉矩阵；
- 每个派生项目的品牌化 Storybook 套件。

## Governance relationship

Storybook 不是单独治理层，它要和另外两层一起看：

- **Registry**：告诉我们有哪些 UI primitives，以及每个 primitive 应该对应哪个 story。
- **Scanner**：提前抓明显违规，比如重复 primitive、直接 Radix import、明显 raw palette 文本。
- **Storybook**：让人看到组件真实状态，判断视觉、交互、长文案和背景适配。

scanner 的 raw palette matching 是明显文本扫描，不是完整 AST/CSS lint 替代。它能抓清楚写在源码里的 `text-blue-600`、`bg-gray-50`、`#004D9E` 这类明显问题，但不能证明动态 class、生成样式或运行时样式全部正确。
