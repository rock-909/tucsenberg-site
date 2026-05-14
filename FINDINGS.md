# Findings

本轮目标：把当前仓库的“整库优化”问题收敛成有限、可执行、按风险排序的 repair backlog。

本轮边界：

- 只读审计；未修业务代码，未删除文件，未执行自动修复。
- 允许新增本报告文件：`FINDINGS.md`、`REPAIR-BACKLOG.md`、`NEXT-WAVE.md`。
- 没有使用 skills；证据来自当前仓库文件和本地已安装依赖文档。

路径说明：下面的证据路径均相对仓库根目录 `/Users/Data/workspace/showcase-website-starter`。

## 当前运行心智模型

这个仓库不是一个已经交付给客户的成品站，而是一个高配置的展示型网站 starter。它的真实运行模型大致是：

1. **请求入口**
   - `src/middleware.ts` 是当前 Web request entry，实际只把请求交给 `next-intl/middleware` 做 locale routing。
   - `.claude/rules/cloudflare.md` 明确要求保留 `middleware.ts`，不要盲迁 `proxy.ts`；Next.js 新文档提示 proxy/nonce 方向，但当前 Cloudflare/OpenNext 证明链还没支持直接迁移。

2. **页面与内容**
   - 页面入口在 `src/app/[locale]/**`。
   - 页面正文主真相在 `content/pages/{locale}/*.mdx`。
   - UI chrome / 表单 / 导航等跨页面文案在 `messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json`。

3. **配置主线**
   - `src/config/single-site.ts` 是公司身份、站点事实、默认 SEO、联系方式的主配置。
   - `src/config/single-site-seo.ts` 管 sitemap、robots、lastmod 和公开页面。
   - `src/config/single-site-product-catalog.ts` 与 `src/constants/product-specs/**` 共同构成产品/市场事实。
   - `src/lib/env.ts` 是运行时 env schema 真相。

4. **Lead / API 路径**
   - `/api/contact`、`/api/inquiry`、`/api/subscribe` 都走 `safeParseJson`、Zod/validation、`withRateLimit`、Turnstile 或 lead pipeline。
   - 当前本地/CI 测试大量使用 mock 或 test-mode；真实 Airtable / Resend / Turnstile 成功需要 deployed canary 证明。

5. **Cloudflare / OpenNext**
   - `pnpm build` 与 `pnpm website:build:cf` 都写 `.next`，不能并行。
   - `open-next.config.ts` 保持空 baseline，OpenNext split-function minify 暂时关闭。
   - `wrangler.jsonc` 是 Worker + assets baseline，没有 R2/D1/DO stack。

6. **质量证明**
   - `pnpm website:check` 证明本地基础门禁。
   - `pnpm release:verify` 是本地 release proof，不是 public launch proof。
   - `docs/website/quality-proof.md` 已经把本地、CI、部署、公开上线证明拆开；问题在于脚本/workflow 仍有几个容易误读或误伤的边界。

## 审计方向覆盖

| 方向 | 本轮结论 |
| --- | --- |
| 1. starter 替换面是否清楚 | 文档已经比较清楚，但实际替换仍跨 config/content/messages/specs/images，缺少机器可读的 replacement surface index。见 F-08。 |
| 2. 配置真相源是否重复或冲突 | 主真相已收口到 `single-site*`，但 locale、env 示例、产品规格 wrapper 仍有同步风险。见 F-03、F-07、F-08。 |
| 3. Next.js / i18n / Cloudflare runtime 高风险边界 | `middleware.ts` 保留是有意识取舍；preview runtime contract 与 CSP/nonce 边界更需要管住。见 F-02、F-03、F-05。 |
| 4. 表单、API、安全、CSP、rate limit 缺口 | API 基础链路有保护；更明显的问题是 rate-limit env 误判、CSP 命名强度落差、真实 lead proof 口径。见 F-01、F-05、F-06。 |
| 5. content/messages/config 是否容易被新项目替换 | 替换顺序有文档，但 message 体量和 product/spec 多层同步让新项目不够顺手。见 F-08。 |
| 6. tests/scripts/checks 是否证明真实质量 | 测试不少，但 local/test-mode、preview、public launch proof 容易混读；`starter-checks.js` 仍过大。见 F-02、F-04、F-06。 |
| 7. AI 味道 | 主要是大脚本多职责、兼容 wrapper 假通用、proof 命令混在一个入口里、重复 locale/env 真相。见 F-03、F-04、F-08。 |

