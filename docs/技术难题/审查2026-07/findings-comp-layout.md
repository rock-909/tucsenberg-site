# 可维护性审查：components/layout + navigation + footer + grid

**统计：高 3 条 / 中 14 条 / 低 18 条（共 35 条）**

范围说明：实际 15 个 .ts/.tsx、约 1413 行（任务描述"36 文件 6900 行"与现状不符）。逐文件读完，每个导出 grep 了全仓调用方。

---

## 高

### 1. `src/components/navigation/navigation-progress-bar.tsx:140-156` — 点击监听不过滤修饰键/非左键，进度条永久挂死
click handler 只排除 `target="_blank"`/锚点/mailto/跨域，没查 `metaKey/ctrlKey/shiftKey/altKey`、`button !== 0`、`defaultPrevented`、`download`。→ Cmd/Ctrl+点击站内链接在新标签打开，当前页 pathname 不变，start() 触发但 finish() 永不触发——进度条 trickle 到 92% 永久悬挂。→ handleClick 开头加修饰键/按钮/defaultPrevented 早返回，isInternalNavigationLink 排除 download 锚点。→ 高 【客观问题】

### 2. `navigation-progress-bar.tsx:128-137` — finish 只监听 pathname，仅 query 变化的导航同样挂死
`isInternalNavigationLink`(45-47) 把"同 pathname 不同 search"判为需显示进度并 start()，但 finish() 只由 usePathname() 触发。→ `mobile-navigation.tsx:73-76` 移动端 CTA 正是 `{pathname:contactHref, query:{source:"mobile_nav_cta"}}`；在 /contact 页点它 pathname 不变、search 变→挂在 92%。`getCurrentRouteKey()` 把 search 纳入路由标识，finish 侧只用 pathname，两套路由身份矛盾。→ 用 useSearchParams（配 Suspense）或统一以 routeKey 驱动 finish。→ 高 【客观问题】

### 3. `src/components/grid/`（grid-system/grid-frame/grid-section/grid-block）— 四文件"通用网格系统"生产零调用方
grep 确认调用方只有自己的四个测试；生产唯一用的是 `HeroGuideOverlay`+`hero-guides.ts`。→ 为一个 hero 装饰网格建了带 columns/rows/guides/span 的通用系统 + 两套外框（GridSystem 与 GridFrame 是同一件事的两套并行实现）+ 配套测试，约 250 行只服务测试自己。→ 移除 grid-system/frame/section/block 及测试，只留 hero-guide-overlay + hero-guides。→ 高 【客观问题】（对应跨模块 C1）

---

## 中

### 4. `layout/header.tsx:33-34,50-52,125` `variant`(minimal/transparent) 与 `sticky` props 无任何调用方（layout.tsx:83 只传 locale/labels/navItems）→ 删 variant/sticky 及分支，固定 sticky+default → 中 【客观问题】

### 5. `header.tsx:53,77-79` `NEXT_PUBLIC_NAV_VARIANT` 残留 feature flag，"legacy" 分支不可达（.env.example 该值空），两分支只差一个 transition 类 → 删 flag，同步清 env.ts:154,230 与 public-runtime-env.ts:37 → 中 【客观问题】

### 6. `header.tsx:54,86-88` `showTestIds: !locale` 输出误导性 testid（`data-testid="mobile-navigation"` 贴在 logo 区且与移动抽屉 id 撞名），生产恒传 locale 永不执行 → 删 showTestIds → 中 【客观问题】

### 7. `header.tsx:172-215` `locale` prop 双重语义："语言"兼"是否渲染右侧控件"（单语站 locale 恒 "en"，实为布尔开关）→ locale 设必填或删，去掉所有 `locale ?` 分支 → 中 【客观问题】

### 8. `header.tsx:137` + `mobile-navigation.tsx:49` + `Footer.tsx:65` `href as "/"` 类断言系统性绕过 typed routes（配置层 href 是宽 string，组件层断言硬塞）→ nav/footer 配置 href 声明为 pathnames 联合类型（配置用 satisfies 校验），组件断言全删 → 中 【客观问题】

### 9. `logo.tsx:19` `locale` prop 声明了但组件不接收（解构里没有），header.tsx:90 还在传 → 安慰剂 prop → 删 LogoProps.locale 与传参 → 中 【客观问题】

### 10. `logo.tsx:14-47` `showText`/`size`/`ariaLabel`/`constrainText` 全无人传，两个 switch 为不存在的调用方服务 → 砍成无 props 固定形态，switch 内联常量 → 中 【客观问题】

### 11. `footer/Footer.tsx:84-102` 双重 `as unknown as` + try/catch + 判等的三层兜底翻译机制（`t as unknown as (key,values)=>string` 抹类型，`translated===key` 猜缺 key）→ 给多租户 starter 写的防御，本站缺 key 该构建期炸 → footer 两个 key 用类型化 useTranslations 直取，或用官方 `t.has(key)` → 中 【客观问题】（对应跨模块 I5）

### 12. `Footer.tsx:113-119` 版权年 = `established + yearsInBusiness`，靠人工每年改配置才不过期 → 把"每年静默过期"设计进系统 → 构建期注入 getFullYear() → 中 【客观问题】（对应跨模块 R11）

### 13. `navigation-progress-bar.tsx:185` `h-0.5`+`overflow-hidden`+`pt-[env(safe-area-inset-top)]` 刘海屏上进度条不可见（inset 44-59px padding 吃掉全部 2px 高度）→ 进度条在移动设备最有价值却自我隐藏 → 用 `top-[env(safe-area-inset-top,0px)]` 定位替代 padding → 中 【客观问题】

