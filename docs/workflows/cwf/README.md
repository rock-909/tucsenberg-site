# CWF 文案工作流产物

这里保存新项目使用 CWF 后产生的页面文案版本。

约定结构：

```text
docs/workflows/cwf/{page}/
├── v1.md
└── v1-final.md
```

注意：

- CWF workflow 入口在 `.claude/commands/cwf.md`。
- 本目录不是旧项目文案归档区。
- 不要恢复旧项目已经跑出来的 CWF 输出。
- 新页面文案应从 `docs/website/内容设置.md`、`src/config/single-site*.ts`、`content/pages/{locale}/*.mdx`、当前页面目标和真实业务素材开始。
