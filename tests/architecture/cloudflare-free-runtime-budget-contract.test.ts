import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

// 这个文件 2026-07-27 从 155 行收窄到这里。删掉的是：五份文档拼成一个字符串再
// toContain 十条整句（"source checkout"、"exact head SHA"、"Pull request CI does
// not prove the Cloudflare Free gzip budget." …）、把 artifactBudget 整个对象连同
// 一句英文散文一起 toEqual 冻住、以及按子串断言 ci.yml 里的步骤名。
//
// 那批断言守的是措辞：改一个说法就红，红了照着抄回去。它自己的 git 历史里有一次
// 提交叫 `docs: make gate rule text tell the truth`——门逼着文档改字，这是判决书。
//
// 真正拦住超限的是 scripts/quality/checks/release-verify.js:61-90：它解析 wrangler
// 输出里的实测 gzip 数值，跟 limitKiB 比大小然后失败。那条在，这里不必再抄一遍。
//
// 留下的三条，每条对应一个真实事故形状。

const CLOUDFLARE_FREE_GZIP_CEILING_KIB = 3072; // 3 MiB，平台硬上限

const requireModule = createRequire(`${process.cwd()}/package.json`);

interface ReleaseProofStep {
  readonly id: string;
  readonly artifactBudget?: {
    readonly limitKiB: number;
    readonly preferredKiB: number;
  };
}

interface ReleaseProofManifestModule {
  readonly getReleaseProofSteps: () => ReleaseProofStep[];
}

function loadReleaseProofSteps(): ReleaseProofStep[] {
  return (
    requireModule(
      "./scripts/quality/release-proof-manifest.js",
    ) as ReleaseProofManifestModule
  ).getReleaseProofSteps();
}

describe("Cloudflare Free runtime budget contract", () => {
  // 自定预算可以调，但调到平台上限之上就不叫预算了——release-verify 会放行一个
  // Cloudflare 根本不收的产物。守的是"留在平台上限以内"这个意图，不是 3000 这个数。
  it("keeps the self-imposed budget under the platform ceiling", () => {
    const budget = loadReleaseProofSteps().find(
      (step) => step.id === "wrangler-preview-dry-run",
    )?.artifactBudget;

    expect(budget).toBeDefined();
    expect(budget!.limitKiB).toBeLessThan(CLOUDFLARE_FREE_GZIP_CEILING_KIB);
    expect(budget!.preferredKiB).toBeLessThan(budget!.limitKiB);
  });

  // 事故形状：体积门跑在构建之前，量到的是上一次的产物。发布链里这三步的先后
  // 关系就是防这个的——头部检查必须在 Cloudflare 构建之后、dry-run 之前。
  it("measures the artifact only after it has been rebuilt", () => {
    const steps = loadReleaseProofSteps();
    const indexOf = (id: string): number =>
      steps.findIndex((step) => step.id === id);

    const build = indexOf("cloudflare-build");
    const headers = indexOf("cloudflare-static-asset-headers");
    const dryRun = indexOf("wrangler-preview-dry-run");

    expect(build).toBeGreaterThan(-1);
    expect(headers).toBeGreaterThan(build);
    expect(dryRun).toBeGreaterThan(headers);
  });
});
