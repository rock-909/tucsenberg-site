---
name: Showcase Website Starter
description: Twitter-blue Radix-style starter for OEM/ODM showcase websites. Flat surfaces, generously rounded, single-accent restraint.
colors:
  primary: "oklch(0.6723 0.1606 244.9955)"
  primary-foreground: "oklch(1 0 0)"
  primary-text: "oklch(0.45 0.12 245)"
  primary-dark: "oklch(0.58 0.15 245)"
  brand-2: "oklch(0.9392 0.0166 250.8453)"
  brand-9: "oklch(0.6723 0.1606 244.9955)"
  brand-11: "oklch(0.45 0.12 245)"
  brand-12: "oklch(0.3 0.08 245)"
  neutral-1: "oklch(1 0 0)"
  neutral-2: "oklch(0.9784 0.0011 197.1387)"
  neutral-3: "oklch(0.9222 0.0013 286.3737)"
  neutral-5: "oklch(0.9317 0.0118 231.6594)"
  neutral-8: "oklch(0.5637 0.0078 247.9662)"
  neutral-12: "oklch(0.1884 0.0128 248.5103)"
  background: "{colors.neutral-1}"
  foreground: "{colors.neutral-12}"
  card: "{colors.neutral-2}"
  muted: "{colors.neutral-3}"
  accent: "{colors.brand-2}"
  accent-foreground: "{colors.brand-9}"
  border: "{colors.neutral-5}"
  ring: "oklch(0.6818 0.1584 243.354)"
  success: "oklch(0.56 0.13 155)"
  warning: "oklch(0.66 0.14 72)"
  error: "oklch(0.6188 0.2376 25.7658)"
  info: "{colors.brand-9}"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: "1.2"
  heading:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "32px mobile, 36px desktop"
    fontWeight: 600
    lineHeight: "1.2"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.625"
  body-chinese:
    fontFamily: "Source Han Sans SC, Noto Sans SC, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.6"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "1.4"
rounded:
  sharp: "0.125rem"
  base: "0.25rem"
  soft: "0.375rem"
  sm: "calc(1.3rem - 4px)"
  md: "calc(1.3rem - 2px)"
  lg: "1.3rem"
  xl: "calc(1.3rem + 4px)"
  "2xl": "calc(1.3rem + 8px)"
  round: "9999px"
spacing:
  unit: "4px"
  container-max: "1080px"
  nav-h: "56px"
  section-y-mobile: "56px"
  section-y-desktop: "72px"
  card-padding: "24px"
components:
  button-default:
    backgroundColor: "{colors.brand-11}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "h 38px, x 20px"
  button-default-hover:
    backgroundColor: "{colors.brand-12}"
  button-secondary:
    backgroundColor: "{colors.neutral-12}"
    textColor: "{colors.neutral-1}"
    rounded: "{rounded.md}"
    padding: "h 38px, x 20px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.md}"
    padding: "h 38px, x 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "h 38px, x 20px"
  button-sm:
    height: "32px"
    padding: "x 12px"
  button-lg:
    height: "40px"
    padding: "x 24px"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "x 16px"
  badge-default:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.round}"
    padding: "x 12px, y 4px"
---

# Design System: Showcase Website Starter

## 1. Overview

**Creative North Star: "The Calm Specifier"——一份让访客**慢下来、看清楚、信得过**的工业制造商页面。**

底色基于 tweakcn Twitter 预设：克制的蓝灰，明亮 canvas，**几乎完全扁平**——没有真正意义上的阴影，深度靠 1px 描边和 1–2 步 lightness 差异表达。当前圆角偏大（1.3rem 基准 ≈ 21px），同样继承自 tweakcn Twitter 预设。**这是 starter 的默认占位，不是已经为工业 B2B 场景拍板的最终选择**——Twitter 的大圆角适合消费社交，工业 B2B 的"专业基准线"（Stripe / Linear / Vercel / SAP Fiori）通常落在 6–12px 区间。每个真实项目应该重新评估：维持现状走"温和当代"路线，还是收紧到中等圆角走"工程克制"路线，在项目级 DESIGN.md 中明确并覆盖 `--radius`。

系统拒绝两类相反的失败：**Alibaba 式的视觉密度堆砌**（产品瓦片墙 / 徽章墙 / 跑马灯 logo 当唯一证据），和**消费 SaaS 式的渐变招摇**（hero 渐变 + 三行假大空 + 同款功能卡片网格）。这两类都不适合"我做这行十几年、知道你在乎什么"的工程总监声音。

