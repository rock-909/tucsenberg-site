# 整库审查 2026-07-26 修复轮设计

- 日期：2026-07-27
- 来源审查：`docs/技术难题/整库审查2026-07-26/`（run-id `2026-07-26`，审查对象 `f432da8`）
- 施工顺序依据：同目录 `04-修复建议排序.md`
- 工作区：`.claude/worktrees/audit-2026-07-26-repairs`，基线 `f432da8`（与 `origin/main` 同 SHA）
- 基线状态：`pnpm install --frozen-lockfile` 通过；`pnpm test` 288 文件 / 2395 用例全绿，与审查基线一致

---

## 1. 这一轮要解决什么

审查产出 12 条发现，外加一条经外部复核补入的记录（下称「补记 A」）。本轮修复 **11 条发现 + 补记 A**，分五个 pull request 交付。

**明确排除**：`FPH-2607-008`（`CLAUDE.md` / `AGENTS.md` 的 i18n 硬性约束与已接受的 Content-as-code ADR 口径冲突）。它需要业主先裁决走哪条口径，裁决前动手只会把两边都改成折中措辞，两边就都不再是可执行的规则。它对应 `04-修复建议排序.md` 的批次 4，不在本轮。

**同样排除**：审查轮跳过的五条重命令（`pnpm component:check`、`pnpm release:verify`、`wrangler deploy --dry-run --env preview`、`pnpm website:lighthouse`、`semgrep scan`）的补跑。其中 `release:verify` 会在每个 PR 的验收里被自然覆盖到一部分，但「补齐审查覆盖面」属于审查轮的事，不是修复轮的事。

---

## 2. PR 顺序，以及为什么是这个顺序

| 次序 | 分支主题 | 覆盖发现 | 排在这里的原因 |
| ---: | --- | --- | --- |
| PR 1 | 静态文件响应头 | `FPH-2607-001`、`FPH-2607-002` | 唯一的 P1；改动面最小；行为面与守卫面必须同一个 PR，否则改完仍然没人守 |
| PR 2 | 删除半成品安全文件 | `FPH-2607-003` | 纯删除，与任何 PR 无文件重叠 |
| PR 3 | 询盘链路的两个静默失败 | `FPH-2607-004`、`FPH-2607-005` | 必须早于 PR 5，两者抢同一个 `src/components/forms/inquiry-form.tsx` |
| PR 4 | 惯例、类型收敛、依赖台账 | `FPH-2607-010`、`FPH-2607-011`、`FPH-2607-012`、补记 A | 与任何 PR 无文件重叠；插在这里，避免在等 PR 3 合并时空等 |
| PR 5 | 架构清理 | `FPH-2607-007`、`FPH-2607-006`、`FPH-2607-009` | 唯一的硬前置：`inquiry-form.tsx` 必须先拿到 PR 3 的改动 |

**硬依赖只有一条**：PR 5 开始前，PR 3 必须已合入 `main`。其余四个 PR 相互独立，任何一个被打回都不阻塞其他。

**交付节奏**：每个 PR 推送后等 CI 全绿，停下来交给业主合并，合并完成后再开下一个。不堆叠分支。

---

## 3. PR 1：让静态文件的响应头真正生效

### 3.1 现状与根因

`next.config.ts:167-207` 声明了两条规则：`/downloads/:path*.pdf` 加 `X-Robots-Tag: noindex`，以及 `svg|jpg|jpeg|png|webp|pdf|woff|woff2|ttf|otf` 加一年 immutable 缓存。

这两条对访客都不生效。`public/` 下的文件由 Cloudflare Static Assets 直接送出，根本不经过 Next 服务器，所以只有 `public/_headers` 说了算。而构建产物 `.open-next/assets/_headers` 里只有一行 `/_next/static/*`。

守卫也没守住：`tests/architecture/tucsenberg-site-contract.test.ts:624-628` 断言的是「`next.config.ts` 这个文件的文本里包含某个字符串」。源文件里写了什么，和访客实际收到什么，是两件事。这条断言即使在完全失效的今天也是绿的。

### 3.2 缓存策略的机制依据

长缓存只有在**文件名带内容指纹**时才安全。指纹指文件名里含一段由内容算出的编号，内容一变文件名就变，浏览器自然去取新的。

- `/_next/static/*`：构建时自动带指纹。它现有的一年 immutable 是正确的，**本轮不动**。
- `public/` 下的文件：文件名由作者写定，永不变化。换了图、换了 PDF，URL 一模一样。

