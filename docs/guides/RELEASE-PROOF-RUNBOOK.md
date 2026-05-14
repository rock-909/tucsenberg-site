# 发布证明执行手册

## 目的

这份文档定义 Tier A 和 production-sensitive 改动的串行 release-proof 流程。

适用范围：

- `src/middleware.ts`
- locale redirect / locale cookie / security headers
- Cloudflare / OpenNext build chain
- Tier A 翻译关键路径
- `src/config/single-site*.ts` 和 `src/constants/product-specs/**`
- contact / inquiry / abuse-protection 的运行时行为

当前单站 authoring split 要始终记住：

- `src/config/single-site.ts`
- `src/config/single-site-page-expression.ts`
- `src/config/single-site-seo.ts`

在给 Cloudflare 故障命名前，先用：

- [`CLOUDFLARE-ISSUE-TAXONOMY.md`](./CLOUDFLARE-ISSUE-TAXONOMY.md)

做分类。

## Release-Proof Flow

Canonical 入口是：

```bash
pnpm release:verify
```

它当前由 `node scripts/starter-checks.js release-verify` 内置顺序执行：

```bash
node scripts/starter-checks.js truth-docs
node scripts/starter-checks.js cf-official-compare --source-only
pnpm type-check
pnpm lint:check
pnpm exec vitest run tests/unit/middleware.test.ts src/__tests__/middleware-locale-cookie.test.ts src/i18n/__tests__/request.test.ts src/lib/__tests__/load-messages.fallback.test.ts
pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts
pnpm exec vitest run tests/integration/api/health.test.ts src/__tests__/middleware-locale-cookie.test.ts
node scripts/starter-checks.js translations
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
CI=1 pnpm exec playwright test tests/e2e/no-js-html-contract.spec.ts tests/e2e/navigation.spec.ts tests/e2e/contact-form-smoke.spec.ts --project=chromium
```

For starter-derived website readiness, add:

```bash
node scripts/starter-checks.js content-readiness
node scripts/starter-checks.js client-boundary
```

These commands prove content residue and source client-boundary budget only. They do not replace deployed preview proof, observability proof, form canary, or owner signoff.

Local release proof is not public launch proof. Public launch still requires `PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config`, deployed smoke against the real URL, deployed lead canary, and owner signoff.

## 为什么要这个顺序

- 先跑 docs-truth：先抓 stale 规则和假真相，别让后面的绿构建替它洗白
- 高风险面不再靠额外脚本兜底，直接跑对应 focused suites
- 先校验翻译，再进 build，失败更快
- `type-check` 早于构建；它会先运行 `next typegen`，再做 TypeScript 检查
- `next-env.d.ts` 是 Next.js 生成文件：保留在 TypeScript `include` 里，但不入库；提交前只确认它没有作为未跟踪源码被带入
- `build` 早于 `website:build:cf`，因为两条线仍共享构建产物族
- `pnpm exec wrangler deploy --dry-run --env preview` 跟在 `website:build:cf` 后面，作为当前更强的本地 Cloudflare deploy-artifact proof
- 最后跑 release smoke，因为它是 release bundle 的浏览器冒烟层
- 如果改动重接了单站真相层或 cutover gate，发布前还要补：
  - `node scripts/starter-checks.js truth-docs`
  - `node scripts/starter-checks.js translations`
  - `pnpm exec vitest run tests/unit/i18n.test.ts src/i18n/__tests__/request.test.ts src/lib/__tests__/load-messages.fallback.test.ts`
- Contact 页面 proof 现在要理解成 **Browser contact route handler**：浏览器联系表单走 `/api/contact`，`src/lib/actions/contact.ts` 只是兼容入口
- preview deploy 当前统一入口是 `node scripts/starter-checks.js cf-preview-deployed`，底层使用 `pnpm exec opennextjs-cloudflare deploy --env preview`
- production deploy 当前统一走 `pnpm exec opennextjs-cloudflare deploy --env production`

## Dirty Worktree vs Clean Branch Rule

如果当前分支是 **dirty worktree**，也就是混着无关改动，完成证据必须拆两层。

### 1. dirty worktree targeted proof

先证明你这次改到的 seam：

```bash
node scripts/starter-checks.js truth-docs
node scripts/starter-checks.js cf-official-compare --source-only
```

再按需补 change-scoped suites 和串行构建：

```bash
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

这叫 **targeted proof**。

它足以说明：你这次改的治理面、页面表达层或真相层已经有 fresh evidence。

如果碰到 `src/config/single-site-page-expression.ts` 或 `src/config/single-site-seo.ts`，汇报时要直接点名，不要模糊说成“single-site config 改了”。

### 2. clean branch full proof

只有把无关改动隔离到 **clean branch** 或独立 worktree 后，才可以拿完整 proof bundle 做全仓结论：

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
```

