import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(repoPath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local files.
  return readFileSync(repoPath, "utf8");
}

describe("contact entry boundary", () => {
  it("keeps browser form submission owned by /api/contact", () => {
    const hookSource = read("src/components/forms/use-contact-form.ts");
    const routeSource = read("src/app/api/contact/route.ts");

    expect(hookSource).toContain('fetch("/api/contact"');
    expect(routeSource).toContain("submitCanonicalContactSubmission");
  });
});
