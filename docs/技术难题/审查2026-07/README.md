# 全库可维护性审查 · 2026-07

分 13 批 + 1 轮跨模块横向扫描，覆盖 `src/` 全部业务代码与 `scripts/`（测试目录暂缓）。共 475 条问题（高 65 / 中 195 / 低 215）。审查标准按资深工程师品味判断，不引用项目规则文件。每条结论均经 grep 验证调用方。

修复工作流与 10 个 PR 的排布见 `docs/superpowers/specs/2026-07-09-全库审查修复-design.md`。

## 报告索引

| 文件 | 范围 | 高/中/低 |
|---|---|---|
| [findings-cross.md](findings-cross.md) | **跨模块横向综合（master backlog，R/I/C/G 编号）** | 11/17/9 |
| [findings-lib-security.md](findings-lib-security.md) | src/lib/security | 8/10/21 |
| [findings-lib-lead.md](findings-lib-lead.md) | lead-pipeline/contact/email/form-schema/airtable | 3/14/20 |
| [findings-lib-platform.md](findings-lib-platform.md) | src/lib api/i18n/seo/analytics | 5/10/14 |
| [findings-lib-content.md](findings-lib-content.md) | src/lib content/blog/marketing/image/motion/cookie + 根 | 6/18/12 |
| [findings-comp-ui.md](findings-comp-ui.md) | components/ui | 3/12/12 |
| [findings-comp-sections.md](findings-comp-sections.md) | components/sections | 3/6/10 |
| [findings-comp-forms.md](findings-comp-forms.md) | components/forms | 4/15/17 |
| [findings-comp-layout.md](findings-comp-layout.md) | components layout/navigation/footer/grid | 3/14/18 |
| [findings-comp-domain.md](findings-comp-domain.md) | components products/content/contact/cookie/security/seo 等 | 2/17/22 |
| [findings-app-pages.md](findings-app-pages.md) | src/app（排除 api） | 3/15/17 |
| [findings-app-api.md](findings-app-api.md) | src/app/api | 3/11/17 |
| [findings-config.md](findings-config.md) | src/config | 6/19/12 |
| [findings-misc.md](findings-misc.md) | constants/i18n/emails/hooks/types/scripts | 5/17/14 |

## 三个系统性根因

1. **starter→derived 收缩后多 profile/多 locale 机制未退役**——最大死代码来源。
2. **"消灭魔法数字"被机械执行成批量生成常量**——含 4 处语义盲借用（BYTES_PER_KB 当断点、HTTP_OK 当阈值、HEX_RADIX 当盐长、PERCENTAGE_FULL 当条数）。
3. **组件/配置面先建、页面后接、接完不回收**——tests/stories 为死代码续命。

全仓约 10,500–11,500 行生产不可达代码，占 src（39,835 行）26–28%。