## Findings

### F-01 - `ALLOW_MEMORY_RATE_LIMIT=false` 会被生产校验当成“已启用内存限流”

**风险等级**：High  
**覆盖方向**：配置真相源、API/security/rate limit、tests/checks proof

**证据文件路径**

- `.env.example:82-93`：示例里写了 `ALLOW_MEMORY_RATE_LIMIT=false`。
- `docs/website/env 设置.md:36-42`：文档语义是只有 `ALLOW_MEMORY_RATE_LIMIT=true` 才是本地兜底，preview/production 不要设 true。
- `src/lib/env.ts:57-67`：runtime schema 把该变量 transform 成 boolean，只有 `"true"` 才为 true。
- `scripts/starter-checks.js:651-656`：`hasAny()` 只判断非空字符串；`isTrue()` 才判断 `"true"`。
- `scripts/starter-checks.js:788-790`：production runtime contract 用 `hasAny(env, "ALLOW_MEMORY_RATE_LIMIT")`，所以 `"false"` 也会触发错误。
- `tests/unit/scripts/validate-production-config.test.ts:75-92`：只覆盖了 `"true"` 被拒绝，没有覆盖 `"false"` 不应报错。

**为什么是问题**

按 `.env.example` 复制配置的人，很可能把 `ALLOW_MEMORY_RATE_LIMIT=false` 带到 preview/production。脚本会把这个非空字符串当成“启用了内存限流”，导致 strict production gate 误伤。

**影响**

- 派生项目可能在正确关闭内存限流时仍被生产校验挡住。
- 文档、runtime schema、校验脚本三者语义不一致，会降低 adopter 对 env gate 的信任。

**修复建议**

- 把 `scripts/starter-checks.js` 里的该项 production 校验从 `hasAny(env, "ALLOW_MEMORY_RATE_LIMIT")` 改为 `isTrue(env, "ALLOW_MEMORY_RATE_LIMIT")`。
- 增加测试：`ALLOW_MEMORY_RATE_LIMIT=false` 不应报 degraded in-memory store；`true` 仍应报错。

**风险**

低。逻辑意图很明确，属于校验误判修正；主要风险是别顺手改动 production runtime contract 的其他规则。

**验证命令**

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
PUBLIC_LAUNCH_STRICT=true APP_ENV=production node scripts/starter-checks.js validate-production-config
```

**是否适合自动修**

适合自动修。范围小，测试容易补齐。

---

### F-02 - preview 环境跳过 production runtime contract，容易把“预览可访问”误读成“可以上线”

**风险等级**：High  
**覆盖方向**：Next.js / Cloudflare runtime、表单/API/security、tests/checks proof

**证据文件路径**

- `scripts/starter-checks.js:698-715`：`APP_ENV=preview` 直接跳过 production runtime contract。
- `tests/unit/scripts/validate-production-config.test.ts:152-163`：测试明确锁定 preview skip runtime contract。
- `.github/workflows/cloudflare-deploy.yml:67-89`：preview proof 路径执行 `node scripts/starter-checks.js cf-preview-deployed`，不是 production strict gate。
- `docs/website/quality-proof.md:29-31`：明确说基础命令不能证明真实部署、真实表单、真实客户信任资产。
- `docs/website/quality-proof.md:70-84`：把本地门禁、发布证明、CI、部署证明、公开上线分开。

**为什么是问题**

preview skip 本身有合理性：预览环境经常缺真实生产 secret。但当前 starter 的用户很容易把“preview deploy job 通过”理解成“关键运行配置也基本没问题”。事实上 Upstash、Turnstile、Resend、Airtable、稳定 Server Action key 等 production runtime contract 可能完全没被 preview path 证明。

**影响**

- 派生项目可能带着未配置的真实表单链路进入客户验收。
- “预览 URL 能打开”会被误当成 public launch readiness。
- 后续排障会从线上才开始暴露，成本更高。

**修复建议**

- 保留默认 preview skip，避免开发体验变差。
- 新增一个明确的 strict preview proof lane，例如 `PUBLIC_LAUNCH_STRICT=true APP_ENV=preview node scripts/starter-checks.js validate-production-config` 或单独 `preview-strict` 命令。
- workflow / docs 里把 `preview accessible`、`preview strict config ready`、`public launch ready` 三个结论分开。
- 增加测试：strict preview 不能跳过关键 runtime contract。

**风险**

中。不是纯代码修复，还涉及 proof 口径和 workflow 文案。不能直接把默认 preview 改成 strict，否则会误伤正常 preview。

**验证命令**

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
PUBLIC_LAUNCH_STRICT=true APP_ENV=preview node scripts/starter-checks.js validate-production-config
node scripts/starter-checks.js cf-preview-deployed
```

