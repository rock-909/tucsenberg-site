# Message namespace map

这份表只解决一个问题：Tucsenberg 当前阶段改 `messages` 时，哪些文案必须替换，哪些只需要按项目语气检查，哪些不要一上来乱改。

当前运行时消息文件只有这两组：

- `messages/{locale}/critical.json`：首屏、导航、产品列表、错误提示等关键 UI 文案。
- `messages/{locale}/deferred.json`：表单辅助、次级区块、隐私/条款、示例或演示类文案。

不要为了“看起来更细”现在就拆文件。拆 `messages` 会牵动 `src/lib/i18n/load-messages.ts`、`src/lib/i18n/static-split-messages.ts`、`src/i18n/request.ts`、`src/types/next-intl.d.ts` 和翻译检查脚本，应该单独开 i18n runtime 改造任务。

## 标签含义

- `must-replace`：公开上线前必须替换或确认，不能把临时示例当真实项目内容。
- `review-or-tune`：通常可以保留结构，但要按新项目语气、页面组合、产品类型或法务要求检查。
- `do-not-edit-first`：不要先从这里动手；这些通常是通用 UI、状态、错误、主题或运行机制文案。

## `messages/{locale}/critical.json`

| Namespace | Category | 用途 | Tucsenberg 处理方式 |
| --- | --- | --- | --- |
| `common` | `do-not-edit-first` | 通用按钮、状态、短标签。 | 除非项目语气有明确要求，否则先保留。 |
| `navigation` | `review-or-tune` | 顶部导航、菜单、CTA 文案。 | 路由和页面组合改完后同步检查。 |
| `theme` | `do-not-edit-first` | 主题切换相关 UI。 | 不要当品牌色入口，品牌色去配置和设计 token。 |
| `language` | `do-not-edit-first` | 语言切换相关 UI。 | 新增语言时跟 i18n 配置一起改，不单独改文案。 |
| `blog` | `review-or-tune` | 博客入口和列表短文案。 | 如果 Tucsenberg 不用时间线 blog，再按 resources / learn 定位决定保留或隐藏。 |
| `home` | `must-replace` | 首页 hero、section、CTA、买家可见主表达。 | 必须替换成新项目自己的价值表达。 |
| `monitoring` | `do-not-edit-first` | 监控或状态类通用文案。 | 保留，除非改了对应运行能力。 |
| `footer` | `must-replace` | 页脚品牌、链接、说明、联系入口。 | 必须按新公司身份和链接检查。 |
| `accessibility` | `do-not-edit-first` | 无障碍辅助文案。 | 保留，除非 UI 行为变了。 |
| `underConstruction` | `review-or-tune` | 未完工/占位页面文案。 | Tucsenberg 公开前应确认是否还需要展示。 |
| `cookie` | `review-or-tune` | Cookie 提示和同意文案。 | 按实际 analytics / tracking / 法务要求检查。 |
| `structured-data` | `do-not-edit-first` | 结构化数据辅助文案。 | 先改配置和内容真相源，不要直接在这里修业务事实。 |
| `apiErrors` | `do-not-edit-first` | API 错误码对用户显示的统一文案。 | 不要为单个业务场景临时写散；改 API contract 时再动。 |
| `errors` | `do-not-edit-first` | 页面错误、not found、fallback 文案。 | 保留为通用兜底，除非错误页设计变了。 |
| `catalog` | `must-replace` | 产品/服务市场、系列、卡片和列表短文案。 | 必须跟 `src/config/single-site-product-catalog.ts` 和 `src/constants/product-specs/**` 一起替换。 |
| `membraneProduct` | `must-replace` | 产品详情页（`/membranes/[product]`）spec、兼容性、material 决策、CTA 文案。 | 必须跟 `src/data/product-compatibility/**` 一起替换，不能保留示例值。 |
| `compatibleBrand` | `must-replace` | OEM 兼容页（`/compatible/[brand]`）facet、结果卡、trademark disclaimer 文案。 | 必须按真实 OEM 兼容数据和商标免责声明确认。 |
| `quote` | `must-replace` | 报价页（`/quote`）表单字段、说明、响应承诺文案。 | 必须按真实接收方式、字段和响应承诺替换。 |
| `search` | `review-or-tune` | 全局兼容搜索（⌘K）输入、结果分组、空结果文案。 | 结构可保留，按 Tucsenberg 搜索范围和语气检查。 |

