# 质量证明指南

质量检查脚本的拆分计划记录在 `docs/website/starter-checks-split-plan.md`。
现在所有 `node scripts/starter-checks.js <command>` 公开命令都是兼容面；后续内部即使拆文件，也不能随便换命令名、参数习惯或证明口径。

这份文档说明新项目从 starter 派生后，怎样证明“网站真的适合继续推进”，而不是只看构建或测试绿灯。

核心原则：

- 门禁绿只是最低运行底线，不等于内容、转化、部署都可靠。
- 本地证明、CI 证明、预览部署证明、上线前人工确认要分开说。
- 不把示例品牌、示例产品、示例联系方式当成真实上线内容。
- 不把旧项目的脚本、域名、产品事实、第三方集成配置原样搬进新项目。

## 起步后先做什么

新项目替换品牌和内容后，先跑基础验证：

```bash
pnpm brand:check
pnpm content:check
node scripts/starter-checks.js content-readiness
node scripts/starter-checks.js client-boundary
pnpm component:check
pnpm website:check
pnpm website:build:cf
```

这些命令能证明代码和配置没有明显破损，但还不能证明真实部署环境、真实表单写入、真实客户信任资产已经准备好。

Local release proof is not public launch proof. Public launch still requires `PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config`, deployed smoke against the real URL, deployed lead canary, and owner signoff.

## Proof lane labels

在报告、handoff 和发布记录里统一使用这些标签，避免把本地测试、部署可访问性和真实外部服务链路混成一个“已证明”：

- `local/test-mode`：本地或 CI 的结构、页面、交互 smoke，允许测试 key、mock 或 test-mode 服务；不能证明真实 Turnstile、CRM、邮件或线上提交链路。
- `deployed-smoke`：打到 preview/staging/production URL 的页面、健康接口或静态资源检查；证明部署地址可访问，不证明真实线索已送达。
- `real-service-canary`：在明确的非生产或上线前目标上，用真实配置服务跑一次 canary；只有记录写入和 owner notification 都被核对后，才能说外部服务链路闭环。

## Component proof 边界

`pnpm component:check` 证明三件事：

- `src/components/ui/` 里的可复用 UI 基础组件都有 registry 和 Storybook story；
- 生产组件没有绕过 UI wrapper 直接用 Radix，也没有明显绕过设计 token；
- Storybook 当前能构建出来。

它不证明每一个业务区块、页面区块、表单组合都有 Storybook 覆盖。业务/page-level stories 是 starter 的示例和评审辅助，可以逐步增加，但不作为派生项目的硬门禁。

### Optional Lighthouse proof boundary

Lighthouse is a bundled manual performance check, not a default CI gate and not a git-hook task.

Use it only when a local production build is available:

```bash
pnpm build
pnpm website:lighthouse
```

This command uses `lighthouserc.js` and `@lhci/cli`. It can help review Core Web Vitals and payload signals on local rendered pages, but it does not replace deployed smoke tests, real-device review, or owner launch signoff.

### Semgrep proof boundary

Semgrep local CLI may be unavailable on a developer machine. When local `pnpm exec semgrep --config semgrep.yml src` returns `Command "semgrep" not found`, record the lane as blocked locally, not passed. CI owns the canonical blocking Semgrep scan through `semgrep scan --error --severity ERROR --config semgrep.yml src` in the official `semgrep/semgrep` container. INFO/WARNING heuristic findings are review signals, not CI blockers.

### Cloudflare platform signal

Cloudflare platform detection uses `DEPLOYMENT_PLATFORM=cloudflare` as the canonical signal. `DEPLOY_TARGET=cloudflare` is accepted only as a legacy compatibility alias.

### CSP proof boundary

`NEXT_PUBLIC_SECURITY_MODE=strict` means enforced security headers with the current static-compatible CSP. It is not nonce-level strict CSP.

This starter intentionally does not add a proxy-generated nonce by default. A nonce CSP lane must be opened separately because it requires dynamic rendering, Cloudflare/OpenNext proof, and fresh checks for Cache Components, Turnstile, analytics, deployed smoke, and form canary behavior.

Current nonce feasibility decision: `docs/website/nonce-csp-feasibility.md`.

### Warning baseline

