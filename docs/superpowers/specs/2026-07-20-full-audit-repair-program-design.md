> Historical.
>
> Planning artifact. This file does not change runtime truth and does not claim any finding is fixed.

# full-audit-2026-07-20 修复项目设计

- 日期：2026-07-20
- 审查基线：`origin/main@9ab5f6c4f158281fd16c987e0cdd02622919d90e`
- 输入报告：`docs/技术难题/整库审查full-audit-2026-07-20/`
- 状态：待 owner 裁决后进入独立修复轮
- 实施总控：`docs/superpowers/plans/2026-07-20-full-audit-repair-master-plan.md`

## 1. 目标与边界

本项目处理审查确认的 16 个 findings。修复顺序先保护页面可用、询盘不丢、生产安全门和公开产品事实，再收紧发布证明、恢复链和重复事实，最后删除死表面。

本轮只生成计划，不修改业务代码，不提交，不推送，也不把审查基线上的旧绿灯当成修复完成证据。实施必须在独立 worktree 和短期分支完成，每个 Wave 绑定自己的 exact SHA。

以下内容不属于代码 Wave 的通过条件：正式域名切换、owner 尚未提供的 PDF/电话/照片/MOQ/法律签字，以及 Cloudflare、Resend、Airtable、Turnstile、GSC/CrUX 的账号侧结果。缺少凭据时标记 `BLOCKED_EXTERNAL`，不能写成通过。

## 2. 采用的组织方式

采用一份总控计划和五份可独立执行的 Wave 计划：

| Wave | Findings | 交付目的 |
| --- | --- | --- |
| 1 | FPH-001、FPH-004、FPH-005 | 修掉 Worker 并发故障、provider 假成功和生产危险开关漏检 |
| 2 | FPH-002、FPH-003、FPH-006 | 修正公开产品事实和移动端键盘滚动 |
| 3 | FPH-007、FPH-010、FPH-011、FPH-012、FPH-013 | 让 Cloudflare CI、deploy、Daily 和 mandatory smoke 的绿灯可信 |
| 4 | FPH-008、FPH-009、FPH-014 | 打通恢复关联键，更新全站测量路由，收缩重复产品事实 |
| 5 | FPH-015、FPH-016 | 删除无消费者资产和测试保活的退役生产符号 |

每个 Wave 可以单独开发、审查和回退。跨 Wave 依赖必须按以下顺序处理：

```text
FPH-004 -> FPH-008
FPH-001 -> FPH-013 -> exact-SHA deployed proof
FPH-005 -> production deploy proof -> real Turnstile canary
FPH-007 -> Cloudflare CI artifact proof
FPH-002 / FPH-003 -> FPH-014 的长期事实 owner 收缩
```

## 3. 修复原则

1. 先复现，后修改。每个行为 finding 都要先留下当前失败证据或失败测试。
2. 修根因，不在调用方散落补丁。Provider ID 在 adapter 边界验证，生产危险开关在现有 production contract 集中拒绝。
3. 单变量处理 FPH-001。先只关闭 `cacheComponents` 并跑同一并发证明；失败就恢复该变量，另开依赖组合升级设计，不能把配置变化和版本升级混在一个试验里。
4. 删除优先。产品数量改成不依赖数量的表达；无用资产和兼容符号直接退役；不建 CMS、provider factory、通用表单框架或产品事实平台。
5. 行为门优先于字符串门。能由真实 build、OpenNext、Wrangler dry-run 或 deployed smoke 证明的内容，不再用 raw substring 冒充证明。
6. Local、CI、deploy、real-service proof 分开。`pnpm release:verify` 不能单独支持公开上线结论。

## 4. 状态机和验收停点

单个 Wave 使用以下状态：

```text
PLANNED
  -> IN_PROGRESS
  -> LOCAL_PROVED
  -> CI_GREEN
  -> READY_FOR_ACCEPTANCE
  -> ACCEPTED
  -> OWNER_MERGE
  -> MERGED
```

`CI_GREEN` 只说明 exact SHA 上的自动检查通过。它不能自动进入 `ACCEPTED`。验收时必须重新核对 finding 的完成条件、Git diff、运行输出和 proof boundary，再由 owner 决定是否合并。

## 5. 分支、worktree 和提交

- 执行前使用 `superpowers:using-git-worktrees` 从实施时最新 `origin/main` 创建隔离 worktree。
- 审查报告集当前尚未提交；实施分支不得把主工作区中的未提交审查文件或清单改动带入业务修复提交。
- 默认一个 finding 一个小提交；同一根因必须原子修改时可以把同 Wave 的紧邻 finding 放在一个提交，但提交信息要列清范围。
- 删除文件必须先移动到带日期和 Wave 名的 Trash 目录，再用 `git add -A` 记录删除；禁止 `rm`、`git rm`、`git clean`。
- `pnpm build` 和 `pnpm website:build:cf` 串行运行，不能并行写同一个 `.next`。

## 6. 完成定义

一个 finding 只有同时满足以下条件才算修复候选完成：

- 当前行为的失败证明可重放。
- 最小实现已通过 focused test。
- finding 自己的验收条件逐条有新鲜证据。
- 受影响的 broader gate 通过。
- 没有把凭据受限项、真实部署或 owner 收件确认伪装成本地通过。
- `git diff --check` 通过，diff 中没有计划外业务变化。

公开上线 blocker 与长期 hardening 分开处理：Wave 1-3 覆盖 6 个 P1 和发布证明可信度；它们全部 `ACCEPTED`、合并，并补齐真实部署和 owner-deferred 条件后，才允许重新启动公开上线审查。Wave 4-5 的 P2/P3 恢复、测量、事实收缩和死表面清理仍按本项目顺序执行和集成验收，但不被升级成公开上线前置条件。修完任意 Wave 本身仍不等于公开上线就绪。

## 7. 不做什么

- 不在本计划轮修业务代码。
- 不预判 FPH-001 的最终责任属于 Next.js、OpenNext 或 Workerd。
- 不把 `requestId` 扩成第二套 correlation 系统。
- 不为一条保修文案建立产品保修 factory。
- 不为产品数量和少数规格建立新 CMS 或通用 schema。
- 不新增依赖来解析当前已经能用 TypeScript、`js-yaml` 和 Node 标准库读取的配置。
- 实施 Wave 不修改已经由 docs-only PR 验收的审查报告目录或 `manifest.sha256`。
