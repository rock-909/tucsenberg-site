# lib-content 批次审查清单（src/lib content/blog/marketing/image/motion/cookie-consent/actions + lib 根目录）

**审了 45 个文件**（含 2 个生成文件仅核对结构），"零调用"结论均经 grep 全仓验证（排除 __tests__）。
**统计：高 6 条 / 中 18 条 / 低 12 条（共 36 条）**

---

## 高

**H1.** `structured-data-helpers.ts:1-158` → 整个文件是零调用的死抽象层。createBreadcrumbStructuredData/createArticleStructuredData/generateProductSchema/generateLocalBusinessSchema/generateLocalizedStructuredData 除本文件和 structured-data.ts 再导出外无调用方；真正被页面用的是 structured-data-generators.ts 直连 shell 组件。还带 150-157 行同步纯函数包 try/catch + I18nPerformanceMonitor.recordError 的莫名耦合 → 删整文件，调用方直接用 generators → 高 【客观问题】（对应跨模块 C2）

**H2.** `structured-data.ts:43-93` → generateStructuredData 带两个重载 + 实现，全仓零调用（注释称"便于测试"，测试也不存在）；35-40 行再导出块全死；唯一活导出是 generateJSONLD → 删死函数和再导出块 → 高 【客观问题】

**H3.** `src/lib/blog/` → blog-index/blog-section-id/format-published-date/types 完全零调用；constants.ts:4 零调用；starter-blog.ts:17-21 getStarterBlogArticles/Slugs 恒返回 `[]` 但 sitemap.ts:175 仍遍历（blogArticle 分支永远空转）；types.ts 与 starter-blog.ts:3-15 各定义形状不同的同名 StarterBlogArticle → 整目录连同 sitemap 分支移除 → 高 【客观问题】（对应跨模块 C7）

**H4.** `src/lib/image/`（blur-placeholder.ts + index.ts）→ 整个模块零导入。70 行注释 + 两个无法人工 review 的预编码 base64 大常量 + barrel，服务零调用方 → 删整个目录 → 高 【客观问题】

**H5.** `navigation.ts:85-96` → NAVIGATION_BREAKPOINTS.tablet=BYTES_PER_KB（1024 字节当 1024px 断点）、NAVIGATION_ANIMATIONS.dropdownFade=PERCENTAGE_FULL（100 当 100ms）、mobileMenuToggle=NAV_PREFETCH_DELAY_MS（预取延迟当菜单动画时长）——语义盲借用；且两对象和 62-82 行 getLocalizedHref 均零调用 → 全部删除 → 高 【客观问题】（对应跨模块 G2）

**H6.** `src/lib/env.ts` → (a) getEnvVar/envUtils/requireEnvVar/getRuntimeEnvNumber/isSecureAppEnv/serverEnvSchema/clientEnvSchema 生产零调用仅 test setup 引用；(b) getRuntimeEnvString/Boolean(338-358) 优先读 Cloudflare context/原始 process.env 且读到即返回，**完全跳过 zod 校验**——schema 的 z.enum/z.url 形同虚设 → 删死导出；getRuntimeEnv* 走验证后的 env 对象或文档明说绕过原因 → 高 【客观问题】

## 中

**M1.** `content-manifest.ts:98-119` getContentEntriesByType/getAllContentEntries 零调用；getContentEntry+ContentEntryQueryOptions+matchesEntryQuery+getProfileFixtureContentEntry(18-84) 这套"通用查询"生产唯一消费者是 resolveOptionalContentEntry 且参数写死 "showcase-full"，两处 max-params 豁免为没人用的灵活性买单 → 删死函数，查询链坍缩成约 20 行 → 中 【客观问题】

**M2.** `sitemap-utils.ts:35-95` getContentLastModified（带 fs.statSync 回退 + eslint 豁免 + 60 行文档）、getProductLastModified 零调用，只有 getStaticPageLastModified 被用；StaticPageLastModConfig 只是 Map 别名 → 删死函数 → 中 【客观问题】

**M3.** `content-query/queries.ts` (a) 整目录一个 34 行文件一个导出一个生产调用方；(b) `Promise.resolve().then()` 把静态查找包装成假异步；(c) locale? 传 undefined 直接 throw；(d) 27 行 `as unknown as PageMetadata` 双重断言 → 改同步、locale 必填、并入 lib/content/ → 中 【客观问题】