**是否适合自动修**

部分适合。测试和脚本分支可自动修；workflow / docs 的 proof 口径需要人工确认命名。

---

### F-03 - locale 真相源分裂，新增语言时容易漏同步

**风险等级**：Medium  
**覆盖方向**：i18n runtime、配置真相源、tests/checks proof、AI 味道

**证据文件路径**

- `src/config/paths/locales-config.ts:5-31`：runtime canonical locale 配置是 `LOCALES_CONFIG`。
- `src/i18n/routing-config.ts`：运行时 routing 从 `LOCALES_CONFIG` 派生。
- `i18n-locales.config.js:1-14`：translation check 自己维护 `locales: ["en", "zh"]`，且注释说“添加新语言时，只需在此处修改 locales 数组”。
- `scripts/starter-checks.js:180`：translation checker 从 `i18n-locales.config.js` 读语言。
- `playwright.config.ts:13-20`：E2E 默认从 env 读 supported locales，缺省只有 `"en"`。
- `tests/e2e/global-setup.ts:15-22`：E2E global setup 也重复解析 env locale。
- `tests/e2e/contact-form-smoke.spec.ts:23-29`：contact smoke 再解析一次 locale，函数类型仍写死 `"en" | "zh"`。
- `i18n.json:1-28`：翻译工具还有一套 `sourceLocale` / `targetLocales`。

**为什么是问题**

runtime 有一套 locale 真相，translation check、Playwright、工具配置又各自有一套。新增第三语言时，很可能出现：

- runtime 支持了新语言，但 translation check 没跑。
- translation check 支持了新语言，但 E2E 仍只测 en。
- 工具配置和 runtime 语言列表漂移。

这不是马上会炸的 bug，但对 starter 来说，新项目加语言是常见动作，漏同步概率高。

**影响**

- 新语言页面可能部分可访问，但 messages/content 缺口没被门禁抓住。
- E2E 结果会给出过度乐观结论。
- 后续 AI 或新手修改时，会跟着错误注释改错入口。

**修复建议**

- 增加 architecture test：`i18n-locales.config.js` 必须与 `LOCALES_CONFIG.locales/defaultLocale` 一致。
- 把 `i18n-locales.config.js` 的注释改成“工具镜像，必须与 runtime locale truth 同步”，不要写“只需改这里”。
- Playwright locale 支持至少从一个受测试保护的 public manifest / generated config 读取；短期也可以先加 parity test 防漂移。
- `i18n.json` 如果只是翻译工具配置，不强行合并进 runtime，但必须纳入 parity check 或明确例外。

**风险**

中。直接合并所有 locale 来源可能牵动工具链；第一步应该是加守卫，不是大重构。

**验证命令**

```bash
pnpm exec vitest run src/i18n/__tests__/routing.test.ts tests/unit/i18n-message-contract.test.ts
node scripts/starter-checks.js translations
pnpm exec playwright test tests/e2e/contact-form-smoke.spec.ts --project=chromium
```

**是否适合自动修**

适合第一步自动修。加 parity test 和注释修正风险低；重构 Playwright 读取源适合后续单独做。

---

### F-04 - `scripts/starter-checks.js` 仍是过大的多职责脚本，proof 和普通检查混在一起

**风险等级**：Medium  
**覆盖方向**：tests/scripts/checks proof、AI 味道、starter 可维护性

**证据文件路径**

- `scripts/starter-checks.js`：当前约 3410 行。
- `scripts/quality/checks/brand.js`
- `scripts/quality/checks/content-slugs.js`
- `scripts/quality/checks/client-boundary.js`
- `scripts/quality/checks/eslint-disable.js`
- `scripts/starter-checks.js:3269-3334`：同一个 CLI 入口还承载 truth docs、translations、production config、component governance、content readiness、Cloudflare smoke、deployed smoke、release verify。
- `docs/website/starter-checks-split-plan.md:13-31`：文档已承认不同命令的证明面不同。
- `docs/website/starter-checks-split-plan.md:33-41`：拆分原则要求保留 CLI 兼容入口，一次只抽一个命令家族，不能混行为变更。
- `docs/website/starter-checks-split-plan.md:97`：第一波不要碰 release/Cloudflare proof 命令。