字体保持**保守的 system stack**——`system-ui` 优先，中文走 Source Han Sans SC → Noto Sans SC → PingFang SC 兜底。这是刻意的选择：每个真实项目想换品牌字体可以单独换；starter 默认不引入网络字体，保护 LCP。

**Key Characteristics：**

- 几乎扁平：阴影令牌存在但透明度为 0，深度靠 1px 边框 + neutral-2 卡片底色完成
- 圆得稳：基础圆角 1.3rem，最小常用圆角 ≈17px
- 单 accent 纪律：主色 Twitter 蓝在任一屏占比 ≤10%，rest 是 neutral
- 12 级 Radix 风格阶梯（brand / neutral 各 12 步），role token 映射统一在 globals.css
- light 为默认主题；dark 是平等的二等公民，但不是默认人格
- 字体保守、不引入运行时网络字体

## Modern Technical B2B calibration

The durable direction lives in `docs/design/truth.md`: Modern Technical B2B,
also usable as Product-led Industrial B2B.

This calibration improves the starter's B2B clarity without adopting another
brand identity. It is not a visual migration and it does not change runtime CSS
by itself.

### Reference source: Vercel discipline, not identity

Vercel is a reference for hierarchy, state precision, restrained spacing,
surface clarity, typography discipline, and short purposeful motion. Do not copy
Vercel's black-and-white developer-platform identity, Geist defaults, token
names, terminal motifs, deploy motifs, or developer-product copy style.

### Typography roles

- **Heading:** buyer-facing page and section hierarchy. Use clear weight and
  size contrast, balanced wrapping, and readable line lengths.
- **Label:** navigation, form labels, metadata, badges, and compact scanning
  text. Keep labels short and avoid all-caps body copy.
- **Copy:** multi-line explanatory text. Keep body copy readable at 16px+ on
  mobile and avoid low-contrast muted gray.
- **Button:** verb-led action labels that say what happens next.
- **Mono:** technical references, SKU-like values, aligned numbers, and proof
  metadata only. Do not use mono as shorthand for "technical."

Runtime typography remains the current cross-platform system stack. Do not adopt
Geist as the default starter font. Do not bundle Apple proprietary font files.

### Component sizing calibration

Use these as review references before changing runtime wrappers:

- 32px for small controls;
- 40px for default controls;
- 48px for large controls.

These are review examples, not permission to silently change Button, Input,
Select, Card, or global control sizing.

### Radius calibration

Use these as review examples before changing runtime wrappers:

- 8px to 12px for ordinary controls;
- around 12px for floating menus and popovers;
- 12px to 16px for cards;
- 9999px for pills, avatars, and circular controls.

Do not silently change global `--radius`.

### Surface and elevation calibration

Static surfaces should use border and tonal difference first. Floating surfaces
such as menus, popovers, dialogs, and tooltips may use restrained shadow when
the shadow explains separation.

Do not pair decorative wide shadows with borders just to make a card feel
premium. Do not copy Vercel token names into this project.

### Motion calibration

Routine state changes should feel fast, around 150ms when motion helps.
Popover, menu, and small-panel movement should stay around 200ms. Larger overlay
motion needs separate visual proof.

Use CSS and existing state attributes before JavaScript orchestration. Do not
gate content visibility on animation. Always preserve reduced-motion behavior.

The canonical motion governance rulebook lives in `docs/ref/motion.md`. This
starter treats motion as a state, hierarchy, and path clarification tool, not as
decoration. Do not add full-site reveal, page choreography, long durations, or
new animation dependencies without separate proof.

## 2. Colors

整体是**克制的蓝灰**——Twitter 风格的中明度蓝（`brand-9 ≈ oklch(0.67 0.16 245)`）作为主色，配 12 级中性阶梯，状态色（成功 / 警告 / 错误 / 信息）使用 OKLCH 但 chroma 控制在中等区间，避免高饱和扎眼。

### Primary

- **Twitter Blue / brand-9** (`oklch(0.6723 0.1606 244.9955)`)：CTA、链接、信息状态、焦点环的"亮"版本。整页占比 ≤10%——只用在希望访客真正下一步的位置。
- **Brand Text Blue / brand-11** (`oklch(0.45 0.12 245)`)：实际的主按钮底色（`--button-primary-bg`）。比 brand-9 更深，保证在白底上 4.5:1+ 对比度。
- **Brand Dark / brand-12** (`oklch(0.3 0.08 245)`)：主按钮 hover 的更深一档。
- **Primary Light / brand-2** (`oklch(0.9392 0.0166 250.8453)`)：accent 浅蓝，用于 hover wash、selected 行底色、subtle 强调。

