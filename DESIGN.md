---
name: Tucsenberg Site
description: Tucsenberg 网站设计系统。基于 IBM Carbon + HashiCorp + McMaster-Carr + Vercel/Geist 的混合参考，服务 part-number problem solver 定位。
status: v1（2026-05-14）
brand:
  north-star: "Aftermarket aeration replacement membrane brand — part-number problem solver"
  keywords: ["精确", "克制", "工程化", "兼容导向", "采购友好"]
references:
  primary:
    - "IBM Carbon — IBM Plex 的权威应用，token 化、8px 网格、Display 300 轻字重"
    - "HashiCorp — 企业基建调性、uppercase overlines、micro-shadows"
    - "McMaster-Carr — 信息密度优先、搜索优先、表格优先的工业 IA"
  secondary:
    - "Vercel/Geist — shadow-as-border、三字重纪律、压缩字距"
    - "DigiKey — faceted filter 交叉查询 UX"
    - "Grainger — 采购信号（SLA / lead time / PO terms）"
  anti:
    - "ClickHouse — 霓虹 + weight 900，太喧嚣"
    - "Resend — 黑底 + Domaine 衬线 96px，杂志奢华"
    - "AerationStore — SSI 零售前端味，要刻意区分"
    - "Alibaba / Made-in-China — 廉价密度感"
colors:
  source: "src/app/globals.css"
  brand:
    navy: "#123B5D"        # Engineering Navy — primary
    teal: "#0F7C82"        # Teal — interactive accent (CTA / link / focus)
    teal-tint: "#DCEFF1"   # Light surface for hover bg / selected
    surface-base: "#F7FAFC"# Page bg secondary tint
  status:
    success: "#1F7A47"
    warning: "#B5570B"
    error: "#B0322C"
    info: "#0F7C82"        # reuse teal
typography:
  display:
    fontFamily: "IBM Plex Sans"
    fontWeight: 300        # 决策：hero 走 IBM Carbon 路线，轻字重 + 大字号
    fontSize: "40px mobile, 60px desktop"
    lineHeight: 1.17
    letterSpacing: 0
  heading:
    fontFamily: "IBM Plex Sans"
    fontWeight: 400        # 二级标题 regular，不重 600
    fontSize: "32px"
    lineHeight: 1.25
    letterSpacing: -0.32
  body:
    fontFamily: "Inter, IBM Plex Sans"  # body 用 Inter（多语种字符宽度更稳）
    fontWeight: 400
    fontSize: "16px"
    lineHeight: 1.5
  mono:
    fontFamily: "IBM Plex Mono"
    use: "part number / SKU / OEM model code / overline"
rounded:
  sharp: "0px"     # 表格 / 极工程化场景
  xs: "4px"        # 徽章 / 小标签
  sm: "6px"        # 按钮 / 输入框（决策：6px）
  md: "8px"        # 卡片
  lg: "12px"       # 大型 panel（仅 procurement / quote 侧栏）
  pill: "9999px"   # ❌ 禁用，pill 读起来太 SaaS
spacing:
  unit: "8px"
  container-max: "1200px"
  container-padding: "24px mobile, 32px desktop"
  section-y-mobile: "64px"
  section-y-desktop: "96px"
---

# Design System: Tucsenberg Site

## 1. 北极星 + 调性

**"part-number problem solver, not a brand site."**

O&M contractor 和工业废水维护团队搜 `sanitaire membrane replacement` 落到这里，5 秒内确认兼容，3 分钟内拿到询价。**视觉只服务这条路径，不抢戏。**

**5 关键词约束所有判断**：
- **精确** — 数字、规格、part number 用 mono；表格优先于段落
- **克制** — 单 accent 色，无装饰图，hero 不堆 CTA
- **工程化** — Display 轻字重 + 紧字距，shadow-as-border，0 圆角表格
- **兼容导向** — 任何页面 3 屏内必须出现兼容查询入口
- **采购友好** — SLA / lead time / PO terms 出现在转化决策点附近

## 2. Reference DNA — 借了什么，明确不借什么

### 主参考（DNA 级别）

**IBM Carbon** —— 字体就是 IBM Plex，他们的应用是权威。借：8px spacing 网格严格执行、Display 字重 300 + 大字号、微字距 0.16/0.32px、单一 accent token 哲学、flat cards 不靠 drop shadow。