**为什么是问题**

这个脚本同时做低风险文本检查、内容检查、生产配置 gate、Cloudflare proof、部署 smoke、release verify。虽然已经抽出部分低风险模块，但主入口仍然过重。后续 AI/新手看到“大脚本”很容易做出两类坏改动：

- 把重构和行为改动混在一起。
- 不小心改变 release / deployed proof 的退出码或证明口径。

**影响**

- 质量治理脚本难维护。
- 小改动可能影响上线 proof。
- 自动修复工具容易在大文件里误改高风险命令。

**修复建议**

- 下一步只抽一个低环境依赖命令，建议 `translations` 或 `content-readiness`，不要碰 release / Cloudflare / deployed smoke。
- 保留 `node scripts/starter-checks.js <command>` 作为唯一公开兼容入口。
- 每次抽取必须证明 direct CLI 和 package script 行为一致。
- 不把拆文件和规则变更放在同一个 PR。

**风险**

中。抽低风险命令本身不难，风险来自误改公开 CLI 行为或 release proof 口径。

**验证命令**

```bash
node scripts/starter-checks.js translations
pnpm content:check
pnpm exec vitest run tests/unit/i18n-message-contract.test.ts tests/unit/scripts/content-slug-sync.test.ts
```

**是否适合自动修**

适合小步自动修。只适合一次抽一个低风险命令，不适合自动碰 Cloudflare / release proof。

---

### F-05 - CSP “strict mode” 名字偏强，但生产 CSP 仍允许较宽 inline script/style

**风险等级**：Medium  
**覆盖方向**：Next.js runtime、安全/CSP、Cloudflare boundary、AI 味道

**证据文件路径**

- `src/config/security.ts:35-57`：生产 `script-src-elem` 仍包含 `'unsafe-inline'`。
- `src/config/security.ts:59-75`：`style-src` / `style-src-elem` / `style-src-attr` 包含 `'unsafe-inline'`。
- `src/config/security.ts:209-253`：默认 security mode 名为 `strict`。
- `.claude/rules/security.md:81-92`：当前 starter 默认 static CSP，不做动态 nonce。
- `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`：Next.js nonce CSP 需要 proxy 生成 nonce，并且必须使用 dynamic rendering；文档还说明 nonce 会影响 static rendering / PPR 等路径。

**为什么是问题**

当前 CSP 取舍本身不一定错：静态 App Router / RSC / Cloudflare starter baseline 下，不盲上 nonce 是合理的。但 “strict mode” 这个名字会让派生项目误以为已经达到 nonce-level strict CSP。实际生产策略仍允许比较宽的 inline script/style。

**影响**

- 安全保护强度容易被高估。
- 派生项目可能跳过本该做的 CSP hardening 评估。
- 后续 AI 可能为了“修 strict”盲目加 nonce/proxy，破坏 Cache Components、Cloudflare 或 static path。

**修复建议**

- 不要第一波直接上 nonce。
- 先改命名/文档/报告口径：把当前模式说明为 `static-compatible enforced CSP`，明确它不是 nonce-level strict CSP。
- 如果未来要做 nonce CSP，必须单独开 proof lane，证明 Next.js dynamic rendering、Cloudflare/OpenNext、Cache Components、Turnstile、analytics 都没有被破坏。

**风险**

中。文档/命名修正风险低；真正 nonce hardening 风险高，不适合混入普通 cleanup。

**验证命令**

```bash
pnpm exec vitest run src/config/__tests__/security.test.ts tests/architecture/middleware-boundary.test.ts
pnpm build
pnpm website:build:cf
```

**是否适合自动修**

部分适合。文档和测试口径适合自动修；nonce CSP 不适合自动修。

---

### F-06 - E2E / CI proof 边界写清楚了，但结果仍容易被误读成真实外部服务证明

**风险等级**：Medium  
**覆盖方向**：表单/API/security、tests/scripts/checks proof、starter 可交付性

**证据文件路径**

