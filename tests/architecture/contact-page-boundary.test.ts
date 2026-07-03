import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CONTACT_ROUTE = "src/app/[locale]/contact/page.tsx";
const CONTACT_PAGE_DATA = "src/app/[locale]/contact/contact-page-data.ts";
const CONTACT_SECTIONS = "src/app/[locale]/contact/contact-page-sections.tsx";
const CONTACT_FALLBACK =
  "src/app/[locale]/contact/contact-form-static-fallback.tsx";
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
  });

  it("validates manifest metadata before returning typed contact page data", () => {
    const source = read(CONTACT_PAGE_DATA);

    expect(source).not.toContain("as unknown as Page");
    expect(source).toContain("assertContactPageMetadata");
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
    expect(source).toContain("<form");
    expect(source).toContain('translate="no"');
    expect(source).toContain("buildFormFieldsFromConfig");
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

  it("keeps legacy field helpers marked away from the main config-driven contact path", () => {
    const legacyFieldFiles = [
      "src/components/forms/fields/name-fields.tsx",
      "src/components/forms/fields/contact-fields.tsx",
      "src/components/forms/fields/additional-fields.tsx",
      "src/components/forms/fields/message-field.tsx",
      "src/components/forms/fields/checkbox-fields.tsx",
    ];

    for (const filePath of legacyFieldFiles) {
      const source = read(filePath);
      expect(source, filePath).toContain("Legacy field helper");
      expect(source, filePath).toContain("contact-form-fields.tsx");
    }
  });
});