**HashiCorp** —— 企业基建调性最近。借：大写 13px / 1.3px 字距的 overline（用于 "OEM SPECS" / "MATERIAL DECISION" / "COMPATIBILITY" 段标）、dual-layer 0.05 opacity 微阴影、严格 token 命名（`--mds-*` 给我们启发 `--brand-*` / `--ink-*` / `--status-*`）。

**McMaster-Carr** —— 工业目录站 IA 标杆。借：信息密度优先、表格优先、搜索优先全局导航。**不借**视觉（他们 90 年代风格）。

### 辅参考（具体模式）

| 模式 | 来源 | 落点 |
|---|---|---|
| `box-shadow: 0 0 0 1px var(--ink-200)` 替代 border | Vercel/Geist | 兼容选择器格子、产品卡片 |
| 三字重纪律（300 display / 400 body / 600 emphasis） | Vercel + Linear | 整个字重体系 |
| 压缩字距 -0.32 ~ -0.8px on display | Vercel | section heading 紧凑感 |
| Faceted filter 多维筛选 | DigiKey | `/compatible/[brand]` 选择器 |
| 采购信号面板（SLA / lead time / PO） | Grainger | `/procurement`、`/quote` 侧栏 |
| `font-feature-settings: "tnum"` | Stripe | 所有 spec / 价格 / 尺寸表格 |
| 大写 12-13px 标签 + 字距 0.6-1.4px | HashiCorp + Mintlify | overline / 小段标 |

### 反面参考（明确不做）

- ❌ **Pill 按钮 9999px**（Resend / Mintlify）—— 读起来像 SaaS 消费品
- ❌ **大气渐变 hero**（Mintlify）—— fresh 创业感
- ❌ **Weight 700+ display**（ClickHouse）—— 喊话感
- ❌ **Whisper weight 300 hero + 紫罗兰**（Stripe luxury 路线）—— 我们不卖溢价
- ❌ **多色 workflow accent**（红粉蓝）—— 一套 token 走完
- ❌ **Domaine / 衬线 display**（Resend）—— 杂志编辑感
- ❌ **圆角 >12px** —— 消费品感，上限 8px
- ❌ **暗色模式优先** —— O&M 维护团队在亮屏 + 打印环境
- ❌ **霓虹 / 荧光 accent** —— 信任靠克制
- ❌ **大块 hero 图 + 居中堆 CTA** —— 搜索框 + 兼容矩阵优先

## 3. 颜色

### Token 架构

```css
/* Brand */
--brand-navy: #123B5D;        /* Engineering Navy — 主色 */
--brand-navy-700: #1B4D77;    /* Hover 时略浅 */
--brand-navy-900: #0B2A45;    /* Active / pressed */
--brand-teal: #0F7C82;        /* 唯一交互 accent — CTA / link / focus */
--brand-teal-hover: #0D6A6F;
--brand-teal-tint: #DCEFF1;   /* Hover bg / selected / badge surface */

/* Surface */
--surface-base: #F7FAFC;      /* 页面交替 section 背景 */
--surface-white: #FFFFFF;     /* 卡片 / 主体 */
--surface-overlay: rgba(15, 31, 46, 0.5);

/* Ink (text + border 共用，按透明度分层) */
--ink-900: #0F1F2E;           /* 标题 */
--ink-700: #2E4256;           /* 正文 */
--ink-500: #5C6F80;           /* 二级文字 */
--ink-400: #8A9BAB;           /* 占位 / disabled */
--ink-300: #C5CFDB;           /* 浅分隔 */
--ink-200: #E2E8F0;           /* 默认 border / 表格行线 */
--ink-100: #F1F4F8;           /* 表格 striping */

/* Status (含背景 tint，徽章 / 提示条用) */
--success: #1F7A47;
--success-tint: #E3F1E9;
--warning: #B5570B;
--warning-tint: #FCEFE0;
--error: #B0322C;
--error-tint: #FBE9E7;
--info: #0F7C82;              /* 复用 teal */
--info-tint: #DCEFF1;
```

### Role 映射

