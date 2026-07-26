# AI

Codex and Claude can collaborate, but durable truth must live in files.

## Entry files

- Codex: `AGENTS.md`
- Claude: `CLAUDE.md`
- Local preference: `CLAUDE.local.md`

Both should point back to `docs/README.md`; do not maintain two competing encyclopedias.

## Superpowers

Upstream `obra/superpowers` currently writes specs and implementation plans to:

- `docs/superpowers/specs/**`
- `docs/superpowers/plans/**`

Older upstream history used `docs/plans/**`. This project follows the current
upstream default, not the older path.

Local `.superpowers/**` state is not a repo document path and must not be
committed.

This derived site still keeps some inherited execution material under `plans/`.
Treat those files as run records, not product docs. They may contain stale
starter/profile facts.

## UI motion changes

Before adding or changing animation, transitions, page reveal, loading motion, or
`motion/react`, read:

```text
docs/design/动效治理.md
```

Motion in this starter is governance-first. It must clarify state, hierarchy, or
navigation path. Do not add animation only to make a page feel premium.

Agent rules:

- prefer CSS and existing state attributes before JavaScript orchestration;
- do not turn static marketing sections into Client Components only for motion;
- keep hero and above-the-fold claim content visible by default;
- preserve `prefers-reduced-motion` behavior;
- do not add page-level reveal, long durations, or new motion dependencies
  without separate proof.

## Generated content

Do not hand-edit:

- `src/lib/content-manifest.generated.ts`

Refresh with:

```bash
node scripts/starter-checks.js content-manifest
node scripts/starter-checks.js content-manifest --check
```

## Review before push

推分支之前先跑一次 Codex 分支审查，在开 PR 之前，不是在合并之前：

手动跑用斜杠命令，但**先刷新远端引用**：斜杠命令只是调用审查器，它自己不会
`fetch`，`origin/main` 停在上次同步的位置就会审错 diff 还报通过。

```bash
git fetch origin || { echo "ABORT: stale base"; exit 1; }
```

```text
/codex:review --wait --base origin/main --scope branch
```

`/pr`、`/review-fix` 这类命令内部**不能**用斜杠命令——它声明了
`disable-model-invocation: true`，模型调不动，门禁会静默失效。命令里走 companion
脚本，路径从已安装插件登记里解析，别钉版本号：

```bash
git fetch origin || { echo "ABORT: stale base"; exit 1; }
CODEX_ROOT="$(node -e 'const r=require(process.env.HOME+"/.claude/plugins/installed_plugins.json");const e=(r.plugins?.["codex@openai-codex"]||[])[0];if(!e)process.exit(1);console.log(e.installPath)' || true)"
if [ -z "$CODEX_ROOT" ]; then echo "UNAVAILABLE: plugin not installed"; else
  OUT="$(node "$CODEX_ROOT/scripts/codex-companion.mjs" review --base origin/main --scope branch 2>&1)"; RC=$?
  printf '%s\n' "$OUT"
  if [ "$RC" -ne 0 ]; then echo "UNAVAILABLE: reviewer exited $RC"
  elif printf '%s' "$OUT" | grep -q -E "Codex review failed\.|without any stdout output|failed to output a response|did not return valid structured JSON|unexpected review shape|Service Unavailable|Reconnecting\.\.\."; then
    echo "UNAVAILABLE: reviewer produced no review"
  elif ! printf '%s' "$OUT" | grep -q "^# Codex "; then
    echo "UNAVAILABLE: unrecognized reviewer output"
  fi
fi
```

**退出码和输出内容要一起判，单看哪个都会放行假审查。** 插件永远先打印
`# Codex …` 标题，失败时才在后面补一句 `Codex review failed.`——只认标题就会把失败
当成功；而空回合时它**退出码是 0**、正文写着 `Reviewer failed to output a
response`——只看退出码同样放行。识别不了的输出一律当未审。

两类失败结局不同，别混成一类：

- **`git fetch` 失败 → 中止。** 继续下去就是拿过期的 `origin/main` 审查，
  审错了 diff 还报绿，比不审更糟。这一类没有"紧急放行"。
- **插件缺失 / 审查器 503 → 不可用。** 这一类才适用"紧急就继续，但必须在 PR 里
  写明没审"。要是一刀切用 `set -e`，两类都变成中止，披露那条路径永远走不到。

