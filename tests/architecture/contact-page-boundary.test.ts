import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CONTACT_ROUTE = "src/app/[locale]/contact/page.tsx";
const CONTACT_PAGE_DATA = "src/app/[locale]/contact/contact-page-data.ts";
const CONTACT_SECTIONS = "src/app/[locale]/contact/contact-page-sections.tsx";
const INQUIRY_STATIC_FALLBACK =
  "src/components/forms/inquiry-form-static-fallback.tsx";
const CONTACT_FORM_FIELDS = "src/components/forms/contact-form-fields.tsx";

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
    expect(source).not.toContain("InquiryFormStaticFallback");
    expect(source).not.toContain("inquiry-form-static-fallback");
  });

  it("validates manifest metadata before returning typed contact page data", () => {
    const source = read(CONTACT_PAGE_DATA);

    expect(source).not.toContain("as unknown as Page");
    expect(source).toContain("assertContactPageMetadata");
  });

  it("keeps Suspense fallback wiring in the page sections module", () => {
    const source = read(CONTACT_SECTIONS);

    expect(source).toContain("InquiryFormStaticFallback");
    expect(source).toContain("inquiry-form-static-fallback");
    expect(source).toContain(
      "fallback={<InquiryFormStaticFallback copy={inquiryCopy} />}",
    );
  });

  it("keeps the no-JS fallback informational without fake form markup", () => {
    const source = read(INQUIRY_STATIC_FALLBACK);

    expect(source).toContain('data-testid="inquiry-form-static-fallback"');
    expect(source).toContain("getPublicContactEmail");
    expect(source).toContain("mailto:");
    expect(source).not.toContain("<form");
    expect(source).not.toContain('type="submit"');
  });

  it("keeps FormFields as the only public contact form field export", () => {
    const source = read(CONTACT_FORM_FIELDS);

    expect(source).toContain("export const FormFields");
    for (const legacyExport of [
      "export { AdditionalFields }",
      "export { CheckboxFields }",
      "export { ContactFields }",
      "export { NameFields }",
    ]) {
      expect(source).not.toContain(legacyExport);
    }
  });
});