| Role | Token | 用途 |
|---|---|---|
| `--primary` | `--brand-navy` | 主按钮背景、徽章主色 |
| `--accent` | `--brand-teal` | Link / 焦点环 / 次要 CTA 文字 |
| `--accent-surface` | `--brand-teal-tint` | 当前选中 / 悬停背景 |
| `--background` | `--surface-base` | Body 背景 |
| `--foreground` | `--ink-900` | 默认文本 |

### 使用规则

- **单色策略**：Engineering Navy 是品牌色（标题 / 主 CTA），Teal 是交互色（链接 / 焦点 / 次要 CTA）。**不混用**：标题不变 Teal，链接不变 Navy。
- **绝不**用 Navy 做大面积背景。Navy 用于文字 / 主按钮 / icon，背景永远是白 / `--surface-base`。
- **绝不**给"premium"或"better than EPDM"配特殊颜色或徽章。TPU 不用比 EPDM 显眼。
- 状态色仅出现在状态徽章 / 提示条。绝不用红色当装饰。

## 4. 排版

### 字体栈

```css
--font-display: "IBM Plex Sans", -apple-system, BlinkMacSystemFont,
                "Segoe UI", "Helvetica Neue", Arial, sans-serif;
--font-body: "Inter", "IBM Plex Sans", -apple-system, BlinkMacSystemFont,
             "Helvetica Neue", Arial, sans-serif;
--font-mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;
```

**分工**（强制）：
- **IBM Plex Sans** — Display / Section heading / UI label / Button / Nav。品牌权威由 Plex 承担。
- **Inter** — Body 段落 / 长内容（guides / articles）。Inter 的西语 / 中文字符宽度比 Plex 稳。
- **IBM Plex Mono** — Part number / SKU / OEM model code / Overline / 表格数字。

### 字号字重尺度

| Role | Font | Size (desktop) | Weight | Line-height | Letter-spacing | 用途 |
|---|---|---|---|---|---|---|
| Display 01 | Plex Sans | 60px | **300** | 1.17 | 0 | Hero 主标题（首页 H1） |
| Display 02 | Plex Sans | 48px | 300 | 1.17 | 0 | 二级 hero（产品页 / 兼容页 H1） |
| Heading 01 | Plex Sans | 40px | 300 | 1.20 | -0.32px | 大段 section 起点 |
| Heading 02 | Plex Sans | 32px | 400 | 1.25 | -0.32px | section 标题 |
| Heading 03 | Plex Sans | 24px | 400 | 1.33 | -0.24px | sub-section / 卡片标题 |
| Heading 04 | Plex Sans | 20px | 600 | 1.40 | -0.20px | 卡片 emphasized 标题 |
| Body Large | Inter | 18px | 400 | 1.56 | 0 | hero sub-claim / 段落引言 |
| Body | Inter | 16px | 400 | 1.50 | 0 | 默认阅读 |
| Body Emphasis | Inter | 16px | 600 | 1.50 | 0 | 内联强调 |
| Small | Inter | 14px | 400 | 1.50 | 0.16px | 次要正文 / metadata |
| Caption | Inter | 12px | 400 | 1.40 | 0.32px | 注解 / 时间戳 |
| Button | Plex Sans | 15px | 500 | 1.0 | 0 | 按钮 / 标签 |
| Nav | Plex Sans | 14px | 500 | 1.50 | 0 | 导航链接 |
| **Overline** | **Plex Mono** | **12px** | **600** | **1.40** | **1.4px** | **大写小段标（OEM SPECS / MATERIAL / COMPATIBILITY）** |
| Part Number | Plex Mono | 14px | 500 | 1.50 | 0 | SKU / part code（**不要大写**，保留原字符） |
| Mono Body | Plex Mono | 14px | 400 | 1.50 | 0 | inline code / 技术值 |

**移动端**：Display 01 → 40px，Display 02 → 32px，Heading 02 → 24px，其他不变。

### 排版纪律（强制）

