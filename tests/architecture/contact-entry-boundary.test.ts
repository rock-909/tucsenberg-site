import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(repoPath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local files.
  return readFileSync(repoPath, "utf8");
}

describe("contact entry boundary", () => {
  it("keeps browser form submission owned by /api/contact", () => {
    const hookSource = read("src/components/forms/use-contact-form.ts");
    const kernelSource = read("src/lib/forms/use-lead-form-submission.ts");
    const routeSource = read("src/app/api/contact/route.ts");

    // The contact hook wires the shared submission kernel to /api/contact, and
    // the kernel is the single place that posts to the configured lead endpoint.
    expect(hookSource).toContain('endpoint: "/api/contact"');
    expect(kernelSource).toContain("fetch(config.endpoint");
    expect(routeSource).toContain("submitCanonicalContactSubmission");
  });
});
