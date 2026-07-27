# 整库审查 2026-07-26 修复轮设计

- 日期：2026-07-27（v2，经三路独立盲审后重写）
- 来源审查：`docs/技术难题/整库审查2026-07-26/`（run-id `2026-07-26`，审查对象 `f432da8`）
- 施工顺序依据：同目录 `04-修复建议排序.md`
- 工作区：`.claude/worktrees/audit-2026-07-26-repairs`，基线 `f432da8`（与 `origin/main` 同 SHA）
- 基线状态：`pnpm install --frozen-lockfile` 通过；`pnpm test` 288 文件 / 2395 用例全绿

## 修订说明

v1 经三个独立子代理盲审（事实核查 / 技术攻击 / 范围合规），去重后共二十余条问题，其中六条会导致施工失败或修出新缺陷。v2 据此重写，主要变更：

| v1 的说法 | v2 改成 | 为什么 |
| --- | --- | --- |
| 删掉 `next.config.ts` 的两条响应头规则 | **一条都不删**，只往 `public/_headers` 新增 | 那两条对 Node 服务器与 Worker 渲染的图标路由是生效的。删掉会让 `tests/e2e/tucsenberg-site-smoke.spec.ts:44` 变红，而红灯落在后续 PR 上 |
| 在 Airtable 加 `Owner Emailed` 勾选列 | 复用现有 `Status` 列，写入 `New — Email Failed` | 勾选框的「否」与「从未写入」不可区分，业主分不出邮件失败和历史记录 |
| 新建「源文件层 + 产物层」两层守卫 | 只扩展既有检查脚本与既有架构测试 | `.open-next/assets/_headers` 是 `public/_headers` 的逐字节 `cpSync` 副本，两层断言同一份内容；且两层今天都已存在 |
| 在 `inquiry-form-status.tsx` 渲染救援行 | 救援行唯一 owner 是 `turnstile.tsx` | `lazy-turnstile.tsx:164-178` 已在脚本失败时渲染救援行，新增会出现两条重复提示 |
| `schemaInput` 用 zod 内省 API 推导字段名 | 用 zod 自带的未知键剥离，一行 spread | 那张表还承担写死 `type`、空串归一、归因字段清洗三件事，纯推导会让买家因 UTM 格式被拒 |
| `updateLead` 只包 `try/catch` | 必须包 `withAirtableBudget` | Airtable SDK 遇 429 自行退避重试（初始 5s，上限 600s），不受 `requestTimeout` 约束；询盘接口无总超时 |

另新增 PR 0（审查报告集尚未提交进 git），并修正十余处文件路径与行号错误。

---

## 1. 这一轮要解决什么

审查产出 12 条发现，外加一条经外部复核补入的记录（下称「补记 A」）。本轮修复 **11 条发现 + 补记 A**，另加盲审新发现的一个缺陷，分六个 pull request 交付。

**明确排除**：`FPH-2607-008`（`CLAUDE.md` / `AGENTS.md` 的 i18n 硬性约束与已接受的 Content-as-code ADR 口径冲突）。需业主先裁决走哪条口径，裁决前动手只会把两边都改成折中措辞，两边就都不再是可执行的规则。

**业主已裁决（2026-07-27）**：

| 事项 | 裁决 |
| --- | --- |
| 静态文件缓存时长 | `public/` 下的图与 PDF 用 `max-age=86400`（一天）；`/_next/static/*` 的一年 immutable 不动 |
| 半成品安全政策文件 | 删除，对外只留 `.well-known/security.txt` 的邮箱 |
| 注释语言 | **中文** |
| `useLeadFormSubmission` 抽象层 | **拆**（明知 2026-07-19 曾登记为延后项，本次裁决取代该登记） |
| 两份 PDF 里的认证声明 | **本轮不改**，记入台账（详见 §10.2） |

---

## 2. PR 顺序，以及为什么是这个顺序

| 次序 | 分支主题 | 覆盖 | 排在这里的原因 |
| ---: | --- | --- | --- |
| PR 0 | 提交审查报告集 | — | 全轮依据尚未进 git，必须先落盘 |
| PR 1 | 静态文件响应头 | `FPH-2607-001`、`FPH-2607-002` | 唯一的 P1；行为面与守卫面必须同一个 PR |
| PR 2 | 删除半成品安全文件 + 补占位句门禁 | `FPH-2607-003` | 纯删除加一条门禁，与任何 PR 无文件重叠 |
| PR 3 | 询盘链路的静默失败 | `FPH-2607-004`、`FPH-2607-005`、新缺陷 N-1 | 必须早于 PR 5，两者抢 `src/components/forms/inquiry-form.tsx` |
| PR 4 | 惯例、locale 收敛、依赖台账 | `FPH-2607-010`、`FPH-2607-011`、`FPH-2607-012`、补记 A | 与任何 PR 无文件重叠 |
| PR 5 | 架构清理 | `FPH-2607-007`、`FPH-2607-006`、`FPH-2607-009` | 唯一硬前置：`inquiry-form.tsx` 必须先拿到 PR 3 的改动 |

**硬依赖只有一条**：PR 5 开始前，PR 3 必须已合入 `main`。

**交付节奏**：每个 PR 推送后等 CI 全绿，停下来交业主合并，合并完成后再开下一个。不堆叠分支。

---

## 3. PR 0：把审查报告集提交进 git

### 3.1 问题

`docs/技术难题/整库审查2026-07-26/`（7 个条目）当前只存在于主检出的工作区，`git status` 显示为未跟踪，任何 ref 里都没有过。本轮全部 12 条发现的编号、定级、证据都只活在这堆游离文件里。

审查轮声称「最终报告集提交到 `docs/技术难题/整库审查2026-07-26/`」，实际只写未提。

### 3.2 改动面

把主检出 `/Users/Data/code/tucsenberg-site/docs/技术难题/整库审查2026-07-26/` 整个目录复制进本工作区并提交。**复制，不移动**——主检出那份保持原样，由业主自行处置。

