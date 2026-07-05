# Section Redesign Checklist

未来重做任何 section 前，先读这个清单。目标不是让页面更花，而是让 section 更清楚、更可信、更容易复用和验收。

## 适用范围

适用于 `src/components/sections/` 下的页面区块，也适用于 route page 里已经变成独立区块的 UI。

不适用于纯文案替换、单个 token 微调、或者不改变 section 行为和视觉结构的小修补。

## 1. 复用判断

开始改之前先回答：

- 这个 section 现在复用了哪些 `src/components/ui/` primitives？
- 有没有现成 business component 可以复用，而不是在 section 里重新写一套？
- 如果要新增组件，它属于 UI primitive、business component，还是只适合留在 section 内部？
- 新增 UI primitive 是否已经有 registry 记录和 Storybook story？
- 这次 redesign 有没有引入新的 design token？如果有，为什么现有 token 不够？

默认顺序：

1. 复用现有 primitive。
2. 复用或扩展现有 business component。
3. 只在有明确复用价值时新增 business component。
4. 一次性、低复用 UI 留在 section 内部。
5. 新增 UI primitive 必须补 Storybook story 和治理记录。

## 2. 视觉验收

section redesign 至少要检查：

- 信息层级是否一眼能看懂：标题、说明、行动按钮、辅助信息不要互相抢。
- spacing 是否使用已有 token 或已有布局规则，不要随手写一次性数值。
- 颜色是否使用 semantic token，不要写 raw hex 或 raw Tailwind palette class。
- 中英文长短文本是否都能撑住。
- 移动端是否不是简单挤压桌面布局。
- 深色背景、浅色背景或品牌色背景下的对比度是否可读。
- 视觉风格是否还是 starter 的通用能力，不要写成某个旧客户的专属审美。

如果 section 视觉风险高，必须用浏览器或 Storybook 做实际预览，不要只看代码。

## 3. Storybook 验收

Phase 1 阻塞项只要求 Tier 0 UI primitives 完成 Storybook 覆盖。

section redesign 时按下面规则处理：

- 如果新增或改动 UI primitive：必须同步新增或更新 Storybook story。
- 如果改动 business component，且它可复用、视觉重要、或有明显状态差异：应补 Storybook story。
- 如果 section 本身视觉复杂、容易回归、或会被多个页面复用：应补 section story。
- business、section、page story 全覆盖属于后续 backlog，不因为没有一次性补齐而阻塞 Phase 1。

Storybook story 必须 import 真实生产组件，不要在 story 里另写一套假的实现。

## 4. 证明命令

根据改动大小选择最小验证：

```bash
node scripts/starter-checks.js truth-docs
pnpm component:governance:test
pnpm component:check
pnpm type-check
pnpm lint:check
```

说明：

- 只改治理文档：优先跑 `node scripts/starter-checks.js truth-docs`。
- 改 UI primitive、registry、scanner 或 Storybook coverage：跑 `pnpm component:governance:test`；需要 Storybook build 证明时跑 `pnpm component:check`。
- 改真实 section 代码：至少跑类型检查和能证明视觉面的检查。
- `pnpm build` 和 `pnpm website:build:cf` 会写同一个 `.next`，不要并行运行。

如果 `pnpm component:governance:test` 因 registry 或 scanner 任务尚未合入而不可用，只记录依赖任务未合入，不要扩大到别人的写作或代码范围。

## 5. 交付说明

完成 section redesign 后，回复里要说清楚：

- 复用了哪些组件；
- 新增了哪些组件以及为什么必须新增；
- Storybook stories 新增或更新了哪些；
- 跑了哪些验证命令；
- 有哪些 business、section、page story coverage 留作后续 backlog。
