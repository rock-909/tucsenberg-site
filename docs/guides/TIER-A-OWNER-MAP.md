# Tier A 责任映射

## 目的

这份文档定义仓库里**风险最高的一层路径**，以及这些路径改动时最低限度需要什么 owner / review / proof。

它是语义层 owner map。  
`.github/CODEOWNERS` 是仓库强制层。两者要互相对齐。

## Tier A Definition

Tier A 路径指的是：一旦改动，可能实质影响下面这些面的仓库区域：

- request entry behavior
- locale / SEO / SSR semantics
- production security posture
- multi-platform build 或 runtime correctness
- lead capture / contact pipeline correctness

## Review Policy

- Tier A 改动至少需要一个 primary owner review
- 如果改动跨 runtime / security / platform 边界，还要补 cross-domain review
- 只靠 fast local gate 不能证明 Tier A 改动安全
- Tier A 改动必须遵守 [`QUALITY-PROOF-LEVELS.md`](./QUALITY-PROOF-LEVELS.md) 的 proof 口径
- 仓库默认 owner 仍是 primary-only；backup identity 只保留给 Tier A 和明确关键面
- 如果未来真有第二位 maintainer 能映射成 enforceable repository owner，要在同一治理周期里同步更新这份文档和 `.github/CODEOWNERS`

## Tier A 改动执行清单

1. 先判断本次路径是不是 Tier A
2. 确认 primary owner review 路径存在
3. 如果跨 runtime / security / platform，补对应 cross-review
4. staged review 要在 merge 前跑，不是 merge 后补
5. 如果 backup review path 当前不可用，就要么阻塞、要么缩 scope，不能假装仓库已经 diversified
6. 如果这次改动 release-critical，proof level 要直接按表里最低要求走

## Owner Map

| Tier A Area | Paths | Primary Owner Role | Backup Owner Role | Required Cross-Review | Minimum Proof Before Merge |
|---|---|---|---|---|---|
| Runtime entry + locale routing | `src/middleware.ts`, `src/i18n/**`, `src/app/[locale]/layout.tsx` | Runtime / i18n maintainer | Platform maintainer | locale redirect / locale cookie 改动时补 Security review | 普通合并至少 `local-full`，release-critical 走 `release-proof` |
| Contact + inquiry + subscribe submission | `src/app/api/contact/**`, `src/app/api/inquiry/**`, `src/app/api/subscribe/**`, `src/lib/actions/contact.ts`, `src/lib/contact/submit-canonical-contact.ts`, `src/lib/lead-pipeline/{lead-schema,process-lead,utils}.ts`, `src/components/forms/**` | Lead pipeline maintainer | Runtime maintainer | validation / rate-limit / abuse chain 改动时补 Security review | `pnpm test` plus focused API route tests |
| Abuse protection + request security | `src/config/security.ts`, `src/lib/security/**`, `src/app/api/verify-turnstile/**`, `src/app/api/csp-report/**`, `next.config.ts` | Security maintainer | Runtime maintainer | Cloudflare 请求来源、header 或部署差异受影响时补 Platform review | 最低 `ci-proof`；policy / header / CSP 级改动走 `release-proof` |
| Platform build + deployment chain | `open-next.config.ts`, `next.config.ts`, `.github/workflows/**`, `scripts/starter-checks.js`, `wrangler.jsonc` | Platform maintainer | Runtime maintainer | 请求路径行为受影响时补 Runtime review | `release-proof` |
| Translation critical path | `messages/{locale}/critical.json`, `messages/{locale}/deferred.json`, `scripts/starter-checks.js` | i18n maintainer | Runtime maintainer | SSR / critical-path keys 改动时补 Runtime review | 最低 `local-full`；影响入口路径时补 `ci-proof` |
| Health endpoint + cache tag utilities | `src/lib/cache/**`, `src/app/api/health/**` | Platform maintainer | Runtime maintainer | health response / cache policy 改动时补 Security review | 最低 `ci-proof` |

## Current Repository State

- 仓库级 ownership 目前由 [`.github/CODEOWNERS`](../../.github/CODEOWNERS) 强制
- 这份文档负责“语义责任边界”，不等于直接文件模式
- 当前 enforceable default owner：
  - primary: `@Alx-707`
- 当前 enforceable Tier A backup review path：
  - `developer@flood-control.com`
- 当前还存在的硬约束：
  - 实际维护能力已经不止一个人
  - 但还没有第二个 enforceable repository owner identity 真正独立分担 Tier A 吞吐
  - backup path 提高了 review 韧性，但没有彻底消除 owner concentration

## Hard Ceiling

- 这份文档可以定义 routing、review expectation、proof requirement
- 它不能凭空造出第二个 enforceable repository owner
- 在第二个 owner identity 真正映射进仓库前，Tier A 韧性仍然只是 review fallback model，不是 fully diversified operating model

## Promotion / Demotion Rules

- 只要一个路径会影响 runtime entry、双平台兼容、安全姿态或 lead capture correctness，就该升到 Tier A
- 只有同时满足下面两条，才允许从 Tier A 降级：
  - 它已经不在关键路径上
  - owner / proof 要求是经过有意识调整，而不是自然漂移没了
