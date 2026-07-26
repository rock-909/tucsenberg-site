# CLAUDE.md

写给 Claude Code。`AGENTS.md` 讲同样的事，是给不会自动加载 `.claude/rules/*.md`
的其他工具看的。

## 这个项目

**tucsenberg-site** —— Tucsenberg 防洪挡板的英文 B2B 官网，靠它接 OEM / 批发询盘：
看产品、比规格、下载 PDF、发 RFQ。部署在 Cloudflare，走 OpenNext。

它是从一个通用 starter 改出来的，但那部分已经拆干净了：runtime profile 选择、
profile fixtures、旧 blog、物料化工具，全部退役。看到 starter 时代的命名，只可能
出现在检查脚本、兼容用的文件名、或者标注过的历史记录里，不代表那套东西还活着。

站点目前只出英文。i18n 框架是留着的，以后要加语言，别为了省事把翻译 key 拆成写死
的英文。

## 沟通

业主不懂技术。讲生意，别讲技术。

## 这个仓库的坑

跟直觉相反、或者从代码里看不出来的：

- **`pnpm build` 和 `pnpm website:build:cf` 写同一个 `.next` 目录。** 并行跑会互相
  覆盖，拿到的是假的构建结果。本地跑 E2E 时 Playwright 的 webServer 也会重建
  `.next`，是第三个写入方。`pnpm website:lighthouse` 不在此列：它单独构建到
  `.next-lighthouse`，用 4173 端口起服务，所以一次二十分钟的测量不会被并行构建、
  也不会被别的 worktree 占着 3000 端口的服务污染。
- **`src/lib/content-manifest.generated.ts` 是生成的，别手改。** 用
  `node scripts/starter-checks.js content-manifest` 重新生成。
- **commit 的 subject 必须小写、不超过 72 字符。** pre-push 会跑一遍完整构建；确实
  急，可以 `RUN_FAST_PUSH=1` 跳过。

## 验证

用能证明这次改动的最小验证，`pnpm run` 列出所有脚本。三条从脚本名看不出来的：

- 改 Cloudflare / OpenNext：先 `pnpm build`，再 `pnpm website:build:cf`。
- 要大范围本地检查：`pnpm website:check`。
- 上线前：`pnpm release:verify`。

## 参考资料

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

（这段带 BEGIN/END 标记，保持英文原样。）

其他依赖同理：动手前先看官方文档或本地锁版本的文档，确认 API 现在长什么样。

## 硬性约束

- **i18n**：用户能看到的文案一律走翻译 key。
- **Git**：GitHub Flow。`main` 是唯一长期分支，功能分支走 pull request。

## 判断准则

**缺陷。** 确认过的缺陷就是缺陷，投入产出比和"这是边缘情况"都不构成关掉它的理由；
范围和排期决定它什么时候修，不决定它算不算数。推迟就说清真实原因，以及留在原地
没动的根因是什么。动手前先问这个 bug 是怎么能存在的——优先拆掉让它成立的条件，
而不是把症状盖住。

**把关机制。** gate 和测试是为某个意图服务的手段，不是法律。一个检查逼着代码或
说明写下不属实的内容，该改的是检查。别把时间点快照（commit hash、条数、推送状态）
钉成必过断言，也别给 `AGENTS.md` / `CLAUDE.md` 加内容断言——要守就守那句话描述的
行为，守在行为发生的地方。