**必须是 `origin/main`，不能是 `main`。** 本地分支会落后，而审查器是拿传进去的
那个 ref 求 merge-base 的。本仓库实测过：本地 `main` 只落后一个提交时，
`main...HEAD` 出来 80 个文件，`origin/main...HEAD` 才是真正属于这个 PR 的 6 个。
审错 74 个文件比不审还糟。

另外**别传 `--model`**。本地 codex 配置默认已经是对的模型和高思考强度；传简写
别名解析不到，会以 503 的形式失败，看起来完全像服务宕机。

顺序是有原因的。Codex 读的是本地 git 状态，能翻整个仓库、能跑命令去核实说法；
CodeRabbit 只看 diff。所以让 Codex 先审，把问题在推之前解决掉，CodeRabbit 那唯一
一次自动审查才落在最终版本上，而不是浪费在一个马上要改的版本上。

需要它质疑"这个做法本身对不对"，而不只是挑实现缺陷，用
`/codex:adversarial-review`。

两件必须照做的：

- **Codex 说的不一定对，实测过再采纳。** 2026-07-25 它建议把 Lighthouse 的测量
  服务钉到 `next start --hostname 127.0.0.1`，理由是消除端口争用。照做之后本机
  实测每条路由都 307 到自己、无限循环：next-intl 中间件把 `/contact` 内部重写到
  `/en/contact`，重写目标带的是 `localhost`，而服务器绑的是 `127.0.0.1`，Next
  判定跨源，把内部重写降级成对外重定向，转回原路径。**问题诊断对，开的药方会把
  站点跑坏。** 采纳前先跑起来看。
- **服务不可用就在 PR 里写明这次没审。** Codex 后端会返回 503，插件会诚实地报
  `Reviewer failed to output a response`。别让"没审"看起来像"审过了"。

CodeRabbit 侧只在 PR 打开时自动审一次（`.coderabbit.yaml` 的
`auto_incremental_review: false`）。后续推送不会重审，手动触发分两种：

- 之前审过、只想补审新推的提交 → `@coderabbitai review`（增量）
- **之前那次被限额跳过了 → 必须用 `@coderabbitai full review`**。增量命令会把
  被跳过的提交当成"已处理"，回一句「does not re-review already reviewed
  commits」然后什么也不审，于是永远卡在未审状态。PR #171 上实际撞到过。
- 查当前额度：`@coderabbitai rate limit`

**它那个绿勾不能当证据。** 限额跳过时检查状态照样是 pass。判定跳过要认
CodeRabbit 自己的结构化标记，**不要搜正文短语**：

```text
<!-- This is an auto-generated comment: rate limited by coderabbit.ai -->
```

短语搜索会误报——`@coderabbitai help` 的回复里就有 `rate limit`，而本仓库现在把
这些短语全写进了文档，CodeRabbit 复述一下 diff 就会命中。实测对照：按标记算，
PR #171（真跳过）2 次、#170 与 #172（真审过）0 次；按短语算，#171 出 5 次，其中
3 次来自 help 回复。

确认覆盖范围的对象是 `gh pr view --json headRefOid`，不是本地 `HEAD`，而且分两种：

- **历史零跳过** → 真实 review 的 `commit.oid` 等于 `headRefOid` 即可。首次审查
  按定义就覆盖整个 PR，而且这是唯一可得的证据——干净通过时汇总评论里根本没有
  `between …` 区间（PR #172 实测）。
- **历史有过跳过** → 末端 SHA 证明不了什么。跳过之后再推提交、再发增量审查，
  末端 SHA 照样等于 `headRefOid`，但最早那批提交没人看过。必须要一个从
  `baseRefOid` 到 `headRefOid` 的完整区间，只有 `full review` 会产生。

## Workflow outputs

CWF/DWF workflow capability can stay. If generated workflow outputs are added
again, keep them out of current product docs and put them under the Superpowers
plan output tree, for example:

```text
docs/superpowers/plans/workflows/cwf/
```

Do not treat old workflow outputs or old plans as Tucsenberg product truth.

## Do not commit

- `.codex/auth.json`
- `.codex/history.jsonl`
- `.codex/log/`
- `.codex/*.sqlite*`
- `.codex/shell_snapshots/`
- `.superpowers/`
- `.omx/`
- `.context/`
- `.claude/settings.local.json`
- real `.mcp.json`
