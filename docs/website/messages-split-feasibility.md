# Messages split feasibility

Decision: do not split now.

这份记录只回答“以后要不要把 `messages` 再拆细，以及什么时候值得拆”。当前不做物理拆分，不改 i18n runtime。

## 当前状态

当前运行时只认这四个文件：

```text
messages/en/critical.json
messages/en/deferred.json
messages/zh/critical.json
messages/zh/deferred.json
```

`critical.json` 主要放首屏、导航、产品列表、错误提示等关键 UI 文案。`deferred.json` 主要放表单辅助、次级区块、隐私/条款、示例或演示类文案。

如果只是想知道哪些 namespace 要替换，先看 `message-namespace-map.md`。那份文档已经把 top-level namespace 按 `must-replace`、`review-or-tune`、`do-not-edit-first` 分好。

## 为什么现在不拆

现在拆文件会从“文档治理”升级成“i18n runtime 改造”，影响面不小：

| 影响点 | 当前职责 | 拆分会带来的变化 |
| --- | --- | --- |
| `src/lib/i18n/load-messages.ts` | 按 locale 加载 `critical` / `deferred`，做缓存、Cloudflare/build/dev 分支和站点变量插值。 | 要新增更多 loader、合并顺序、缓存 tag 和 fallback 规则。 |
| `src/lib/i18n/static-split-messages.ts` | 静态导入四个 split 文件并合并，供 server-only 静态路径使用。 | 要改成更多静态 import，且要证明 bundle / server-only 边界没变。 |
| `src/i18n/request.ts` | 每个请求加载完整 messages，交给 `next-intl`。 | 要决定请求级是继续全量合并，还是按 namespace 分层加载。 |
| `src/types/next-intl.d.ts` | 从英文 critical + deferred 生成 `IntlMessages` 类型。 | 要把更多 JSON 类型做稳定 deep merge，避免 key 类型丢失。 |
| `scripts/quality/checks/translations.js` | 校验 locale 间 key 对齐、critical/deferred 重复 key 和总 key 数。 | 要支持多文件清单、跨文件重复 key、locale parity 和 namespace coverage。 |

这些不是不能做，但不适合混进当前 repair wave。当前更高价值的是让派生项目知道“该替换什么”，而不是为了文件看起来更小就改运行链路。

## 什么时候值得拆

只有出现下面至少一种情况，才值得进入真正拆分：

1. 派生项目经常只改某一类 namespace，却必须编辑 60KB 级大文件，导致冲突或误改。
2. 客户项目需要按模块交给不同 owner 维护，例如法务、产品、表单、首页分别维护。
3. `next-intl` client payload 或 server merge 成为可观察的性能问题，并且已经有数据证明瓶颈在 message 结构。
4. 翻译平台或自动化同步工具需要 namespace-level 文件，而不是当前 `critical` / `deferred` 两文件模型。

如果只是“文件大，看着不舒服”，不够。那会把简单问题变成运行时问题。

## 建议的长期拆法

如果以后真的要拆，建议不要一次拆成几十个碎片。先按稳定 owner 拆成少量组：

```text
messages/{locale}/critical/
  shell.json        # common, navigation, theme, language, accessibility
  home.json         # home
  catalog.json      # catalog
  errors.json       # apiErrors, errors, monitoring
  footer.json       # footer, cookie, structured-data

messages/{locale}/deferred/
  forms.json        # contact, formTemplate, email, phone, organization, website
  legal.json        # legal, privacy, terms
  product-copy.json # products, customProject, trust, faq, stats
  system.json       # error, turnstileRequired, errorBoundary, formatting, progress
  demos.json        # themeDemo, ReactScanDemo, themes, instructions, actions, article, title
```

这个只是候选结构，不是当前约定。真正执行前要先写 migration plan，并更新 loader、type augmentation、translation check 和 docs。

## 需要证明什么才算能拆

真正拆分前，至少要证明：

```bash
node scripts/starter-checks.js translations
pnpm content:check
pnpm type-check
pnpm exec vitest run src/lib/__tests__/load-messages-runtime.test.ts src/i18n/__tests__/request.test.ts tests/unit/i18n-message-contract.test.ts
pnpm build
```

如果拆分同时改变 client payload 或 request loading 策略，还要补对应的 route / hydration proof。不能只证明 JSON key 对齐。

## 当前明确不做

- 不拆 `messages/*.json`。
- 不改 `src/lib/i18n/load-messages.ts`。
- 不改 `src/lib/i18n/static-split-messages.ts`。
- 不改 `src/i18n/request.ts`。
- 不改 `src/types/next-intl.d.ts`。
- 不改 `scripts/quality/checks/translations.js` 的行为。

当前只保留一个更清楚的替换地图：`message-namespace-map.md`。
