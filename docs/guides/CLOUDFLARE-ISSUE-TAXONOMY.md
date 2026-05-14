# Cloudflare 问题分类表

## 目的

这份文档给仓库一套统一说法，避免大家一看到 Cloudflare 报错就乱贴标签。

它的作用就是把问题分清：

- 是平台入口问题
- 还是生成产物兼容问题
- 还是当前站点运行时回归
- 还是最终部署环境行为不对

## Four Buckets

### 1. Platform entry / local runtime issue

含义：

- Wrangler / Miniflare / preview 启动本身就不健康
- 请求还没真正进入当前站点业务代码，就已经出事

典型信号：

- local preview 一直起不稳
- 请求在页面代码真正运行前就挂住
- inspector / local worker boot failure

不要把这类问题叫成：

- 页面逻辑坏了

### 2. Generated artifact compatibility issue

含义：

- build 看起来过了，但生成产物和当前本地 Cloudflare 路径不完全兼容

典型信号：

- manifest load 问题
- generated handler 的 dynamic require 回归
- 框架 / OpenNext 升级后，preview-only 500

不要把这类问题叫成：

- 内容 bug
- 翻译 bug

### 3. Current site runtime regression

含义：

- 平台能起来，但 Example Showcase Company 站点本身行为已经不对

典型信号：

- redirect 错
- cookie 错
- 内部 header 泄漏
- 页面内容、SEO、contact 行为回归

### 4. Final deployed behavior issue

含义：

- 本地 proof 过了，但真实部署环境行为仍然不对

典型信号：

- deployed `/api/health` 失败
- deployed 页面 / runtime 行为和本地验证结果不一致

不要把这类问题叫成：

- preview proof 失败，所以 production 一定坏了

## Proof Mapping

| Bucket | 最先有价值的强证据 |
|---|---|
| Platform entry / local runtime issue | `pnpm website:build:cf && pnpm exec opennextjs-cloudflare preview --env preview` 加本地诊断 |
| Generated artifact compatibility issue | `pnpm website:build:cf`、`node scripts/starter-checks.js cf-preview-smoke`，必要时再加 `pnpm exec wrangler deploy --dry-run --env preview` |
| Current site runtime regression | 页面级测试、`pnpm build`、`pnpm website:build:cf`、`node scripts/starter-checks.js cf-preview-smoke` |
| Final deployed behavior issue | `node scripts/starter-checks.js deployed-smoke --base-url <url>` |

## 写法规则

记录或汇报 Cloudflare 问题时，顺序固定：

1. 先说 bucket
2. 再说失败的是哪一级 proof
3. 最后再说具体现象

例子：

- Generated artifact compatibility issue；local preview proof 因 manifest load regression 失败
- Final deployed behavior issue；deployed smoke 在 `/api/health` 上失败

## Related Canonical Docs

- [`QUALITY-PROOF-LEVELS.md`](./QUALITY-PROOF-LEVELS.md)
- [`RELEASE-PROOF-RUNBOOK.md`](./RELEASE-PROOF-RUNBOOK.md)
- [`CANONICAL-TRUTH-REGISTRY.md`](./CANONICAL-TRUTH-REGISTRY.md)