- **三字重**：300（display）、400（body / heading regular）、600（emphasis / overline）。**禁止 700+**。
- **Display 300 weight 是核心识别**。在 Hero 区域 60px / weight 300 + Engineering Navy 的组合就是品牌签名。
- **微字距**：14px 以下文字加 `letter-spacing: 0.16px`，12px 加 `0.32px`（IBM Carbon 规则）。
- **Tabular numbers**：所有 spec / 价格 / 尺寸表格加 `font-feature-settings: "tnum"`。
- **Overline 必须大写 + Mono + 1.4px 字距**。这是 section 段标的唯一形式。
- **Part number 不大写**（OEM 真实型号字符串，破坏即错误）。
- 段落最大宽度 **72ch**（约 720px）。读 guides / articles 别拉满。

## 5. 间距 + 布局

### 8px 网格（严格）

允许值：**4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80 / 96 / 128**。

禁止：5px / 10px / 15px / 30px 这种任意值。如果非用不可，必须在 PR 描述里说明理由。

### 容器

```css
--container-max: 1200px;
--container-padding: 24px;       /* mobile */
--container-padding-desktop: 32px;
```

### Section 节奏

- 移动 section 上下 padding：64px
- 桌面 section 上下 padding：96px
- Section 之间不用 divider —— 背景在 `--surface-white` 和 `--surface-base` 之间交替即可。

### 断点

```
mobile-sm:   < 480px      单列，padding 16px
mobile:      480 – 768px  单列，padding 24px
tablet:      768 – 1024px 两列 grid 开始
desktop:     1024 – 1280px 完整布局，container 1080px
desktop-lg:  > 1280px     container 1200px
```

## 6. 组件规范

### 按钮（radius 6px —— 用户决策）

**Primary**（主 CTA）
```
background: var(--brand-navy);
color: #FFFFFF;
padding: 10px 20px;
border-radius: 6px;
font: 500 15px "IBM Plex Sans";
border: 1px solid var(--brand-navy);

hover: background var(--brand-navy-700);
active: background var(--brand-navy-900);
focus: outline 2px solid var(--brand-teal); outline-offset: 2px;
```

**Secondary**（次要 CTA / 二选一场景的弱选项）
```
background: var(--surface-white);
color: var(--brand-navy);
padding: 10px 20px;
border-radius: 6px;
font: 500 15px "IBM Plex Sans";
border: 1px solid var(--ink-200);

hover: border-color var(--ink-300); background var(--surface-base);
```

**Ghost**（卡片内 / 工具栏）
```
background: transparent;
color: var(--brand-navy);
padding: 8px 12px;
border-radius: 6px;
font: 500 14px "IBM Plex Sans";
```

**禁止**：
- Pill 按钮（9999px radius）
- 大于 18px 字号的按钮文字
- 渐变背景
- 阴影 + 大边框的拟物按钮

### 卡片

```
background: var(--surface-white);
border-radius: 8px;
box-shadow: 0 0 0 1px var(--ink-200);    /* shadow-as-border */
padding: 24px;

elevated 状态（hover）:
  box-shadow:
    0 0 0 1px var(--ink-300),
    0 2px 4px rgba(15, 31, 46, 0.04),
    0 8px 16px -8px rgba(15, 31, 46, 0.06);
```

不要给静态卡片 drop shadow。**深度靠 border + hover lift 提示**。

### 输入框

```
background: var(--surface-white);
border: 1px solid var(--ink-300);
border-radius: 6px;
padding: 10px 12px;
font: 400 15px "Inter";
color: var(--ink-900);

placeholder: color var(--ink-400);
focus: border-color var(--brand-teal); box-shadow: 0 0 0 3px rgba(15, 124, 130, 0.15);
error: border-color var(--error);
```

**不用 Carbon 底边线输入框**（太 enterprise SaaS，会显得弱）。保留 boxed 输入，工业目录站习惯。

### 徽章 / 状态指示

```
font: 500 12px "IBM Plex Sans";
padding: 2px 8px;
border-radius: 4px;
letter-spacing: 0.16px;

兼容状态:
  direct-fit:    bg var(--success-tint), text var(--success), border 1px var(--success) at 30% alpha
  requires-check: bg var(--warning-tint), text var(--warning)
  discontinued:  bg var(--ink-100), text var(--ink-500)
```

### 表格（spec / 兼容性数据）

