> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# components 业务域批次审查清单（products / content / contact / cookie / security / seo / monitoring / errors / motion / mdx / icons + 根目录）

**统计：高 2 条 / 中 17 条 / 低 22 条（共 41 条；审查范围 43 个文件、约 4150 行）**

---

## 高

### H1. `src/components/content/about-page-shell.tsx:1-285` → 整个组件生产不可达（死代码），并连带拖死 `mdx/mdx-content.tsx`
`AboutPageShell`（285 行）生产零调用方；`about/page.tsx` 实际走 `StaticMdxPage`→`LegalPageShell`/`TradeLandingShell`，唯一引用者是自己的测试。`mdx-content.tsx` 的唯一调用方恰是这个死组件，因此也不可达。→ 批次里最大单体死代码，长得像"正在服务 about 页"，改 about 页可能先改错这里。→ 确认 about 由 StaticMdxPage 渲染后移除该文件及测试，mdx-content 一并处理。→ 高 【客观问题】

### H2. products 目录 6 个组件均无生产调用方（约 470 行死代码群）
`product-specs.tsx`(60)、`product-trade-info.tsx`(107)、`product-certifications.tsx`(43)、`spec-table.tsx`(67)、`sticky-family-nav.tsx`(36)、`market-series-card.tsx`(49)，除自身/stories/tests 外无调用方（生产页面自己另写市场卡片）。→ "组件先造、页面后接、接完不回收"；product-specs 与 product-trade-info 的 `<dl>` 渲染标记还重复。→ 逐个确认后移除，或写入路线图。→ 高 【客观问题】

---

## 中

### M1. `src/components/contact/contact-form-island.tsx:1-236` → 为"懒加载一个表单"造了 236 行状态机
useReducer 5 action、3 态判别联合、IntersectionObserver 门控、双层动态 import 降级。核心需求只是"进视口后动态加载 ContactFormContainer，失败给重试"，两 useState + 一 effect 即可。→ 状态收敛为 `idle|loading|loaded|failed` 单 useState + attempt，reducer/判别联合/双层降级全删。→ 中 【客观问题】

### M2. `contact-form-island.tsx:80-83,160` → `"loading"` action 永远 no-op（死路径）
初始即 loading，retry 也重置 loading，`load()` 开头 dispatch loading 时状态必然已是 loading。→ 删该 action。→ 中 【客观问题】

### M3. `contact-form-island.tsx:206-222` → 内联兜底 UI 与 `ContactFormLoadError` 组件重复
failed 分支手写"错误消息+重试按钮"硬编码复刻 Button/StatusCallout，与 contact-form-load-error.tsx 功能相同。→ 静态 import ContactFormLoadError，删内联。→ 中 【客观问题】

### M4. `trade-landing-shell.tsx:47-62` 与 `legal-page-shell.tsx:103-120` → schemas 组装跨文件复制 + `as unknown as` 双重断言
两 shell 各自复制 extractFaq→push FAQ schema（都 `as unknown as Record`）→push BreadcrumbList。→ 双重断言暴露返回类型对不上，改逻辑必漏一处。→ 抽 `buildShellSchemas(...)` 到 lib 并修返回类型。→ 中 【客观问题】

### M5. `lazy-cookie-consent-island.tsx` + `cookie-consent-island.tsx:30-32` + `lazy-cookie-banner.tsx` → 三层懒加载嵌套、双重 Suspense
banner 被两层 Suspense/lazy 包裹，LazyCookieBanner(22行)唯一调用方是 CookieConsentIsland；后者外层 Suspense 对已自带 Suspense 的 LazyCookieBanner 纯冗余。→ LazyCookieBanner 合并进 CookieConsentIsland。→ 中 【客观问题】

### M6. `cookie-banner.tsx:420` → DOM id 由翻译文案生成
`id = cookie-${label.toLowerCase().replace(/\s+/g,"-")}`，id 来自展示文本。→ id 应稳定；含非 ASCII 或文案撞车时重复/畸形，还叠加 aria-labelledby。→ 传稳定 name 作 id 基底或 useId()。→ 中 【客观问题】

### M7. `cookie-banner.tsx:29-36,87-126,169-193` → 手写 focus trap（约 60 行）
自研 FOCUSABLE_SELECTOR+trapPanelFocus+keydown 实现 Tab 循环/Escape。→ 手写 focus trap 经典边缘漏水（不可见元素/inert/iframe 不处理），项目已有 Radix。→ 改 Radix Dialog 或验证过的 focus-trap；短期抽可测 hook。→ 中 【风格偏好】

