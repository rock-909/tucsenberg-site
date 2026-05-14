# Repair Backlog

本 backlog 最初只把问题转成有限任务。当前执行状态见下面的
`Execution status - 2026-05-13`。路径均相对
`/Users/Data/workspace/showcase-website-starter`。

## Execution status - 2026-05-13

Wave 1: completed.

- F-01 / W1-01 completed: `ALLOW_MEMORY_RATE_LIMIT=false` no longer trips the
  production runtime gate.
- F-03 / W1-02 completed: locale truth parity is guarded.
- F-07 / W1-03 completed: `.dev.vars.example` now states its local Cloudflare
  preview boundary.
- F-04 / W1-04 completed: `translations` was extracted from
  `scripts/starter-checks.js` while preserving the public CLI.
- F-02 / W1-05 completed: `PUBLIC_LAUNCH_STRICT=true APP_ENV=preview` now runs
  the production runtime contract while default preview remains convenient.

Wave 2: completed.

- F-06 / W2-01 completed: proof lane labels distinguish `local/test-mode`,
  `deployed-smoke`, and `real-service-canary`.
- F-08 / W2-02 completed: `docs/website/replacement-surface-index.md` now gives
  derived projects a replacement surface index.
- F-05 / W2-03 completed: CSP strict wording is now static-compatible, not
  nonce-level strict CSP.

Additional decision/proof boundaries completed:

- `middleware.ts -> proxy.ts`: official-doc-only decision recorded in
  `docs/website/proxy-migration-official-doc-check.md`; no runtime migration was
  performed.
- nonce CSP: feasibility decision recorded in
  `docs/website/nonce-csp-feasibility.md`; nonce CSP was not implemented.
- real-service-canary: release runbook now separates Airtable `recordCreated`
  proof from manual `ownerNotified` / owner notification confirmation.

Derived-project dry-run follow-ups completed:

- `content-readiness` now reports starter identity residue.
- `content-readiness --strict-client-launch` promotes client-launch residue to
  hard errors.
- public trust validation now rejects `.example` emails and fake US `555` phone
  values.

Do not treat the original wave list as pending. It remains below as the original
repair plan and verification reference. Current execution evidence lives in
`.context/goal-repair/PROGRESS.md`.

## 原则

- 先修会误伤 adopter 或误导上线判断的问题。
- 每一波都要小，能验证，能回滚。
- 不把“整理代码”和“改变 proof 口径”混在一个任务里。
- 不碰 `src/middleware.ts -> src/proxy.ts` 迁移，除非单独开 Cloudflare/OpenNext proof lane。
- 不做 strict CSP nonce，除非单独证明 dynamic rendering / Cache Components / Cloudflare 不受影响。
- 不自动向真实外部服务提交 canary，除非 owner 明确确认目标环境。

## Wave 1 - 最值得先修的 5 个任务

### W1-01 - 修正 `ALLOW_MEMORY_RATE_LIMIT=false` production gate 误判

**对应 finding**：F-01  
**任务目标**：`false` 不应被当成启用内存限流；`true` 仍必须阻断 production strict gate。  
**建议文件范围**

- `scripts/starter-checks.js`
- `tests/unit/scripts/validate-production-config.test.ts`

**修复建议**

- 把 `ALLOW_MEMORY_RATE_LIMIT` 的 production 判断改为 `isTrue(env, "ALLOW_MEMORY_RATE_LIMIT")`。
- 增加 `"false"` 测试。

**风险**

低。不要顺手改其他 production runtime contract。

