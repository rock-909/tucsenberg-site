> Historical.
>
> This file records the approved D5a execution design. Current product truth remains in stable project docs and runtime code.

# D5a 无障碍正确性收口设计

- 日期：2026-07-18
- 状态：已批准；D5a 可执行
- 基线：`origin/main` `a23f30ca457f65aa0bcab008147fb8039e6e1f14`
- 前置：D6a PR #136 已验收并合并
- 任务簇：Cluster 3A（C2 -> D6a -> D5a）

## 1. 目标

D5a 在已经合并的固定三字段 `InquiryForm` 上补齐真实无障碍语义，同时收口已确认的文字对比度、主题选择、导航名称和静态颜色桥问题。

本任务不改变买家需要填写什么，也不改写询盘后端。买家仍只看到：

- `fullName`：必填
- `email`：必填
- `message`：选填

公开询盘路径不得出现 buyer phone、WhatsApp 或 `input[type="tel"]`。

## 2. 采用方案

采用最小根因修复，不建立新的表单状态机、配置引擎或无障碍抽象层：

1. 复用服务端现有 `details` 与客户端现有 `fieldDetails`，只补齐 `state -> visible fields -> DOM` 的最后一段。
2. 共享 `InquiryForm` 自己拥有字段错误文案，不能重新依赖旧 Contact 私有 namespace。
3. 颜色只改语义 token owner；测试计算实际对比度，不把某个 token 名钉成永久答案。
4. 可访问名称由 `accessibility` message namespace 统一提供；服务端可翻译处通过 props 下传，不为翻译扩大 Client Component 边界。
5. 删除项目手写的错误或重复 ARIA，但保留原生 HTML、Radix Primitive 和可见或 `sr-only` 文本已经提供的正确语义。

## 3. 字段级错误

### 3.1 数据流

`/api/inquiry` 已返回稳定 detail code，decoder 已保存到 `InquirySubmitState.fieldDetails`。D5a 不修改 route、Zod schema、detail mapper 或提交 kernel。

共享表单只识别以下可见字段 code：

```text
errors.fullName.required
errors.fullName.invalid
errors.fullName.tooLong
errors.email.required
errors.email.invalid
errors.email.tooLong
errors.message.invalid
errors.message.tooLong
```

未知、隐藏或旧字段 detail 不渲染原始 code，不创建额外控件，只保留表单顶部总览错误。

### 3.2 展示规则

- 每个可见字段按服务端 details 顺序只展示第一条已识别错误。
- 出错控件设置 `aria-invalid="true"`。
- `aria-describedby` 必须指向真实存在且 ID 唯一的错误节点。
- message 出错时同时关联原有 hint 和 error，不能用错误覆盖帮助文字。
- 未出错字段不设置 `aria-invalid`，也不能产生悬空 `aria-describedby`。
- 顶部 `StatusCallout` 总览继续保留。

### 3.3 文案所有权

在 `inquiry.form.errors` 下增加上述 8 个字段错误叶子，英文可沿用现有 Contact 文案。不要增加 `message.required`、`message.tooShort` 或 `phone.*`。

## 4. 主题与颜色

### 4.1 Muted foreground

light 与 dark 均使用 `--neutral-9` 作为 `--muted-foreground`：

| 主题 | 背景 | 预期实算对比度 |
| --- | --- | ---: |
| Light | background | 7.558:1 |
| Light | card | 7.104:1 |
| Light | muted | 6.004:1 |
| Dark | background | 6.250:1 |
| Dark | card | 5.279:1 |
| Dark | muted | 5.285:1 |

测试必须解析实际 CSS 并计算 WCAG 对比度，三个表面均要求至少 4.5:1。

### 4.2 Static theme color bridge

`STATIC_THEME_COLORS.primary` 当前值 `#005993` 实际对应浏览器 token `--primary-text`。D5a 将该 bridge key 改名为 `primaryText`，邮件层仍可用 `COLORS.primary` 作为内部业务别名：

```ts
primary: STATIC_THEME_COLORS.primaryText
```

这样不会新增死配置，也不扩大邮件模板改动。

经 live search 仍为零生产消费时，删除：

- `primaryHover`
- `warning`
- `warningLight`
- `error`

浏览器 UI 继续禁止导入 static bridge。邮件头部必须保持 `#005993`，白字对比度约 7.3:1。

### 4.3 Ghost hover

Button ghost hover 使用现有 `foreground`：

```text
hover:bg-accent hover:text-foreground
```

不新增 token，不为单个调用点再建 variant。

## 5. ThemeSwitcher

- 外层使用 `role="group"`。
- 组名来自 `accessibility.themeSelector`。
- hydration 后三个按钮都设置布尔 `aria-pressed`，且恰好一个为 true。
- `theme` 尚未恢复时，以 `resolvedTheme` 确定 active 项。
- 未 hydration 的 disabled skeleton 不声明虚假的选中态，可省略 `aria-pressed`。
- 点击或键盘激活仍调用现有 `setTheme`，焦点不丢失。

