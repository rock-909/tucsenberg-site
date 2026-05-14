# Next Wave

第一波目标：只修最会误导或误伤派生项目的治理问题。最多 5 个，不扩大。

## Current status - 2026-05-13

Wave 1 and Wave 2 are already completed.

Do not restart the first-wave checklist. The original checklist below is kept as
historical context for why the completed work was ordered this way.

Completed:

- F-01: fixed `ALLOW_MEMORY_RATE_LIMIT=false` gate semantics.
- F-03: added locale truth parity guard.
- F-07: clarified `.dev.vars.example` as a local Cloudflare preview example.
- F-04: extracted the low-risk `translations` check.
- F-02: made strict preview run the production runtime contract.
- F-06: added proof lane labels.
- F-08: added replacement surface index.
- F-05: clarified static-compatible CSP wording.

Dedicated lanes only:

- `middleware.ts -> proxy.ts` migration remains a future dedicated migration
  lane, not a cleanup item.
- nonce-level CSP remains a future security proof lane, not the current starter
  default.
- real external service canary automation needs a deployed URL, credentials,
  cleanup policy, and owner notification acceptance path.
- messages split / config wrapper merge should be planned as a separate
  structure change, not folded into this repair wave.

Derived-project dry-run follow-ups are also completed:

- starter identity residue detection in `content-readiness`;
- `content-readiness --strict-client-launch`;
- `.example` email and fake US `555` phone blocking in public trust validation.

## 推荐顺序

### 1. 修 `ALLOW_MEMORY_RATE_LIMIT=false` 误判

**对应 finding**：F-01  
**为什么先做**：这是明确 bug，影响 production strict gate，且修复面很小。  
**文件范围**

- `scripts/starter-checks.js`
- `tests/unit/scripts/validate-production-config.test.ts`

**验证命令**

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
PUBLIC_LAUNCH_STRICT=true APP_ENV=production node scripts/starter-checks.js validate-production-config
```

**自动修**：适合。

---

### 2. 加 locale parity guard

**对应 finding**：F-03  
**为什么第二个做**：新项目加语言是 starter 常见动作，当前 truth source 容易漂移；先加 guard 比大重构更稳。  
**文件范围**

- `src/config/paths/locales-config.ts`
- `i18n-locales.config.js`
- `i18n.json`
- `tests/architecture/**`

**验证命令**

```bash
pnpm exec vitest run src/i18n/__tests__/routing.test.ts tests/unit/i18n-message-contract.test.ts
node scripts/starter-checks.js translations
```

**自动修**：适合。

---

### 3. 对齐 `.dev.vars.example` 的边界

**对应 finding**：F-07  
**为什么第三个做**：这是 adopter-facing 文件，新项目最容易照着复制；现在明显比 `.env.example` 和 env 文档落后。  
**文件范围**

- `.dev.vars.example`
- `.env.example`
- `docs/website/env 设置.md`
- `tests/architecture/env-example-parity.test.ts`

**验证命令**

```bash
pnpm exec vitest run tests/architecture/env-example-parity.test.ts
pnpm type-check
```

**自动修**：适合。

---

### 4. 小步抽 `starter-checks.js` 的低风险命令

**对应 finding**：F-04  
**为什么第四个做**：这是长期维护风险，但不能先动 release/Cloudflare proof；等前三个小修稳定后，再继续瘦身 CLI。  
**文件范围**

- `scripts/starter-checks.js`
- `scripts/quality/checks/translations.js` 或 `scripts/quality/checks/content-readiness.js`

**验证命令**

```bash
node scripts/starter-checks.js translations
pnpm content:check
pnpm exec vitest run tests/unit/i18n-message-contract.test.ts tests/unit/scripts/content-slug-sync.test.ts
```

**自动修**：适合，但一次只抽一个命令。

---

### 5. 给 preview strict proof 加明确入口

**对应 finding**：F-02  
**为什么第五个做**：它影响“能预览”和“可上线”的判断，但涉及 workflow / proof 口径，所以放在第一波最后。  
**文件范围**

- `scripts/starter-checks.js`
- `tests/unit/scripts/validate-production-config.test.ts`
- `.github/workflows/cloudflare-deploy.yml`
- `docs/website/quality-proof.md`

**验证命令**

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts
PUBLIC_LAUNCH_STRICT=true APP_ENV=preview node scripts/starter-checks.js validate-production-config
node scripts/starter-checks.js cf-preview-deployed
```

**自动修**：部分适合。脚本和测试可以自动做，workflow 文案建议人工看一眼。

## 第一波 stop line

第一波不要做这些：

- 不做 `src/middleware.ts -> src/proxy.ts` 迁移。
- 不做 strict CSP nonce。
- 不改 release-verify / Cloudflare deploy proof 的核心行为。
- 不自动提交真实 Airtable / Resend / Turnstile canary。
- 不拆 messages 大文件。
- 不合并 `single-site` / product wrapper / market spec registry。
- 不删除 products、ops、Storybook、governance tests。

## 第一波完成标准

完成后应该能说清楚：

1. `.env.example` 里的 `ALLOW_MEMORY_RATE_LIMIT=false` 不再误伤 production gate。
2. 新增语言时，runtime locale、translation checker、工具配置不会无声漂移。
3. `.dev.vars.example` 不再让 Cloudflare 本地 preview 配置入口显得缺关键边界。
4. `starter-checks.js` 又少一个低风险职责，但公开命令不变。
5. preview proof 和 launch strict proof 的边界更清楚。

## 建议最后验证包

如果第一波 5 项都做完，最后跑：

```bash
pnpm exec vitest run tests/unit/scripts/validate-production-config.test.ts tests/unit/i18n-message-contract.test.ts tests/architecture/env-example-parity.test.ts
node scripts/starter-checks.js translations
pnpm content:check
pnpm type-check
```

如果第 4 项动到了 `content-readiness`，再补：

```bash
node scripts/starter-checks.js content-readiness
```

如果第 5 项改了 Cloudflare workflow 或 preview proof 入口，再补：

```bash
node scripts/starter-checks.js cf-preview-deployed
```

但这条可能依赖外部部署凭证；没有凭证时只能标记为 blocked，不能当 passed。