Generated warning baseline lives in `docs/quality/cloudflare-warning-baseline.md` and `docs/quality/storybook-warning-baseline.md`. A known warning baseline is not a pass/fail claim; it prevents old generated warnings from hiding new warning categories.

React Doctor runs as an error-level quality gate: error blocks CI; warning is backlog. `pnpm react:doctor:report` is the manual JSON report command for human review. Warning classification is human backlog/reference, not a separate CI governance layer, and the former raw baseline is not enforced. React Doctor warnings can still be interpreted with `docs/quality/react-doctor-policy.md`, and known project exceptions are recorded in `docs/quality/react-doctor-exceptions.md`. Do not treat the warning count as a count of real production bugs.

## 四层证明口径

| 层级 | 目的 | 典型证明 | 不能证明什么 |
| --- | --- | --- | --- |
| 本地基础门禁 | 快速发现代码和配置错误 | `pnpm type-check`、`pnpm lint:check`、`pnpm test` | 真实浏览器、真实部署、真实询盘 |
| 本地发布证明 | 证明当前机器上能完成生产构建 | `pnpm build`、`pnpm website:build:cf`、`pnpm release:verify` | CI 环境和线上环境一定可用 |
| CI 证明 | 证明干净环境可重复通过 | GitHub Actions 的 CI/CD Pipeline | 部署后的页面和外部服务一定可用 |
| 部署证明 | 证明预览或生产 URL 可访问 | deployed smoke、关键页面检查、健康接口检查 | 业务内容一定真实、联系人已确认 |

说结论时要精确：

- “本地构建通过”只代表本地构建通过。
- “CI 通过”只代表仓库门禁通过。
- “预览部署可访问”只代表部署 URL 能响应。
- “可以公开上线”还需要真实品牌资产、联系方式、内容、表单链路和 owner signoff。

## 可复用质量证明能力

从先前项目的质量提升中可以复用的是方法，不是项目事实。

### 1. 预览页面证明

目标：对预览部署 URL 检查关键页面，而不是只看 deploy job 成功。

建议覆盖：

- 首页
- 联系页
- 产品或服务列表页
- 1 个核心产品/服务详情页
- About / Terms / Privacy 这类信任页

建议检查：

- 页面返回 200。
- URL 不回落到 localhost。
- 每页只有一个 canonical。
- hreflang 数量合理。
- 页面有明确 CTA。
- JSON-LD 可解析。
- 没有公开示例联系方式、示例产品图说明、默认 logo 路径。

注意：deployed proof 必须接在部署后等待就绪之后执行。不要在部署 URL 刚输出时提前探测，否则容易制造假红灯。

### 2. 内容就绪检查

目标：防止 starter 示例内容进入买家可见页面。

只应该扫描买家可见输入面：

- `content/pages/**`
- `messages/{locale}/{critical,deferred}.json`
- `public/images/**`
- `src/config/single-site.ts`
- `src/config/single-site-seo.ts`
- `src/config/single-site-navigation.ts`
- `src/config/single-site-links.ts`
- `src/config/single-site-page-expression.ts`
- `src/config/single-site-product-catalog.ts`
- `src/constants/product-specs/**`
- 明确会进入页面或结构化数据的 runtime config

不要扫描：

- `**/__tests__/**`
- `*.test.*`
- guardrail 常量文件
- docs / reports / generated artifacts

否则会误扫测试里故意保留的坏样本，导致永远红，甚至诱导删除有价值的测试。

Starter 现在提供 `node scripts/starter-checks.js content-readiness` 做第一轮自动检查。它只扫上面这些买家可见输入面，并故意排除 docs、tests、reports 和 generated output；翻译检查以 `messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json` 为准。

client launch 前还要跑 `PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config`。这个 strict gate 会把 starter 公司身份、示例域名、示例邮箱、SEO 默认值、待确认 logo/product photos、`PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED`，以及 About / Contact / Privacy / Terms 这类 owner-reviewed 内容作为上线阻断项。

单站公司身份的 canonical authoring source 是 `src/config/single-site.ts`。导航和链接看 `src/config/single-site-navigation.ts` 与 `src/config/single-site-links.ts`，页面表达看 `src/config/single-site-page-expression.ts`，SEO crawl / indexing 看 `src/config/single-site-seo.ts`。

这个命令能证明明显的 starter / fake / placeholder 残留有没有被扫出来；它不能证明内容法律上正确、文案足够有说服力，或已经得到 owner 确认。

