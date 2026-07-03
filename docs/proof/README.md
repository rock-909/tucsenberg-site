# Proof

这里说明“什么命令证明什么”。不要把构建通过、CI 通过、预览可访问、真实上线混成一个结论。

## Main docs

- `launch.md`：当前 Tucsenberg 站上线前怎么证明。
- `levels.md`：fast gate / local-full / ci-proof / release-proof 的边界。
- `release.md`：release-sensitive 改动的串行命令顺序。
- `dry-run.md`：继承的 starter `company-site` materialized output 边界证明。
- `baselines/`：warning、route mode、React Doctor、client boundary 等证明基线。

当前 Tucsenberg 上线证明以 `launch.md` 为准；starter/profile 证明只在维护
继承工具时使用，不能替代当前站证明。