### Neutral

- **Pure Canvas / neutral-1** (`oklch(1 0 0)`)：默认背景，footer 也是白底（不是灰色色带）。
- **Card Surface / neutral-2** (`oklch(0.9784 0.0011 197.1387)`)：卡片、sidebar、Twitter 风格的轻微温白。和 canvas 的 lightness 差 ≈2 个百分点——这就是全部的"深度"。
- **Muted Surface / neutral-3** (`oklch(0.9222 0.0013 286.3737)`)：muted 背景、表头底色。
- **Border / neutral-5** (`oklch(0.9317 0.0118 231.6594)`)：所有 1px 边框。border 才是这个系统的"阴影"。
- **Mid Text / neutral-8**：placeholder、辅助文字、低对比度 label。
- **Ink / neutral-12** (`oklch(0.1884 0.0128 248.5103)`)：正文、标题、secondary 按钮底色——不是纯黑，是带极轻蓝调的墨色。

### Status

- **Success**（`oklch(0.56 0.13 155)`）：绿，配 muted 浅底 + 深 foreground。
- **Warning**（`oklch(0.66 0.14 72)`）：金黄，同套三件配色。
- **Error**（`oklch(0.6188 0.2376 25.7658)`）：暖红，也作为 destructive。
- **Info**（= primary）：和品牌色合并，避免引入第二种蓝。

### Named Rules

**The One Voice Rule.** 主色（`brand-9` / `brand-11`）在任一屏占比 ≤10%。它的稀缺性才是它的力量。如果一屏出现五处蓝色 CTA，说明信息架构本身有问题，不要靠"再加一个蓝按钮"解决。

**The Border-Is-Shadow Rule.** 这个系统的所有阴影令牌（`--shadow-xs` 到 `--shadow-xl`）透明度都是 0——它们刻意失效，作为未来"shadow-as-border"过渡使用。当前的视觉深度只来自 1px `--border`（`neutral-5`）和 `neutral-2` 卡片底色。新增组件不要打破这条纪律，更不要自己写 `box-shadow: 0 4px 12px rgba(0,0,0,0.1)` 之类的随手阴影。

**The Tinted-Neutral Rule.** 不用 `#000` / `#fff`，所有中性都向 `brand` 微调。`neutral-1` 是 `oklch(1 0 0)`（纯白）只在浅色画布场景生效，所有其他中性都带极轻蓝调。

## 3. Typography

**Display / Heading / Body / Mono：单一字体家族（系统栈）+ 中文兜底栈。**

