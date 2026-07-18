import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(repoPath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local files.
  return readFileSync(repoPath, "utf8");
}

describe("contact entry boundary", () => {
  it("keeps legacy useContactForm wired to /api/contact outside production pages", () => {
    const hookSource = read("src/components/forms/use-contact-form.ts");
    const kernelSource = read("src/lib/forms/use-lead-form-submission.ts");

    expect(hookSource).toContain('endpoint: "/api/contact"');
    expect(kernelSource).toContain("fetch(config.endpoint");
  });

  it("keeps production contact journeys on InquiryForm -> /api/inquiry", () => {
    const islandSource = read("src/components/contact/contact-form-island.tsx");
    const inquiryFormSource = read("src/components/forms/inquiry-form.tsx");

    expect(islandSource).toContain("InquiryForm");
    expect(inquiryFormSource).toContain('endpoint: "/api/inquiry"');
  });
});