如果改动仍然是 release-facing，或者还碰到 Cloudflare / runtime-sensitive surface，再继续补完整 release-proof bundle。

规则：

- 不能只靠 dirty worktree targeted proof 就说“全关了”
- 不能把 unrelated dirty failures 甩锅给你这次碰的治理线
- targeted proof 和 clean branch proof 必须分开汇报

## Site Cutover Preflight

主树里已经没有 canonical `pnpm preflight:site-cutover` 命令了。  
如果变更碰到 single-site truth 或 skeleton removal，直接跑 live baseline：

```bash
APP_ENV=preview NEXT_PUBLIC_SITE_URL=https://preview.example.com NODE_ENV=production node scripts/starter-checks.js validate-production-config
node scripts/starter-checks.js truth-docs
node scripts/starter-checks.js translations
pnpm exec vitest run tests/unit/i18n.test.ts src/i18n/__tests__/request.test.ts src/lib/__tests__/load-messages.fallback.test.ts
pnpm build
```

最终 signoff 前，把下面三条视为单站真相面的基线证明：

- `node scripts/starter-checks.js truth-docs`
- `node scripts/starter-checks.js translations`
- `pnpm exec vitest run tests/unit/i18n.test.ts src/i18n/__tests__/request.test.ts src/lib/__tests__/load-messages.fallback.test.ts`

## Preview Degraded-Mode Exception Contract

- Current contract source：主树里已经退场
- Contract checker：主树里已经退场
- 当前状态：只剩历史意义；现行 preview proof 需要真实 preview secrets，不能再靠 degraded flag 混过去

## 重要约束

- `pnpm build` 和 `pnpm website:build:cf` 绝对不要并行跑
- fast local gate 不是 release proof
- release proof 比 CI proof 更强，因为它考虑改动类型和平台边界
- 如果这次改动本身就碰了 Cloudflare build chain，signoff 前额外再补一次 fresh `pnpm website:build:cf`
- canonical final Cloudflare preview proof 是 `node scripts/starter-checks.js cf-preview-deployed`
- preview proof 已经包含 deployed GET smoke，所以 preview workflow 不要再补第二套 GET smoke；但正式公开前仍要单独跑 deployed lead canary manual launch gate
- 如果需要更底层的原语，再手动跑真实 preview 发布加：
  - `node scripts/starter-checks.js deployed-smoke --base-url <deployment-url>`
- Cloudflare 相关步骤失败时，必须记清楚它属于：
  - platform-entry issue
  - generated-artifact issue
  - current-site runtime regression
  - final deployed behavior issue

## 最低接受 / 拒绝规则

- release-proof 流程里只要有一步失败，就不能叫 release-proven
- 对 Tier A 改动来说，fast gate 变绿也不能覆盖缺失的 release-proof

## After Release-Proof

当改动拿到 release-proof 后，下一步就是进入人类 release decision。

release-proof 只结束技术证据阶段。  
它本身不自动授权发布。

## Deployed lead canary manual launch gate

`pnpm release:verify` proves the local/build/release smoke floor. It does not prove that a deployed buyer inquiry writes to Airtable or triggers the deployed lead notification path.

Before broad public launch, set `DEPLOYED_BASE_URL` to the deployed preview or production URL and run:

```bash
POST_DEPLOY_TEST=1 PLAYWRIGHT_BASE_URL="$DEPLOYED_BASE_URL" pnpm exec playwright test tests/e2e/smoke/
```

Passing criteria:

- the deployed Contact form submits successfully;
- the test records the submitted reference data;
- Airtable/Resend/Turnstile credentials are the deployed environment credentials;
- failures block public launch until investigated.

The current Playwright canary verifies the Airtable record, so it proves
`recordCreated` for the deployed contact path. It does not automatically inspect
the owner inbox or Resend event stream. `ownerNotified` remains separate:
owner notification still needs manual target-system confirmation before public
launch signoff.

This is a manual launch gate because it depends on deployed secrets and external service state.

## Middleware to proxy migration lane

The Next.js installed docs under `node_modules/next/dist/docs/` describe `proxy.ts` as the renamed convention for middleware. The current Cloudflare/OpenNext lane keeps `src/middleware.ts` until a separate migration branch proves `pnpm build`, `pnpm website:build:cf`, local preview smoke, strict preview smoke, and deployed smoke.

This migration is not part of the launch trust asset repair wave.
