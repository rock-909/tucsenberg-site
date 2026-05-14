# Dependency Upgrade Policy

这份文档记录**当前技术栈升级时哪些能升、哪些不能顺手升**。
目标不是阻止升级，而是避免每次看到 `pnpm outdated` 都重新靠记忆判断。

## 当前原则

1. 安全补丁优先；如果 `pnpm audit --prod --audit-level moderate` 报漏洞，不能用 hold 掩盖。
2. patch / minor 可以进入同一条小升级线，但必须跑对应证明。
3. major 升级、`0.x` minor 升级、编译器/格式化/部署工具的大版本变更要拆成独立 lane。
4. 生产运行链和 Cloudflare 构建链优先于“npm latest 好看”。
5. 依赖巡检使用 `pnpm outdated --format json + pnpm audit --prod --json + pnpm type-check/lint:check/build/website:build:cf`；已确认的 hold 项列成 `held_updates`，真正未处理的升级仍会出现在 `needs_update` 并阻塞。
6. `pnpm audit --audit-level low` 必须没有已知漏洞；如果直接依赖无法升，就用有证据的 `pnpm.overrides` 收敛 transitive 漏洞。

## 当前 hold 清单

| Package | Current reason | Safe next step |
| --- | --- | --- |
| `@types/node` | 项目 runtime 支持范围是 `>=24 <25`，Node 25 types 不匹配 | 只有当 runtime baseline 扩到 Node 25 时再升 |

## 2026-05-12 当前版本快照

这轮全面同步后的版本边界：

- Next.js / `@next/*`：16.2.6
- React / React DOM / `react-server-dom-*`：19.2.6
- TypeScript：6.0.3
- Tailwind CSS / `@tailwindcss/postcss`：4.3.0
- next-intl：4.11.2
- ESLint：10.3.0，`eslint-plugin-react-you-might-not-need-an-effect`：0.10.1
- React Email：6.1.1，`@react-email/render`：2.0.8
- React Grab：0.1.33，当前入口是 `@react-grab/mcp`
- OpenNext Cloudflare：1.19.9
- Wrangler：4.90.0
- workerd：1.20260507.1，由 Wrangler / Miniflare 间接带入
- Vite：8.0.12
- Playwright：1.60.0
- Vitest / `@vitest/coverage-v8`：4.1.6
- commitlint：21.0.0
- pnpm：11.1.0
- Node proof baseline：24.15.0，`@types/node` 保持 24.x

这份快照不替代 `package.json` 和 lockfile；它只是给人工阅读时快速判断“是不是旧文档”的锚点。

Cloudflare `compatibility_date` 仍是 `2026-05-04`。这不是漏升依赖，而是 runtime 行为开关没有跟着 Wrangler 补丁日历自动前进。后续如果推进到 `2026-05-07` 或更晚日期，要单独做 Cloudflare runtime proof。

## 这次升级经验

### react-grab

`react-grab` 不是简单改版本号：旧 companion `@react-grab/claude-code` 已经不适合继续作为当前入口。当前仓库改为：

- `react-grab 0.1.33`
- `@react-grab/mcp 0.1.33`
- 本地 helper 使用 `@react-grab/mcp/server` 的 `startMcpServer()`
- 浏览器侧 CDN bridge 使用 `@react-grab/mcp@0.1.33/dist/client.global.js`

验证重点：

- helper 能 import 到 `startMcpServer`
- `src/app/[locale]/layout.tsx` 只在 development 且未禁用 dev tools 时加载这些脚本
- paired test 断言具体 CDN URL，而不是只数 `<Script>` 个数

### React Email 6

`react-email` 6 迁移不是单纯改版本号。当前仓库采用：

- `react-email 6.1.1` 作为邮件组件和 render 的统一入口
- `@react-email/ui 6.1.1` 支撑本地 email preview
- 移除已 deprecated 的 `@react-email/components` 和 `@react-email/preview-server`
- 保留 `@react-email/render 2.0.8` 作为 `resend` peer dependency 的显式依赖
- `pnpm.overrides["@react-email/ui>next"] = "$next"`，避免预览工具链带入旧 Next patch
- `react-email` 当前仍会经由 `glob` 带入 `brace-expansion 5.x`，因此保留 `pnpm.overrides["brace-expansion@>=5.0.0 <5.0.5"] = "5.0.5"` 固定到 patched patch

验证重点：

