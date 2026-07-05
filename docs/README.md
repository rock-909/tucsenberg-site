# Tucsenberg Site Docs

这里是 Tucsenberg 当前英文官网的项目知识库。读者是 owner 和 agent。

`docs/` 只保留长期有用的项目基础、技术难题、设计约束和决策记录。Superpowers 只使用当前上游默认的 `docs/superpowers/specs/**` 和 `docs/superpowers/plans/**` 两个输出口。

Superpowers 上游当前默认输出路径是 `docs/superpowers/specs/**` 和 `docs/superpowers/plans/**`。早期上游历史曾使用 `docs/plans/**`；本项目不恢复这个旧路径，也不把本地 `.superpowers/**` 当作可提交文档路径。

## 先看哪里

| 你要做什么 | 读这些 |
| --- | --- |
| 了解当前项目 | `项目基础/项目基础.md` -> `项目基础/技术栈.md` |
| 维护内容、品牌、配置 | `项目基础/内容.md` -> `项目基础/品牌.md` -> `项目基础/配置.md` |
| 配 Cloudflare / 预览 / 发布 | `项目基础/部署.md` -> `项目基础/上线验证.md` -> `项目基础/发布验证.md` |
| 看 CI 和质量门 | `项目基础/发布验证.md` -> `项目基础/验证等级.md` -> `项目基础/ReactDoctor政策.md` |
| 做 UI / 设计调整 | `design/设计真相.md` -> `design/组件治理.md` -> `design/组件使用手册.md` |
| 查性能、路由、Cloudflare 等难题 | `技术难题/性能记录.md` -> `技术难题/性能实验优化方法论.md` |
| 查已经确认的取舍 | `决策记录/UI基础方案.md` -> `决策记录/Content-as-code与CMS边界.md` |
| 查 docs 为什么保留 | `项目基础/文档清单.md` |

## 当前目录

- `项目基础/`：项目怎么维护、怎么部署、技术栈、配置、内容、品牌、CI/验证和继承边界。
- `design/`：设计真相、设计系统、组件治理、Storybook 和视觉规则。
- `技术难题/`：性能、Cloudflare、Next.js 16、路由模式、客户端边界预算等问题记录。
- `决策记录/`：已经确认过的架构或产品技术决策。
- `superpowers/`：Superpowers 上游当前默认输出根目录；只放 `specs/**` 和 `plans/**`，不是当前产品真相。

## 不当作当前真相

- `docs/superpowers/specs/**` 和 `docs/superpowers/plans/**`：Superpowers spec / plan 过程记录。
- `plans/**`：旧执行计划和构建交接材料。
- 任何旧 `/zh` 路由、旧 starter 域名、旧 branch 名称：只能作为历史证据，不能覆盖当前 English-only 站点事实。

当前版本和运行事实看 `package.json`、lockfile、`AGENTS.md` / `CLAUDE.md`、当前配置和测试结果。