### 14. `mobile-navigation-interactive.tsx:112-121,154-164` cloneElement 注入机制无生产调用方，且对 RSC children 本质不可行（穿过客户端边界后 cloneElement 拿到宿主 `<nav>`，注入变非法 DOM 属性）→ 删 children prop 与 withInteractiveNavigationProps，固定自渲染 → 中 【客观问题】

### 15. `header-utility-control.ts:1-2` `HEADER_UTILITY_CONTROL_CLASS` 全仓零引用（语言切换/主题按钮删除后的遗骸）→ 删常量 → 中 【客观问题】

### 16. `mobile-navigation.tsx:60-65` 运行时剥 `navigation.` 前缀 + 断言成 t 的 key 类型 → 断言作废编译期校验 → 配置存命名空间内短 key（类型标联合），或组件用根 useTranslations，删 replace+断言 → 中 【客观问题】（对应跨模块 I3）

### 17. `grid/grid-frame.tsx:18-25,67` 从 CSS 属性对象"猜"十字标角落并无条件覆盖调用方 transform → 样式对象被当语义信号，合法 transform 被静默改写 → 改显式 `corner` 参数（或随高-3 删）→ 中 【客观问题】

---

## 低

### 18. `header.tsx:174-202` 桌面 CTA 与移动 CTA 两段近乎重复 JSX + `contactHref?` 判两次 → 合并 → 低 【风格偏好】
### 19. `header.tsx:119-123` CenterNav props 内联重写 `{key;href;label}` 与 HeaderNavItem 重复 → `mainNavItems: HeaderNavItem[]` → 低 【客观问题】
### 20. `header.tsx:44-56` `getHeaderState` 单调用方把 5 个一行推导包成函数还藏 env 读取 → 内联 → 低 【风格偏好】
### 21. `logo.tsx:23-34,36-47` 对穷尽三值联合写不可达 default（掩盖新增枚举的编译提醒）→ 删 default 或用映射对象 → 低 【风格偏好】
### 22. `logo.tsx:90-91` base class 已有 truncate，constrainText 分支再加一次 → 分支只留 max-w → 低 【客观问题】
### 23. `Footer.tsx:79` + `layout.tsx:100` columns 默认值与唯一调用方传参互为冗余 → 删 prop，Footer 内部 import → 低 【客观问题】
### 24. `Footer.tsx:22,127` `dataTheme` prop 无生产调用方（story/预览用）→ 删 prop，story 用装饰器 → 低 【风格偏好】
### 25. `Footer.tsx:132-139` "TUCS=NBERG" 字标硬编码拆词与 siteName 脱钩 → 有设计 spec，加注释绑定"须与 SINGLE_SITE_CONFIG.name 同步" → 低 【客观问题】
### 26. `footer/Footer.tsx` PascalCase 命名孤例（其余全 kebab-case）→ 重命名 footer.tsx（连带 stories/tests）→ 低 【风格偏好】（对应跨模块 I12）
### 27. `navigation-progress-bar.tsx:78-88,176` clearTimers 的 useCallback + 依赖数组恒定噪音（不依赖任何 props/state）→ 普通函数或内联 → 低 【风格偏好】
### 28. `mobile-navigation-interactive.tsx:40-42` `siteName`/`siteDescription` props 无生产调用方（内部已有 i18n 兜底）→ 删 props → 低 【客观问题】
### 29. `mobile-navigation-interactive.tsx:57` `MobileMenuButton` 导出但仅本文件使用 → 去 export → 低 【风格偏好】
### 30. `mobile-navigation-interactive.tsx:184` `onEscapeKeyDown` 重复接线（Radix Dialog Escape 默认走 onOpenChange）→ 删 → 低 【客观问题】
### 31. `header-client.tsx:24-45` 激活切 Suspense 时 fallback `<details>` 重挂载，面板闪合（慢网络体感"点了没反应又弹出"）→ fallback details 显式受控 open → 低 【客观问题】
### 32. `header-mobile-navigation-fallback.tsx:23` fallback 面板不是 dialog 却声明 `aria-haspopup="dialog"` → 改 menu 或去掉 → 低 【客观问题】
### 33. `header-utility-control.ts` 文件名与内容错位（叫 utility-control 内容是两个 Tailwind 长串），CTA 出现两次靠共享 class 串 → 删死常量后 HEADER_CTA_CLASS 收编进 header 或做 Button variant → 低 【风格偏好】
### 34. `grid/grid-system.tsx:46-48` + `grid-frame.tsx:27-29` `JSON.stringify(pos)` 当 React key 且两文件重复 → 随高-3 处理 → 低 【风格偏好】
### 35. `grid/hero-guides.ts:12-30` `fadeThreshold` 命名失真，渐隐数学无注释；`hero-guide-overlay.tsx:29-35` 手写 filter/join 拼 className 与全仓 cn() 不一致 → 重命名 + 注释；改 cn() → 低 【风格偏好】（对应跨模块 I9）

---

## 总评

真实问题不在"巨型组件"（预警的 5400 行不存在，最大文件 218 行），而在两类系统性倾向：
1. **投机 API 面**：Header 的 variant/sticky、Logo 全部 props、Footer columns/dataTheme、MobileNavigationInteractive children/siteName——几乎每个组件为不存在的第二调用方保留配置面，含一个安慰剂 prop（Logo.locale）和一套对 RSC children 不可行的 cloneElement。
2. **grid 目录坐实"单一用途做成通用系统"**：生产只用 HeroGuideOverlay，却养 GridSystem/GridFrame 两套外框 + GridSection/GridBlock + 测试。
功能缺陷集中在 navigation-progress-bar：修饰键点击与 query-only 导航两条挂死（后者被本仓移动 CTA 直接触发）、刘海屏自我隐藏。