本项目额外还有两条事实，堵死了「让 `public/` 也拿到指纹」这条路：
- `next.config.ts:96-102` 在 Cloudflare 构建下设 `images.unoptimized: true`，官方文档说明该值为 `true` 时「源图按 `src` 原样送出」。
- `src/components/layout/logo.tsx:71-72` 的 `next/image` 用的是来自配置的**字符串路径**（`src/config/single-site.ts:215-224`），不是静态 import，所以不会进入带指纹的产物目录。

因此 `public/` 下的图与 PDF 只能短缓存。定 `max-age=86400`（一天）。业主是非技术人员，不应该因为「换图忘了改文件名」而踩一年的坑。

**将来图片变多时的正解**（本轮不做，届时需实测确认）：新图放进 `src/` 并用 `import` 引入，由构建自动加指纹、自动落进 `/_next/static/`，自动吃到已有的一年缓存。`public/` 只保留「URL 必须稳定」的东西：买家会收藏转发的 PDF、`.well-known/security.txt`、社交分享用的 OG 图。

### 3.3 改动面

```text
public/_headers                                             +8 行
next.config.ts                                              −13 行（删 pdfNoindexHeaders 与静态资源 cdnCacheHeaders 两条 source 规则）
tests/architecture/tucsenberg-site-contract.test.ts         替换 1 个用例的断言目标
scripts/quality/checks/cloudflare-static-asset-headers.js   期望规则集 +2 条
```

`public/_headers` 追加：

```text
/downloads/*
  X-Robots-Tag: noindex
  Cache-Control: public,max-age=86400

/images/*
  Cache-Control: public,max-age=86400
```

`next.config.ts` 只删这两条 `source` 规则。`/:path*` 上的安全响应头与非生产环境 noindex 规则**保留**，它们服务的是由 Worker 渲染的 HTML 路由，那条路径上 Next 的 `headers()` 是生效的。

### 3.4 守卫设计：两层，各证各的

单靠一层证不完。分开：

| 层 | 断言什么 | 证明了什么 | 什么时候跑 |
| --- | --- | --- | --- |
| `pnpm test`（架构测试） | `public/_headers` 源文件里写了 `/downloads/*` 段且含 `X-Robots-Tag: noindex` | 意图存在 | 每次提交 |
| `node scripts/starter-checks.js cf-static-asset-headers` | 构建产物 `.open-next/assets/_headers` 里同样存在这两段 | 意图真的进了部署包 | 构建后 |

架构测试断言源文件而不是构建产物，是因为 `pnpm test` 不触发构建，在干净检出上读 `.open-next/` 会失败。这个分工是刻意的，不是妥协：源文件层证明「有人写下了这个意图」，构建产物层证明「这个意图没有在构建途中丢掉」。

被替换掉的旧断言（读 `next.config.ts` 文本找字符串）整条删除，不保留。它守的是一个已经不存在的机制。

### 3.5 变红验证

改完后必须实际执行一次，不是纸面承诺：临时删除 `public/_headers` 里的 `/downloads/*` 段，重跑上表两层检查，确认**两层同时变红**；恢复后确认变绿。执行记录写进 PR 描述。