- 管理员通知、客户确认、产品询盘三类模板都能 HTML render
- 三类模板都能 plain text render
- `pnpm exec email dev --dir src/emails --port 3001` 能启动 React Email 6 preview
- Resend 发送路径继续生成 plain text 内容
- `pnpm outdated --format json` 不再出现 React Email 5 hold 项

### prettier-plugin-tailwindcss 0.8

`prettier-plugin-tailwindcss` 仍在 `0.x`，因此 minor 升级按独立 formatting lane 处理。
本次 `0.7.2 -> 0.8.0` 没有触发全仓格式化 churn。

验证重点：

- `pnpm exec prettier --check .` 通过
- 不和业务代码或其它依赖升级混在同一个提交里

### ESLint 10

ESLint 10 不能只改版本号。当前仓库采用：

- `eslint 10.3.0`
- `@eslint/js 10.0.1`
- `eslint-plugin-security 4.0.0`
- `eslint-plugin-react-you-might-not-need-an-effect 0.10.1`
- `@eslint/compat 2.1.0`

这次升级的关键点：

- `eslint-plugin-react`、`eslint-plugin-import`、`eslint-plugin-jsx-a11y` 的 latest 仍未完全声明 ESLint 10 peer 范围，其中一部分由 `eslint-config-next` 间接带入。
- 旧 React ESLint rule API 在 ESLint 10 下会触发 `contextOrFilename.getFilename is not a function`，因此 Next 官方配置通过 `@eslint/compat` 的 `fixupConfigRules()` 包一层，而不是关闭规则。
- `pnpm.peerDependencyRules.allowedVersions` 只用于记录这批已验证的 ESLint 10 peer 噪声；如果后续插件 release 正式支持 ESLint 10，应优先移除这段兼容声明。
- ESLint 10 暴露了 `preserve-caught-error`、`no-useless-assignment` 相关问题，本次已把丢失的原始错误挂到 `cause`，并去掉无意义初始赋值。
- `eslint-plugin-react-you-might-not-need-an-effect 0.10.1` 会把 effect 里调用 props callback 的模式也纳入 `no-event-handler`；当前已采用 `0.10.1`，新增命中点需要通过真实事件处理器重构，或在确属外部 adapter 同步时使用最小范围、带理由的局部豁免。

验证重点：

- `pnpm lint:check` 能完整跑完
- `pnpm type-check` 通过；测试 tsconfig 如需单独核验，直接运行 `pnpm exec tsc --noEmit -p tsconfig.test.json`
- 受影响的 SEO、Resend、Airtable 错误处理测试通过
- `pnpm outdated --format json` 不再出现 ESLint 10 hold 项

### TypeScript 6

`typescript` 6 迁移不是只改版本号。当前仓库采用：

- `typescript 6.0.3`
- 移除 `tsconfig.json` 里的 `baseUrl`，保留显式 `paths` alias
- 移除旧的 `ignoreDeprecations: 5.0`，不再靠静默配置掩盖编译器弃用项
- 补齐 `tsconfig.typecheck-source.json`，让 source-only TypeScript 配置可以在需要时用 `next typegen && pnpm exec tsc --noEmit -p tsconfig.typecheck-source.json` 检查源码

这次升级的关键点：

- TypeScript 6 会把 `baseUrl` 作为弃用错误处理；当前项目没有依赖裸的 `src/...`、`components/...` 等 baseUrl import，因此可以直接移除。
- `@/*`、`@messages/*`、`@content/*` 继续通过 `paths` 工作。
- 新版 DOM 类型要求 `IntersectionObserver.scrollMargin`，测试 mock 需要补齐这个只读字段。

保留的 secondary tsconfig：

- `tsconfig.test.json` 保留给测试专用类型证明。它覆盖 Vitest、Testing Library、Playwright 配置、mock、测试工具和测试内容导入，避免测试环境类型问题被主 `tsconfig.json` 的源码检查漏掉。手动验证命令：`pnpm exec next typegen && pnpm exec tsc --noEmit -p tsconfig.test.json`。这条不是默认 CI 门禁；如果失败，要按输出修测试类型，不要靠删配置掩盖。
- `tsconfig.typecheck-source.json` 保留给 source-only 类型证明。它继承主 tsconfig，只单独设置 `tsBuildInfoFile`，用于在依赖或编译器升级时隔离证明源码面仍能通过。手动验证命令：`pnpm exec next typegen && pnpm exec tsc --noEmit -p tsconfig.typecheck-source.json`。
- `tsconfig.knip.json` 不保留。当前没有 package script 或 active 文档把它作为正式质量门禁；不在本轮顺手接入 knip，已按本地 trash 规则从 tracked source 退役。

