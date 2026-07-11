# src/app/ 页面批次审查清单（排除 api 与 __tests__）

**统计：高 3 条 / 中 15 条 / 低 17 条（共 35 条，审查 36 个文件）**

---

## 高

### H1. `src/app/sitemap.ts:38-210` → 生产 sitemap 里保留整套 starter profile / blog 死机制
`generateSitemapForProfile(profileId?)`/`getPageConfig(path,profileId)`/`createStaticPageLastmod(profileId)` 全链穿透 `StarterProfileId` 可选参数；`generateBlogArticleEntries` 及 `@/lib/blog/starter-blog` 三个 import 服务 blog 条目。默认 profile 固定 `"catalog"`，其 dynamicSurfaces 只有 `["productMarket"]`，src/app 下无 blog 路由，唯一调用方实参永远同一常量。→ blog 分支永不执行；若 profile 常量被误改成含 blogArticle，sitemap 会输出 404 blog URL。→ 收敛为"静态页+产品市场页"两个直接函数，删 profileId 参数/generateBlogArticleEntries/starter-blog import。→ 高 【客观问题】（对应跨模块 C7）

### H2. `contact/contact-page-data.ts:76-101`、`contact-page-sections.tsx:27-36,48-67,243-257`、`contact-form-static-fallback.tsx:17-19` → contact 页自建第二套 i18n 读取机制
contact 链路全程传裸 `messages: Record<string, unknown>`，用 `readRequiredMessagePath(messages, ["contact","form","key"])` 字符串路径取文案，而全站其余用 `getTranslations` 类型化 API。→ 两套心智模型；字符串路径无编译期检查，key 错到运行时才炸；Record 在 6 个组件间层层透传是典型 stringly-typed 耦合。ContactInquiryHandoff/ContactFormColumn 都是服务端组件可用 getTranslations。→ 服务端组件改回 getTranslations，只在注水客户端 island 边界传 messages。→ 高 【客观问题】

### H3. `privacy/page.tsx:1-84` 与 `terms/page.tsx:1-82` → 两页整体复制粘贴，且绕开现成的 StaticMdxPage 抽象
两文件逐行同构（generateMetadata 只差 slug/pageType、逐字符相同的骨架屏、相同 Content 结构）；about/warranty/guides/oem-wholesale 五页都走 static-mdx-page.tsx，privacy/terms 却手写一遍 loadLegalPage + generateMetadataForPath。→ 同类 MDX 静态页两套实现且已漂移（privacy/terms 有 Suspense+骨架，其他五页没有）；改元数据要改三处。→ 给 StaticMdxPageConfig 增 schemaType 透传项，privacy/terms 改成配置式页面；骨架/Suspense 下沉进 StaticMdxPage。→ 高 【客观问题】

---

## 中

### M1. `sitemap.ts:68-76` 单语站输出 hreflang alternates（en + x-default 指向同一 URL）→ 纯噪音，膨胀体积，误导"多语站" → 删 buildAlternateLanguages 与 alternates 字段，locale 循环收敛为 defaultLocale → 中 【客观问题】（对应跨模块 R7）

### M2. 全批次约 15 处 `locale as Locale`/`as SeoLocale` 断言（page.tsx:83,85,481、contact/page.tsx:41,116、products/page.tsx:37,39,57、products/[market]/page.tsx:333,382、static-mdx-page.tsx:35,37,57、privacy/page.tsx:32,34、terms/page.tsx:32,34）→ 三个 Locale 来源（routing-config、config/paths、content.types）没统一，每页付心智税 → 让三源都从 routing-config 派生，删所有 as → 中 【客观问题】（对应跨模块 I1）

### M3. `layout-fonts.ts:1-32` 被抽空的字体机制残骸（getFontClassNames 恒返回 ""，systemSans/jetbrainsMono 两死导出全仓无 import）→ next/font 移除后的空壳 → 删文件，layout.tsx 去掉 `className={getFontClassNames()}` → 中 【客观问题】

