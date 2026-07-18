import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const INQUIRY_FORM = "src/components/forms/inquiry-form.tsx";
const REQUEST_QUOTE_PAGE = "src/app/[locale]/request-quote/page.tsx";
const CONTACT_SECTIONS = "src/app/[locale]/contact/contact-page-sections.tsx";

const FORBIDDEN_CLIENT_IMPORTS = [
  "inquiry-form-static-fallback",
  "public-trust",
  "site-facts",
  "@/lib/env",
  'from "zod"',
  'from "zod/',
  "@t3-oss/env-nextjs",
] as const;

function read(repoPath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads repo-local files from fixed constants
  return readFileSync(repoPath, "utf8");
}

describe("InquiryForm client dependency boundary", () => {
  it("accepts a server-built fallback ReactNode instead of importing static fallback modules", () => {
    const source = read(INQUIRY_FORM);

    expect(source).toContain("readonly fallback: ReactNode");
    expect(source).toContain("return fallback;");
    for (const forbiddenImport of FORBIDDEN_CLIENT_IMPORTS) {
      expect(source).not.toContain(forbiddenImport);
    }
  });

  it("builds the no-JS fallback on the server for Contact and Request Quote", () => {
    for (const repoPath of [CONTACT_SECTIONS, REQUEST_QUOTE_PAGE]) {
      const source = read(repoPath);
      expect(source).toContain("InquiryFormStaticFallback");
      expect(source).toContain("fallback={");
    }
  });
});