对产品/服务页来说，catalog truth 是一整组输入面：`src/config/single-site-product-catalog.ts`、`src/constants/product-specs/**`、messages 文案和产品图片都要一起替换。starter 示例可以存在于 starter 仓库；公开客户站不能把这些示例当成真实销售事实。

crawl / indexing truth 也要单独看：`src/config/single-site-seo.ts` 控制 sitemap、robots、公共静态页面索引策略和 lastmod 来源。派生项目如果改了页面结构、产品市场或公开索引策略，不能只改页面文案或站点标题。

### 3. 预览健康接口证明

目标：确认部署后的健康接口可用，并且不会暴露环境、配置或内部排障字段。

最低检查：

- `/api/health` 返回 200。
- 响应体是 `{ "status": "ok" }`。
- 响应带 `cache-control: no-store`。
- 响应不带 `x-request-id` 或 `x-observability-surface` 这类内部 observability header。

这不是业务页面证明，也不是询盘链路证明；它只证明最小健康检查路径可用且不会输出内部运行细节。

### Owner traffic dashboard proof

`/ops/traffic` is an owner-only proof surface. It proves the deployed site can read real Cloudflare traffic data for the configured hostname.

Minimum proof:

- missing credentials show a safe unconfigured state;
- unauthorized visitors cannot see data;
- configured owner access shows Cloudflare analytics data;
- the API token is never rendered in HTML, browser JavaScript, logs, or `NEXT_PUBLIC_*`.

This proof does not prove sales quality, legal readiness, or form delivery.

### 4. 表单 canary

目标：证明联系/询盘表单链路在部署环境可用。

默认应该是 dry-run，不提交真实数据。  
只有满足下面条件时，才允许 strict submit：

- 使用当前真实表单 API 的 payload，不写旧项目 payload。
- 有非生产测试策略，例如 Turnstile 测试 token 或明确 staging bypass。
- 默认不要求重复提交键；strict submit 只能打非生产目标，并且要接受重复测试线索或在目标系统里人工清理。真实客户项目如果自行加入重复提交保护，再把对应字段放进 canary payload。
- 目标 URL 限制在 localhost、preview、staging 或明确的非生产域名。
- 报告记录提交 reference，便于人工去 Airtable/邮件系统核对。

For contact and product inquiry launch canaries, success means both:

- a lead record exists in Airtable or the configured CRM;
- the owner notification was delivered or the configured owner-notification fallback was explicitly accepted.

The runtime result distinguishes `recordCreated` from `ownerNotified`; do not treat record creation alone as full owner delivery proof.

不要把“错误请求被拒绝”说成“表单链路闭环已证明”。

### 5. Client boundary budget

目标：防止页面无意中变成大量 client component。

建议做法：

- 统计 `src/**/*.{ts,tsx}` 里顶层 `"use client"` 文件。
- 排除测试和工具目录。
- baseline 放在 `docs/quality/client-boundary-budget.json`。
- 实际报告写入 `reports/quality/**`，脚本必须自动创建目录。

如果新增 client boundary，要能解释为什么这个组件必须在浏览器里跑。

Starter 现在提供 `node scripts/starter-checks.js client-boundary`。它会把 `src/` 下顶层 `"use client"` 文件和 `docs/quality/client-boundary-budget.json` 对比，并把当前报告写到 `reports/quality/client-boundary-budget.json`。

这是源码结构 proof，不是浏览器行为 proof。它不证明 hydration 行为、页面 UX 或真实浏览器里的交互质量。

### 6. Route mode proof

目标：记录关键路由是 static、PPR 还是 dynamic。

当前建议先作为 manual proof：

- 跑一次 `pnpm build`。
- 记录 Next.js route summary。
- 对首页、联系页、产品/服务页、隐私/条款页记录当前模式。

只有脚本能从稳定 build artifact 生成 current snapshot，并能在 clean checkout 下自己创建报告目录时，才把它升级成自动门禁。

Current route mode notes live in `docs/quality/route-mode-contract.md`. The snapshot helper can parse a saved build log with `pnpm route-mode:snapshot <build-output.txt>` and writes `reports/quality/route-mode-snapshot.json`.

### 6.1 Generated reports retention