验证重点：

- `next typegen && pnpm exec tsc --noEmit -p tsconfig.typecheck-source.json` 通过
- `next typegen && pnpm exec tsc --noEmit -p tsconfig.test.json` 作为保留测试 tsconfig 的证明命令，必须通过
- `pnpm type-check` 通过
- 与 Turnstile / IntersectionObserver 相关测试通过
- `pnpm build` 和 `pnpm website:build:cf` 都要跑，因为 Next 文档明确生产构建会执行类型检查
- `pnpm outdated --format json` 不再出现 TypeScript hold 项

`next-env.d.ts` 处理方式：

- 这是 Next.js 自动生成的类型入口，不是项目手写源码。
- 按 Next.js 16 本地文档，它要保留在 `tsconfig.json` / 测试 tsconfig 的 `include` 里，让 TypeScript 能识别 Next 类型。
- 同一份文档也建议把它加入 `.gitignore`；本项目按这个方式执行，不再跟踪提交它。
- `pnpm type-check` 会先跑 `next typegen`，确保干净 checkout、CI 和本机验证时文件会被重新生成；更细的 tsconfig 检查使用 `next typegen && pnpm exec tsc --noEmit -p <tsconfig>`。
- 不要编辑 `next-env.d.ts`。自定义全局类型放到独立 `.d.ts` 文件，再通过 tsconfig include 接入。

### `@types/node` / Node runtime

`@types/node` 不能按 npm latest 直接升。当前结论：

- 使用 `@types/node 24.x`
- 不把 `@types/node` 升到 `25.x`
- 项目 runtime baseline 已迁到 Node `24.15.0` LTS

原因：

- 当前 `package.json` 运行时范围是 `>=24 <25`
- GitHub Actions 和本地 `ci:local` 都以 Node `24.15.0` 作为 proof baseline
- Node 官方说明生产应用应使用 Active LTS 或 Maintenance LTS；Node 25 是 Current，不是 LTS
- Cloudflare Wrangler 可以在 Current / Active / Maintenance Node 上运行，但 Worker 最终运行在 `workerd`，这不能证明应用代码可以安全使用 Node 25 API

参考来源：

- Node.js release schedule: https://nodejs.org/en/about/previous-releases
- Cloudflare Wrangler install/update: https://developers.cloudflare.com/workers/wrangler/install-and-update/

所以这条不是“忘了升”，而是类型定义必须和真实运行时对齐。否则 TypeScript 会允许 Node 25 API，但 CI / Node 24 proof baseline 实际不可用。

Node 24 迁移验证重点：

1. `pnpm install --frozen-lockfile` 必须在 Node 24 下通过，验证 native/binary 依赖能安装。
2. `pnpm type-check`、`pnpm lint:check` 必须通过；需要测试 tsconfig 证明时，直接运行 `next typegen && pnpm exec tsc --noEmit -p tsconfig.test.json`。
3. `pnpm build` 和 `pnpm website:build:cf` 必须通过。
4. 完整 CI 必须在 Node 24 下通过。
5. 只有当 CI、Cloudflare 构建链和项目运行时都明确支持 Node 25 时，才考虑 `@types/node 25.x`。

### pnpm 11 / CI version source

当前仓库采用：

- `packageManager: pnpm@11.1.0`
- `engines.pnpm: >=11.1.0 <12`
- `pnpm-workspace.yaml` 里的 `packageManager: pnpm@11.1.0`

CI 不再在 `pnpm/action-setup@v5` 里硬编码 `version`。让 action 读取 `package.json` 的 `packageManager` 是有意的：

- 避免 GitHub Actions 配置和 `package.json` 出现两个 pnpm 真相源
- 避免 `ERR_PNPM_BAD_PM_VERSION`
- 避免 strict package-manager 检查下 CI 安装阶段提前失败

如果以后升级 pnpm，只改项目真相源和 lockfile，再跑 workflow contract test；不要只在 CI 里临时改成另一个 10.x 或 11.x。

### `critters`

`critters` 已从仓库移除，不替换成 `beasties`。

原因：

