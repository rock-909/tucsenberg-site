# Proof

这里说明“什么命令证明什么”。不要把构建通过、CI 通过、预览可访问、真实上线混成一个结论。

## Main docs

- `launch.md`：当前 Tucsenberg 站上线前怎么证明。
- `levels.md`：fast gate / local-full / ci-proof / release-proof 的边界。
- `release.md`：release-sensitive 改动的串行命令顺序。
- `dry-run.md`：继承的 starter `company-site` materialized output 边界证明。
- `baselines/`：warning、route mode、React Doctor、client boundary 等证明基线。
- `performance/`：历史 starter 性能证明和基线；不是当前 Tucsenberg 上线证明。

当前 Tucsenberg 上线证明以 `launch.md` 为准；starter/profile 证明只在维护
继承工具时使用，不能替代当前站证明。

## Baseline index

- `baselines/client-boundary-budget.json`：client boundary 机器预算。
- `baselines/cloudflare-warning.md`：OpenNext / Wrangler 生成物 warning 基线。
- `baselines/react-doctor.md`：React Doctor 当前执行基线。
- `baselines/react-doctor-policy.md`：React Doctor policy 和例外说明。
- `baselines/route-mode.md`：Next.js build route mode 观察基线。
- `baselines/storybook-warning.md`：Storybook warning 基线。
- `baselines/testing/icon-mock-best-practices.md`：图标 mock 测试方法。
- `baselines/testing/mock-config-standard.md`：mock 配置测试方法。
