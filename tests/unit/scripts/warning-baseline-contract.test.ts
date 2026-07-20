import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo fixture files by relative path
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("generated warning baseline contract", () => {
  it("keeps React Doctor wired as an error gate plus full reconciliation", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["react:doctor"]).toBe(
      "npx --loglevel=error -y react-doctor@latest --verbose --scope changed --blocking error",
    );
    expect(packageJson.scripts["react:doctor:report"]).toBe(
      "npx --loglevel=error -y react-doctor@latest --json --no-score --blocking none",
    );
    expect(packageJson.scripts["react:doctor:reconcile"]).toBe(
      "node scripts/react-doctor-reconcile.js",
    );
    expect(packageJson.scripts["react:doctor"]).toContain(
      "react-doctor@latest",
    );
    expect(packageJson.scripts["react:doctor:report"]).toContain(
      "react-doctor@latest",
    );
    expect(packageJson.scripts).not.toHaveProperty("react:doctor:classify");
    expect(packageJson.scripts).not.toHaveProperty("react:doctor:governance");
    expect(packageJson.scripts).not.toHaveProperty(
      "react:doctor:raw-governance",
    );
  });
});