### 3.6 验收

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
pnpm website:build:cf
node scripts/starter-checks.js cf-static-asset-headers
pnpm exec wrangler dev --port 8787 --local &
curl -sI http://127.0.0.1:8787/downloads/spec-sheet-tb-bw.pdf | grep -i "x-robots-tag\|cache-control"
curl -sI http://127.0.0.1:8787/images/tucsenberg-logo.png     | grep -i "cache-control"
```

期望：PDF 响应含 `X-Robots-Tag: noindex` 与 `Cache-Control: public,max-age=86400`；图片响应含 `Cache-Control: public,max-age=86400`。

---

## 4. PR 2：删除半成品安全联系文件

### 4.1 现状与根因

`public/security-policy.txt` 当前可公开访问，正文里留着「Replace this line with the real security contact before public launch」。同时 `public/.well-known/security.txt` 存在，且已填了真实邮箱 `sales@`。

根因是「安全联系方式」这件事有两个所有者。`.well-known/security.txt` 是 RFC 9116 规定的标准位置，安全研究者与自动化工具只认它。留着第二份人类可读版本，只会保证两份迟早不一致。

### 4.2 改动面

```text
public/security-policy.txt                        移入废纸篓（禁用 rm，见全局约束）
public/.well-known/security.txt                   Preferred-Languages 去掉已退役的 zh
tests/unit/content-page-placeholders.test.ts:29   从 PUBLIC_LEGAL_AND_SECURITY_FILES 移除该路径
tests/architecture/public-asset-surface.test.ts:27 从 NON_REFERENCED_SURFACES 移除该项
docs/项目基础/替换边界.md:26                       删除该 must-replace 条目
docs/项目基础/技术栈.md                            去掉对该文件的引用
```

删除操作用 `mv` 移到 `~/.Trash/`（带时间戳后缀避免同名冲突），再 `git add -A` 让 git 记录删除。全局约束禁止 `rm`、`git clean` 等不可恢复命令。

### 4.3 为什么删而不是填

填意味着承认两份真相长期共存。删之后，「安全联系方式」只有一个所有者，也就没有了不一致的可能。这是 delete-first。

### 4.4 验收

```bash
pnpm test
pnpm build && pnpm website:build:cf
pnpm exec wrangler dev --port 8787 --local &
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/security-policy.txt   # 期望 404
curl -s http://127.0.0.1:8787/.well-known/security.txt                                # 期望含 sales@，不含 zh
```

---

## 5. PR 3：询盘链路上的两个静默失败

### 5.1 `FPH-2607-004`：验证码挂了，买家没有被指出去的路

**现状**：Turnstile 拿不到令牌时，提交按钮保持禁用（`inquiry-form-status.tsx` 的 `disabled={isSubmitting || !turnstileReady}`），页面上没有任何显式的「换个方式联系我们」。页脚法务行里确实有纯文本邮箱，所以买家不是彻底无路可走，这也是审查时把它从 P1 降到 P2 的原因。但一个按钮永远点不亮、页面不解释为什么，买家的默认反应是离开。

**改法**：不新增组件、不新增文案键。救援行组件 `TurnstileRescueLine` 与文案键 `inquiry.form.turnstile.rescue*` 都已存在。只改触发条件：

```text
src/components/forms/inquiry-form.tsx         onError / onExpire 除了清令牌，另置 needsRescue 状态
src/components/forms/inquiry-form-status.tsx  needsRescue 为真，或「组件已就绪但 15 秒仍无令牌」时渲染救援行
```

15 秒阈值的依据：Turnstile 正常挑战通常 1–3 秒完成，15 秒足以排除慢网络的误触发。

### 5.2 `FPH-2607-005`：邮件失败而表格成功时，没人告诉业主

**现状**：`src/lib/lead-pipeline/process-lead.ts:162-177` 用 `Promise.all` 并行发出邮件与 Airtable 写入，只要有一边成功就返回成功（行为合约 BC-012A，「任一通道成功即成功，邮件尽力而为」）。这个合约本身是对的：买家不该因为业主的邮件服务商抽风而被拒绝。

问题在下游。邮件失败、记录写成功时，业主的收件箱里什么都没有，Airtable 里那条记录长得和正常的一模一样。业主不会知道有一封本该到达的通知丢了。

**改法**：在 Airtable 记录上写一个标记。

`createProductLeadRecord`（`process-lead.ts:105-144`）当前丢弃了 `airtableService.createLead` 的返回值，只回一个布尔。改成回 `{ ok: boolean; recordId?: string }`（`CreatedAirtableRecord` 已含 `id`，见 `src/lib/airtable/types.ts:8-10`）。

两个通道**照旧并行**。两个结果都拿到之后，仅在「邮件失败 且 记录写成功」这一种组合下，追加一次 Airtable 更新，把 `Owner Emailed` 置为否。

```text
src/lib/airtable/service.ts                        新增 updateLead(recordId, fields) 方法
src/lib/airtable/service-internal/lead-records.ts  新增 Owner Emailed 字段映射
src/lib/lead-pipeline/process-lead.ts              createProductLeadRecord 返回 recordId；结果汇合后按条件补一次更新
```

**为什么不改成串行**：串行会让每个买家多等一个网络往返，换来的只是代码顺一点。补丁式更新只在失败路径上多一次请求，正常路径零额外开销。

**这次更新失败了怎么办**：包在 `try/catch` 里，失败只记日志，接口仍返回成功。询盘本身已经存进 Airtable 了，不能因为写不上一个标记就把买家的提交判失败。

**依赖业主操作**：Airtable 表里需要新增一列 `Owner Emailed`（勾选框类型）。列不存在时更新会被 Airtable 拒绝，按上一段的设计只会记一条日志，不影响询盘落库。这一项列入业主待办。

### 5.3 测试策略

先写会失败的测试，再写实现。

```text
新增单元测试：mock Resend 失败 + Airtable 成功
  断言 1：接口仍返回成功
  断言 2：updateLead 被调用，且 Owner Emailed 为否
新增单元测试：mock 两者都成功
  断言：updateLead 一次都没被调用（证明正常路径零额外请求）