**M4.** `content/page-dates.ts:13-49` 假异步；try 内 throw 后自己 catch 接住降级为 warn+epoch（用异常当 if）；遍历 routing.locales 再 reduce 而本站只有 en → 同步化、单 locale 直取 → 中 【客观问题】

**M5.** `content/render-legal-content.tsx` 纯改名转发层（createLegalContent 就是 createStaticMarkdownContent 别名；parseHeadingId 再导出无人从此消费）→ 删本文件，调用方直连 → 中 【客观问题】

**M6.** `seo-metadata.ts:51-53,78` resolveLocale 是恒返回 "en" 的同义反复；78 行 buildCanonicalForPath 调用它后连返回值都不接（死语句）→ 删函数和死调用 → 中 【客观问题】

**M7.** `seo-metadata.ts:110-151` 手写逐字段 merge（applyBaseFields 搬 3 字段、applyCustomFields 搬 9 字段，baseConfig 的 title/description 被静默丢弃）→ 展开 + undefined 过滤一行完成 → 中 【客观问题】

**M8.** `seo-metadata.ts:153-230` 78 行 switch，11 个 case 的 type 全是 "website" 唯一差异是 keywords；definition===undefined 兜底与 default 完全重复；营销关键词硬编码在通用 lib → keywords 表放页面定义，函数变查表 → 中 【客观问题】

**M9.** `marketing/attribution-fields.ts` + `utm.ts` 同 10 个字段两套平行类型；pickAttributionFields 与 pickAttributionFieldsFromFormData 复制粘贴；utm.ts captureUtmParams/captureClickIds 第三份同构；getAttributionSnapshot/getAttributionAsObject/captureUtmParams/captureClickIds 外部零调用 → 以 ATTRIBUTION_FIELD_NAMES 为单一真相派生，提取收敛为一个 pick，去无用 export → 中 【客观问题】

**M10.** `content/mdx-faq.ts:5,28-36` + `seo-metadata.ts:56-67` interpolateFaqAnswer 与 interpolateSeoString 相同 `\{(\w+)\}` 替换写两遍；LAYER1_FACTS 与 SEO_INTERPOLATION_MAP 都从 siteFacts 挑字段键部分重叠 → 合并为一个插值工具 + 一份表意命名映射 → 中 【客观问题】（对应跨模块 R6）

**M11.** `cookie-consent/context.tsx:36-133` 为一个 cookie 横幅维护 7 个模块级可变量（cachedReady 与 isHydrated 语义几乎重合）；snapshot 重建三处复制；懒初始化藏在 subscribe 里 → 封装单对象 + 唯一 updateSnapshot，标志位二选一 → 中 【风格偏好】

**M12.** `src/lib/env.ts` (a) DEPLOYMENT_PLATFORM/DEPLOY_TARGET/NEXT_PUBLIC_DEPLOYMENT_PLATFORM 三变量同义（isRuntimeCloudflare 三个都查）；(b) public-runtime-env.ts:5 头注释写客户端"never from @/lib/env" 而 env.ts:371-377 又把五个函数原样再导出 → 部署变量收敛为一个；删再导出 → 中 【客观问题】（对应跨模块 I6）

**M13.** `resend-utils.ts:30-169` ResendUtils 九个方法全 static 无状态（class 当命名空间用，tree-shaking 更差）；sanitizeEmailData 与 sanitizeProductInquiryData 相似度 80% → 拆成普通导出函数 → 中 【风格偏好】

**M14.** `structured-data-generators.ts:274-285` buildCustomProjectPageSchema 零调用；generateProductData/generateBreadcrumbData/buildSchemaFallback/buildLocalBusinessSchema 调用方只有 H1 死层，helpers 删后随之死 → 删 buildCustomProjectPageSchema，清理 H1 后二次收割 → 中 【客观问题】

**M15.** `actions/server-action-utils.ts:9-22` success:boolean + 全可选 data/errorCode/error/details 允许非法状态；文件注释自称"工具函数"实际只一个接口，整个 actions/ 目录为此单开 → 改判别联合，并入表单模块 → 中 【客观问题】

