import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Cloudflare deploy workflow contract", () => {
  it("runs preview proof against an explicit public preview URL without Cloudflare deploy secrets", () => {
    const workflow = readFileSync(
      ".github/workflows/cloudflare-deploy.yml",
      "utf8",
    );

    expect(workflow).toContain("preview_url:");
    expect(workflow).toMatch(
      /- name: 检查 Cloudflare 凭据\s+if:\s*\$\{\{\s*inputs\.environment == 'production'\s*\}\}/u,
    );
    expect(workflow).toContain('if [ -z "$PREVIEW_URL" ]; then');
    expect(workflow).toContain(
      'node scripts/starter-checks.js public-preview-smoke --base-url "${PREVIEW_URL}"',
    );
    expect(workflow).not.toContain(
      "node scripts/starter-checks.js cf-preview-deployed",
    );
  });

  it("guards production deployment to the main branch", () => {
    const workflow = readFileSync(
      ".github/workflows/cloudflare-deploy.yml",
      "utf8",
    );

    expect(workflow).toContain("阻断：production 只能从 main 部署");
    expect(workflow).toContain('if [ "${GITHUB_REF_NAME}" != "main" ]; then');
    expect(workflow).toContain("GITHUB_REF_NAME: ${{ github.ref_name }}");
    expect(workflow).toMatch(
      /if:\s*\$\{\{\s*inputs\.environment == 'production'\s*\}\}/u,
    );
  });
});
