# Env 设置

本项目的网站运行时环境变量真相源是 `src/lib/env.ts`。

`.env.example` 是给派生项目使用者看的示例，不是生产密钥文件。真实值只放在本地 `.env.local`、Cloudflare dashboard、`.dev.vars`、GitHub Actions secrets 或部署平台 secret 里。

注意区分两类变量：

- 网站运行时变量：给 Next.js / Worker 运行时读取，主要由 `src/lib/env.ts` 管。
- 部署和工具变量：给 Wrangler、CI dry-run 或 deploy 使用，例如 `CLOUDFLARE_API_TOKEN`。这类变量不一定属于网站运行时 schema，但仍然必须 server-only。

## 基本原则

- `NEXT_PUBLIC_*` 会进入浏览器，不能放 secret。
- API token、邮件密钥、Airtable token、Turnstile secret、Cloudflare analytics token、限流 pepper 都必须保持 server-only。
- Turnstile 的 `site key` 可以公开给浏览器，`secret key` 绝不能公开。
- 没有使用某个集成时，对应变量可以留空。
- starter 可以在本地使用默认值；client launch 前必须按真实项目补齐部署、表单和 owner 可见性配置。

## 必须理解的分组

| 分组 | 变量 | 什么时候需要 |
| --- | --- | --- |
| Public site identity | `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SITE_KEY` | 所有派生项目都应确认。 |
| Runtime mode | `APP_ENV`, `DEPLOYMENT_PLATFORM`, `NEXT_PUBLIC_DEPLOYMENT_PLATFORM` | 本地、预览和生产环境都应明确。 |
| Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_ALLOWED_HOSTS`, `TURNSTILE_ALLOWED_ACTIONS` | 表单上线并启用机器人防护时需要。 |
| Resend | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` | 需要发送 owner 邮件时需要。 |
| Airtable | `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME` | 需要把线索存入 Airtable 时需要。 |
| Cloudflare deploy tooling | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Wrangler dry-run、CI 或真实部署时需要；`CLOUDFLARE_API_TOKEN` 不是浏览器变量。 |
| Cloudflare analytics | `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ANALYTICS_API_TOKEN`, `CLOUDFLARE_ANALYTICS_HOSTNAME`, `OPS_DASHBOARD_ACCESS_KEY` | 使用 `/ops/traffic` owner dashboard 时需要；当前 client launch strict gate 也要求 owner dashboard hostname、zone 和访问保护已配置。 |
| Distributed rate limit | `RATE_LIMIT_PEPPER`, `RATE_LIMIT_PEPPER_PREVIOUS`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` | 预览或生产环境需要稳定限流时需要。`RATE_LIMIT_PEPPER_PREVIOUS` 是限流 pepper 轮换时保留的旧值/上一版值，必须 server-only。当前 production strict gate 要求 Upstash Redis；KV-only 不能当作生产替代方案。 |
| Cloudflare / Next compatibility | `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, `CF_PAGES`, `DEPLOY_TARGET`, `CI`, `GITHUB_TOKEN` | 普通项目 owner 可以先不管；发布、CI 或 Cloudflare proof 时再处理。 |
| Tooling / proof-only | `CLOUDFLARE_PREVIEW_BASE_URL`, `DEPLOY_SMOKE_BASE_URL`, `DEPLOY_SMOKE_HEADER_NAME`, `DEPLOY_SMOKE_HEADER_VALUE`, `POST_DEPLOY_TEST`, `PLAYWRIGHT_BASE_URL`, `STAGING_URL`, `BASE_URL`, `CI_DAILY`, `CI_FLAKE_SAMPLING` | 只给本地预览、deployed smoke、Playwright 和 CI proof 使用；不是普通网站运行时 schema。 |
| Security headers | `SECURITY_HEADERS_ENABLED`, `CSP_REPORT_URI`, `CORS_ALLOWED_ORIGINS` | 安全 header、CSP report 或跨域策略需要调整时使用。 |

## Preview / production 必须注意

`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` 是 Cloudflare / Next Server Actions 兼容相关配置。预览和生产环境要配置稳定值；缺失会挡发布验证。

`ALLOW_MEMORY_RATE_LIMIT=true` 只能用于本地开发兜底。preview / production 不要设成 `true`。

当前生产验证要求配置 Upstash Redis：`UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`。`KV_REST_API_URL` / `KV_REST_API_TOKEN` 可以保留为兼容或后续治理输入，但不要把 KV-only 当作当前 production strict gate 可接受的限流方案。

`RATE_LIMIT_PEPPER` 和 `RATE_LIMIT_PEPPER_PREVIOUS` 都是 server-only 值。轮换 pepper 时，新值放在 `RATE_LIMIT_PEPPER`，旧值/上一版值短期放在 `RATE_LIMIT_PEPPER_PREVIOUS`，不要写进 `NEXT_PUBLIC_*`。

## 可安全留空的集成

如果派生项目不用某个集成，可以先留空：

- 不发邮件：留空 `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`。
- 不存 Airtable：留空 `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME`。
- 不做本地 dashboard 调试：可以先留空 `CLOUDFLARE_ANALYTICS_API_TOKEN` 和 `OPS_DASHBOARD_ACCESS_KEY`。
- 本地开发不接 Turnstile：留空 Turnstile secret，并只在本地使用 bypass。

留空不等于 client launch ready。按当前仓库规则，client launch strict gate 默认要求 owner traffic dashboard 的 hostname、zone 和访问保护已配置；正式上线前仍要用真实表单 canary、部署 proof 和 owner signoff 确认。

## 禁止事项

- 不要把 `RESEND_API_KEY` 放进 `NEXT_PUBLIC_*`。
- 不要把 `AIRTABLE_API_KEY` 放进 `NEXT_PUBLIC_*`。
- 不要把 `TURNSTILE_SECRET_KEY` 放进 `NEXT_PUBLIC_*`。
- 不要把 `CLOUDFLARE_ANALYTICS_API_TOKEN` 放进 `NEXT_PUBLIC_*`。
- 不要把 `CLOUDFLARE_API_TOKEN` 放进 `NEXT_PUBLIC_*`。
- 不要把 `RATE_LIMIT_PEPPER` 或 `RATE_LIMIT_PEPPER_PREVIOUS` 放进 `NEXT_PUBLIC_*`。
- 不要把 `.env.local`、`.dev.vars` 或真实 `.mcp.json` 提交入库。

## 验证

修改 env schema 或 env 示例后，至少运行：

```bash
pnpm type-check
pnpm test -- tests/architecture/env-boundary.test.ts tests/architecture/env-example-parity.test.ts
```

发布前仍以 `docs/website/quality-proof.md` 里的 proof surface 为准。
