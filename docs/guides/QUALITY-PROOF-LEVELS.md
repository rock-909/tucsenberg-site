# 质量证明等级说明

## 目的

这份文档统一定义仓库里的几种 proof level 到底分别证明什么：

- `fast gate`
- `local-full proof`
- `ci-proof`
- `release-proof`

它们不能混着叫，也不能互相冒充。

## Proof Levels

### 1. `fast gate`

用途：

- 本地快速回路
- 适合开发中途反复跑
- 不足以支撑发布级信心

典型命令：

- `pnpm type-check`
- `pnpm lint:check`
- change-scoped `pnpm exec vitest run ...`
- `lefthook` 的 staged / pre-commit / pre-push 检查

它能证明：

- 基础代码质量和安全检查至少跑过一遍
- 部分架构和翻译检查可能已执行

它不能证明：

- coverage gate
- performance gate
- 完整运行时行为
- 双平台构建正确性
- release readiness

适用场景：

- 普通本地迭代
- PR 早期准备

绝不能单独拿它来证明：

- 有运行时 / 平台影响的 Tier A 变更
- 发布决策

### 2. `local-full proof`

用途：

- 在请求 CI 或合并高风险改动前，给出更强的本地证据

最小组合：

- `pnpm type-check`
- `pnpm lint:check`
- `pnpm build`
- `pnpm test`
- 如果涉及 i18n / messages / content，再补 `node scripts/starter-checks.js translations`

按需加跑：

- `pnpm website:build:cf`：平台 / runtime / build-chain 改动
- `pnpm exec wrangler deploy --dry-run --env preview`：Cloudflare 部署 artifact 改动，需要不改远端状态的部署证明时
- Semgrep security scan: CI runs `semgrep scan --error --severity ERROR --config semgrep.yml src` in the official `semgrep/semgrep` container. INFO/WARNING heuristic findings are review signals, not CI blockers. A missing local `semgrep` binary is `Blocked`, not `Passed`.
- `CI=1 pnpm exec playwright test`：关键 UI / runtime 行为改动
- `pnpm build`：改到 `src/config/single-site*.ts`、`src/constants/product-specs/**`、`NEXT_PUBLIC_SITE_KEY` 或站点装配入口
- `pnpm website:build:cf`：同类改动还要证明 Cloudflare 构建链时
- `node scripts/starter-checks.js content-readiness`：改到 `content/pages/**`、`messages/{locale}/{critical,deferred}.json`、`public/images/**`、`src/config/single-site*.ts` 或 `src/constants/product-specs/**` 时运行
- `node scripts/starter-checks.js client-boundary`：改到 client/server component 边界、interactive islands、forms、theme、cookie 或 header/navigation 交互时运行

它能证明：

- 开发者确实主动跑过重型本地检查
- 证据强度已经明显高于 `fast gate`

它仍然不能单独证明：

- 独立 CI 环境也一定没问题
- 已达到发布级多环节确认

适用场景：

- Tier A merges
- runtime / security / i18n / platform 敏感改动

### 2.1 dirty worktree 场景下的 `local-full proof`

如果当前分支是 **dirty worktree**，也就是夹着无关改动，不能把一次大绿灯硬说成整个仓库都被你证明过。

必须拆成两层：

- **targeted proof**：只证明你这次碰的那条线
- **clean branch** proof：在隔离分支或独立 worktree 里再做全仓结论

这个仓库里，常见 targeted proof 是：

- `node scripts/starter-checks.js truth-docs`
- `node scripts/starter-checks.js cf-static-baseline --source-only`
- `node scripts/starter-checks.js truth-docs`
- `pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts`
- `pnpm exec vitest run tests/unit/middleware.test.ts src/__tests__/middleware-locale-cookie.test.ts src/i18n/__tests__/request.test.ts src/lib/__tests__/load-messages.fallback.test.ts`
- matching focused suites from `docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md`
- 变更范围对应的 Vitest 套件
- 串行构建，如 `pnpm build` 后再跑 `pnpm website:build:cf`
- 如果碰到 Cloudflare deploy path，再补 `pnpm exec wrangler deploy --dry-run --env preview`

它能证明：