不修改其中任何一个字节。里面有两处已知瑕疵（补记 A 把 R'5 的 MOQ 项误并入 R'6；`FPH-2607-007` 的反证漏了一个 `vi.mock`），**不在这个 PR 里改**——审查报告是一次运行的快照，改它等于伪造历史。两处更正记入本设计文档 §10.3，供后续轮次引用。

### 3.3 验收

```bash
git status --porcelain -- "docs/技术难题/整库审查2026-07-26"   # 期望零行
pnpm test                                                      # 期望不受影响
```

---

## 4. PR 1：让静态文件的响应头在 Cloudflare 上生效

### 4.1 现状与根因

`next.config.ts:158-207` 声明了两条规则：

- `pdfNoindexHeaders`（:166-171）应用于 `source: "/downloads/:path*.pdf"`（:198-201）
- `cdnCacheHeaders`（:158-165）应用于 `source: "/:all*(svg|jpg|jpeg|png|webp|pdf|woff|woff2|ttf|otf)"`（:202-207）

**这两条不是无效的，是覆盖面不完整。** 它们通过 Next 的 `headers()` 生效，因此覆盖：

- 本地与 CI 的 Playwright（`playwright.config.ts:133-137` 跑的是 `pnpm build && pnpm start`，Node 服务器）
- Worker 渲染的路由，包括 `src/app/icon.png`、`src/app/apple-icon.png` 这类文件式 metadata

**不覆盖**的是 `public/` 下的文件。它们由 Cloudflare Static Assets 直接送出，不经过 Next 服务器，只有 `public/_headers` 说了算。而 `public/_headers` 当前只有一条 `/_next/static/*`。

所以真实缺口是：**部署到 Cloudflare 之后，6 份 PDF 没有 `X-Robots-Tag: noindex`，3 张图没有缓存头**。

守卫也没守住：`tests/architecture/tucsenberg-site-contract.test.ts:625-631` 断言的是「`next.config.ts` 这个文件的文本里包含某个字符串」。源文件写了什么，和访客收到什么，是两件事。

### 4.2 缓存策略的机制依据

长缓存只有在**文件名带内容指纹**时才安全。指纹指文件名里含一段由内容算出的编号，内容一变文件名就变。

- `/_next/static/*`：构建时自动带指纹。现有的一年 immutable 是正确的，**本轮不动**。
- `public/` 下的文件：文件名由作者写定，永不变化。

本项目额外有两条事实堵死了「让 `public/` 也拿到指纹」这条路：

- `next.config.ts:96-102` 在 Cloudflare 构建下设 `images.unoptimized: true`。官方文档（`node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md:404`）：「`true`: The source image will be served as-is from the `src`」。
- `src/components/layout/logo.tsx:57,71-72` 的 `next/image` 用的是来自 `src/config/single-site.ts:215-224` 的**字符串路径**，不是静态 import，不会进入带指纹的产物目录。

因此 `public/` 下的图与 PDF 只能短缓存，定 `max-age=86400`。

**将来图片变多时的正解**（本轮不做，届时需实测确认）：新图放进 `src/` 并用 `import` 引入，由构建自动加指纹、落进 `/_next/static/`，自动吃到已有的一年缓存。`public/` 只保留「URL 必须稳定」的东西。

### 4.3 改动面

```text
public/_headers                                              +8 行（纯新增）
next.config.ts                                               +3 行注释（说明 public/ 走 _headers）
tests/architecture/tucsenberg-site-contract.test.ts          删除 :625-631 那个假绿用例
tests/architecture/cloudflare-free-runtime-budget-contract.test.ts  扩展既有 _headers 用例
scripts/quality/checks/cloudflare-static-asset-headers.js    期望规则集 +1 条意图断言
tests/unit/scripts/cloudflare-static-asset-headers.test.ts   同步 fixture 与错误文案断言
docs/项目基础/发布验证.md:52-53                               更新该检查证明了什么
```

`public/_headers` 追加：

```text
/downloads/*
  X-Robots-Tag: noindex
  Cache-Control: public,max-age=86400

/images/*
  Cache-Control: public,max-age=86400
```

**`next.config.ts` 一行不删。** 只在 `headerConfigs` 上方加三行注释，写明：这些规则只对 Next 服务器渲染的响应生效；`public/` 下的文件由 Cloudflare Static Assets 直送，必须同时写进 `public/_headers`。这是防复发措施——下一个改这里的人需要知道有两个地方。

**字体**：被覆盖的 `woff|woff2|ttf|otf` 在 `public/` 下没有任何文件（`public/fonts/subsets/` 只有 `README.md`）。不加 `/fonts/*` 规则。若将来往那里放字体，需要补一段——记入 §10.1。

### 4.4 守卫设计

v1 提出的「源文件层 + 产物层」两层是假的：`.open-next/assets/_headers` 由 `@opennextjs/aws` 的 `createStaticAssets` 做一次 `fs.cpSync(public → .open-next/assets, {recursive, dereference})` 产生，全链路没有任何一行代码加工 `_headers`。两层断言的是同一份字节。

而且这两层今天都已经存在：

- `tests/architecture/cloudflare-free-runtime-budget-contract.test.ts:73-81` 已经读 `public/_headers`
- `scripts/quality/checks/cloudflare-static-asset-headers.js` 已经同时读源文件与产物

因此**不新建守卫文件**，只做两件事：

**其一，扩展既有架构测试**（`cloudflare-free-runtime-budget-contract.test.ts`）：断言 `public/_headers` 含 `/downloads/*` 段且该段带 `X-Robots-Tag: noindex`。

**其二，扩展既有检查脚本**（`cloudflare-static-asset-headers.js`）：同样断言 `/downloads/*` 与 `X-Robots-Tag: noindex` 在源文件与产物里都在。

**断言什么、不断言什么**：

| 断言 | 不断言 | 理由 |
| --- | --- | --- |
| `/downloads/*` 段存在 | — | 这是不可调的意图 |
| 该段含 `X-Robots-Tag: noindex` | — | 这是不可调的意图 |
| 该段含 `Cache-Control:` | **不断言 `86400` 这个数字** | 缓存时长是业主随时可调的参数。钉死秒数 = 业主一改就红，但意图完全没坏。这正是 `CLAUDE.md` 判断准则里点名禁止的「时间点快照钉成必过断言」 |