- `critters` 只在 Next.js 的 `experimental.optimizeCss` 路径里被动态 `require("critters")`
- 当前仓库没有开启 `experimental.optimizeCss`
- 当前仓库还明确关闭 `experimental.inlineCss`，因为它会引入 FOUC 和首屏性能回退
- `beasties` 是 `critters` 的维护 fork，但 Next.js 16.2.6 当前并不会自动 `require("beasties")`
- 因此直接新增 `beasties` 会变成新的未使用依赖，不是稳定升级

### Next.js / React 2026-05 security patch lane

这轮安全同步采用：

- `next 16.2.6`
- `@next/mdx 16.2.6`
- `@next/bundle-analyzer 16.2.6`
- `@next/eslint-plugin-next 16.2.6`
- `eslint-config-next 16.2.6`
- `react 19.2.6`
- `react-dom 19.2.6`
- `react-server-dom-webpack 19.2.6`
- `react-server-dom-turbopack 19.2.6`

原因：

- Next.js `v16.2.5` 是安全发布，覆盖 App Router / Middleware-Proxy / Cache Components / RSC / CSP nonce / Image Optimization 等多项 advisory；当前已跟随补丁线到 `v16.2.6`。
- React `19.2.6` 同步修复 React Server Components 相关安全警告；仓库显式依赖的 `react-server-dom-*` 必须一起对齐，不能只升 `react` / `react-dom`。
- Cloudflare adapter `@opennextjs/cloudflare 1.19.9` peer 明确要求 `next >=15.5.16 <16 || >=16.2.5`，所以 Next 16.2.6 与 OpenNext 1.19.9 仍在同一条安全兼容线。

验证重点：

- `pnpm list next react react-dom react-server-dom-webpack react-server-dom-turbopack --depth 0`
- `pnpm audit --audit-level low`
- `pnpm type-check`
- `pnpm lint:check`
- `pnpm test`
- `pnpm build`
- `pnpm website:build:cf`

### transitive security overrides

当前部分 dev-tool 依赖没有上游新版本，但有可安全覆盖的 transitive 漏洞：

- `@lhci/cli 0.15.1` 仍带 `lighthouse 12.6.1`、`proxy-agent`、`express` 链路里的漏洞依赖。
- `eslint-config-next 16.2.6` 仍通过 `eslint-plugin-import` 带入旧 `minimatch 3.1.2`。
- `vitest 4.1.6` peer graph 仍需要通过 override 固定 `happy-dom >=20.8.9`，虽然本仓库默认测试环境是 `jsdom`。
- `@storybook/nextjs-vite 10.3.6` peer graph 需要 patched Vite。

因此使用这些 override：

- `vite@>=7.1.0 <7.3.2 -> >=7.3.2`：历史安全 override，Vite 主依赖现已升级到 8.0.12；保留用于收敛仍声明旧 peer 范围的下游工具链。
- `basic-ftp -> >=5.3.1`
- `path-to-regexp@>=8.0.0 <8.4.0 -> >=8.4.0`
- `happy-dom -> >=20.8.9`
- `lodash-es -> >=4.18.0`
- `ip-address@<=10.1.0 -> >=10.1.1`
- `minimatch@<3.1.5 -> >=3.1.5`
- `brace-expansion@<1.1.13 -> >=1.1.13`
- `qs -> >=6.14.2`

这批 override 不能当成长期美化项；每次升级 `@lhci/cli`、`eslint-config-next`、`vitest`、`storybook` 后，都要重新跑：

```bash
pnpm audit --audit-level low
pnpm why basic-ftp lodash-es path-to-regexp happy-dom vite minimatch brace-expansion qs ip-address
```

验证重点：

- `pnpm build` 通过
- `pnpm website:build:cf` 通过
- `pnpm website:lighthouse` 是可选手动性能证明，不属于默认升级门禁
- `pnpm outdated --format json` 不再出现 deprecated `critters`

### tech check

`pnpm outdated --format json + pnpm audit --prod --json + pnpm type-check/lint:check/build/website:build:cf` 的目标是指出真正需要处理的问题。
当前策略是：

- 有可行动升级：`needs_update` 非空，命令失败
- 只有已确认 hold：`held_updates` 非空但 `needs_update` 为空，命令通过
- 有安全漏洞：不能 hold，必须失败
- 如果 npm registry 的 full outdated 查询卡住，可先用 `TECH_CHECK_SKIP_OUTDATED=1 pnpm tech:check` 跳过 registry outdated 阶段，先验证 audit / config / type / lint / build；完整 latest 差异再用单包 `npm view` 或分组 `pnpm outdated --prod/--dev --compatible` 补查。