### M8. `enterprise-analytics-island.tsx:37-41` → 无 Provider 时 analytics 默认放行
`cookieConsent` 为 null 时 `analyticsAllowed=true`。→ 同意机制缺省为"允许"方向反了，GDPR 下未知应等于拒绝；等着未来重构变成无同意加载 GA 的雷。→ null 分支返回 false。→ 中 【客观问题】

### M9. `motion/page-transition.tsx:20-32` → ref+state+useLayoutEffect 手动维护动画 key，每次导航多一轮同步渲染
useLayoutEffect 里 setState 每次导航强制再渲染一轮。→ 惯用 `key={pathname}` 让 React 重建子树 + ref 处理首屏。→ 声明式重写。→ 中 【客观问题】

### M10. `products/boxwall-cross-section.tsx:255-277` → rAF 循环内每帧 getBoundingClientRect
每帧强制 layout，恰在以"轻呼吸动画"为卖点的组件；文件已建 ResizeObserver 却只在 reduced-motion 分支用。→ ResizeObserver 无条件缓存尺寸，render 只读缓存。→ 中 【客观问题】

### M11. `products/catalog-breadcrumb-jsonld.ts:1-33` → 生产不可达的 JSON-LD 分支
`CatalogBreadcrumb` 两个生产调用方都传 `renderJsonLd={false}`，默认 true 分支和 jsonld 文件从不执行。→ 默认值与调用现实相反最易骗读者。→ 删 renderJsonLd 面和 jsonld 文件，或翻转默认为 false。→ 中 【客观问题】

### M12. `catalog-breadcrumb{,-view,-types,-jsonld}` → 146 行功能拆成 4 个文件
入口(39)/view(65)/types(9)/jsonld(33)；view 与 types 均无第二使用者。→ 单调用方拆分只带跳转成本。→ 合并为一个文件。→ 中 【风格偏好】

### M13. `security/turnstile.tsx:214-266` → `useTurnstile` hook 死代码，且 `isLoading` 语义反转
hook 无生产调用方；初始 isLoading=false，onLoad 时反而设 true，onSuccess 再设回。→ 50 行死代码带语义反转 + 4 个 useCallback，测试守护错误语义。→ 移除 hook 及测试。→ 中 【客观问题】

### M14. `security/turnstile-rescue-line.tsx:12-22` → 业务承诺文案硬编码在组件里
"Same 12-hour quote commitment." 写死 JSX；同目录 turnstile.tsx 走 labels 注入+英文兜底。→ 12 小时报价承诺是业务参数，owner 改时想不到来这找；同域三套文案做法。→ 文案进 messages。→ 中 【客观问题】（对应跨模块 I5）

### M15. `seo/json-ld-script.tsx:31-36,53-57` → 两层 try/catch 静默吞错，连日志都不打
generateJSONLD 与 generatePageStructuredData 失败都 return null 无 logger。→ Organization/WebSite/FAQ schema 整站消失也没人知道。→ catch 里 logger.error 后再 return null。→ 中 【客观问题】

### M16. `motion/breathing-stagger.tsx:1-77` → `BreathingStagger`/`Item` 无生产调用方
grep 仅命中自身与 lib 常量测试。→ 77 行死代码，与 BreathingReveal 共享 variants 构成"死的那份重复"。→ 移除。→ 中 【客观问题】

### M17. `attribution-bootstrap-utils.ts:8-14` + `attribution-bootstrap.tsx:12-17` → `loadModule` 依赖注入配置面无使用者
AttributionModuleLoader 类型/loadModule prop/默认实现三件套为注入 mock 设计，全仓没一处传自定义 loader。→ 为不存在的测试需求预留 DI 面。→ 删 prop 与类型，effect 直接 import utm。→ 中 【客观问题】

---

## 低