**行为层守卫**：以上两条仍然只证明「文本写在文件里」，段落缩进写错、Cloudflare 实际不按该段匹配，两层都是绿的。因此在 `cf-preview-smoke` 里加一条实测断言：请求一份 PDF，断言响应含 `X-Robots-Tag: noindex`。这是本条唯一的行为层证明。

**删除的旧断言**：`tucsenberg-site-contract.test.ts:625-631` 整条删除。它守的是 `next.config.ts` 的源码文本，而该规则的真实行为已由 `tests/e2e/tucsenberg-site-smoke.spec.ts:44-49` 在 Node 运行时实测。同文件 :633-638 那个近乎同构的用例（非生产环境 noindex）**保留不动**，不在本 PR 范围。

### 4.5 变红验证

必须实际执行，且必须含重新构建这一步——`.open-next/assets/_headers` 是上一次构建留下的副本，只删源文件不重建，产物层会假绿：

```bash
# 1. 临时删除 public/_headers 里的 /downloads/* 段
pnpm test                                    # 期望：架构测试变红
pnpm build && pnpm website:build:cf
node scripts/starter-checks.js cf-static-asset-headers   # 期望：变红
# 2. 恢复，重建，确认全绿
```

执行记录写进 PR 描述。

### 4.6 验收

验证等级：**local-full proof**（本地构建 + 本地 Cloudflare 运行时实测）。不宣称 deployed proof。

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
pnpm website:build:cf
node scripts/starter-checks.js cf-static-asset-headers
pnpm exec wrangler dev --port 8787 --local &
# 等服务就绪（轮询 /api/health，不要直接 curl）
node scripts/starter-checks.js cf-preview-smoke --base-url http://127.0.0.1:8787 --include-api-health --rounds 3
curl -sI http://127.0.0.1:8787/downloads/spec-sheet-tb-bw.pdf | grep -i "x-robots-tag\|cache-control"
curl -sI http://127.0.0.1:8787/images/tucsenberg-logo.png     | grep -i "cache-control"
pnpm exec playwright test tests/e2e/tucsenberg-site-smoke.spec.ts
```

期望：PDF 响应含 `X-Robots-Tag: noindex` 与 `Cache-Control: public,max-age=86400`；图片响应含 `Cache-Control: public,max-age=86400`；Node 侧 e2e 的 PDF noindex 断言仍绿。

---

## 5. PR 2：删除半成品安全文件，并补上让它成立的门禁缺口

### 5.1 现状与根因

`public/security-policy.txt` 当前可公开访问，第 4 行留着「Replace this line with the real security contact before public launch」。同时 `public/.well-known/security.txt` 存在且已填真实邮箱 `sales@`。

**症状**是「有一份半成品文件公开可访问」。**根因**是两条门禁都没覆盖「这份文件是否已完成」：

- `tests/unit/content-page-placeholders.test.ts:7-22` 的 `FORBIDDEN_PLACEHOLDERS` 词表里没有「Replace this line」这类占位句
- `tests/unit/content-page-placeholders.test.ts:24-28` 的 `PUBLIC_LEGAL_AND_SECURITY_FILES` 是一张三条的硬编码清单
- `tests/architecture/public-asset-surface.test.ts:26-30` 的 `NON_REFERENCED_SURFACES` 把该文件整体豁免

只删文件不补门禁，明天再放一份带占位句的文件进 `public/`，两条门禁照旧全绿。`CLAUDE.md` 判断准则要求「优先拆掉让它成立的条件，而不是把症状盖住」。

### 5.2 改动面

```text
public/security-policy.txt                        移入废纸篓（禁用 rm）
public/.well-known/security.txt                   Preferred-Languages 去掉已退役的 zh
tests/unit/content-page-placeholders.test.ts      FORBIDDEN_PLACEHOLDERS 加占位句；
                                                  PUBLIC_LEGAL_AND_SECURITY_FILES 从点名清单
                                                  改为遍历 public/**/*.txt
