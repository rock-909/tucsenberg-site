# Page Pattern Reference

> 从首页 v1 实现中提取的页面级设计模式。
> 所有新页面和存量页面重构必须遵循此文件。
> Token 值定义在 `src/app/globals.css`，此文件只记录**用法约定**。

---

## 1. 页面骨架

```
┌─ <html> ──────────────────────────────────────────────┐
│  Header (layout.tsx 提供, 56px nav)                    │
│  ┌─ <main> ──────────────────────────────────────────┐ │
│  │  GridFrame? (装饰层, 可选)                         │ │
│  │  ┌─ Section ─────────────────────────────────────┐│ │
│  │  │  Container (1080px + px-6)                    ││ │
│  │  │  └─ SectionHead + Content                    ││ │
│  │  └──────────────────────────────────────────────┘│ │
│  │  ┌─ Section ─────────────────────────────────────┐│ │
│  │  │  ...                                          ││ │
│  │  └──────────────────────────────────────────────┘│ │
│  │  FinalCTA? (全宽, GridFrame 外)                   │ │
│  └───────────────────────────────────────────────────┘ │
│  Footer (layout.tsx 提供)                               │
└────────────────────────────────────────────────────────┘
```

### 页面包裹

```tsx
// 标准页面入口
<div className="min-h-screen bg-background text-foreground">
  {children}
</div>
```

### GridFrame（可选）

用于需要装饰网格的页面（首页、About）。FinalCTA 等全宽 section 放在 GridFrame **外部**。

```tsx
<GridFrame crosshairs={[{ top: 0, left: 0 }, { bottom: 0, right: 0 }]}>
  {/* 常规 sections */}
</GridFrame>
<FinalCTA /> {/* 全宽 bg-primary, 不被 1080px 框裁切 */}
```

---

## 2. Container 约定

**唯一写法：**

```tsx
<div className="mx-auto max-w-[1080px] px-6">
```

| 属性 | 值 | 说明 |
|------|----|------|
| max-width | `1080px` | 内容区最大宽度 |
| padding-x | `px-6` (24px) | 两侧留白 |
| 居中 | `mx-auto` | |

**禁止使用：**
- ~~`container mx-auto px-4`~~ (Tailwind 默认 container，宽度不可控)
- ~~`max-w-4xl`~~ / ~~`max-w-3xl`~~ (与 1080px 不一致)
- ~~`max-w-screen-xl`~~ (Container 组件默认值 1280px，过宽)

**例外：** 窄内容页（privacy、terms）可用 `max-w-[720px] px-6`，但必须写明 `mx-auto`。

---

## 3. Section 节奏

### 标准间距

```tsx
<section className="py-14 md:py-[72px]">
```

| 断点 | padding-y | 说明 |
|------|-----------|------|
| mobile | `py-14` (56px) | |
| md+ | `py-[72px]` | 首页所有 section 统一值 |

### Hero 间距（特例）

```tsx
<section className="relative px-6 py-10 pb-14 md:py-16 md:pb-[72px]">
```

Hero 的 top padding 比标准小（py-10 = 40px），底部对齐标准。

### Section Divider

紧邻上方 section 有分割线时，给当前 section 加 `section-divider`：

```tsx
<section className="section-divider py-14 md:py-[72px]">
```