- `playwright.config.ts:149-174`：E2E webServer 使用 test-mode services，`SECURITY_HEADERS_ENABLED=false`、`SKIP_ENV_VALIDATION=true`、Turnstile test keys、`APP_ENV=preview`。
- `tests/e2e/contact-form-smoke.spec.ts:3-10`：注释说明这是 local/CI test-mode smoke，不是生产态最终证明。
- `.github/workflows/ci.yml:84-88`：CI 跑 `pnpm test` 和 lead API family proof。
- `tests/integration/api/lead-family-contract.test.ts:10-14`：明确 mock 核心保护和 submission pipeline，不是 full lead-chain protection proof。
- `tests/integration/api/lead-family-protection.test.ts:9-16`：也说明 deeper processing pipeline 使用 mock。
- `docs/website/quality-proof.md:179-199`：表单 canary 才证明部署环境表单链路，且 recordCreated 和 ownerNotified 不能混为一谈。

**为什么是问题**

测试不是没价值；问题是它们证明的是本地结构、route contract、mock/test-mode 行为。它们不证明真实 Turnstile、真实 Airtable、真实 Resend owner delivery、真实部署 header、真实 Cloudflare 环境都已经工作。

**影响**

- CI 绿灯可能被误读成“表单链路闭环已证明”。
- 客户派生项目上线前容易漏做真实 canary。
- 安全 header 在 E2E 中被关闭，不能用这些 E2E 结果证明生产 header。

**修复建议**

- 给 proof lane 增加机器可读标签或报告摘要：`local/test-mode`、`preview/deployed-smoke`、`real-service-canary`。
- 对 lead path 增加非生产 deployed canary runbook 或脚本入口，默认 dry-run，不在普通 CI 自动提交真实线索。
- 在 CI summary / docs 里明确 lead family proof 是 route contract，不是 external-service proof。

**风险**

中。改文档和报告标签风险低；新增 deployed canary 需要谨慎，不能误打真实客户系统。

**验证命令**

```bash
pnpm test
pnpm exec playwright test tests/e2e/contact-form-smoke.spec.ts --project=chromium
node scripts/starter-checks.js deployed-smoke --base-url "$DEPLOYED_BASE_URL"
POST_DEPLOY_TEST=1 PLAYWRIGHT_BASE_URL="$DEPLOYED_BASE_URL" pnpm exec playwright test tests/e2e/smoke/post-deploy-form.spec.ts --project=chromium
```

**是否适合自动修**

部分适合。proof label / docs 适合自动修；真实 canary 自动化需要人工确认环境和提交策略。

---

### F-07 - `.dev.vars.example` 明显落后于 `.env.example` 和 env 文档

**风险等级**：Medium  
**覆盖方向**：配置真相源、Cloudflare runtime、表单/API/security、starter 替换面

**证据文件路径**

- `.dev.vars.example:1-17`：只列出 Cloudflare 本地基础变量和少量 Resend/Airtable/Turnstile 注释。
- `.env.example:82-93`：包含 rate limit / Upstash / KV / pepper / memory fallback。
- `.env.example:98` 之后还有 security / diagnostics 相关变量。
- `src/lib/env.ts:10-95`：runtime schema 包含邮件、Airtable、Turnstile、Server Action key、Cloudflare analytics、rate limit、security headers 等。
- `docs/website/env 设置.md:20-34`：文档已经把 env 分组写得比较完整。

**为什么是问题**

`.dev.vars.example` 是 Cloudflare Workers 本地开发最直观的入口，但它比 `.env.example` 和 `src/lib/env.ts` 少很多关键变量。新项目按它复制 `.dev.vars` 时，容易漏掉 rate limit、Server Action key、owner dashboard、安全 header 等边界。

**影响**

- 本地 Cloudflare preview 可能和真实 runtime 配置差距过大。
- 派生项目会在 `.env.local`、`.dev.vars`、Cloudflare dashboard、GitHub secrets 之间来回猜。
- env 文档已经说清楚的东西没有被示例文件承接。

**修复建议**

二选一：

1. 把 `.dev.vars.example` 明确标成“最小本地 preview only”，并强指向 `.env.example` / env 文档；或
2. 补齐关键 server-only keys，并新增 parity check，至少保证 `.dev.vars.example` 不漏 Cloudflare preview 需要的核心变量。

不要把真实 secret 或生产默认值写进示例。

**风险**

低到中。示例文件本身风险低；风险在于如果补齐过多变量，可能让非技术用户误以为都必须配置。

**验证命令**