- 你实际改到的 seam 有 fresh evidence
- 如果改到 `src/config/single-site.ts`、`src/config/single-site-page-expression.ts`、`src/config/single-site-seo.ts`，至少正确跑过针对这三层真相面的窄验证

它不能证明：

- 其他无关 dirty 文件也都通过全仓门禁
- 稍后 clean branch 上的 full proof bundle 已经自动成立

### 3. `ci-proof`

用途：

- 用仓库控制的独立 CI 环境给出统一证据

Source of truth：

- `.github/workflows/ci.yml`

当前 `.github/workflows/ci.yml` 的最低预期：

- TypeScript 检查通过
- lint 和 eslint-disable registry 检查通过
- brand / content / translation shape 检查通过
- client-boundary source budget 检查通过
- unit + integration tests 通过
- lead-family focused proof 通过
- browser E2E smoke 通过
- Next.js build 和 Cloudflare/OpenNext build 通过

它能证明：

- 仓库核心门禁在干净 CI 环境里是绿的
- `node scripts/starter-checks.js content-readiness` 和 `node scripts/starter-checks.js client-boundary` 这类轻量 proof 可以在普通 CI 里跑，因为它们不依赖 preview deployment secrets

它不能单独证明：

- configured Semgrep lane 之外的 security scans 已经执行
- standalone performance benchmark 已经执行
- release-specific deployment health
- 特定环境的 rollout 正确性
- Tier A 场景下的人类 signoff 已完成

适用场景：

- merge confidence
- baseline release candidate confidence

### 4. `release-proof`

用途：

- 这是最高 proof level，给 production-sensitive 改动用

必须使用的场景：

- `src/middleware.ts` 改动
- locale redirect / locale cookie / security headers 改动
- `open-next.config.ts` 或 Cloudflare 部署链改动
- 关键翻译 bundle 或 runtime locale 语义改动
- contact / inquiry / abuse-protection 对生产行为有实质影响的改动

最低预期：

- `local-full proof`
- 成功的 `ci-proof`
- 适用时必须双平台验证：
  - `pnpm build`
  - `pnpm website:build:cf`
- 受影响关键路径的 runtime 检查
- Tier A owner review 要求满足

它能证明：

- 这次改动已经有足够生产级技术证据

## 按改动类型映射

| 改动类型 | 最低 proof |
|---|---|
| Tier A 之外的普通 UI/组件清理 | `fast gate` |
| 普通功能开发，但合并风险不低 | `local-full proof` |
| Tier A 的 runtime / security / i18n / platform 改动 | `local-full proof` 起步 |
| 准备合并前的仓库级确认 | `ci-proof` |
| 生产敏感的 runtime / platform 改动 | `release-proof` |

## 常见误用

- 把 `fast gate` 当成 `ci-proof`
- 把一次本地全绿当成 `release-proof`
- 把 `pnpm build` 通过当成 Cloudflare 也没问题
- 把总体 coverage 当成关键路径稳定证明

## 仓库级补充说明

- `pnpm website:build:cf` 现在走官方 OpenNext Cloudflare CLI，但它和标准构建线仍共享 `.next` 这一类构建产物，所以必须串行跑
- 想拿到更强的标准构建证据，先跑 `pnpm build`，再跑 `pnpm website:build:cf`
- 如果碰到 Cloudflare / OpenNext deploy artifact 行为，`pnpm exec wrangler deploy --dry-run --env preview` 比 stock preview 更强
- 当前 Cloudflare 兼容链里，`src/middleware.ts` 仍是优先入口，不是 `proxy.ts`
- 翻译 proof 不能只看 flat 文件，要同时覆盖 full bundles 和 critical bundles
- site-aware 改动不能只做结构 proof；只要改到站点身份或 overlay seam，至少跑一个 non-default-site build
- 只要碰到 current-truth docs 或 derivative authoring guidance，补跑 `node scripts/starter-checks.js truth-docs`
- 分支是 dirty worktree 时，必须把 targeted proof 和 clean branch proof 分开汇报
- 当前单站 authoring truth 要明确分成三层：
  - `src/config/single-site.ts`
  - `src/config/single-site-page-expression.ts`
  - `src/config/single-site-seo.ts`
