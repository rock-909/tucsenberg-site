> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# src/components/ui/ 审查清单

**统计：高 3 条 / 中 12 条 / 低 12 条（共 27 条）**

审查范围：src/components/ui/ 下全部非测试、非 stories 的 .ts/.tsx，共 30 个文件、2174 行。所有"零调用方"结论均经 grep 全 src/+tests/ 验证（stories 不计为真实调用方）。

---

## 高

### 1. dialog/dropdown-menu/popover/radio-group/select/social-icons/tabs/tooltip/checkbox（整文件）→ 9 个组件零业务调用方，约 960 行死代码
以上 9 文件在 src/ 与 tests/ 中除各自 .stories 外无任何 import（checkbox 仅被治理脚本单测以字符串路径引用）。占 ui 目录 2174 行约 44%。→ 组件库近一半是"只活在 Storybook 里"的僵尸组件，每次全局重构都付维护成本（select 184 行、social-icons 256 行尤重）。→ 逐个确认后移入 Trash，或在近期需求清单点名保留并记录理由。→ 高 【客观问题】

### 2. badge.tsx:34 / input.tsx:66 / textarea.tsx:18 / data-card.tsx:12 / status-callout.tsx:44 → 每个实例各自 mount 完整 `<RadixThemePilot>`（Radix `<Theme>` provider）
每渲染一个实例包一层 `<Theme accentColor="blue">`，一页十几个 Badge 就是十几个重复 Theme provider + 包裹节点。→ 注入 context、渲染带大量 class 容器，主题参数散在 5 文件各写一遍。→ pilot Theme 提升为区域级 provider，组件内部只渲染 Radix 本体。→ 高 【客观问题】

### 3. input.tsx + textarea.tsx vs contact-form-control.tsx → 两套平行 Radix TextField/TextArea 包装
ContactFormTextInput/Textarea 与 Input/Textarea 做同一件事但参数不一致：radius 一边 large 一边 medium、一边有 pilot 包裹一边没有、type 联合一边含 "hidden" 一边不含。→ 重复造轮子 + 参数漂移，改样式必漏一套。→ 合并为一套，删 contact-form-control.tsx。→ 高 【客观问题】

---

## 中

### 4. social-icons.tsx:176-256 SocialIconLink V1/V2 双接口 union + 运行时探测（`"icon" in props`）+ 静默 null，而组件根本无调用方 → 随 1 删 → 中 【客观问题】
### 5. input.tsx:57-99 双渲染路径两套视觉两套 a11y（textual 走 Radix、其余走原生，aria-invalid 错误样式只在原生分支）→ 类型收窄只支持 textual，Radix 分支补 aria-invalid → 中 【客观问题】
### 6. badge.tsx:8-20 给 `<span>` 徽章声明 autoComplete/disabled/form/name/value 等表单控件 props → 无效 HTML 属性落 DOM，API 面撒谎 → props 收窄为 HTMLAttributes<HTMLSpanElement>+variant → 中 【客观问题】
### 7. badge.tsx:22-29 + badge-variants.ts 变体真相双份维护（cva class + RADIX_BADGE_VARIANT 映射，Radix variant 颜色随即被 cva 覆盖）→ 二选一 → 中 【客观问题】
### 8. theme-switcher.tsx:58-113 骨架分支与真实分支约 40 行 JSX 近乎完整复制 → 单一渲染路径 `disabled={!isHydrated}` → 中 【客观问题】
### 9. theme-switcher.tsx:46-48 用 `rest as Record<string,unknown>` 双重断言抠 data-testid → props 类型显式加 `"data-testid"?: string` → 中 【客观问题】
### 10. lazy-theme-switcher.tsx（整文件）为一个 ~3KB 小组件叠 lazy+requestIdleCallback+自定义 fallback 延迟三层（fallbackDelay 与 timeout 传同一常量）→ 省的首屏字节可忽略，代价是页头控件延迟约 600ms 闪现 → 直接渲染 ThemeSwitcher，删 lazy 包装 → 中 【风格偏好】
### 11. badge/textarea/separator 用 forwardRef，而 input/data-card/dropdown-menu 用 React 19 ref-as-prop → 两代 ref 风格混用 → 统一迁 ref-as-prop → 中 【客观问题】（对应跨模块 I8）
### 12. dropdown-menu.tsx:40-56 / tooltip.tsx:34-38 手写 `ref?: Ref<ElementRef<…>>` 接口三连（ElementRef 已弃用），而 select/popover 一行 ComponentProps → 全改 ComponentProps → 中 【客观问题】
### 13. section-head.tsx:11-16 JSDoc 描述不存在的 `layout="stack"` prop；两分支重复 title/subtitle JSX → 删过时注释，合并单一结构 → 中 【客观问题】
### 14. status-callout.tsx:45-59 用 Radix Callout.Root 却丢弃其全部 API（颜色/边框/内边距全被覆盖，标题用裸 `<p>`）→ 改纯 div + tone class，删 Radix Callout 与 pilot 包裹 → 中 【客观问题】
### 15. dialog.tsx:63,74-76 与 sheet.tsx:58,78-80 aria-describedby 解构再条件回插的 hack 复制两份 → dialog 随 1 删后仅剩 sheet 一处加注释 → 中 【客观问题】（对应跨模块 I4）

