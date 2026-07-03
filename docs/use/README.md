# Use

派生新项目时从这里开始。默认路径是先 materialize `company-site`，再替换真实公司内容。

## Read in order

1. `start.md`：确认默认 profile，dry-run，生成新项目目录。
2. `replace.md`：按顺序替换品牌、内容、图片、表单、部署配置。
3. `brand.md`：公司身份、域名、联系方式、品牌资产。
4. `content.md`：页面正文、SEO、messages 和多语言。
5. `deploy.md`：Cloudflare、env、表单和上线前配置。
6. `ai.md`：Codex / Claude / Superpowers 协作边界。

## Do not start by deleting demo files

默认公司站应通过 `pnpm profile:materialize -- --profile company-site` 得到干净输出。不要在 source checkout 里手动乱删 optional routes、fixtures、Storybook 或治理测试。

机制细节看 `../ref/profiles.md`、`../ref/surfaces.md`、`../ref/messages.md`。
