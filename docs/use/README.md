# Use

这里放当前 Tucsenberg 站维护说明，以及从 starter 继承下来的派生说明。

当前站已经派生完成。日常维护不要从 `start.md` 开始；先看内容、部署和项目边界。

## Read in order

1. `content.md`：页面正文、SEO、messages 和内容检查。
2. `deploy.md`：Cloudflare、env、表单和上线前配置。
3. `brand.md`：公司身份、域名、联系方式、品牌资产。
4. `ai.md`：Codex / Claude 协作边界。
5. `replace.md`：继承的 starter 替换面说明；只在追溯时看。
6. `start.md`：继承的 materialize/profile 说明；不是当前站日常入口。
7. `project-workflow.md` / `website-production-workflow.md`：继承的 starter workflow 说明；不是当前产品真相。

## Do not start by deleting inherited files

当前仓库仍保留一些 starter/profile 工具、测试和 fixtures。它们看起来像旧内容，但部分仍支撑检查、message composition、materialization 边界或历史证明。

清理前先确认有没有被 CI、脚本、测试、docs 或 runtime 引用。机制细节看 `../ref/profiles.md`、`../ref/surfaces.md`、`../ref/messages.md`。