```
header:
  font: 600 13px "IBM Plex Sans";
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--ink-500);
  border-bottom: 1px solid var(--ink-200);
  padding: 12px 16px;

cell:
  font: 400 15px "Inter";
  color: var(--ink-700);
  padding: 12px 16px;
  border-bottom: 1px solid var(--ink-200);
  font-feature-settings: "tnum";   /* 数字列必须 */

striping: alternating var(--surface-white) and var(--ink-100);

part-number cell:
  font-family: "IBM Plex Mono";
  font-size: 14px;
  color: var(--ink-900);
```

### Overline（section 段标 —— HashiCorp 模式）

```html
<div class="overline">OEM SPECS</div>
<h2 class="heading-02">Sanitaire 9-inch disc compatibility</h2>
```

```css
.overline {
  font-family: "IBM Plex Mono";
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.4px;
  color: var(--ink-500);
  margin-bottom: 12px;
}
```

这是**唯一允许的"提示标"**形式。不用 emoji，不用左侧短色条，不用 "✨ Premium" 这种装饰前缀。

## 7. 页面模板规则

### 首屏（hero）模式 —— 决策：折中（保留 H1 + 兼容搜索条）

**结构（从上到下）**：
1. **H1 一行短主张**（≤14 字英文，~28 字符西语）— Display 01 60px / weight 300
2. **Sub-claim 一行**（Body Large 18px / 400）— 限定场景或客户类型
3. **Compatibility search bar**（占 60% 宽度）— 直接搜 part number / OEM model
4. **OEM family grid**（6-8 个品牌徽标 + 链接到 `/compatible/[brand]`）
5. **Trust ribbon**（lead time / SLA / no-fit guarantee 三个 stat，薄薄一行）

**禁止**：
- Hero 图 / 渲染图占据右半
- "Get a Quote" 大按钮挤掉搜索条
- 居中堆叠两个 CTA 按钮
- 任何装饰性插画 / 矢量图形

### 兼容页 `/compatible/[brand]`

- 左侧 facet 筛选（diameter / material / OEM model）
- 右侧结果卡 grid，每张卡显示 OEM model + 兼容 Tucsenberg part + fit status badge
- 顶部 trademark disclaimer（强制，CLAUDE.md 规则）

### 产品页 `/membranes/[product]`

- Hero：part image + 关键 spec stat 横条（diameter / material / orifice pattern / temp range）
- 兼容性表（横向滚动表，OEM models 在左列）
- Material decision callout（如适用）
- Quote CTA + lead time + SLA 一个 panel

### 报价页 `/quote`

- 双列：左 form / 右 sticky summary（你要的产品 + 数量 + 预估 lead time）
- 表单字段最小化：part number(s) + 数量 + 公司 + 邮箱 + 国家。其他都 optional。
- 文件上传：part list CSV / 拆下来的旧膜照片

### 跨页交互模式 —— B 原型探索反哺（仅吸收交互，不吸收视觉）

> 背景：B 版（Claude Design 探索）产出过一套 SaaS Dashboard 视觉皮 + 一组交互骨架。
> 视觉皮（暗色优先 / Inter 做 display / 满屏 pill / 密度切换）**全部拒绝**，与第 2 节反面参考一致。
> 下列三个**交互模式**命中买家路径，吸收进来，但一律用本文件第 3-6 节的 A 视觉 token / 字体 / 圆角实现，不引入任何 B 皮肤。

**1. 全局兼容性搜索（primary 入口）**

- 主放置点：**首页第一屏 compatibility search bar**（已在上面 hero 模式锁定，这里强化）。
- 全站增强：任意页面顶部可用键盘（`⌘K` / `Ctrl K`）或顶栏入口随时唤起同一个兼容搜索。买家在任何深层页想到一个 part number 都能立刻查，不用回首页。
- 视觉：唤起后是一个居中的 boxed 搜索面板（输入框规范见第 6 节，圆角 6px，focus teal ring），**不是** B 那种暗色 ⌘K palette。结果行用 part-number mono + fit-status 徽章（第 6 节徽章规范）。
- 约束：这是 Phase 1 的兼容查询入口本体，不是"以后再加"的站内全文搜索；只搜 part number / OEM model，不搜文章。

**2. 上下文条（context ribbon）**

