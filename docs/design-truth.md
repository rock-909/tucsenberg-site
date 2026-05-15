# Design Truth

这份文档只记录 Tucsenberg 当前已经确认的设计真相。
它是当前网站的工作规范，不是通用模板品牌规范。

## 当前设计定位

`tucsenberg-site` 的默认设计方向是：

- 精确
- 克制
- 工程化
- 兼容导向
- 采购友好
- 便于 AI 复用和维护

默认避免两种偏差：

1. 过度装饰，导致内容和行动路径不清楚。
2. 组件随手新增，导致后续 AI 难以复用和维护。

## 当前品牌表达

当前视觉是 Tucsenberg Phase 1 工作基线。

设计上要做到：

- 当前未完成页面看起来像 Tucsenberg work-in-progress，而不是旧模板站；
- 后续调色时不需要逐个组件改颜色；
- 组件状态、表单、卡片、导航等有统一规则；
- Storybook 可以作为组件预览和审核面。

## 当前视觉基线

现有 token、圆角、阴影、网格和布局节奏可以继续作为当前控制面板。  
但派生项目确认真实品牌后，可以替换 token 值和视觉风格。

### 色彩

- Current truth: Tucsenberg uses a role-based color system.
- Stable interface: semantic roles and token architecture.
- Provisional value: Engineering Navy / Process Teal / cool neutral palette.

规则：

- 生产组件不直接写品牌 hex。
- 改品牌色先改 token。
- 如果 token 角色变化，需要同步 `docs/impeccable/system/COLOR-SYSTEM.md` 和相关测试。

### 字体

- 当前主字体基线：IBM Plex Sans + Inter + IBM Plex Mono，中文走系统回退。
- 排版优先清晰、稳定、可读。

### 形状与阴影

- 默认圆角和阴影保持克制。
- 阴影用于区分层级或表达交互，不用于填充空白。

## 当前交互与动效原则

- 动画服务于理解，不服务于表演。
- 默认使用 restraint + speed + purposeful motion。
- 常规交互动效应保持短促。
- 尊重 reduced motion。

## 当前组件治理原则

- 先复用，再新增。
- 低层 UI 组件不能塞业务文案。
- 可复用组件要有清晰 variants。
- 视觉上容易漂移的组件应补 Storybook story。
- 新组件如果只是现有组件的轻微变体，优先扩展现有组件。

## 当前 UI 底座决策

当前采用 hybrid / pilot-first UI foundation，详见
`docs/decisions/ADR-ui-foundation.md`。

- Radix Primitives 是复杂交互默认底座。
- Radix-style 1-12 色阶是长期颜色纪律。
- Tailwind 继续负责页面布局、响应式结构和品牌表达。
- `src/app/globals.css` 里的项目 tokens 继续是运行时颜色真相源。
- Radix Themes 只允许在本地 UI wrapper 内做 pilot。

判断 UI 走哪条路时，不按页面区域粗分，而按行为分：

- 有交互、状态、校验、focus、loading、error、selected 等控制逻辑的 UI，
  可以进入 Radix-backed wrapper。
- 纯叙事、品牌图、页面排版、静态内容层级，继续用 Tailwind + 项目 tokens。

Hero 里的 CTA 按钮可以用项目 Button wrapper，因为它是控件。Hero layout
本身不应默认交给 Radix Themes。

## 当前不采用的方向

- 把 Tucsenberg 做回泛模板站。
- 每个页面随手新建一套按钮、卡片、表单。
- 大量硬编码颜色。
- 用 fake proof、fake logo、fake 客户来制造信任。
- 全站 Radix Themes-first 迁移。
- 用 Radix Themes 接管 Hero、产品故事、工厂证明、Footer 或页面叙事结构。

## 真相来源

当前设计真相主要来自：

- `src/app/globals.css`
- `docs/decisions/ADR-ui-foundation.md`
- `docs/impeccable/system/COLOR-SYSTEM.md`
- `docs/impeccable/system/COMPONENT-GOVERNANCE.md`
- `DESIGN.md`

`docs/impeccable/system/DESIGN-TOKENS.md` 可作为历史背景或设计系统参考，但当前颜色 contract 以 `COLOR-SYSTEM.md` 为准。
