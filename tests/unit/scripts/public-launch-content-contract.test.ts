import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const LIVE_TEXT_PATHS = [
  "content/pages/en/terms.mdx",
  "content/pages/zh/terms.mdx",
  "messages/en/critical.json",
  "messages/zh/critical.json",
  "messages/en/deferred.json",
  "messages/zh/deferred.json",
] as const;
const LIVE_PRODUCT_SPEC_PATHS = [
  "src/constants/product-specs/north-america.ts",
  "src/constants/product-specs/australia-new-zealand.ts",
  "src/constants/product-specs/mexico.ts",
  "src/constants/product-specs/europe.ts",
  "src/constants/product-specs/specialty-product-systems.ts",
] as const;

function readRepoFile(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed repo-owned contract fixtures
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("public launch content contract", () => {
  it("ships public contact fallback copy in the live contact namespace", () => {
    for (const locale of ["en", "zh"] as const) {
      const source = JSON.parse(
        readRepoFile(`messages/${locale}/deferred.json`),
      ) as {
        contact?: {
          panel?: {
            emailUnavailable?: unknown;
          };
        };
      };

      expect(
        source.contact?.panel?.emailUnavailable,
        `messages/${locale}/deferred.json`,
      ).toEqual(expect.any(String));
    }
  });

  it("keeps fake phone numbers out of buyer-facing text sources", () => {
    for (const relativePath of LIVE_TEXT_PATHS) {
      const source = readRepoFile(relativePath);

      expect(source, relativePath).not.toContain("+86-518-0000-0000");
      expect(source, relativePath).not.toContain("0000-0000");
    }
  });

  it("keeps live product spec sources off the sample product illustration", () => {
    for (const relativePath of LIVE_PRODUCT_SPEC_PATHS) {
      const source = readRepoFile(relativePath);

      expect(source, relativePath).not.toContain(
        "/images/products/sample-product.svg",
      );
    }
  });
});