---

## 低

### 16. input.tsx:6-33 TextualInputType 联合与 TEXTUAL_INPUT_TYPES Set 把 12 个字面量抄两遍 → `as const` 数组 + 派生类型 → 低 【客观问题】
### 17. data-card.tsx:6-8 五个语义不同子组件共用 DataCardProps（Omit "color" 是为 RadixCard 才需要）→ 子组件用 ComponentProps<"div"> → 低 【客观问题】
### 18. data-card/input/status-callout/dropdown-menu/tooltip 给具名函数组件手动赋 displayName（11 处，DropdownMenuContent 还抄 primitive displayName 让 DevTools 显示错误名）→ 全删 → 低 【客观问题】
### 19. sheet.tsx:84-87 关闭按钮 sr-only 硬编码 "Close" 且没有 dialog 已有的 closeLabel prop（sheet 是移动导航在用的那个）→ 加 closeLabel="Close" 对齐 → 低 【客观问题】
### 20. dialog.tsx:89-107 / sheet.tsx:93-111 Header/Footer 自带 p-4 嵌在已有 p-6 的 Content 里叠出 40px 不对称内缩 → 去掉 p-4 → 低 【客观问题】
### 21. dialog.tsx:8-9 DIALOG_Z_INDEX="z-[110]" 常量插模板串，z 层级散落（cookie banner z-[100] 硬编码、其余 z-50）→ globals.css 定义 --z-overlay token → 低 【客观问题】
### 22. radix-theme.tsx:43 RadixThemePilotAppearance 导出无使用方 → 删导出与 ThemeProps → 低 【客观问题】
### 23. contact-form-control.tsx:5-18 文本输入类型联合含 "hidden"（hidden input 会被渲染成带样式的 Radix TextField）→ 从联合去掉 hidden，合并进第 3 条 → 低 【客观问题】
### 24. breadcrumb.tsx:81-97 BreadcrumbEllipsis 无调用方（shadcn 模板残留）→ 删 → 低 【客观问题】
### 25. theme-switcher.tsx:33-35,50-55,100 三处小冗余（交叉类型重复 className、无收益 useCallback、多余 key 断言）→ 删 → 低 【客观问题】
### 26. theme-switcher-highlight.tsx（整文件）7 行装饰 div 独立成文件 + 独立 story，标 "use client" 无客户端行为，cubic-bezier 就是 Tailwind ease-in-out → 内联回 theme-switcher，删文件 → 低 【风格偏好】
### 27. separator.tsx（整文件）纯静态 div 标 "use client"，无 role="none"/aria-hidden（Radix Separator 是现成方案）→ 删 use client，加 role="none" 或用 @radix-ui/react-separator → 低 【客观问题】

---

## 总体判断

核心问题不是单点写法，而是**库的规模与站点真实用量严重脱节**：30 个组件里 9 个零调用、若干组件只有 1 个调用方，同时存在两套表单控件体系和逐实例的 Theme 包裹。先做减法（1、3、4），再统一 ref/类型风格（11、12），剩下的都是顺手清理。