**验证命令**

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
PUBLIC_LAUNCH_STRICT=true APP_ENV=production node scripts/starter-checks.js validate-production-config
```

**是否适合自动修**

是。

---

### W1-02 - 加 locale parity guard，先防漂移，不做大重构

**对应 finding**：F-03  
**任务目标**：让 runtime locale、translation checker、工具配置至少被测试锁住。  
**建议文件范围**

- `i18n-locales.config.js`
- `i18n.json`
- `src/config/paths/locales-config.ts`
- 新增或扩展 `tests/architecture/**` locale parity 测试

**修复建议**

- 新增 architecture test，比对：
  - `LOCALES_CONFIG.locales`
  - `i18n-locales.config.js.locales`
  - `i18n.json.sourceLocale` / `targetLocales`
- 修正 `i18n-locales.config.js` 注释，不再说“新增语言只改这里”。

**风险**

低到中。第一波不要重构 Playwright locale 读取方式；先加 guard。

**验证命令**

```bash
pnpm exec vitest run src/i18n/__tests__/routing.test.ts tests/unit/i18n-message-contract.test.ts
node scripts/starter-checks.js translations
```

**是否适合自动修**

是。

---

### W1-03 - 对齐 `.dev.vars.example` 与 env 文档边界

**对应 finding**：F-07  
**任务目标**：让 Cloudflare 本地开发 env 示例不再明显落后。  
**建议文件范围**

- `.dev.vars.example`
- `.env.example`
- `docs/website/env 设置.md`
- `tests/architecture/env-example-parity.test.ts`

**修复建议**

优先选保守方案：

- 在 `.dev.vars.example` 顶部明确它是“Cloudflare local preview minimal example”。
- 补充必须从 `.env.example` / dashboard / secrets 同步的关键 server-only 变量清单。
- 如已有 parity test 只覆盖 `.env.example`，补一条 `.dev.vars.example` 的最小边界测试。

**风险**

低。注意不要把示例写成真实生产默认值。

**验证命令**

```bash
pnpm exec vitest run tests/architecture/env-example-parity.test.ts
pnpm type-check
```

**是否适合自动修**

是。

---

### W1-04 - 继续小步拆 `starter-checks.js`，只抽低风险命令

**对应 finding**：F-04  
**任务目标**：降低大 CLI 维护风险，但不改变公开命令。  
**建议文件范围**

- `scripts/starter-checks.js`
- `scripts/quality/checks/translations.js` 或 `scripts/quality/checks/content-readiness.js`
- 对应 focused tests

**修复建议**

- 二选一，只做一个：
  - 抽 `translations`；或
  - 抽 `content-readiness`。
- 保留 `node scripts/starter-checks.js <command>`。
- 不碰 `release-verify`、`cf-preview-smoke`、`deployed-smoke`、`cf-preview-deployed`、`cf-official-compare`。

**风险**

中。技术风险不大，主要是不能误改 CLI 行为、退出码、输出路径。

**验证命令**

```bash
node scripts/starter-checks.js translations
pnpm content:check
pnpm exec vitest run tests/unit/i18n-message-contract.test.ts tests/unit/scripts/content-slug-sync.test.ts
```

**是否适合自动修**

是，但必须小步。

---

### W1-05 - 给 preview strict proof 一个明确入口或测试边界

**对应 finding**：F-02  
**任务目标**：保留默认 preview 便利性，同时让“公开上线前 strict runtime contract”可被明确执行。  
**建议文件范围**

- `scripts/starter-checks.js`
- `tests/unit/scripts/validate-production-config.test.ts`
- `.github/workflows/cloudflare-deploy.yml`
- `docs/website/quality-proof.md`

**修复建议**

- 不要把默认 preview 直接改成 strict。
- 增加 `PUBLIC_LAUNCH_STRICT=true APP_ENV=preview` 时不跳过 runtime contract 的测试，或新增清晰命令别名。
- workflow / docs 里把 preview proof 和 launch strict proof 分开。

**风险**

中。涉及 proof 口径，容易影响部署流程认知；建议在 W1 前四项稳定后再做。

**验证命令**

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
PUBLIC_LAUNCH_STRICT=true APP_ENV=preview node scripts/starter-checks.js validate-production-config
node scripts/starter-checks.js cf-preview-deployed
```

**是否适合自动修**

部分适合。脚本和测试适合，workflow 口径需人工确认。

## Wave 2 - 第二波治理任务

### W2-01 - 给 proof lane 输出加标签，避免把 local/test-mode 当真实外部服务证明

**对应 finding**：F-06  
**任务目标**：让测试报告 / 文档明确区分 `local/test-mode`、`deployed-smoke`、`real-service-canary`。  
**建议文件范围**

- `docs/website/quality-proof.md`
- `playwright.config.ts`
- `tests/e2e/contact-form-smoke.spec.ts`
- `tests/e2e/smoke/post-deploy-form.spec.ts`
- 可选：`scripts/starter-checks.js` proof 输出

**验证命令**

```bash
pnpm test
pnpm exec playwright test tests/e2e/contact-form-smoke.spec.ts --project=chromium
```

**自动修适配度**

部分适合。不要自动打真实外部服务。

---

### W2-02 - 生成 replacement surface index，让派生项目知道“该改哪”

**对应 finding**：F-08  
**任务目标**：把替换面从文档描述升级成可执行清单。  
**建议文件范围**

- `docs/website/新项目替换清单.md`
- `docs/website/配置真相源.md`
- `scripts/starter-checks.js` 或新的 quality check module
- 可选：`docs/website/replacement-surface-index.md`

**验证命令**

```bash
node scripts/starter-checks.js content-readiness
pnpm content:check
pnpm exec vitest run tests/architecture/product-market-slug-contract.test.ts tests/architecture/website-config-runtime-boundary.test.ts
```

**自动修适配度**

部分适合。清单生成适合；大规模 config 合并不适合。

---

### W2-03 - 调整 CSP mode 命名/文档，避免 “strict” 被误读

**对应 finding**：F-05  
**任务目标**：明确当前是 static-compatible CSP，不是 nonce-level strict CSP。  
**建议文件范围**

- `src/config/security.ts`
- `src/config/__tests__/security.test.ts`
- `.claude/rules/security.md`
- `docs/website/quality-proof.md` 或 security doc

**验证命令**

```bash
pnpm exec vitest run src/config/__tests__/security.test.ts tests/architecture/middleware-boundary.test.ts
pnpm build
pnpm website:build:cf
```

**自动修适配度**

部分适合。命名/文档适合；nonce CSP 不适合。

## Later / proof-only lanes

这些不建议放进第一波，也不要顺手做：

1. **`middleware.ts -> proxy.ts` 迁移**
   - 只有当 Cloudflare/OpenNext 对该路径有 fresh proof 时再做。
   - 最小证明：

     ```bash
     pnpm build
     pnpm website:build:cf
     node scripts/starter-checks.js cf-preview-smoke
     node scripts/starter-checks.js deployed-smoke --base-url "$DEPLOYED_BASE_URL"
     ```

2. **strict CSP nonce lane**
   - 需要动态渲染、proxy nonce、Cloudflare/OpenNext、Cache Components 一起证明。
   - 不应混入普通 security cleanup。

3. **真实外部服务 canary 自动化**
   - 需要明确非生产目标、Turnstile 策略、Airtable/CRM 清理策略、owner notification 验收方式。
   - 默认只能 dry-run 或手动确认后运行。

4. **messages 拆分 / config wrapper 合并**
   - 可能是长期值得做的事，但第一步应先有 replacement surface index 和同步测试。

## 有限 backlog 总数

本轮有限 backlog 共 8 个 finding，对应：

- Wave 1：5 个任务
- Wave 2：3 个任务
- Later / proof-only：4 条禁止顺手做的 proof lane

第一波最多 5 个，不建议继续扩。