tests/architecture/public-asset-surface.test.ts   从 NON_REFERENCED_SURFACES 移除该项
docs/项目基础/替换边界.md:26                       删除该 must-replace 条目
```

**不改** `docs/项目基础/技术栈.md`：`04-修复建议排序.md:68` 列了它，但全仓 grep 证明该文件没有任何 `security-policy` 引用。这是一条被原样抄过来、未经核实的改动点。

**删除方式**：`mv` 到 `~/.Trash/`（带时间戳后缀避免同名冲突），再 `git add -A` 让 git 记录删除。全局约束禁止 `rm`、`git clean` 等不可恢复命令。

**为什么点名清单要改成遍历**：`docs/记忆` 里已有教训——删文件后最险的残留是点名它的清单，因为清单静默变短不会报错，只会少查。改成遍历 `public/**/*.txt` 之后，新增文件自动进入检查范围。

### 5.3 对外承诺的取舍（业主已裁决）

被删文件里有三条对外承诺：5 个工作日内致谢、协调披露时点、善意研究边界。删除后 `.well-known/security.txt` 只剩联系方式，网站对外不再有安全政策正文。

业主 2026-07-27 裁决：**只留邮箱**。理由是那三条承诺是模板自带、业主从未承诺过，写下了做不到比不写更坏；且 `.well-known/security.txt` 是 RFC 9116 规定位置，自动化工具只认它。

### 5.4 变红验证

在 `public/` 下临时放一个含「Replace this line」的 `.txt`，确认 placeholder 门禁变红；删掉后变绿。

### 5.5 验收

验证等级：**local-full proof**。

```bash
pnpm test
pnpm build && pnpm website:build:cf
pnpm exec wrangler dev --port 8787 --local &
node scripts/starter-checks.js cf-preview-smoke --base-url http://127.0.0.1:8787 --include-api-health --rounds 3
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/security-policy.txt   # 期望 404
curl -s http://127.0.0.1:8787/.well-known/security.txt                                # 期望含 sales@，不含 zh
```

---

## 6. PR 3：询盘链路上的静默失败

本 PR 触碰 inquiry 行为，按 `docs/项目基础/行为合约.md:110-117` 的 Update rule，**必须在同一分支内**更新：受影响的合约条文、测试路径、证明边界、状态。改动面已含 `行为合约.md`。

### 6.1 新缺陷 N-1：Turnstile 的 `onLoad` 回调从未触发

盲审新发现，不在原审查的 12 条里。

**证据**：`src/components/security/turnstile.tsx:224` 把 `onLoad={handleLoad}` 传给 `@marsidev/react-turnstile` 的组件。该库的类型定义（`node_modules/@marsidev/react-turnstile/dist/index.d.ts`）只有 `onWidgetLoad`（:332）与 `onLoadScript`（:369），**没有 `onLoad`**。这个 prop 被 rest spread 落到一个 `<div>` 上，永不触发。覆盖它的测试全部打 mock，抓不到这个错配。

**影响**：「验证码组件已经渲染出来了」这个状态在现有代码里不可观察。这直接决定了 6.2 能不能做。

**改法**：`onLoad` → `onWidgetLoad`。同时把相关测试从 mock 改成能抓到 prop 名错配的形式（至少断言传给库的 props 里有 `onWidgetLoad`）。

### 6.2 `FPH-2607-004`：验证码拿不到令牌时，买家没有被指出去的路

**现状的准确描述**（v1 说过头了）：救援行 `TurnstileRescueLine` 已有两条渲染路径在跑：

- `src/components/forms/lazy-turnstile.tsx:164-178`：`LazyIslandErrorBoundary` 的 `failureFallback`，脚本加载失败时渲染
- `src/components/security/turnstile.tsx:90,98`：站点密钥缺失/不可用时，由 `TurnstileUnavailableStatus` 渲染

真正的缺口只有一种：**widget 渲染成功，但 `onError` / `onExpire` 触发，或迟迟拿不到令牌**。此时提交按钮永远点不亮（`inquiry-form-status.tsx:62` 的 `disabled={isSubmitting || !turnstileReady}`），页面不解释为什么。页脚法务行里有纯文本邮箱，所以买家不是彻底无路可走——这也是审查把它从 P1 降到 P2 的原因。

**改法：救援行只能有一个 owner。** v1 提议在 `inquiry-form-status.tsx` 新增一个渲染点，那会让 `onError` 场景同时出现两条「Email us instead」。改成把新状态喂给已经在渲染救援行的 `turnstile.tsx`（它已有 `rescue: TurnstileRescueLineProps` 这个 prop，:59）。

```text
src/components/security/turnstile.tsx   onLoad → onWidgetLoad（见 6.1）；
                                        新增「已渲染但 15 秒无令牌」与「onError/onExpire 已触发」
                                        两个状态，任一为真则渲染救援行
src/components/forms/inquiry-form.tsx   onError/onExpire 除了清令牌，把信号往下传
```

**不新增渲染点、不新增组件、不新增文案键**。文案键 `inquiry.form.turnstile.rescue*` 已存在于 `messages/profiles/b2b-lead/en/messages.json:79-81`。

**15 秒阈值**：Turnstile 正常挑战通常 1–3 秒。计时从 `onWidgetLoad` 触发时起算。

**必须避开的误报**：`use-lead-form-submission.ts:111-114` 在每次提交结束（无论成功失败）都把令牌清回 `""`。一个只看「没令牌」的计时器会在每次正常提交后误报救援行。计时器在 `isSubmitting` 期间及提交完成后的重置窗口内不得计时。

### 6.3 `FPH-2607-005`：邮件失败而表格成功时，没人告诉业主

**现状**：`src/lib/lead-pipeline/process-lead.ts:162-177` 用 `Promise.all` 并行发出邮件与 Airtable 写入，任一成功即返回成功（`行为合约.md:27` BC-012A）。这个合约本身是对的：买家不该因为业主的邮件服务商抽风而被拒绝。

问题在下游：邮件失败、记录写成功时，业主收件箱里什么都没有，Airtable 里那条记录和正常的一模一样。

**改法：写一个正向的、非默认值的信号。**

v1 提议新增 `Owner Emailed` 勾选列并置为否。这是错的：Airtable 勾选框的默认状态就是未勾选，「邮件失败」与下面三种情况不可区分——加列之前的历史记录、业主还没建列时的记录、补丁更新自己失败的记录。这个标记唯一需要可靠的方向，恰好是它分不出的方向。

改成复用现有的 `Status` 列（`src/lib/airtable/service-internal/lead-records.ts:34-40` 已经每条记录写死 `Status: "New"`）：邮件失败时把它改成 `"New — Email Failed"`。默认态是 `New`，异常态必须由代码写入才会出现，写不进去时业主看到的是 `New`，不会被误导成「一切正常」。

```text
src/lib/airtable/types.ts                 新增 updateLead 的 fields 参数类型
src/lib/airtable/service.ts               新增 updateLead(recordId, fields) 方法
src/lib/lead-pipeline/process-lead.ts     createProductLeadRecord 返回 { ok, recordId }；
                                          结果汇合后按条件补一次更新