### L1. `contact-form-island.tsx:50-61` `defaultLoadContactForm` 命名暗示注入点实际没有 → 更名或随 M1 消失 → 低 【客观问题】
### L2. `contact-form-island.tsx:23-29` `LoadedContactForm`/`LoadedContactFormLoadError` 单字段包装接口 → 直接传组件类型 → 低 【风格偏好】
### L3. `about-page-shell.tsx:163`、`legal-page-shell.tsx:127`、`trade-landing-shell.tsx:66` props `locale: string` 再 `as Locale` 三处 → props 直接 `locale: Locale` → 低 【客观问题】
### L4. `legal-content-renderer.tsx:1-9` 9 行纯转发组件 → 删，调用处直接用 createLegalContent → 低 【风格偏好】
### L5. `legal-page-shell.tsx:29-35` `export interface ShellSchemaInput` 无外部导入者 → 去 export → 低 【客观问题】
### L6. `legal-page-shell.tsx:57-59` 返回类型 `Promise<Record> | Record` 联合（两调用方都 await）→ 声明 async 统一 Promise → 低 【风格偏好】
### L7. `cookie-banner.tsx:139-143` useCallback 外再包 useEffectEvent 双保险冗余 → 留一层 → 低 【客观问题】
### L8. `cookie-banner.tsx:159-165` handleAcceptAll/RejectAll 纯转发 useCallback → 直接 onClick={acceptAll} → 低 【客观问题】
### L9. `cookie-banner.tsx:425-441,203-204` 冗余 a11y（input 已被 label 包裹又加 aria-labelledby 指派生 id；role=dialog+aria-modal=false 更适合 region）→ 删多余 aria，role 改 region → 低 【风格偏好】
### L10. `lazy-cookie-banner.tsx:5-7` CookieBannerProps 重复声明 + className 无人传 → 随 M5 合并删 → 低 【客观问题】
### L11. `enterprise-analytics-island.tsx:48,57,63-74` 冗余分支 + 非空断言 + 多余 Fragment → 收窄 gaMeasurementId，删冗余分支 → 低 【客观问题】
### L12. `breathing-reveal.tsx:41` `getInstantTransition(reducedMotion)` 参数恒为 false（24-28 已早返回）→ 直接内联 transition → 低 【客观问题】
### L13. `turnstile.tsx:269` `export { Turnstile }` re-export 无调用方 + 双名困惑 → 删 → 低 【客观问题】
### L14. `turnstile.tsx:217-218` `_setError`/`_setIsLoading` 下划线前缀却在正常使用 → 去下划线或随 M13 删 → 低 【客观问题】
### L15. `turnstile.tsx:102-103` 参数默认值里读环境变量，每次渲染求值 → 移到函数体顶部 → 低 【风格偏好】
### L16. `turnstile.tsx:164-188,14-16` 纯转发 handler 包装 + 孤例中文注释 → 直接传 props；统一注释语言 → 低 【风格偏好】
### L17. `product-run-calculator.tsx:45-51` `replace` 只替首个占位符 + href 类型断言 → replaceAll；href 用 {pathname,query} → 低 【客观问题】
### L18. `product-story-fixtures.ts:1-147` 仅供 stories 的 fixture 混在生产组件目录 → 移到 __fixtures__ → 低 【风格偏好】
### L19. `theme-provider.tsx:1-32` 包装层默认 "system" 与唯一用法 "light" 相悖，4 props 手工转发会漂移 → 直接用 NextThemesProvider 或固化默认删 props → 低 【客观问题】
### L20. `icons/static-icons.tsx:1-182` 与 lucide-react 双图标体系并存（同名同形复刻）→ 确认收益，没有就统一 lucide → 低 【风格偏好】（关联跨模块 C1：static-icons 消费者全在 sections 死集群内，传递死代码）
### L21. `catalog-breadcrumb.tsx:24-26` `{...(x===undefined?{}:{x})}` 条件展开三连 → view props 声明 `| undefined` 后直接传 → 低 【风格偏好】
### L22. `boxwall-cross-section.tsx:48-68` 逐变量 style-probe 取色（5 次 getComputedStyle + transition hack）→ 一次读 documentElement 的 --var 原始值，或颜色显式传入 → 低 【风格偏好】

---

## 跨目录观察

1. **死代码是本批次主题**：H1+H2+M11+M13+M16+M17 约 900 行生产不可达，反映"组件/配置面先建、页面后接、接完不回收"的流程缺口。建议做"生产调用方审计"并在组件治理检查中加 usage 校验。
2. **文案管理三轨并行**（messages 注入 / 组件内英文默认 / 纯硬编码），security 与 products 尤其明显。
3. **包装层偏多**：LazyCookieBanner、LegalContentRenderer、ThemeProvider、catalog-breadcrumb 四件套、attribution-utils——单调用方包装至少 5 次。