**M16.** `content/render-static-markdown-content.tsx` 项目已有 MDX RSC 管线，此处手写 340 行第二套 Markdown 解析器；状态机边角 bug：(a) 306-315 空行时表格内夹空行让表格保持打开吞后续行；(b) handleTableLine 两表间无空行时第二表头被当第一表数据行 → 短期修状态机，长期评估并入 MDX 管线 → 中 【客观问题】

**M17.** `navigation.ts:26` mobileNavigation 是 mainNavigation 纯别名（注释"can be different"为不存在的差异化预留）；isActivePath(29-59) 手动剥 locale 前缀重复 next-intl 路由层职责 → 删别名；删剥前缀循环 → 中 【客观问题】

**M18.** `blog/starter-blog.ts:38-42` getStarterBlogArticleModifiedAt 即 publishedAt 单行包装；getStarterBlogArticle 对恒空数组 find 后必 throw → 随 H3 清除 → 中 【客观问题】

## 低

**L1.** `logger.ts:99-105` sanitizeIP 的 if/else 两分支返回完全相同的 "[REDACTED_IP]"，IP_V4/V6_PATTERN 是死逻辑；sanitizeEmail 同理 → 删正则与分支 → 低 【客观问题】
**L2.** `logger.ts:35-43` shouldLog 对 error/warn 无条件放行，LOG_LEVEL=error 无法关 warn → 文档写明或让分级生效 → 低 【客观问题】
**L3.** `public-runtime-env.ts:46-52` assertAllowlistedKey 不可达（参数已是 keyof，key in READERS 恒真）→ 删 → 低 【客观问题】
**L4.** `idle-callback.ts:35` 导出函数与全局 requestIdleCallback 同名遮蔽；50-56 SSR 分支同步立即执行与语义相反 → 改名 runWhenIdle，标注 SSR → 低 【风格偏好】
**L5.** `structured-data-types.ts:56-61` StructuredDataType 标 @public 但零消费；Locale 三层接力 re-export → 删死类型，Locale 扁平化 → 低 【客观问题】（对应跨模块 I1）
**L6.** `motion/light-breathing.ts:7-17,31-41` 为一个 cubic-bezier 造四个单值常量再组装；两 transition 字段值完全相同 → 内联 `[0.25,1,0.5,1] as const`，合一 → 低 【风格偏好】
**L7.** `content/legal-page.ts:37-41` locale:string 再 as Locale 断言；H2/H3_PREFIX 与 render-static-markdown-content 是两份实现 → 签名改 Locale，前缀常量共享 → 低 【客观问题】
**L8.** `seo-metadata.ts:86-105` buildLanguagesForPath 单语言下生成 {en, x-default} 两个相同 URL；new URL 构造写三遍 → 提取 absoluteUrl(path) → 低 【风格偏好】（对应跨模块 R7）
**L9.** `seo-metadata.ts:348-356` `(openGraph as {url?}).url = canonical` + `as unknown as` 双断言强改刚生成的对象；generateLocalizedMetadata/createPageSEOConfig 外部零调用 → 直接接收 canonical 一次成型，去 export → 低 【客观问题】
**L10.** `merge-objects.ts:17` blockedKeys Set 每次调用（含递归每层）重建 → 提为模块级常量 → 低 【风格偏好】
**L11.** `cookie-consent/index.ts` barrel 全量摊开 storage 内部函数和全部类型，实际消费面只 3 个符号 → 收窄 barrel → 低 【风格偏好】
**L12.** `mdx-loader.ts:43-60` 同一内容存在性查两个真相源（manifest + importer map）任一缺失静默 null → 不一致时 logger.error 或合并单真相源 → 低 【风格偏好】

## 跨文件汇总
- **死代码重灾区**：structured-data 三件套（H1/H2/M14）、blog/（H3/M18）、image/（H4）、navigation 常量（H5）、env 便捷层（H6）、sitemap-utils（M2）、content-manifest 查询层（M1）——约 25%+ 导出面无生产调用方。
- **同逻辑多份**：siteFacts 插值 ×2（M10）、attribution 提取 ×3（M9）、slugify ×2、假异步 ×2（M3/M4）、H2/H3 前缀解析 ×2（L7）。
- **单调用方转发层**：render-legal-content（M5）、content-query/（M3）、image/index（H4）、cookie-consent/index（L11）。
