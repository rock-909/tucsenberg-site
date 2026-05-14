import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CONTACT_ROUTE = "src/app/[locale]/contact/page.tsx";
const CONTACT_SECTIONS = "src/app/[locale]/contact/contact-page-sections.tsx";
const CONTACT_FALLBACK =
  "src/app/[locale]/contact/contact-form-static-fallback.tsx";

function read(repoPath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads repo-local files from fixed constants
  return readFileSync(repoPath, "utf8");
}

describe("Contact page source boundaries", () => {
  it("keeps generated content and message loading out of the route file", () => {
    const source = read(CONTACT_ROUTE);

    expect(source).not.toContain("CONTENT_MANIFEST");
    expect(source).not.toContain("@messages/en/critical.json");
    expect(source).not.toContain("@messages/en/deferred.json");
    expect(source).not.toContain("@messages/zh/critical.json");
    expect(source).not.toContain("@messages/zh/deferred.json");
    expect(source).not.toContain("mergeObjects");
  });

  it("keeps the route focused on Contact orchestration", () => {
    const source = read(CONTACT_ROUTE);

    expect(source).toContain("ContactFormWithFallback");
    expect(source).toContain("contact-page-sections");
    expect(source).not.toContain("ContactFormStaticFallback");
    expect(source).not.toContain("contact-form-static-fallback");
    expect(source).not.toContain('data-contact-form-fallback="static"');
  });

  it("keeps Suspense fallback wiring in the page sections module", () => {
    const source = read(CONTACT_SECTIONS);

    expect(source).toContain("ContactFormStaticFallback");
    expect(source).toContain("contact-form-static-fallback");
    expect(source).toContain(
      "fallback={<ContactFormStaticFallback messages={messages} />}",
    );
  });

  it("keeps fallback form markup inside the fallback adapter", () => {
    const source = read(CONTACT_FALLBACK);

    expect(source).toContain('data-contact-form-fallback="static"');
    expect(source).toContain('aria-busy="true"');
    expect(source).toContain('translate="no"');
  });
});