### M4. `page.tsx:55-64` 消费的 `SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS` 键名与内容脱节（键 structure/content/deployment/inquiry/multilingual 映射到 boxwall/gate/bag/tube/frp 洪水挡板）→ 键是 starter 演示遗物，HOME_PRODUCT_CARD_GLYPHS 映射表只为弥合错误键名 → 键改产品语义，同步 messages 与 page-expression，映射表消失 → 中 【客观问题】（对应跨模块 config M3）

### M5. `page.tsx`（490 行）首页 6 个 section 组件内联在页面文件（products/contact 页都拆了兄弟文件）→ 两种组织惯例，路由关注点与视图混杂 → 抽 home-sections.tsx → 中 【风格偏好】

### M6. `page.tsx:422-486` 可配置 section 排序机制只有一个消费者（eager 构建 7 section 塞 record 再按 SECTION_ORDER map）→ 为唯一顺序维护 key 常量+record+satisfies，没省任何东西 → 直接按顺序写 JSX，或配置处注明理由 → 中 【风格偏好】

### M7. `products/[market]/market-page-data.ts:12-24` + `page.tsx:347-356` families 死数据（getFamiliesForMarket 取出从未消费）+ 双轨校验（页面 isValidMarketSlug→notFound，data 层 getMarketBySlug→throw）→ 删 market-page-data.ts，页面内三行解决 → 中 【客观问题】

### M8. `products/[market]/page.tsx:280,298,300-301,308` 硬编码英文文案混入配置驱动页面（"FAQ"/"Request a quote"/"Download spec sheet" + 47 词 rfqNote 兜底）→ 同页两套文案机制，owner 改配置改不到这几处 → 收进产品页配置公共字段 → 中 【客观问题】（对应跨模块 I5）

### M9. `products/products-overview-sections.tsx:26-44` 手写 message key 联合类型复刻类型化 translator（ProductsTextKey 手工枚举 + callable interface）→ getTranslations 返回值本就类型化，新增 key 要改两处 → 子组件参数用 `Awaited<ReturnType<typeof getTranslations<"catalog">>>` 或收成品字符串 → 中 【客观问题】

### M10. request-quote 目录 5 文件拆分 + copy 对象接力链（request-quote-form-copy.ts:29-52 把 12 个 key 1:1 搬进 copy 对象，内嵌二级 copy；page.tsx:83-87 先 `key as Parameters<typeof t>[0]` 擦类型）→ 加一条文案动 3 文件，擦除让连编译期校验都没有 → 保留类型化 key，copy 由 pick 工具生成，5 文件合并 → 中 【客观问题】（对应跨模块 R10/I3）

### M11. `request-quote/request-quote-form.tsx:46-53,67-69` useEffect 直接操作 DOM 赋值（`getElementById("rfq-message").value`）+ 两处裸读 window.location.search → 绕过 React，依赖"textarea 非受控 && id 恰好叫 rfq-message"隐式契约，改 id 静默失效 → useSearchParams 一次读，textarea 用 defaultValue → 中 【客观问题】

### M12. `request-quote-form.tsx:86-106` 非 JSON 错误响应被误报为"网络错误"（response.json() 对网关 HTML 500 抛异常落入 catch 显示 networkError）→ 误导买家反复重试，丢排障信号 → json 解析单独 try/catch 或先判 response.ok+content-type → 中 【客观问题】（对应跨模块 comp-forms 真 bug）

### M13. `layout.tsx:93` `<Suspense fallback={children}>` 无注释的反直觉 hack（children 自身当 fallback）→ 第一眼像 bug，后来者易"顺手修掉" → 补注释或 PageTransition 内部自行降级 → 中 【客观问题】

### M14. `layout.tsx:60-68` 导航数据存带前缀 key，用时正则剥前缀再 as 断言 → 数据源与消费格式不匹配靠运行时手术+断言缝合 → mainNavigation 存裸 key 并声明命名空间类型 → 中 【客观问题】（对应跨模块 I3）

### M15. `global-error.tsx:38-87` 使用 Tailwind 语义类但自身不引入任何样式（globals.css 只在 [locale]/layout.tsx 引入，global-error 渲染时该布局已被替换）→ 初始加载即触发全局错误时可能裸 HTML 呈现 → 顶部显式 `import "@/app/globals.css"` 或内联极简样式；建议实际触发验证 → 中 【客观问题】