`reports/**` 是本地生成报告目录，不是人工审计文档目录。为了避免本地
timestamped reports 越堆越多，可以先 dry-run：

```bash
pnpm reports:retention
```

需要实际清理时再显式执行：

```bash
node scripts/quality/retention-reports.mjs --keep 5
```

这个脚本只扫描 `reports/**`，默认每类 timestamped generated report 保留最近
5 份，永远保留 `*-latest.*`。它不会永久删除文件；被清理的旧报告会移动到
`reports/.trash/retention-*/`，方便回滚或人工核对。

这不是审计资料清理命令。不要用它处理 `docs/audits/**`、`docs/superpowers/**`
或 owner 手写的 Markdown 结论文档。

### 7. Cloudflare middleware/proxy 边界

Next.js 当前推荐 `proxy.ts`，并会输出 Next.js deprecation warning。
但这个 starter 暂不迁移：

- Do not rename `src/middleware.ts` to `src/proxy.ts`.
- Cloudflare/OpenNext support is not acceptable for a blind migration.
- 当前 `src/middleware.ts` 只负责 next-intl locale routing，稳定性优先于消除 warning。
- 这条 warning 作为 known platform-transition warning 记录，不作为 public launch blocker。

Current decision record: `docs/website/proxy-migration-official-doc-check.md`
(`official-doc-only check`). This current decision does not run a proxy runtime
migration test and does not create `src/proxy.ts`.

如果未来要迁移，必须单独开 proof lane，至少证明：

```bash
pnpm build
pnpm website:build:cf
node scripts/starter-checks.js cf-preview-smoke
```

如果有真实 preview deployment URL，再补：

```bash
node scripts/starter-checks.js deployed-smoke --base-url "$DEPLOYED_BASE_URL"
```

### 8. Cloudflare image transformation proof

starter baseline 不启用 Cloudflare Image Optimization。默认 `pnpm build`、`pnpm website:build:cf` 和 `pnpm release:verify` 只证明普通 Cloudflare/OpenNext 构建链路，不证明 Cloudflare Transformations 或 Cloudflare Images 的真实边缘行为。

如果派生项目选择 Cloudflare Transformations 或 Cloudflare Images，至少补充：

```bash
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
node scripts/starter-checks.js deployed-smoke --base-url "$DEPLOYED_BASE_URL"
```

还要人工确认一个 buyer-visible transformed image URL：

- URL 来自真实 deployed Cloudflare URL；
- 图片是公开页面上买家能看到的图片，不是隐藏测试 fixture；
- resize、格式转换或 variant 行为符合项目选择的图片策略；
- 失败时有明确 fallback 或回滚路径。

不要把本地构建通过说成 Cloudflare 图片优化已经证明。

## 上线前人工确认清单

这些不是代码能自动替你确认的事：

- 真实公司名、地址、电话、邮箱已经 owner 确认。
- logo、favicon、OG 图、产品/服务图片不是 starter 示例。
- Terms / Privacy / About 文案适合当前公司。
- 联系/询盘表单能在部署环境写入目标系统。
- 邮件通知或 CRM/Airtable 记录可以被人工查到。
- analytics、监控、错误收集配置符合当前项目隐私要求。

## 什么不能从旧项目带过来

不要迁移：

- 旧公司名、旧域名、旧电话、旧产品规格。
- 旧项目的 Airtable 表名、字段名、base id。
- 旧项目专用 Cloudflare worker 名、zone、route。
- 旧项目的 proof 结果报告。
- 旧项目里“只是刚好能跑”的测试 fixture。

可以迁移：

- proof 分层口径。
- 页面合同检查思路。
- content readiness 的扫描范围规则。
- preview observability 的最小 header 合同。
- client boundary budget 的控制方式。
- staging/dry-run canary 的安全边界。

## 推荐落地顺序

1. 先替换品牌、内容、图片和部署配置。
2. 跑 `pnpm brand:check`、`pnpm content:check`、`node scripts/starter-checks.js content-readiness`、`node scripts/starter-checks.js client-boundary`、`pnpm website:check`。
3. 跑 `pnpm build`，再串行跑 `pnpm website:build:cf`。
4. 建立预览部署 URL。
5. 对预览 URL 做页面合同和健康接口检查。
6. dry-run 表单 canary。
7. 上线前由 owner 确认真实信任资产和真实表单写入。