## 6. 导航、Footer 与 breadcrumb

在 `accessibility` namespace 新增：

```text
mainNavigation
mobileNavigation
themeSelector
footerNavigation
breadcrumb
```

已有 `openMenu`、`closeMenu`、`skipToContent` 继续复用。不为无活跃消费者的 `languageSelector` 或 `mobileMenuButton` 建键。

接线边界：

- layout/server owner 读取 `mainNavigation` 并传给 Header。
- `MobileNavigationLinks` 读取 `accessibility.mobileNavigation`。
- Sheet 的 `SheetTitle` 使用相同翻译。
- Footer 使用现有 root translator 读取 `accessibility.footerNavigation`，不提前退役其余英文 fallback。
- `CatalogBreadcrumb` 在服务端读取 `accessibility.breadcrumb`，通过 `ariaLabel` 传给 view 和 primitive。
- 通用 `Breadcrumb` primitive 不保留静默英文默认值；生产调用方必须显式提供名称。
- 删除 `NAVIGATION_ARIA` 常量和只证明常量货架的测试。

## 7. ARIA 去重

删除项目手写的两处 `aria-haspopup="dialog"`：

- no-JS `<details>/<summary>` fallback：面板不是 dialog。
- standalone `MobileMenuButton`：集成时由 Radix `SheetTrigger` 拥有真实 dialog trigger 语义。

如果 Radix 集成 DOM 自动输出 `aria-haspopup="dialog"`，这是正确的 primitive 行为，不得为了源码清零而覆盖它。

删除三处冗余 `aria-label`：

1. fallback summary：已有 `sr-only` 文本。
2. `MobileMenuButton`：已有 `sr-only` 文本。
3. `SheetContent`：已有 `SheetTitle` 提供 dialog 名称。

测试应证明删除属性后 accessible name 仍存在，不使用源码负空间扫描替代行为证明。

## 8. Given / When / Then 验收条件

### 字段错误

**Given** `/api/inquiry` 返回 `errors.email.invalid`
**When** Contact 或 Request Quote 的共享表单提交失败
**Then** 顶部总览仍显示，email 下方显示翻译错误，email 为 `aria-invalid="true"`，且 `aria-describedby` 指向该错误节点。

**Given** message 同时有 hint 与 `errors.message.tooLong`
**When** 错误渲染
**Then** textarea 同时关联 hint ID 与 error ID，两个节点都存在。

**Given** details 含未知或不可见字段
**When** 表单失败
**Then** 不显示原始 code，不创建字段，仍只显示总览。

### 三字段合同

**Given** Contact 或 Request Quote 进入可编辑状态
**When** 表单渲染
**Then** 只有姓名和邮箱 required，message 明确 optional，且没有 phone/WhatsApp/tel 控件。

### ThemeSwitcher

**Given** 当前主题为 dark
**When** ThemeSwitcher hydration 完成
**Then** 有翻译名称的 group 内，dark 为 pressed，light/system 为未 pressed。

### 导航名称

**Given** 当前 locale messages 完整
**When** header、mobile navigation、Footer 和 catalog breadcrumb 渲染
**Then** landmark/dialog 名称来自 accessibility namespace，不依赖 `NAVIGATION_ARIA` 或 primitive 英文默认值。

### 色彩

**Given** light/dark token map
**When** 计算文字与真实使用表面的对比度
**Then** muted foreground 对 background/card/muted 均至少 4.5:1，ghost hover foreground 对 accent 至少 4.5:1。

## 9. 证明分工

| 证据 | 负责证明 |
| --- | --- |
| 组件测试 | 字段错误、ARIA ID 关系、required/optional、ThemeSwitcher group/pressed、翻译名称 |
| 数学合同测试 | light/dark 实际 token 对比度 |
| 浏览器/簇级验收 | Contact/RFQ 真实页面、键盘操作、主题切换、整页 axe、no-JS 与三字段回归 |

axe 不能替代字段业务映射或数学对比度；组件测试也不能替代真实页面和 OpenNext 集成。

## 10. 明确不做

- 不新增 buyer phone、WhatsApp、company、subject、quantity 或产品选择器。
- 不修改 `/api/inquiry`、`/api/contact`、Zod issue 生成或 rate limit；这些属于 D6b。
- 不删除旧 Contact 表单栈、旧 schema/config/tests；这些属于 D6e。
- 不全面退役 Footer fallback、动态翻译 cast、SVG/Canvas 英文；这些属于 D7a。
- 不新建通用 field-error utility、表单配置引擎、二次 state 或微型 a11y framework。
- 不触碰正式域名、PDF、公开电话/照片裁决、管坝 MOQ、法律签字。

## 11. Cluster 3A 验收边界

D5a 是 Cluster 3A tip。任务完成后正式验收范围是 C2 + D6a + D5a，而不是只看 D5a diff。验收通过并合并后，Cluster 3A 才能 CLOSED，D6b 才能开始。
