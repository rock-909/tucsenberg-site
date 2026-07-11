> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# src/components/sections/ 可维护性审查

统计：高 3 条 / 中 6 条 / 低 10 条（共 19 条）。实际审查文件数：25。

审查方式：25 个文件逐一读完，并用 grep 在 `src/`、`tests/` 全量验证每个文件的引用方。

---

## 高

### 1. `src/components/sections/`（整个目录的大部分）→ 死掉的"第二套首页"集群
- **位置**：`chain-section.tsx`/`chain-section-view.tsx`、`final-cta.tsx`/`final-cta-view.tsx`、`products-section.tsx`/`products-section-view.tsx`、`quality-section.tsx`/`quality-section-view.tsx`、`sample-cta.tsx`/`sample-cta-view.tsx`、`scenarios-section.tsx`/`scenarios-section-view.tsx`、`starter-boundary-section.tsx`/`starter-boundary-section-view.tsx`、`resources-section-view.tsx`、`homepage-trust-strip.tsx`、`homepage-section-shell.tsx` —— 共 17 个组件文件。
- **问题**：以上文件在 `src/app` 下**零引用**。逐个 grep 验证：引用方只有彼此、自己的 `.stories.tsx` 和 `__tests__`。真实首页 `src/app/[locale]/page.tsx` 只用了 `HeroSection` 和 `FaqSectionView`，其余区块全部在 page.tsx 里**内联重写了一遍**。`HomeFinalAction`(page.tsx:366) 与 `FinalCTAView` 是同一"最终 CTA"两套实现；`HomeStartPathSection`(page.tsx:284) 与 `StarterBoundarySection` 甚至消费同一批 i18n 键 `startPath.items.*`。`resources-section-view.tsx` 连容器都没有，只有 story 在用。
- **为什么是问题**：两套平行首页实现是最贵的一类债。改首页的人先打开 sections/ 目录，改完发现线上没变；tests/stories 继续绿灯制造"这些组件是活的"错觉。约 1200+ 行组件 + 等量 stories/tests/fixtures 全是维护税。
- **改法**：二选一裁决：(a) 删除死集群及 stories/tests/fixtures；(b) 若刻意保留，把 page.tsx 内联区块换回这套组件让测试守护真实产物。最低限度放 who-is-live 说明。
- **严重程度**：高 【客观问题】（对应跨模块 C1）

### 2. `faq-section.tsx:42-50` → 手写正则重新实现 i18n 插值
`interpolateMessage` 用 `template.replace(/\{(\w+)\}/g, ...)` 手工插值，配合 `loadCompleteMessages`+`readMessagePath`(68-77) 整套绕开 next-intl 的 getTranslations。→ 这是生产活代码（about 页经 about-page-shell.tsx:258 走到 sectionTitle 分支）。手写插值不支持 ICU plural/select/转义——一旦 faq.sectionTitle 用了 `{countries, number}` 就把原文吐给用户无告警。→ 改用 getTranslations + t，删 readMessagePath/interpolateMessage。→ 高 【客观问题】（对应跨模块 R6）

### 3. `faq-section.tsx:18-36,74-93` → 双模式 props 一半是死分支，JSON-LD 算了就扔
`FaqSectionKeyProps | FaqSectionDirectProps` 互斥联合，但生产唯一调用方（about-page-shell）只走 faqItems 直传，items 键模式（74-93 整个 else）只有 stories 用；`renderJsonLd` 默认 true 而唯一生产调用传 false，但 65 行 generateFaqSchemaFromItems 无条件执行算完即弃。→ 约 100 行组件近半路径无生产调用方。→ 砍掉 key 模式，props 收敛为 `{faqItems, locale, title?, subtitle?, renderJsonLd?}`，schema 仅在 renderJsonLd 真时计算。→ 高 【客观问题】

---

## 中

