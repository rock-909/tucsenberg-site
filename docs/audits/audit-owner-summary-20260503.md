# 代码库审计摘要 — 2026-05-03

审计范围：整个 `/Users/Data/workspace/showcase-website-starter`  
审计模式：full  
对应技术报告：`audit-report-20260503.md`

## 1. 一句话结论

这个 starter 的代码底座整体是可继续推进的；真正要担心的不是“代码马上会坏”，而是 **有几处测试/文档的说法比实际证明更强，容易让 owner 把 starter 示例状态误判成真实上线准备完成**。

## 2. 四栏判断

| 维度 | 等级 | 人话说明 |
|---|---|---|
| Code health | Ok | 主干结构、类型、lint、依赖边界和安全扫描都是绿的；没有发现会立刻打断询盘链路的代码级阻断问题。 |
| Proof health | Weak | 测试很多，但有几处 proof 名称或 CI 口径容易被误读，尤其是联系表单本地 E2E 和 lead-family contract。 |
| Truth-source health | Weak | starter 示例内容、产品规格、替换清单和行为合同之间还有几处不同步。 |
| Repairability | Strong | 这些问题大多是收口 proof 命名、文档真相和 launch-strict gate，不需要大面积重构。 |

## 3. 现在最重要的 5 个问题

- **本地联系表单 E2E 的标题过强**：测试名写“成功提交”，实际只填表并确认按钮可见，没有真正点击提交或验证成功反馈。
- **lead-family contract 容易被误当成完整安全证明**：它明确 mock 掉了 rate limit、Turnstile 和 lead pipeline，只能证明响应壳和 observability。
- **行为合同 BC-024 自相矛盾**：正文说 inquiry/subscribe 幂等已有测试，后面的 gap analysis 又说没测。
- **产品/服务替换面不够完整**：替换清单主要指向 `src/config/website/products.ts`，但真实产品页还读 `src/constants/product-specs/**`、messages 和图片。
- **starter 示例内容仍是 live-rendered truth**：示例公司、example.com、placeholder 产品规格都还在，这是 starter 合理状态，但不能被当成真实上线内容。

## 4. 这些问题对业务的实际影响

- 询盘链路目前不是“明显坏”，但 owner 不能只看本地 E2E 绿灯就认为真实部署表单已经闭环。
- 派生项目如果只按现有替换清单改一部分文件，可能出现首页变了、产品详情仍是示例规格的情况。
- 行为合同里前后矛盾会让后续修复优先级错位，把已经有测试的地方继续当成缺口。
- 这些问题会影响发布判断和交付信任，不是单纯代码风格问题。

## 5. 建议动作顺序

| 优先级 | 动作 | 为什么现在做 |
|---|---|---|
| P0 | 改掉 contact E2E 的“成功提交”过强命名，或补真正 submit + result 断言 | 这是最容易误导 owner 的 proof 名称。 |
| P0 | 修正 `docs/specs/behavioral-contracts.md` 的 BC-024 gap analysis | 同一文档内部矛盾，成本低、影响大。 |
| P1 | 把 lead-family contract 明确标成 auxiliary proof，release/owner summary 不把它当完整安全证明 | 防止 CI 绿灯被过度解读。 |
| P1 | 扩充新项目替换清单，列出 product specs、catalog messages、图片等 live 产品真相面 | 防止派生项目漏替换。 |
| P2 | 把 public launch strict gate 和 starter 示例状态说清楚 | 保留 starter 示例，但上线前必须阻断。 |

## 6. 这轮审计没有否定什么

- 没有发现真实密钥泄露到客户端。
- 没有发现当前 lead route 直接绕过 Turnstile、rate limit 或 idempotency。
- 没有发现 i18n runtime loader 的明显 Cloudflare 缓存错误。
- 没有把 starter 示例内容当成“代码 bug”；它是 starter 合理内容，只是发布口径必须分清。
- 没有把旧 `/tmp/audit` 的 2026-04-29 产物当成最终证据，本轮报告使用 2026-05-03 fresh evidence。

## 7. 下一步怎么接着做

建议先做一轮 **proof/truth 收口**，不要先大改代码结构：

1. 先修 2 个文档/测试命名问题：contact E2E 标题、BC-024 gap。
2. 再修替换清单，把所有 live 产品 truth surfaces 列清楚。
3. 最后补一个 owner-facing launch readiness 口径：本地绿灯、CI 绿灯、Cloudflare dry-run、deployed smoke、真实表单 canary 分别证明什么。
