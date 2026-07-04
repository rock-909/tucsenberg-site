# Lighthouse 黄债治理 Wave 1 closeout

Historical starter proof. This file is not current Tucsenberg launch proof; see
`../项目基础/上线验证.md`, `../项目基础/发布验证.md`, `../项目基础/验证等级.md`, and `../README.md` for the current
boundary.

结论：建议关闭 Wave 1，不继续 Task 4 小修。Wave 2 应另开规划和分支，本文件不执行 Wave 2。

## 当前基线

- 分支：`main at 88f5afd Merge pull request #64 from rock-909/perf/lighthouse-public-env-split`
- Wave 1 已完成：PR #64 public env split
- 本轮判断对象：是否还追加一个低风险 shared JS/CSS 小修

## Wave 1 已交付与证据来源

PR #64 的交付面是 public runtime env split：新增 `src/lib/public-runtime-env.ts`，把客户端可读的 public env helper 从完整 `@/lib/env` 中拆出；客户端调用方迁移到 zod-free allowlist，服务端 env schema 和 server-only 校验继续留在 `@/lib/env`。

合同面已经在 PR #64 中覆盖：

- client-safe module 不引入 `zod`、`@t3-oss/env-nextjs`、完整 `@/lib/env` 或 server-only helper。
- `"use client"` 文件不再直接导入 `@/lib/env`。
- server `@/lib/env` 继续保留 `createEnv`、`serverEnvSchema`、`clientEnvSchema`。
- forbidden server key names 不进入 client chunks。

Before/after 主证据见 `docs/技术难题/Lighthouse黄色债务归因.md` 的 `Task 3 after evidence`：

- 14 个 URL 每页约减少 68800 bytes network transfer。
- zod / `@t3-oss/env-nextjs` shared client chunk 被移除。
- `/en` 从 543446 bytes 降到 474639 bytes，低于 490KB warn。
- `/en/products/north-america` 从 676099 bytes 降到 607274 bytes。

本 closeout 只判断 Task 4 是否继续追加小修。结论是不追加：剩余黄债已经转向 Radix/global CSS、font、contrast、budget，这些分别属于 Wave 2 / Wave 3，不适合混入 Wave 1。

## 验证命令

本轮使用的验证命令：

```bash
pnpm lint:check
pnpm type-check
pnpm test
NODE_OPTIONS=--dns-result-order=ipv4first pnpm build
CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse
```

`NODE_OPTIONS=--dns-result-order=ipv4first` 是本机验证环境处理，不是 Wave 1 性能优化。原因是本机 Node/Next 字体下载通过 `node:https` 访问 `fonts.gstatic.com` 时出现 IPv6/TLS 断开；Node fetch/curl 可通。切到 `ipv4first` 后，Next 字体下载和构建通过。

验证结果：

- `pnpm lint:check`：pass
- `pnpm type-check`：pass
- `pnpm test`：345 files passed, 3413 passed, 7 skipped
- `NODE_OPTIONS=--dns-result-order=ipv4first pnpm build`：pass
- `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse`：autorun exit 0，仅剩 warning-level `total-byte-weight`

## Lighthouse 本机取数

表格取自本轮 `.lighthouseci/lhr-177954*.json` 和 `.lighthouseci/assertion-results.json`。`Total bytes` 是 Lighthouse `total-byte-weight` / `assertion-results.json` `actual`，属于 network transfer size；`JS/CSS/Font/Image bytes` 来自 Lighthouse `resource-summary.*.transferSize`，也是 network transfer size。本文不使用 treemap `resourceBytes` / `unusedBytes`；treemap 只代表 source-size estimate，不能当作网络节省或 budget overage 口径。

| URL | Perf | A11y | LCP ms | TBT ms | Total bytes | JS bytes | CSS bytes | Font bytes | Image bytes | Over 490KB | Yellow |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| /en | 87 | 100 | 4014 | 40 | 475210 | 299621 | 106083 | 44686 | 0 | 0 | no |
| /zh | 87 | 100 | 4012 | 26 | 476559 | 299621 | 106083 | 44686 | 0 | 0 | no |
| /en/about | 90 | 100 | 3610 | 26 | 477482 | 301728 | 106083 | 44686 | 0 | 0 | no |
| /zh/about | 90 | 100 | 3610 | 26 | 478817 | 301728 | 106083 | 44686 | 0 | 0 | no |
| /en/contact | 90 | 100 | 3608 | 39 | 518159 | 331935 | 106083 | 44686 | 0 | 28159 | yes |
| /zh/contact | 90 | 100 | 3609 | 39 | 520696 | 331935 | 106083 | 44686 | 0 | 30696 | yes |
| /en/products | 89 | 96 | 3762 | 36 | 503652 | 307040 | 106083 | 44686 | 0 | 13652 | yes |
| /zh/products | 89 | 96 | 3759 | 37 | 506021 | 307040 | 106083 | 44686 | 0 | 16021 | yes |
| /en/blog | 91 | 96 | 3461 | 16 | 514028 | 293824 | 106083 | 44686 | 0 | 24028 | yes |
| /zh/blog | 90 | 96 | 3611 | 16 | 516662 | 293824 | 106083 | 44686 | 0 | 26662 | yes |
| /en/products/north-america | 87 | 100 | 4060 | 43 | 607843 | 346838 | 106083 | 69088 | 2907 | 117843 | yes |
| /zh/products/north-america | 87 | 100 | 4063 | 44 | 611368 | 346838 | 106083 | 69088 | 2907 | 121368 | yes |
| /en/blog/prepare-before-launch | 90 | 96 | 3611 | 18 | 488993 | 293824 | 106083 | 44686 | 0 | 0 | no |
| /zh/blog/prepare-before-launch | 90 | 96 | 3609 | 17 | 491129 | 293824 | 106083 | 44686 | 0 | 1129 | yes |

Yellow URLs：

- `/en/contact`
- `/zh/contact`
- `/en/products`
- `/zh/products`
- `/en/blog`
- `/zh/blog`
- `/en/products/north-america`
- `/zh/products/north-america`
- `/zh/blog/prepare-before-launch`

产品详情页超过 490KB warn 的幅度：

- `/en/products/north-america`：117843 bytes
- `/zh/products/north-america`：121368 bytes

## 关闭 Wave 1 的判断

建议关闭 Wave 1。剩余黄债主要落在 Radix/global CSS/font/contrast/budget 几类问题上，没有新的明确小型 shared JS/CSS 小修。

具体归属：

- Radix CSS/DataCard：进入 Wave 2 Lane 4，先做 static-surface evaluation，不直接替换 UI foundation
- font：进入 Wave 2 Lane 5
- A11y 96：进入 Wave 2 Lane 6
- budget：进入 Wave 3；Wave 1 / Wave 2 不改 Lighthouse 阈值

继续 Wave 1 的条件不满足：

- 没有直接证据指向一个不触碰 Radix、font、contrast、budget 的小改。
- framework、motion、layout shell 这类改动风险和复杂度超过收益。
- `/zh/blog/prepare-before-launch` 只超 1129 bytes，不值得单独开修。

## 建议下一步

另开 Wave 2，从 Lane 4 的规划开始。

先写或更新 Wave 2 spec、plan、验收标准，再做 Radix static-surface evaluation。涉及 UI wrapper 的改动，要跑：

```bash
pnpm component:check
```
