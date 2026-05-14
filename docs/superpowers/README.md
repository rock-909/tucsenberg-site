# Superpowers Workspace

这个目录用于保留当前项目仍需要的 Superpowers 工作产物。

默认放这里的内容包括：

- 仍有效的 design spec
- 仍有效的 implementation plan
- 必要的 review 产物

## 路径边界

当前约定要明确：

- `docs/superpowers/plans/`
  - 放 **Superpowers workflow 直接产出的 plan**
  - 也就是 brainstorming / writing-plans 这条链默认会落到这里
  - 已完成或旧日期的 plan 可能保留当时的技术栈快照，不能当成当前依赖版本真相
- 历史上的 `docs/plans/`
  - 已退出主树
  - 如果旧 plan 里提到这个路径，按历史上下文理解，不再视为当前默认落点

当前依赖版本只看 `docs/technical/tech-stack.md`、`docs/technical/dependency-upgrade-policy.md`、`package.json` 和 lockfile。看到旧 plan/spec 里的 Next、React、OpenNext、Wrangler 版本号时，先按历史快照处理，不要直接照着执行升级命令。

一句话：

- **Superpowers 自己写出来的 plan** → `docs/superpowers/plans/`
- **当前默认计划模式** → `docs/superpowers/plans/`

## 当前结构

- `current/`：当前仍在用的 Superpowers 产物

清理原则：

- 当前仍在用的内容留在主层
- 明显过时或已完成的内容优先通过 git 历史回看，不再要求常驻 live docs tree
- 不再让所有历史 spec / plan 平铺并列
- 更老的历史包优先通过 git 历史回看，不强依赖 live docs tree 持续挂载
