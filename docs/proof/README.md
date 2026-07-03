# Proof

这里说明“什么命令证明什么”。不要把构建通过、CI 通过、预览可访问、真实上线混成一个结论。

## Main docs

- `launch.md`：派生项目上线前怎么证明。
- `levels.md`：fast gate / local-full / ci-proof / release-proof 的边界。
- `release.md`：release-sensitive 改动的串行命令顺序。
- `dry-run.md`：默认 `company-site` materialized output 边界证明。
- `baselines/`：warning、route mode、React Doctor、client boundary 等证明基线。

默认公司站证明以 `company-site` 为准；optional profiles 单独证明。