## `messages/{locale}/deferred.json`

| Namespace | Category | 用途 | Tucsenberg 处理方式 |
| --- | --- | --- | --- |
| `error` | `do-not-edit-first` | 通用错误短文案。 | 先保留。 |
| `turnstileRequired` | `do-not-edit-first` | Turnstile 人机验证提示。 | 只有改表单安全策略时再动。 |
| `errorBoundary` | `do-not-edit-first` | React 错误边界文案。 | 先保留。 |
| `legal` | `review-or-tune` | 法务区块通用短文案。 | 跟隐私/条款页面一起检查。 |
| `themeDemo` | `do-not-edit-first` | 主题演示文案。 | 如果 Tucsenberg 不展示 demo，可后续清理展示入口。 |
| `instructions` | `do-not-edit-first` | 通用操作说明。 | 先保留。 |
| `actions` | `do-not-edit-first` | 通用动作按钮文案。 | 先保留。 |
| `formTemplate` | `review-or-tune` | 表单模板、字段辅助文案。 | 改联系表单或询盘流程时检查。 |
| `contact` | `must-replace` | 联系页、联系表单、响应承诺和询盘说明。 | 必须按真实接收方式、响应承诺和业务场景替换。 |
| `formatting` | `do-not-edit-first` | 格式化辅助文案。 | 先保留。 |
| `progress` | `do-not-edit-first` | 进度和加载状态文案。 | 先保留。 |
| `ReactScanDemo` | `do-not-edit-first` | React Scan 演示文案。 | 不要当业务内容入口；如不展示 demo，另开清理任务。 |
| `themes` | `do-not-edit-first` | 主题名称和主题选择文案。 | 不要从这里改品牌视觉。 |
| `stats` | `review-or-tune` | 数据指标标签。 | 如果首页/页面展示指标，必须确认是否是真实数据。 |
| `email` | `review-or-tune` | 邮箱字段短标签。 | 通常保留，但要确认表单语气。 |
| `emailPlaceholder` | `review-or-tune` | 邮箱输入占位。 | 按目标客户语气检查。 |
| `phone` | `review-or-tune` | 电话字段短标签。 | 如果电话不是必填或不收集，要跟表单配置同步。 |
| `organization` | `must-replace` | 公司/组织字段和组织身份文案。 | 必须按新项目业务身份确认。 |
| `website` | `review-or-tune` | 网站字段或站点短文案。 | 按表单是否收集官网信息检查。 |
| `article` | `review-or-tune` | 文章相关短标签。 | 如果不启用文章/博客，可后续收缩。 |
| `products` | `must-replace` | 产品相关延迟区块短文案。 | 必须跟 catalog truth 一起替换。 |
| `title` | `do-not-edit-first` | 通用标题短文案。 | 先保留。 |
| `trust` | `review-or-tune` | 信任、证明、资质相关短文案。 | 不能保留临时示例证明；上线前必须确认。 |
| `faq` | `review-or-tune` | FAQ 短文案。 | 跟页面 FAQ 和业务问答一起检查。 |
| `privacy` | `must-replace` | 隐私相关 UI 文案。 | 必须跟 `content/pages/{locale}/privacy.mdx` 和法务主体一致。 |
| `terms` | `must-replace` | 条款相关 UI 文案。 | 必须跟 `content/pages/{locale}/terms.mdx` 和法务主体一致。 |
| `customProject` | `must-replace` | 定制项目/询盘辅助文案。 | 必须按真实服务能力和接单边界替换。 |

## 最小验证

改完 message 后至少跑：

```bash
node scripts/starter-checks.js translations
pnpm content:check
```

如果改了产品、市场或页面表达，还要补对应 catalog / page expression 的 focused tests，不要只看翻译 key 对齐。