docs/项目基础/行为合约.md                  BC-012A 补一句交付语义与证明路径
```

**两个通道照旧并行。** 只在「邮件失败 且 记录写成功且拿到 recordId」这一种组合下追加一次更新。正常路径零额外请求。

**追加的更新必须包 `withAirtableBudget`，且用更短的预算（2 秒）。** 这不是可选项：

- `src/lib/airtable/service.ts:34` 的 `AIRTABLE_REQUEST_TIMEOUT_MS = 8000` 只管**单次尝试**
- Airtable SDK 遇 429 会自行退避重试（`node_modules/airtable/lib/internal_config.json`：初始 5000ms，上限 600000ms），这段时间不受 `requestTimeout` 约束
- `src/app/api/inquiry/route.ts` 没有 `maxDuration`、没有 `AbortController`、没有总超时。全链路上限约 18 秒（限流 5s + Turnstile 5s + 线索处理 8s）
- `try/catch` 抓不到「一直不返回」

BC-012A 明文要求「The Airtable write is bounded by a request budget: a hung CRM cannot block the buyer response beyond the budget」。新方法不会自动继承 `createLead` 的 in-process race，必须显式包。加 2 秒预算后全链路上限约 20 秒。

**这次更新失败了怎么办**：预算超时或抛错只记日志，接口仍返回成功。询盘已经存进 Airtable，不能因为写不上一个标记就把买家的提交判失败。

### 6.4 本条覆盖不到的情形（诚实边界）

`withAirtableBudget` 用的是 `Promise.race`，**没有 AbortController**。超时时底层 HTTP 请求仍在跑，记录很可能几秒后照样落库，但 `createProductLeadRecord` 已经返回 `ok:false, recordId: undefined`。

因此：**Airtable 超时 + 邮件失败**同时发生时，记录可能存在却拿不到 recordId，标记写不上。这种情形本轮仍然只有服务端日志，业主看不到。

而超时正是 Airtable 最常见的失败形态（仓库为它专门写了测试：`src/lib/lead-pipeline/__tests__/process-lead.test.ts:182-194`）。

**PR 描述里必须写明这一点**，不得宣称覆盖了没覆盖的情形。彻底解决需要给 `withAirtableBudget` 加 AbortController，那是一次独立改动，不在本轮。记入 §10.1。

### 6.5 测试策略

先写会失败的测试，再写实现。

```text
新增单元：mock Resend 失败 + Airtable 成功
  断言 1：接口仍返回成功
  断言 2：updateLead 被调用，Status 为 "New — Email Failed"
新增单元：mock 两者都成功
  断言：updateLead 一次都没被调用（证明正常路径零额外请求）
新增单元：mock Airtable 更新挂起
  断言：买家响应仍在预算内返回，接口仍成功
新增单元：断言传给 Turnstile 组件的 props 含 onWidgetLoad（守 6.1 的错配）
新增 e2e：拦截 challenges.cloudflare.com 使其失败
  断言：页面出现带 mailto 的救援行，且**只有一条**