`section-divider` = `border-top: 1px solid var(--divider)` (#ebebeb)

**规则：** 首尾 section（Hero、最后一个 section）不加 divider；中间 section 按需加。

---

## 4. 排版阶梯

从首页提取的标题参数。所有页面标题使用相同阶梯。

### H1 — 页面主标题

```
mobile:  36px / extrabold (800) / line-height 1.1 / tracking -0.03em
desktop: 48px / extrabold (800) / line-height 1.0 / tracking -0.05em
```

```tsx
<h1 className="text-[36px] font-extrabold leading-[1.1] tracking-[-0.03em] md:text-[48px] md:leading-[1.0] md:tracking-[-0.05em]">
```

**每个页面只有一个 H1。** 位于 Hero 区域。

### H2 — Section 标题

```
32px / bold (700) / line-height 1.2 / tracking -0.02em
```

```tsx
<h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.02em]">
```

由 `SectionHead` 组件提供。所有 section 标题通过 `<SectionHead>` 渲染。

**SectionHead 用法：**

```tsx
// 纯标题 + 副标题
<SectionHead title={t("chain.title")} subtitle={t("chain.subtitle")} />

// 带右侧 action button
<SectionHead
  title={t("products.title")}
  subtitle={t("products.subtitle")}
  action={<Button variant="secondary" asChild><Link href="/products">{t("products.cta")}</Link></Button>}
/>
```

SectionHead 自带 `mb-9` (36px) 底部间距到内容区。

### H2 — 深色背景变体 (FinalCTA)

```
36px / bold (700) / line-height 1.2 / tracking -0.02em / text-white
```

```tsx
<h2 className="text-[36px] font-bold leading-[1.2] tracking-[-0.02em] text-white">
```

### H3 — 卡片标题

三个层级，按内容重要性选择：

| 层级 | 参数 | 场景 |
|------|------|------|
| 强调 | `text-[18px] font-bold leading-snug` | Scenario 卡片、大卡片 |
| 标准 | `text-lg font-semibold leading-snug` | Product 卡片、中等卡片 |
| 紧凑 | `text-[15px] font-semibold leading-snug` | Step 卡片、小条目 |

### Eyebrow 文字

```tsx
<span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-primary">
```

仅用于 Hero eyebrow 和特殊标注。

### Body 文字

| 用途 | className |
|------|-----------|
| Hero 副标题 | `text-lg text-muted-foreground` |
| Section 副标题 | `text-muted-foreground` (base size, SectionHead 内) |
| 段落正文 | `text-sm leading-relaxed text-muted-foreground` |
| 辅助标注 | `text-[13px] text-muted-foreground` |

### Mono 文字

数据、编号、标准代号使用 mono 字体：

```tsx
<span className="font-mono text-sm text-muted-foreground">Example Standard A</span>
<span className="font-mono text-xl font-medium">100+</span>
```

---

## 5. 卡片系统

### 层级 A — Shadow Card（独立卡片）

用于独立的内容卡片（产品卡、场景卡等）。

```tsx
// 标准交互卡片 (hover 增强阴影)
className="rounded-lg shadow-card transition-shadow hover:shadow-card-hover"

// 强调交互卡片 (hover 带品牌色环)
className="rounded-lg shadow-card transition-shadow hover:shadow-[var(--shadow-card-active)]"
```

Shadow token 值：

| Token | 值 | 用途 |
|-------|-----|------|
| `shadow-border` | `0 0 0 1px rgba(0,0,0,0.08)` | 轻量边框替代 |
| `shadow-card` | 1px ring + 1px + 4px layers | 卡片默认状态 |
| `shadow-card-hover` | 1px ring + 2px + 8px layers | 卡片 hover |
| `--shadow-card-active` | primary ring + 4px glow | 品牌色 hover |

### 层级 B — Border Grid（密集条目）

用于紧密排列的步骤条、资源列表等 — 2px gap + border 背景模拟分割线。

```tsx
<div className="overflow-hidden rounded-lg border bg-border">
  <div className="grid grid-cols-1 gap-[2px] sm:grid-cols-3 lg:grid-cols-5">
    <div className="bg-background p-6">{/* card content */}</div>
    {/* ... */}
  </div>
</div>
```

外层 `bg-border` + 内层 `gap-[2px]` = 每个 cell 之间 2px 的视觉分割线。

### 层级 C — Shadow Border（轻量占位）

用于 Hero 占位块、装饰元素。

```tsx
className="rounded-lg bg-white shadow-border"
```

### 禁止使用

- ~~`border border-border`~~ 做卡片边框 → 用 `shadow-card`
- ~~`hover:border-primary hover:ring-1`~~ → 用 `hover:shadow-card-hover` 或 `hover:shadow-[var(--shadow-card-active)]`

**保留 border 的场景：** 内部分割线（`border-t border-border`）、表单输入框、虚线占位。

---

## 6. CTA 模式

### Inline CTA（页中）

浅色品牌背景横幅，内嵌在 section 流中：

```tsx
<div className="flex flex-col items-start gap-6 rounded-xl border border-[var(--primary-light)] bg-[var(--primary-light)] p-8 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h2 className="text-2xl font-bold leading-tight">{title}</h2>
    <p className="mt-2 max-w-[480px] text-sm leading-relaxed text-muted-foreground">{desc}</p>
  </div>
  <Button asChild className="shrink-0">
    <Link href="/contact">{cta}</Link>
  </Button>
</div>
```

### Final CTA（页尾）

容器内 bordered card，不再使用全宽品牌色带：

```tsx
<section className="section-divider px-6 py-14 md:py-[72px]">
  <div className="mx-auto max-w-[1080px]">
    <div className="rounded-lg border border-border bg-card px-6 py-10 text-center shadow-[var(--shadow-xs)] md:px-10 md:py-12">
      <h2 className="text-[32px] font-bold leading-tight tracking-[-0.03em] md:text-[36px]">{title}</h2>
      <p className="mx-auto mt-4 max-w-[620px] text-muted-foreground">{desc}</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button size="lg">{primary}</Button>
        <Button variant="secondary" size="lg">{secondary}</Button>
      </div>
    </div>
  </div>
</section>
```

---

## 7. Button 变体选择

| 场景 | variant | 说明 |
|------|---------|------|
| 主 CTA | `default` | 蓝底白字 |
| 次 CTA | `secondary` | 白底带 border + shadow |
| 深色背景主 CTA | `on-dark` | 白底蓝字 |
| 深色背景次 CTA | `ghost-dark` | 透明 + 白色边框 |
| 文字链接 | `link` | 无背景带下划线 |
| 轻量操作 | `ghost` | 透明，hover 显示背景 |
| 边框强调 | `outline` | 2px 蓝色边框 |

**尺寸：** 默认 `h-[38px] px-5`，表单/页尾用 `size="lg"` (h-10 px-6)。

---

## 8. Icon 规范

### Section 内 Icon（资源卡、特性卡）

```tsx
<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary-light)] text-primary">
  <svg width="20" height="20" ... />
</div>
```

容器 36×36，icon 20×20，蓝色浅底 + 蓝色描边。

### 承诺/大 Icon（Quality section）

```tsx
<svg width="32" height="32" className="text-primary" strokeWidth="2" ... />
```

无容器背景，32×32 纯色描边。

### 列表圆点

```tsx
<span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
```

---

## 9. 间距约定

### 垂直间距（section 内部）

| 用途 | 值 | Tailwind |
|------|----|----------|
| SectionHead → 内容 | 36px | `mb-9` (SectionHead 内置) |
| 标题 → 副标题 | 8px | `mt-2` |
| 标题 → 正文 | 16px | `mt-4` |
| CTA 按钮组 → 上方内容 | 28px | `mt-7` |
| 卡片内标题 → 列表/正文 | 12px | `mt-3` |
| 子模块间距 | 24px | `mt-6` |
| 大块间距（footer 底栏） | 48px | `mt-12` |
| ProofBar/Stats → 上方 | 28px | `mt-7` |

### Grid gap

| 场景 | gap |
|------|-----|
| 独立卡片网格 | `gap-4` (16px) |
| 紧凑列表 | `gap-3` (12px) |
| Border grid (cell 间) | `gap-[2px]` |
| 统计数据横排 | `gap-6 md:gap-8` |

---

## 10. 响应式断点策略

| 断点 | 典型变化 |
|------|---------|
| 默认 (mobile) | 单列，小间距 |
| `sm` (640px) | 2-3 列网格 |
| `md` (768px) | 双列 Hero，标准间距 |
| `lg` (1024px) | Grid 装饰可见，最终列数 |

**关键响应式模式：**

```tsx
// Hero: 1 列 → 2 列
grid-cols-1 md:grid-cols-2

// 产品卡: 1 列 → 2 列
grid-cols-1 sm:grid-cols-2

// 场景卡: 1 列 → 3 列
grid-cols-1 md:grid-cols-3

// Steps: 1 列 → 3 列 → 5 列
grid-cols-1 sm:grid-cols-3 lg:grid-cols-5

// Resources: 1 列 → 2 列 → 4 列
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

---

## 11. 深色表面

### Footer

Token 系统在 `:root` 中定义，所有值固定（不随主题切换）：

| Token | 值 | 用途 |
|-------|-----|------|
| `--footer-bg` | `#2c353b` | 背景 |
| `--footer-text` | `#c1cad0` | 正文 |
| `--footer-heading` | `#8a969e` | 列标题 |
| `--footer-link` | `#b4bec6` | 链接，hover → white |
| `--footer-divider` | `rgba(255,255,255,0.08)` | 分割线 |

Footer 列标题样式：

```tsx
<h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--footer-heading)]">
```

### FinalCTA

直接用 `bg-primary text-white`，按钮用 `on-dark` / `ghost-dark` 变体。

---

## 12. Grid 装饰系统

桌面端（lg+）可见的装饰元素，用于增强结构感和页面完成度。

| 组件 | 用途 | 可见条件 |
|------|------|---------|
| `GridFrame` | 1080px 外框 + crosshair 锚点 | lg+ |
| `HeroGuideOverlay` | Hero 区 12×8 淡出网格 | lg+ |

**哪些页面使用 GridFrame：**
- 首页 ✅
- About ✅（推荐）
- Products 列表页 — 可选
- Contact / Blog / FAQ — 不使用（内容型页面不需要装饰）

---

## 13. 存量页面差距速查

当前其他页面与本规范的偏差，供逐步对齐参考：

| 页面 | Container | Section 间距 | H1 | 卡片 |
|------|-----------|-------------|----|----- |
| **About** | ~~`container px-4`~~ → `max-w-[1080px] px-6` | ~~`py-12 md:py-16`~~ → `py-14 md:py-[72px]` | ~~`text-heading`~~ → 精确参数 | ~~shadcn Card~~ → shadow-card |
| **Contact** | ~~`max-w-4xl px-4`~~ → `max-w-[1080px] px-6` | ~~`py-16`~~ → `py-14 md:py-[72px]` | ~~gradient text~~ → 纯色 | ~~shadcn Card~~ → shadow-card |
| **Products** | ~~`container px-4`~~ → `max-w-[1080px] px-6` | ~~`py-8 md:py-12`~~ → `py-14 md:py-[72px]` | ~~`text-heading`~~ → 精确参数 | 待检查 |

---

## Checklist — 新页面上线前

- [ ] Container: `mx-auto max-w-[1080px] px-6`
- [ ] Section 间距: `py-14 md:py-[72px]`
- [ ] H1 使用精确排版参数（每页唯一）
- [ ] H2 通过 `SectionHead` 渲染
- [ ] 卡片使用 `shadow-card` 系统（非 border）
- [ ] 所有用户文案通过 i18n translation key
- [ ] Section 分割使用 `section-divider`
- [ ] 深色 CTA 使用 `on-dark` / `ghost-dark` 按钮变体
- [ ] 移动端单列、md+ 多列响应式
- [ ] lg+ Grid 装饰（如适用）