```bash
pnpm exec vitest run tests/architecture/env-example-parity.test.ts
pnpm type-check
```

**是否适合自动修**

适合自动修。建议先做“最小本地 preview only”说明 + parity guard，而不是一次性塞满所有变量。

---

### F-08 - 替换面已文档化，但实际仍有多层 wrapper 和大 messages 文件，对新项目不够顺手

**风险等级**：Medium  
**覆盖方向**：starter 替换面、content/messages/config、配置真相源、AI 味道

**证据文件路径**

- `docs/website/README.md:7-23`：给了网站 starter 必读顺序。
- `docs/website/新项目替换清单.md:5-34`：品牌身份、产品/服务信息替换面已列出。
- `docs/website/新项目替换清单.md:36-46`：market slug 同步涉及 catalog、spec 文件、registry、messages、page expression。
- `docs/website/配置真相源.md:7-17`：列出当前主配置表。
- `docs/guides/CANONICAL-TRUTH-REGISTRY.md:10-19`：四层内容模型已经定义。
- `src/config/paths/site-config.ts:14`：`SITE_CONFIG = SINGLE_SITE_CONFIG` 是兼容 wrapper。
- `src/constants/product-catalog.ts:1-23`：`PRODUCT_CATALOG = SINGLE_SITE_PRODUCT_CATALOG` 是 product catalog compatibility wrapper。
- `src/constants/product-specs/market-spec-registry.ts:8-14`：market specs 还有独立 registry。
- `messages/en/critical.json`、`messages/en/deferred.json`、`messages/zh/critical.json`、`messages/zh/deferred.json`：四个 messages 文件合计约 160K。

**为什么是问题**

替换面“写清楚了”，但实际操作仍要跨多层：

- config 层：`single-site*`、navigation、links、page expression、seo。
- content 层：`content/pages/{locale}/*.mdx`。
- product 层：catalog、spec 文件、market registry。
- messages 层：critical/deferred 大 JSON。
- assets 层：`public/images/**`。

兼容 wrapper 短期合理，但对新项目来说，会出现“不知道该改真相源还是 wrapper”的困惑。大 message 文件也让“替换业务文案”和“保留 starter UI chrome”不够分明。

**影响**

- 新项目替换成本偏高，容易漏 product slug / messages / specs 的同步。
- 新手或 AI 容易改 wrapper 或页面组件，而不是改 canonical surface。
- content-readiness 能扫残留，但还不能直接给出一份完整 replacement surface index。

**修复建议**

- 不急着合并 runtime 配置，也不要马上拆 messages。
- 先生成或维护一份 `replacement surface index`：列出每个新项目必须替换、可保留、可选替换的文件面。
- 增强 `content-readiness` 报告，让它按 brand / product / legal / lead / images / deployment 分组输出。
- 对 market slug 增加更直接的 proof，确保 catalog、spec registry、messages 同步。

**风险**

中。文档/报告增强风险低；真正合并 wrapper 或拆 messages 可能造成大范围改动，不适合第一波。

**验证命令**

```bash
node scripts/starter-checks.js content-readiness
pnpm content:check
pnpm exec vitest run tests/architecture/product-market-slug-contract.test.ts tests/architecture/website-config-runtime-boundary.test.ts
```

**是否适合自动修**

部分适合。replacement surface index 和 proof guard 适合自动修；大规模配置合并或 messages 拆分不适合第一波自动修。

## 风险排序总览

| 排序 | ID | 核心问题 | 风险等级 | 是否进入第一波 |
| --- | --- | --- | --- | --- |
| 1 | F-01 | `ALLOW_MEMORY_RATE_LIMIT=false` 被 production gate 误判 | High | 是 |
| 2 | F-02 | preview skip runtime contract 容易误读成 launch ready | High | 是 |
| 3 | F-03 | locale 真相源分裂 | Medium | 是 |
| 4 | F-07 | `.dev.vars.example` 落后于 env truth | Medium | 是 |
| 5 | F-04 | `starter-checks.js` 多职责脚本仍过大 | Medium | 是，限低风险命令 |
| 6 | F-06 | E2E / CI proof 边界容易被误读 | Medium | 第二波 |
| 7 | F-08 | 替换面文档化但执行不够顺手 | Medium | 第二波 |
| 8 | F-05 | CSP strict 命名强度与实际策略有落差 | Medium | 第二波 / proof-only |