- **Sans Stack：** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Chinese Stack：** `"Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
- **Mono Stack：** `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`

**字体性格：** 克制、平实、无衬线。系统字体的好处是零网络代价、字形稳定、中英文都不会突然降级到难看的兜底字体。代价是"无个性"——这是 starter 的特征不是缺陷，每个真实项目想换品牌字体可以单独加载。

### Hierarchy

- **Display**（600，36px，line-height 1.2）：页面 H1、hero 主标。
- **Heading**（600，32px mobile / 36px desktop，leading-tight）：section 标题（`.text-heading` 工具类）。
- **Title**（600–700，20–24px，leading-tight）：卡片标题、子区块标题。
- **Body**（400，16px，leading-relaxed ≈1.625）：正文（`.text-body`）。最大行宽 65–75ch。
- **Label**（500，14px）：表单 label、按钮文字。
- **Mono**（400，14px）：技术规格、SKU、代码片段。

### Named Rules

**The Single-Family Rule.** 一个 sans 系列 + 一个中文兜底栈 + 一个 mono。不混入第三个字体家族（除非真实项目里有合理的品牌理由，并且在项目级 DESIGN.md 中明确）。

**The 16px-Minimum Rule.** 任何 buyer-facing 正文在移动端不小于 16px、行高不小于 1.5。中文段落额外开启 `font-feature-settings: "kern" "liga" "calt"`。

## 4. Elevation

**这个系统几乎完全扁平。**

阴影令牌（`--shadow-xs` 到 `--shadow-xl`）全部以透明度 0 定义——它们存在是为了未来"shadow-as-border"动画过渡留接口，**当前不渲染任何可见阴影**。视觉深度完全来自：

- **1px `--border`**（`neutral-5`）——边框是这个系统的"地基阴影"
- **`neutral-2` 卡片底色** —— 比 canvas 暗 ≈2 个百分点
- **`--shadow-inset`** —— 仅在按下态使用的内阴影（6% 不透明黑）
- **`--shadow-card-active`** —— focus 时的双层 ring（实色 + 12% 半透明扩散），不是漂浮感

### Shadow Vocabulary

- **Active focus ring** (`--shadow-card-active`)：`0 0 0 1px primary, 0 0 0 4px primary/12%`。focus / selected 卡片专用。
- **Inset press** (`--shadow-inset`)：`inset 0 1px 0 neutral-12/6%`。按下态轻微下沉。
- **Accent halo** (`--shadow-accent`)：`0 0 0 3px primary/20%`。仅用于焦点环或选中态强调。

### Named Rule

**The Flat-By-Default Rule.** Surfaces are flat at rest. 任何漂浮阴影（`0 4px 12px ...`）都必须有具体功能理由（focus / selected / dragging）。**禁止把"立体感阴影"当作美化**——它会立刻让页面看起来像 2014 年。

## 5. Components

### Buttons

- **Shape：** 圆角 `--radius-md`（≈18.8px）——"圆润但有边"，不是 pill。
- **Sizing：** 默认 `h-[38px] px-5 py-2.5`；sm = `h-8 px-3`；lg = `h-10 px-6`。
- **Primary (default)：** 底色 `brand-11`（深蓝），白字，hover 到 `brand-12`。**注意：实际主按钮用的是 `brand-11` 不是 `brand-9`**——为了 4.5:1+ 对比度，比"Twitter 蓝亮色"更深一档。
- **Secondary：** 底色 `neutral-12`（墨黑），白字，1px border，hover 边框收紧。
- **Outline：** 透明底，`brand-11` 字 + 2px `brand-11` 边，hover 加 10% wash。
- **Ghost：** 透明底，foreground 字，hover 用 accent（浅蓝）。
- **Link：** 纯文字，下划线 hover 出现。
- **on-dark / ghost-dark：** 暗底场景专用（hero、scenario surface）。
- **Focus：** 2px ring + 2px offset。`active:scale-[0.98]` 给点轻微按压反馈。

### Cards

- **Shape：** 圆角 `--radius-lg`（1.3rem ≈ 20.8px）。
- **Background：** `card`（neutral-2 温白）。
- **Border：** 1px `border`（neutral-5）——这是 elevation 唯一来源。
- **Padding：** `py-6 px-6`（24px 全向）。
- **Shadow：** none（默认 surface 是 `--card-default-shadow: none`）。
- **Composition：** 内部用 `Card / CardHeader / CardTitle / CardContent / CardFooter` 子组件，gap-6。
- **DataCard：** 规格、参数、商务条款专用变体——用于结构化数据展示，和 marketing Card 是不同语义。

**禁止嵌套卡片。** 如果两层信息分组，用 divider / 留白 / 标题层级，不要叠 surface。

### Inputs

- **Shape：** `rounded-md`（≈18.8px）。
- **Height：** `h-10`（40px）。
- **Padding：** `px-4 py-1`。
- **Border：** 1px `border-input`，hover 不变，focus-visible 时变 `border-ring` + 3px `ring/50` 外晕。
- **Error：** `aria-invalid` 时 border 切到 `destructive`、ring 切到 `destructive/20`。
- **复杂 input（textual types）走 Radix Themes TextField pilot**，由 `RadixThemePilot` wrapper 隔离作用域。

### Badges

- **Shape：** `rounded-full`（pill）。
- **Padding：** `px-3 py-1`（12px × 4px）。
- **Use：** 状态标识、规格标签、tag——**不是 trust badge**（trust 不靠徽章堆，见 §6）。

### Section Container

- **Width：** `--container-max` = 1080px。
- **Side padding：** 24px（mobile） / 控制在 grid 内（desktop）。
- **Vertical rhythm：** `py-14 md:py-[72px]`（56 / 72px）——starter 现存 8+ 个 section view 都用这个节奏。新建 section 沿用，不要随手改成 py-20 / py-28。
- **Section divider：** 1px top border（`--divider` = neutral-5），让长页有清晰的"换章节"信号。

### Signature: surface-card 与 showcase-scenario-surface

- `.surface-card`：项目级 card 工具类，给非 React Card 但需要相同语义的元素用。
- `.showcase-scenario-surface`：暗底场景专用渐变（neutral-12 → neutral-10 + 角落 success 光晕）+ `.showcase-scenario-grid` 22px 网格——starter 唯一允许的"画面感"重投资点，给"使用场景叙事"section 用。

## 6. Do's and Don'ts

### Do

- **Do** 用 role token：`bg-primary` / `text-foreground` / `border-border` / `ring-ring`。**永远不要**写裸 hex 或 Tailwind 调色板 class（`bg-blue-500`）。
- **Do** 把 1px border 当成 elevation。需要"分层感"就加 border 或换 `neutral-2` 底色，不是加阴影。
- **Do** 主色（`brand-9` / `brand-11`）任一屏 ≤10%。CTA、链接、focus ring——其他地方让位给 neutral。
- **Do** Section 节奏沿用 `py-14 md:py-[72px]`。
- **Do** 卡片 padding 用 24px。如果觉得太挤，先想内容是否过密，再想加 padding。
- **Do** 焦点态可见：所有交互元素至少 `ring-2 ring-ring ring-offset-2`。
- **Do** `prefers-reduced-motion` 必须生效——starter 已经在 `globals.css` 里把所有 duration 压到 0.01ms，新增动画走同一套 duration 令牌即可。

### Don't

- **Don't** 做**徽章墙**：金色 / 圆形 / "诚信通"式认证徽章作为信任主证据。可以提认证，但用"具体名称 + 时间 + 适用范围"的文字 + 一个小的 mono 编号，不靠图标墙。（来自 PRODUCT 反例 Alibaba.com，毒点 #2。）
- **Don't** 把 **logo 跑马灯**当 hero 之后唯一的"我们值得信"段落。可以有 logo 区，但必须前后接具体客户案例 / 项目细节 / 工艺照片。
- **Don't** 首页堆**产品瓦片墙**。并列展示 >6 个产品请走分类页或产品列表页，不要砸在 hero 之后。（毒点 #1 + #3。）
- **Don't** 做 **Hero metric 模板**：超大数字 + 小 label + 3–4 条支撑统计 + 渐变 accent。这是 SaaS 陈词滥调。
- **Don't** 写 **`background-clip: text` + 渐变背景**的彩色文字。任何情境都不行。
- **Don't** 把 **`border-left`** 或 **`border-right`** > 1px 当成彩色装饰条。要强调就用完整边框 / 背景色块 / 编号 / 图标，不用侧条。
- **Don't** 把 **glassmorphism / 毛玻璃**当默认装饰。少数 hero overlay 可以，但不能是卡片底色。
- **Don't** 模板感千篇一律的卡片网格：同尺寸 + 同图标位置 + 同标题 + 同三行文字 × N。（毒点 #4。）
- **Don't** **假冒高端**：黑金配色 + stock 商务握手图 + 空洞标语。Starter 的克制蓝灰路线和这种风格不兼容。
- **Don't** 文案里用 **em-dash 或 `--`**。用逗号、冒号、分号、句号、括号。
- **Don't** Modal 当第一直觉。先尝试 inline 展开 / 渐进式 / 抽屉。Sheet 适合移动端导航；Dialog 留给真的"阻塞性决策"。
- **Don't** 把业务文案（公司名、产品规格）写进 `src/components/ui/*` 低层原语。这些内容属于 config 或 MDX。
- **Don't** 滥用 `--ease-spring`（带 1.56 overshoot 的弹簧曲线）。它存在是为了少数刻意的"出现"动画（`animate-scale-in`），不要用在 hover / 状态切换上——shared design law 明确禁止弹跳/橡皮筋。如果一定要用，单点用、不要叠加。

## 7. Current Truth Sources

starter 的"运行时真相"在代码里，不在文档里。修改任何颜色 / 字体 / 圆角前，先读：

- **颜色 / token 运行时**：`src/app/globals.css`（包括 light / dark 两套）
- **颜色合同**：`docs/design/truth.md` 与 `docs/impeccable/system/COLOR-SYSTEM.md`
- **组件治理**：`docs/impeccable/system/COMPONENT-GOVERNANCE.md`
- **网站替换面**：`docs/website/`（业主换皮第一站）
- **产品上下文**：`PRODUCT.md`

如果代码和本文档不一致，**代码是真相，本文档要追上**——再次运行 `/impeccable document` 重新提取即可。