新增 e2e：拦截 challenges.cloudflare.com 使其失败
  断言：页面出现带 mailto 的救援行
```

### 5.4 验收

```bash
pnpm type-check && pnpm lint:check && pnpm test
pnpm build && pnpm website:build:cf
pnpm exec playwright test
```

---

## 6. PR 4：惯例、类型收敛、依赖台账

### 6.1 `FPH-2607-011`：惯例不一致

三件事，共同点是**都不是违规，是根本没有规则可依**。审查时特别核对过：`coding-standards.md:31` 那张表规定的是标识符命名，不是文件名。所以下面第一条是「事实惯例的唯一例外」，不是「违反规则」。

```text
src/components/layout/Footer.tsx → footer.tsx   68 个组件文件里唯一的 PascalCase 文件名
docs/.../coding-standards.md                     补两条现在压根没写下来的规则：文件名大小写、注释语言
src/lib/api/with-rate-limit.ts:10,16,184         JSDoc 示例里的 'contact' 预设已退役，改成 'inquiry'
```

注释语言：全仓 275 个文件里 53 个中英混写。没有任何规则可依，所以本轮只做一件事——把规则写下来，让以后有据可循。**不批量重写存量注释**，那是一次与本轮无关的大范围改动。

文件重命名在 macOS 的大小写不敏感文件系统上用 `git mv` 执行，git 会正确记录改名。

### 6.2 `FPH-2607-010`：28 处语言参数硬转换

全仓有 28 处 `locale as Locale` 式的硬转换，只有 5 处走了 `isLocale` / `coerceLocale` 守卫。

**这不是修 bug**。审查时实测过 `/invalid/contact`、`/zh`、`/nope` 全部 404，Next 路由层先拦住了，当前没有可触发路径。这也是它被从 P2 降到 P3 的原因。

改的是写法一致性——委托明确点名要查「新代码是否跟本仓库既有写法长得一样，还是每段自成一派」。改一半比不改更糟：那等于在两种写法之外再造第三种。

**改法**：提供 `resolveLocaleParam(params)`，28 处收敛成一种调用。顺手让它在拿到非法值时 `notFound()`，把静默转换变成响亮的 404。预期行为零变化（当前本来就到不了），改的是「以后路由层放行了会怎样」。

### 6.3 `FPH-2607-012`：开发依赖漏洞

5 个 high、2 个 low，全部在开发依赖里，生产依赖树干净。

**不进门禁**。这些包不会发给访客，拿它们把门禁变红只会训练所有人忽略红灯。改法是给 `.github/workflows/weekly-audit.yml` 加一个 `continue-on-error: true` 的全量 audit 步骤，结果只写进工作流摘要，让它可见但不阻塞。

### 6.4 补记 A：测试标题与断言脱节

`tests/unit/scripts/validate-production-config.test.ts:619` 用例标题是「blocks starter identity, SEO defaults, **and missing legal/contact owner review** in client launch strict mode」，但断言列表里已经没有任何一条检查法务/联系人复核了——那个布尔断言在 2026-07-27 的业主裁决中已退役（`scripts/quality/checks/production-config.js:427-432` 有记录）。

**改法**：删掉标题里那半句。测试标题是给人读的合约，说了不做比不说更坏。

这一条是审查初版漏报、经外部复核补入的。

### 6.5 验收

```bash
pnpm type-check && pnpm lint:check && pnpm test
pnpm build && pnpm website:build:cf
pnpm knip:check
grep -rn "as Locale" src --include="*.ts" --include="*.tsx" | grep -v __tests__
# 期望：仅剩 src/i18n/locale-utils.ts 内部的实现，页面层零命中
```

---

## 7. PR 5：架构清理（前置：PR 3 已合入 main）

delete-first、simplify-first。三步严格按序，做完一步跑一次全量验收再进下一步，避免两处同时改动互相干扰。

### 7.1 第一步：删 `src/config/site-facts.ts`（`FPH-2607-007`，Delete）

该文件整体只做一件事：`export const siteFacts = SINGLE_SITE_FACTS;`。一个纯转手层，制造了同一份真相的第二个名字。

6 个消费方改成直接从 `@/config/single-site` 导入，文件移入废纸篓。

### 7.2 第二步：内联 `useLeadFormSubmission`（`FPH-2607-006`，Simplify）

`src/lib/forms/use-lead-form-submission.ts` 是一个 166 行的泛型 hook，8 个配置项加一个 `TResult` 类型参数，全仓只有一个调用方。它的自我说明还写着「两个表单真正重复的部分」，那已经不是事实。

内联回 `inquiry-form.tsx` 后约 250 行，仍在健康区间。

**测试要重写，不要搬运**：现有 294 行测试测的是这个 hook 的内部结构。原样搬过去等于把「测内部结构」这个问题一起搬过去。改成测表单看得见的行为：提交时锁住、令牌重置、成功后清空。

### 7.3 第三步：`schemaInput` 从校验规则推导（`FPH-2607-009`，Simplify）

`src/app/api/inquiry/route.ts:79-88` 手写了一张字段白名单。加了新的询盘字段但忘了同步这张表，字段会被静默丢掉——不报错、不记日志，买家填了，业主收不到。

改成从 zod schema 的字段名推导。写一次，以后加字段自动跟上。

### 7.4 验收

```bash
pnpm type-check && pnpm lint:check && pnpm test
pnpm build && pnpm website:build:cf
pnpm knip:check
pnpm exec playwright test
grep -rn "siteFacts" src --include="*.ts" --include="*.tsx" | grep -v __tests__   # 期望零命中
```

---

## 8. 每个 PR 的共同标准

**验收总纲**（串行执行，`pnpm build` 与 `pnpm website:build:cf` 绝不并行——两者写同一个 `.next` 目录）：

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
pnpm website:build:cf
```