---

## 低

### L1. `layout-metadata.ts:41-43` `await params` 后丢弃 + `baseUrl || "http://localhost:3000"` 生产缺失静默指 localhost → 删 params；baseUrl 缺失 throw → 低 【客观问题】
### L2. `layout.tsx:122-127` isLocale 校验后再 coerceLocale 双重机制 → isLocale 做 type guard 收窄 → 低 【风格偏好】
### L3. `sitemap.ts:34,48-51,86-98` BASE_URL 别名、getPageConfig 1:1 包装、createSitemapEntry 接口包装 6 行对象 → 随 H1 内联 → 低 【风格偏好】
### L4. `contact/page.tsx:30,117` searchParams 可选 + `?? Promise.resolve({})` 防御（Next 恒传）→ 类型改必选，删兜底 → 低 【风格偏好】
### L5. `contact/contact-page-data.ts:29-31` getStaticMessages 1:1 包装 getStaticSplitMessages → 直接调原函数 → 低 【风格偏好】
### L6. `contact-page-data.ts:33-55` 手写运行时元数据断言（manifest 是构建期自家生成，正确性应由生成脚本保证）→ 校验移到生成侧 → 低 【风格偏好】
### L7. `global-error.tsx:23-30` 1:1 包装（isDevelopmentRuntime）、误导命名（translations 实为硬编码英文）、动态 import logger → 删包装；改名 FALLBACK_COPY；静态 import → 低 【风格偏好】
### L8. `page.tsx:89-91,102-104` 单张卡片 badge 走 Set + 条件 spread → `badge: keys.includes(key) ? t(...) : undefined` → 低 【风格偏好】
### L9. `page.tsx:417-421,450-458` FAQ 数组构建后再 remap（`{id,...}`→`{key,...}`）→ 一次构建成视图形状 → 低 【风格偏好】
### L10. `page.tsx:386-401` primary/secondary 三元分支重复 Button 结构 → variant/label 由 labelKey 派生 → 低 【风格偏好】
### L11. `page.tsx:187,284,330` section 组件参数契约不一致（有的收字符串、有的收 t、有的都收）→ 统一收成品数据 → 低 【风格偏好】
### L12. `products/[market]/page.tsx:320-341` generateMetadata 先取 productPage 再判 !market，无效 slug 返回 `{}` 靠巧合与 notFound 对齐 → 先判 market 提前返回 → 低 【风格偏好】
### L13. `products/[market]/page.tsx:75-79` 表格行/单元格 key 用内容拼接（`row.join("|")`、`${cell}-${index}`）重复行会冲突（当前静态数据无重复）→ 静态无重排数据用索引 → 低 【客观问题】
### L14. `products/[market]/market-jsonld.ts:37-45` JSON-LD description 拼入全部表格行（可能上千字符）→ description 应是简介，规格走 additionalProperty → 低 【风格偏好】
### L15. `market-jsonld.ts:22-26` 防御自家配置的路径安全校验（isSafeRootRelativeImageSrc 校验第一方常量 image.src）→ 删校验，配置错误由架构测试抓 → 低 【风格偏好】
### L16. `request-quote-payload.ts:53-76` 把 UI 翻译文案当业务数据塞进 lead payload（copy.source/productName 写进 requirements）→ lead 记录内容取决于 UI 文案版本 → payload 用稳定常量 → 低 【风格偏好】
### L17. `contact/error.tsx` 与 `products/error.tsx` 逐行复制的错误边界（仅 namespace/logContext 不同，都 `key as Parameters<typeof t>[0]` 擦类型）→ createRouteError(namespace, logContext) 工厂，各路由一行导出，保留类型化 key → 低 【客观问题】（对应跨模块 I3）

---

## 附注（核实过、判定不立案）

- `[...rest]/page.tsx` 的 notFound 占位 + generateStaticParams：cacheComponents 约束下的合理 workaround，注释充分。
- `static-mdx-page.tsx` metadata 与页面各调一次 loadLegalPage：成本限于构建期；内容变大可加 React.cache。
- contact 静态 fallback 表单整体：为 island 降级服务，结构合理。