- 用途：在 `/compatible/[brand]` 和 `/membranes/[product]` 这类深层页，顶部薄薄一行显示买家当前所处坐标（当前 OEM 系列 / 当前材质 / 当前直径），降低长决策路径里的迷路感。
- 落点：复用 hero 模式里已定义的 **Trust ribbon 槽位**形态（薄、单行、克制），不新增视觉语言。文字用 Small / overline 规范，数值用 mono。
- 禁止：做成 B 那种带背景色块的"context bar"或面包屑塞满状态 pill。

**3. OEM 系列切换 tab**

- 用途：`/compatible/[brand]` 顶部，在同品牌多个 OEM 系列之间切换（如 Sanitaire 9" disc / Sanitaire tube）。
- 视觉：下划线式 tab（active 用 teal 下划线 + Navy 文字），不是 B 的 pill tab，不是色块 tab。与左侧 facet 筛选并存：tab 切大类，facet 筛细维度。

## 8. 动效

**克制原则**：所有交互动画 < 200ms，缓动 `cubic-bezier(0.4, 0, 0.2, 1)`。

允许：
- Hover：opacity / background-color / box-shadow 过渡
- Focus ring 出现
- 折叠面板 height 过渡
- 下拉菜单 fade + 4-8px translateY

禁止：
- 进入页面的 stagger 动画
- Hero 文字逐字浮现
- 视差滚动
- 鼠标跟随渐变
- Skeleton 之外的 loading 动画（Lottie / SVG morph）

`prefers-reduced-motion`：所有过渡 instant。

## 9. Anti-AI-slop 守则（强制）

**禁止文案**：
- "high quality" / "efficient" / "durable" / "premium" / "world-class" / "industry-leading"
- "TPU is better than EPDM"（TPU 按工况必要性卖，不按溢价）
- "革命性" / "颠覆性" / "全新一代"（中文同理）

**禁止视觉**：
- AI 生成的 hero 图（油润渲染感）
- Emoji 当 icon 使（除非是状态指示）
- "✨" / "🚀" 在标题里
- 渐变文字
- 玻璃拟态（glass morphism）
- 大量 noise / grain texture
- 默认 Lucide / Heroicons 之外的 icon 包 mix

**必须文案**：
- OEM 品牌名首次出现后跟 trademark disclaimer
- 所有页面 i18n key 走 translation files，不硬编码
- TPU / EPDM 描述按工况，不按"档次"

## 10. Do / Don't

### Do
- 用 token，不硬编码 hex
- Display 60px / weight 300 / Engineering Navy 出现在每个一级页面 H1
- 表格、part number、spec 用 IBM Plex Mono
- Overline 大写 + 1.4px 字距 + Plex Mono
- `tnum` 给所有数字表格
- 任何"premium / better than"的暗示先停下来想三秒
- 看起来太花了 → 删一层颜色 / 删一个 shadow / 删一个 emoji

### Don't
- 用 Figtree / Inter 替代 IBM Plex Sans 做 display
- Hero 字重 > 400
- 圆角 > 12px
- 用 pill 按钮
- 用 hero 图替代 compatibility search bar
- 拿 Vercel / Stripe / Resend 的 hero 直接照抄
- 加任何"以后再加"的功能（cross-reference basket / PDF / 站内搜索）

## 11. Truth Sources

- 颜色 token 源：`src/app/globals.css`
- 字体源：`src/app/layout.tsx`（next/font）+ `tailwind.config.ts`
- 组件库：`src/components/ui/`（先复用，再创建）
- 品牌占位检查：`pnpm brand:check`
- 内容检查：`pnpm content:check`
- 替换清单：`docs/website/新项目替换清单.md`

## 12. 版本

- v1（2026-05-14）— 从 starter provisional DESIGN.md 整篇替换，基于 qiaomu reference fit check + 工业目录站补参考 + 用户三处决策（hero 300 / 折中首屏 / 按钮 6px）
- v1.1（2026-05-15）— A/B 反哺：第 7 节新增"跨页交互模式"小节。吸收 B 原型探索的三个交互骨架（全局兼容搜索 ⌘K 唤起 / 上下文条 / OEM 系列 tab），明确拒绝 B 的全部视觉皮（暗色优先 / Inter display / pill / 密度切换）。视觉锁定不变，仍是第 2-6 节的 A 体系。用户决策：兼容搜索 = 首页第一屏主入口 + 全站可唤起。