**每个 PR 必须能说清一件事**：如果这个修复被改坏，哪条检查会变红。说不清的，说明守卫没做到位，PR 不算完成。

**提交规范**：subject 小写、不超过 72 字符。pre-push 会跑完整构建。

**合并规范**：推送后等 CI 全绿，停下来交业主合并。不自行合并。

---

## 9. 业主待办

只有一项，且只影响 PR 3 的完整生效：

- 在 Airtable 的询盘表里新增一列 `Owner Emailed`，类型选勾选框。这列用来标出「这条询盘的通知邮件没发出去」。列不存在不会导致询盘丢失，只是这个标记写不上。

另有一项本轮**不做但仍悬着**的裁决：`FPH-2607-008`，`CLAUDE.md` / `AGENTS.md` 的 i18n 硬性约束与已接受的 Content-as-code ADR 之间的口径冲突。需要业主选定走哪一边，之后**单向**修正文档，不做折中措辞。

---

## 10. 明确不做的事

审查过程中评估过并否决的，本轮同样不做：

| 想法 | 为什么不做 |
| --- | --- |
| 给邮件服务加一层 `EmailService` 接口 / DTO / mapper | 一个供应商、一个调用方，调用方用的已是业务形状方法。加层是拿一个复查触发点换一个真实的多余抽象 |
| 把 5 个产品页常量文件拆小 | 单一职责的数据文件，改动原因只有一个。行数不是判据 |
| 拆开 893 行的 `tucsenberg-site-contract.test.ts` | 它的点名清单是与真实注册表 `toEqual` 对账的，拆开可能拆断对账 |
| 把并行的邮件 + 表格改成串行 | 买家多等一个网络往返，只换来代码顺一点 |
| 修 `--border` 的对比度 | 装饰性描边，WCAG 1.4.11 不要求。改了会让全站分隔线变重 |
| 批量重写 53 个文件的混合语言注释 | 本轮只补规则，存量重写是另一件事 |
| 把开发依赖的 5 个 high 漏洞升到门禁 | 不发给访客，变红只会训练大家忽略红灯 |
| 现在就把 3 张品牌图搬进 `src/` 做指纹化 | 要改 `single-site.ts` 这个真相源和它的测试，把一个两行配置改动变成真重构。等真要加产品图时再做 |

---

## 11. 风险

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| PR 1 改了缓存时长，与 `next.config.ts` 原声明（一年 immutable）不同 | 回头客的图片与 PDF 每天多一次条件请求 | 三张图共几百 KB，实际影响近似为零；换来的是「换图不用改文件名」 |
| PR 3 依赖业主在 Airtable 加列 | 列没加时标记写不上 | 更新失败只记日志，询盘照常落库；PR 描述里写明这一项 |
| PR 5 第二步重写 294 行测试 | 重写过程中可能漏掉现有覆盖 | 先写新的行为测试并确认变红，再删旧测试；不允许「删了再补」 |
| PR 5 与 PR 3 的文件冲突 | 合并冲突 | 顺序前置，PR 3 合入 main 后 PR 5 才开分支 |
| `Footer.tsx` 大小写改名在大小写不敏感文件系统上出错 | 改名丢失或产生重复文件 | 用 `git mv`，改完 `git status` 与 `pnpm build` 双重确认 |