```

受影响的既有测试（改动面必须覆盖）：

```text
src/lib/lead-pipeline/__tests__/process-lead.test.ts       BC-012A 证明文件
tests/integration/api/lead-pipeline-real.test.ts           BC-012A / BC-013B 证明文件
src/components/security/__tests__/                          turnstile 相关全部
```

### 6.6 验收

验证等级：**local-full proof + browser proof**（跑 e2e）。不宣称真实收件人已收到（那是 M2 的事）。

```bash
pnpm type-check && pnpm lint:check && pnpm test
pnpm build && pnpm website:build:cf
pnpm exec playwright test
```

### 6.7 业主待办（条件性）

Airtable 的 `Status` 列若是单选（single select）类型，需要在表里加一个选项 `New — Email Failed`。若是纯文本列则无需任何操作。这一项不影响询盘落库：选项不存在时更新被拒，按 6.3 只记日志。

---

## 7. PR 4：惯例、locale 收敛、依赖台账

### 7.1 `FPH-2607-011`：惯例不一致

三件事，共同点是**都不是违规，是根本没有规则可依**。审查时核对过：`.claude/rules/coding-standards.md:31` 那张表规定的是标识符命名，不是文件名。

**其一，Footer 改名。** 文件在 `src/components/footer/Footer.tsx`（v1 写成 `layout/`，错）。同目录还有 `Footer.stories.tsx` 与 `__tests__/Footer.test.tsx`，同样是 PascalCase，**三个一起改**。

改名会牵连的位置（v1 一个都没列）：

```text
src/components/footer/Footer.tsx                       → footer.tsx
src/components/footer/Footer.stories.tsx               → footer.stories.tsx
src/components/footer/__tests__/Footer.test.tsx        → footer.test.tsx
tests/architecture/design-token-contract.test.ts:6     硬编码路径 FOOTER_COMPONENT_SOURCE
src/app/[locale]/layout.tsx:10                         import 路径
src/app/[locale]/__tests__/layout.test.tsx:94          vi.mock("@/components/footer/Footer")
docs/design/页面模式.md:139                             文档引用
docs/design/可迁移设计资产-剖面动画与页脚.md:17          文档引用
```

**macOS 陷阱**：本机文件系统大小写不敏感，`vi.mock` 用旧大小写照样解析成功，本地绿、Linux CI 红。必须用 `git mv`，改完 `git status` 与 `pnpm build` 双重确认，并注意 CI 是最终裁判。

**其二，补两条规则**到 `.claude/rules/coding-standards.md`（v1 写成 `docs/...`，错，`docs/` 下没有这个文件）：

- 文件名：kebab-case，组件文件同理
- 注释语言：**中文**（业主 2026-07-27 裁决）

**不批量重写存量注释。** 全仓 `src/` 下 275 个生产文件里 53 个中英混写（这两个数是 `src/` 口径，不是全仓口径——全仓 tracked 的 `.ts/.tsx/.js` 是 671 个）。本轮只把规则写下来，让以后有据可循。

**诚实声明**：这两条规则被改坏，没有任何检查会变红。本设计 §9 自订「说不清哪条会红就不算完成」的标准，此处不适用——给文风加机器门禁属于过度门禁。PR 描述里如实写「这两条靠人守，不加检查」。

**其三，修正 JSDoc 里的退役预设名**。当前预设只有 `inquiry` 与 `csp`（`src/lib/security/distributed-rate-limit.ts:24-31`）：

```text
src/lib/api/with-rate-limit.ts:10    withRateLimit('contact', ...)   → 'inquiry'   需改
src/lib/api/with-rate-limit.ts:176   @param 里的 (e.g., 'contact', 'inquiry')     需改
```

v1 写的 `:16` 是 `'csp'`（合法预设，**不许动**），`:184` 已经是 `'inquiry'`（本来就对）。

### 7.2 `FPH-2607-010`：locale 硬转换收敛

**这不是修 bug**。审查时实测 `/invalid/contact`、`/zh`、`/nope` 全部 404，Next 路由层先拦住，当前没有可触发路径。改的是写法一致性。

**准确的数字**（v1 的 28 / 5 都不准）：`src/` 下非测试的 `as Locale` 命中 **27** 处，分布在 14 个文件。其中：

| 类别 | 处数 | 本轮处理 |
| --- | ---: | --- |
| 路由 params 层（`src/app/[locale]/**`） | 19 | **收敛为 `resolveLocaleParam(params)`** |
| import 别名（`src/config/paths/types.ts:5`） | 1 | 不动，它不是类型断言 |
| 守卫自身实现（`src/i18n/locale-utils.ts:8`） | 1 | 不动 |
| 拿 prop 或普通字符串，接不到 params | 6 | **不动**（`legal-page-shell.tsx:41,106`、`trade-landing-shell.tsx:78`、`page-dates.ts:22`、`legal-page.ts:41`、`storybook-messages.ts:14`） |

守卫调用点是 6 处（`layout.tsx:120,124`、`layout-metadata.ts:50`、`load-messages.ts:59,67`、`request.ts:50`），不是 5 处。

**改法**：提供 `resolveLocaleParam(params)`，19 处页面层收敛成一种调用。它在拿到非法值时 `notFound()`，把静默转换变成响亮的 404。预期行为零变化。

### 7.3 `FPH-2607-012`：开发依赖漏洞

`pnpm audit --prod` → 无漏洞；`pnpm audit` → 7 个（2 low + 5 high），全在开发依赖。

**不进门禁**。这些包不发给访客，拿它们把门禁变红只会训练所有人忽略红灯。给 `.github/workflows/weekly-audit.yml` 加一个 `continue-on-error: true` 的全量 audit 步骤（现有 `:44` 只跑 `--prod`），结果只写进工作流摘要。

### 7.4 补记 A：测试标题与断言脱节

`tests/unit/scripts/validate-production-config.test.ts:619` 标题含「and missing legal/contact owner review」，但 :626-636 的 11 条断言全是 `SITE_CONFIG.*`，没有一条检查法务/联系人复核——那个布尔断言在 2026-07-27 的业主裁决中已退役（`scripts/quality/checks/production-config.js:427-432` 有记录）。

删掉标题里那半句。测试标题是给人读的合约，说了不做比不说更坏。

### 7.5 验收

验证等级：**local-full proof + browser proof**。`docs/项目基础/验证等级.md:78-89` 把「critical translation/runtime locale behavior」列为 release-sensitive，因此必须跑 e2e。

```bash
pnpm type-check && pnpm lint:check && pnpm test
pnpm build && pnpm website:build:cf
pnpm knip:check
pnpm exec playwright test
# locale 收敛的实测复核（FPH-2607-010 的 verification_needed）
pnpm start &
for p in /invalid/contact /zh /nope; do
  curl -s -o /dev/null -w "$p %{http_code}\n" "http://127.0.0.1:3000$p"   # 期望全部 404
done
# 收敛范围核对：只要求页面层清零，不要求全仓清零
grep -rn "as Locale" "src/app/[locale]" --include="*.ts" --include="*.tsx" | grep -v __tests__
# 期望：零命中
```

---

## 8. PR 5：架构清理（前置：PR 3 已合入 main）

delete-first、simplify-first。三步严格按序，做完一步跑一次全量验收再进下一步。

**删除方式**：与 PR 2 同——`mv` 到 `~/.Trash/`（带时间戳后缀），禁用 `rm`、`git rm -f`、`git clean`。

### 8.1 第一步：删 `src/config/site-facts.ts`（`FPH-2607-007`，Delete）

该文件整体只做一件事：`:13` `export const siteFacts = SINGLE_SITE_FACTS;`。一个纯转手层，制造了同一份真相的第二个名字。

**6 个生产消费方**改成直接从 `@/config/single-site` 导入：`contact-page-sections.tsx`、`hero-section.tsx`、`inquiry-form-static-fallback.tsx`、`structured-data-generators.ts`、`seo-metadata.ts`、`mdx-faq.ts`。

**v1 完全漏掉的 6 处牵连**：

```text
src/config/__tests__/site-facts.test.ts          整文件随模块死。但 :28-42（证书声明的文件真的存在）、
                                                 :76（logo.status === "ready"）、:80（productPhotos.status
                                                 === "pending"）三段覆盖只在这里，必须先搬进
                                                 single-site.test.ts 再删
src/lib/__tests__/seo-metadata.test.ts:20-21     vi.mock("@/config/site-facts", …) 指向被删模块
src/lib/__tests__/structured-data-generators.test.ts:3,121,125-127   直接 import siteFacts
scripts/quality/checks/client-boundary.js:267    { label: "site-facts", … } 变成永远匹配不到的规则。
                                                 直接删——:269-272 的 single-site 规则已覆盖同一意图
doctor.config.json:123                           抑制条目指向被删的测试文件
.claude/skills/ai-smell-audit/references/smell-taxonomy.md:794   把该文件写成本项目的 canonical
                                                 site-definition layer，删了模块它就在说不属实的话
```

**原审查的反证在这里是错的**：`FPH-2607-007` 的 `refutation_attempt` 写「`__tests__` 中无对 `site-facts` 的 mock」，实际 `seo-metadata.test.ts:20` 就是一个。更正记入 §10.3。

### 8.2 第二步：内联 `useLeadFormSubmission`（`FPH-2607-006`，Simplify）

`src/lib/forms/use-lead-form-submission.ts` 是 166 行的泛型 hook，**7 个**配置项（v1 写 8 个，错）加一个 `TResult` 类型参数，全仓只有一个生产调用方（`inquiry-form.tsx:61`）。它的自我说明（:13）还写着「It owns only the lifecycle both forms genuinely duplicate」，那已经不是事实。

**这一项 2026-07-19 那一轮曾登记为延后决定**（`docs/superpowers/plans/2026-07-19-overengineering-cleanup.md:48,1099`，成本估算「a 294-line behavior-test port through the Turnstile trust boundary, for a net saving of ~40 lines」）。业主 2026-07-27 明确裁决**做**，该登记被本次裁决取代。设计文档在此显式记录这个覆盖关系，不假装它不存在。

内联后 `inquiry-form.tsx` 预估 255–270 行（现 189 行 + hook 的约 90 行逻辑 − 现有约 15 行 config 字面量），仍在健康区间。

**v1 漏掉的牵连**：

```text
tests/architecture/contact-entry-boundary.test.ts:73-75   按路径 readFileSync 该文件，
                                                          后接 expect(...).toContain("fetch(config.endpoint")。
                                                          文件一删 → ENOENT，报错是「文件不存在」
                                                          而不是「契约破了」。这条断言守的是「表单自己
                                                          发请求，没经过第二层封装」，内联后应改成读
                                                          src/components/forms/inquiry-form.tsx
src/lib/forms/__tests__/use-lead-form-submission.test.tsx  294 行，随模块一起退役
```

**测试要重写，不要搬运**：现有 294 行测的是 hook 的内部结构。原样搬过去等于把「测内部结构」这个问题一起搬过去。改成测表单看得见的行为：提交时锁住、令牌重置、成功后清空。

**执行纪律**：先写新的行为测试并**确认它们真的变红**，再删旧测试。不允许「删了再补」。

因为这条路径穿过 Turnstile 的信任边界，验收额外要求一轮浏览器实测（见 8.4）。

### 8.3 第三步：`schemaInput` 不再手写白名单（`FPH-2607-009`，Simplify）

`src/app/api/inquiry/route.ts:79-88` 手写了一张字段白名单。加了新的询盘字段但忘了同步这张表，字段会被静默丢掉——不报错、不记日志。

**v1 的改法（用 zod 内省 API 推导字段名）是想当然的。** 那张表同时干了三件别的事，纯推导会把它们弄丢：

1. `type: PRODUCT_LEAD_TYPE` 是**服务端写死**的（`:80`），不是从 `data` 取的。推导成 `data.type` 就把这个字段交给了客户端。
2. `message` / `catalogProductId` / `buyerInterest` 走 `normalizeOptionalString`（空串 → undefined）。直接传 `data`，`catalogProductId: ""` 会撞上 `.trim().min(1)` 变成 400。
3. 10 个归因字段走 `pickAttributionFields`，它会 trim 并**丢掉非字符串值**。推导之后 `utmSource: 123` 会让买家因为一个营销参数格式不对被整单拒绝。

还有一层：`schemaInput` 同时被当作 `source` 传给 `mapInquiryValidationDetails`（`:100`），`enrichValidationIssueWithSource` 靠读它区分 `missing_required` / `blank_required` / `wrong_type`（`src/lib/api/validation-error-details.ts:88-113`）。换掉喂进去的东西 = 换掉买家看到的错误文案键。

**真正的改法，比推导更省事**：zod 的 object 默认就剥离未知键，`turnstileToken` / `website` / `phone` 本来就进不去。所以：

```ts
productLeadSchema.safeParse({
  ...data,
  type: PRODUCT_LEAD_TYPE,            // 服务端写死，覆盖客户端任何同名值
  ...pickAttributionFields(data),      // 放在 spread 之后，覆盖原始归因字段
})
```

不需要碰 zod 的内省 API。空串归一必须**显式**处理：把 `normalizeOptionalString` 挪进 schema（`canonicalBuyerMessageSchema` 已经是这么做的，照抄），或给 `catalogProductId` / `buyerInterest` 各包一层。

**必须重跑** `tests/unit/inquiry-validation-details.test.ts`——那是买家错误文案的守卫。

### 8.4 变红验证（`FPH-2607-009` 的 verification_needed，v1 丢了）

在 schema 里加一个新的可选字段而**不改** `route.ts`，确认新写法下该字段能穿透到处理层（旧写法下它会被静默丢掉）。这是本条发现的全部价值所在——不做这一步，改完没人知道新写法真的挡住了漏改。

### 8.5 验收

验证等级：**local-full proof + browser proof**。

```bash
pnpm type-check && pnpm lint:check && pnpm test
pnpm build && pnpm website:build:cf
pnpm knip:check
pnpm exec playwright test
# 注意：不排除 __tests__，因为改完之后测试里也不该再有 siteFacts
grep -rn "siteFacts" src --include="*.ts" --include="*.tsx"     # 期望零命中
grep -rn "use-lead-form-submission" src tests scripts            # 期望零命中
```

---

## 9. 每个 PR 的共同标准

**验收总纲**（串行执行，`pnpm build` 与 `pnpm website:build:cf` 绝不并行——两者写同一个 `.next` 目录）：

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
pnpm website:build:cf
```

**验证等级**：每个 PR 描述必须用 `docs/项目基础/验证等级.md` 的确切标签声明本次达到的等级，不得抬高。本轮全部 PR 上限是 `local-full proof`（+ 跑了 e2e 的加 `browser proof`）。**没有任何一个 PR 能宣称 deployed proof 或真实收件证明**——那属于 M2，业主未启动。

**每个 PR 必须能说清一件事**：如果这个修复被改坏，哪条检查会变红。说不清的，要么补守卫，要么在 PR 描述里显式写明「这条靠人守，不加检查，原因是……」。唯一已知的例外是 PR 4 的两条文风规则（见 7.1）。

**提交规范**：subject 小写、不超过 72 字符。pre-push 会跑完整构建。

**合并规范**：推送后等 CI 全绿，停下来交业主合并。不自行合并。

---

## 10. 台账与边界

### 10.1 本轮不做，但已知存在的问题

| 事项 | 为什么这轮不做 |
| --- | --- |
| `withAirtableBudget` 没有 AbortController | 导致 6.4 那个覆盖不到的情形。独立改动，影响面比本轮任何一条都大 |
| `public/fonts/` 若放字体将没有缓存头 | 目录当前为空。放字体时需给 `_headers` 补一段 `/fonts/*` |
| 53 个文件的中英混写注释 | 本轮只补规则，存量重写是另一件事 |
| `next.config.ts` 的静态资源规则仍覆盖 `woff/ttf/otf` | 那些扩展名在 Worker 路由上没有实际文件，删它属于无收益改动 |

### 10.2 PDF 里的认证声明（业主 2026-07-27 裁决：本轮不改）

`pdftotext` 实测，两份公开 PDF 仍含业主已判定不成立的标准声明：

```text
public/downloads/product-catalog.pdf   :285  "• UV-stabilised ABS, tested to ASTM G154-2016"
                                        :286  "(0.76 W/m² @340 nm, BPT 60 °C, 8 h)"
                                        :516  "fire EN 13501 B1 · working temperature −30 °C to +70 °C"
public/downloads/spec-sheet-tb-td.pdf  :55   "EN 13501 B1"（Fire rating 一格的值）
```

**这是 R'6 的漏改**。R'6（`执行计划.md:7`）裁决「ASTM/EN 报告不存在→删标准声明」，任务 R1.11 Step 2（`:263`）执行时的验收 grep 只覆盖 `content/ messages/ src/constants/`，**PDF 从未进入那个检查范围**。网页侧已改对：`src/constants/tucsenberg-product-page-flood-tube-dams.ts:97` 现在写 `["Fire rating", "Flame-retardant fabric", "same"]`。

**为什么本轮不改**：PDF 不是代码生成的（`pdfinfo` 显示 Creator `Kami`、Producer `cairo 1.18.4`），仓库里没有源文件，本机也没有任何 PDF 编辑工具。且 `EN 13501 B1` 是规格表里的一个值，删了留下空格；换成网页口径的 `Flame-retardant fabric` 比原文长，会排版错位。可靠的做法需要原始源文件重新导出。业主裁决本轮不做。

**同时明确一件事：`MOQ from 10 metres` 不属于此列，不许动。** R'5 / R'12（`执行计划.md:7,275`）裁决「管坝 MOQ 真实口径业主后补……不改相关产品事实、消息键或 SEO 文案，等待业主给出真实值」，并明令「不得自行补值」。网站上 `tucsenberg-product-page-flood-tube-dams.ts:120` 与 PDF 里都还写着这句，两边一致，是刻意保留，不是漂移。

### 10.3 对既往记录的两处更正

审查报告集本身不改（见 3.2）。以下两处更正在此登记，供后续轮次引用：

1. **`00-审查报告.md` 的 2026-07-27 补记**把 `MOQ from 10 metres` 与 ASTM/EN 归为同一类「R'6 已裁决删除但 PDF 未改」。不对。MOQ 属 R'5 挂起、R'12 延期，网页与 PDF 都刻意保留原文，两边一致。详见 10.2。
2. **`02-findings.json` 中 `FPH-2607-007` 的 `refutation_attempt`** 写「`__tests__` 中无对 `site-facts` 的 mock」。不对。`src/lib/__tests__/seo-metadata.test.ts:20-21` 就是一个 `vi.mock("@/config/site-facts", …)`。

### 10.4 明确不做的事

审查过程中评估过并否决的，本轮同样不做：

| 想法 | 为什么不做 |
| --- | --- |
| 给邮件服务加一层 `EmailService` 接口 / DTO / mapper | 一个供应商、一个调用方，调用方用的已是业务形状方法。加层是拿一个复查触发点换一个真实的多余抽象 |
| 把 5 个产品页常量文件拆小 | 单一职责的数据文件，改动原因只有一个。行数不是判据 |
| 拆开 893 行的 `tucsenberg-site-contract.test.ts` | 它的点名清单是与真实注册表 `toEqual` 对账的，拆开可能拆断对账 |
| 把并行的邮件 + 表格改成串行 | 买家多等一个网络往返，只换来代码顺一点 |
| 给 PDF 改用 `robots.txt` 的 `Disallow` | `Disallow` 只阻止抓取，爬虫读不到响应头里的 `noindex`，URL 反而可能靠外链被收录成无摘要条目。`X-Robots-Tag` 是对的 |
| 修 `--border` 的对比度 | 装饰性描边，WCAG 1.4.11 不要求。改了会让全站分隔线变重 |
| 把开发依赖的 5 个 high 漏洞升到门禁 | 不发给访客，变红只会训练大家忽略红灯 |
| 现在就把 3 张品牌图搬进 `src/` 做指纹化 | 要改 `single-site.ts` 这个真相源和它的测试，把一个纯新增改动变成真重构 |

---

## 11. 业主待办

| 事项 | 影响 | 什么时候需要 |
| --- | --- | --- |
| Airtable 的 `Status` 列若为单选类型，加一个选项 `New — Email Failed` | 不加不会丢询盘，只是邮件失败的标记写不上 | PR 3 合并前 |
| `FPH-2607-008` 的 i18n 口径选定 | 决定 `CLAUDE.md` / `AGENTS.md` 与 Content-as-code ADR 哪边让步。选定后**单向**修正文档，不做折中措辞 | 本轮之外，随时 |
| 管坝 MOQ 的真实数字 | R'5 / R'12 挂起中。给出真值后，网页与 PDF 一并更新 | 本轮之外 |
| 两份 PDF 的原始源文件 | 用于清掉 ASTM G154 / EN 13501 两处不实声明 | 本轮之外 |

---

## 12. 风险

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| Footer 改名在大小写不敏感文件系统上本地绿、Linux CI 红 | CI 才发现 | 用 `git mv`；改完 `git status` + `pnpm build` 双重确认；把 CI 当最终裁判 |
| PR 5 第二步重写 294 行测试 | 重写过程中漏掉现有覆盖 | 先写新行为测试并确认变红，再删旧测试；额外跑一轮浏览器实测 |
| PR 5 第一步搬迁 `site-facts.test.ts` 的三段独有覆盖 | 静默丢失证书文件存在性与品牌资产状态断言 | 先搬进 `single-site.test.ts` 并确认通过，再删原文件 |
| PR 3 的 15 秒计时器在正常提交后误报 | 每次成功提交都弹救援行 | 提交中与提交后重置窗口内不计时；e2e 断言「只有一条救援行」 |
| PR 3 依赖 Airtable 的 `Status` 选项 | 选项没加时标记写不上 | 更新失败只记日志，询盘照常落库；PR 描述写明 |
| PR 1 的 `cf-preview-smoke` 实测依赖本地 wrangler 就绪 | 服务没起来就 curl，误判为失败 | 轮询 `/api/health` 直到就绪再跑断言，不用固定 sleep |
| PR 5 与 PR 3 的文件冲突 | 合并冲突 | 顺序前置，PR 3 合入 main 后 PR 5 才开分支 |