### 4. `final-cta.tsx:20-45` 为构造 2 个对象上四层类型体操（map→satisfies 元组→Object.fromEntries→as Partial<Record>）；trustItems 用 flatMap+switch+assertNever 处理只有单成员的配置数组 → 直接写对象字面量 → 中 【客观问题】
### 5. `hero-section.tsx:13-49`、`quality-section.tsx:20-58`、`final-cta.tsx:13-15` "配置数组+switch+assertNever" 模式三处复制 → 删键名数组层直接写数据数组，assertNever 提取共享 → 中 【客观问题】（对应跨模块 R16）
### 6. `products-section.tsx:19`、`quality-section.tsx:62`、`starter-boundary-section.tsx:12` `t(key as Parameters<typeof t>[0])` 强转绕过翻译键类型检查（已复制三次扩散）→ 收窄 namespace 或单点 helper → 中 【客观问题】（对应跨模块 I3）
### 7. `products-section.tsx:36` 路由 href 存翻译 JSON 里再 `as LinkHref` 断言回来 → 路由改名 TS 失明；href 放类型化 config，翻译只留 label → 中 【客观问题】
### 8. `quality-section-view.tsx:56-66` 图标映射 `COMMITMENT_ICONS` 同时收编生产键(commitment1..5)和 story fixture 键(response/proof/reuse/contact)+兜底 → fixture 词汇反渗生产；键收敛为 union 全覆盖 Record，fixture 改用生产键名 → 中 【客观问题】
### 9. `homepage-section.fixtures.ts`(342 行)、`section-story-fixtures.ts`(170 行) 两份命名不一致的 story fixture 混在生产目录，含中文变体 → 统一命名移入 stories 体系，随问题 1 裁决清理死 fixture → 中 【风格偏好】

---

## 低

### 10. `hero-section-view.tsx:106-138` 四个无功能的 `<div>` 壳（hero 是 LCP 区多余节点无益）→ 删 → 低 【客观问题】
### 11. `faq-section-view.tsx:22-27` 手写与 HomepageSectionShell 完全同构的骨架 → 随问题 1 联动裁决 → 低 【客观问题】
### 12. `homepage-section-links.ts` 整个文件是一行别名 re-export → 调用方直接 import 原名，删文件 → 低 【风格偏好】（对应跨模块 I10）
### 13. `scenarios-section-view.tsx:41` 永不可达的 fallback（SCENARIO_ICON_MAP 已 satisfies 全 union 且含 default 键）→ 删兜底 → 低 【客观问题】
### 14. `final-cta-view.tsx`、`sample-cta-view.tsx` CTA/Cta 大小写同文件打架（FinalCTAView vs FinalCtaContent）→ 统一 → 低 【风格偏好】（对应跨模块 I12）
### 15. `homepage-trust-strip.tsx:4,47,54-58` 可选 key + 索引兜底 + JS 渲染分隔符（进列表项可访问文本）→ key 必填；分隔符改 CSS `li+li::before` → 低 【风格偏好】
### 16. `products-section-view.tsx:52-58` 卡片链接文本 `{title} →` 重复卡片标题 → 换独立 CTA 文案或整卡链接 → 低 【风格偏好】
### 17. `products-section.tsx:14-24` 单站点里为"products 页可能不存在"预留的双重守卫 → 随问题 1 裁决 → 低 【风格偏好】
### 18. `starter-boundary-section.tsx:17,22-29` aria 标签复用标题键、CTA 标签借 finalCta 文案却指向 products（改 finalCta 会悄改本区块按钮语义）→ 随问题 1 裁决；保留则给独立键 → 低 【客观问题】
### 19. `hero-section-view.tsx:9` vs 其他 view 同一概念两种 href 类型来源（hero 现推 ComponentProps<typeof Link>["href"]，其余用 LinkHref）→ hero 统一用 LinkHref → 低 【风格偏好】（对应跨模块 I2）

---

## 附注

- 本范围内没有一个文件使用 `"use client"`，全部 Server Component / 纯展示组件，客户端边界处理无可挑剔（FAQ 用原生 `<details>` 零 JS 手风琴是正确取舍）。
- Container/View 拆分纪律统一，但在问题 1 背景下大部分花在没人渲染的代码上。
