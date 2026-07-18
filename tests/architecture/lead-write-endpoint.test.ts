import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(repoPath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local files.
  return readFileSync(repoPath, "utf8");
}

const PRODUCTION_INQUIRY_FORM_SOURCES = [
  "src/components/forms/inquiry-form.tsx",
  "src/components/contact/contact-form-island.tsx",
  "src/app/[locale]/request-quote/page.tsx",
  "src/app/[locale]/contact/contact-page-sections.tsx",
] as const;

const PRODUCTION_CONTACT_PAGE_SOURCES = [
  "src/app/[locale]/contact/page.tsx",
  "src/app/[locale]/contact/contact-page-sections.tsx",
  "src/components/contact/contact-form-island.tsx",
] as const;

describe("lead write endpoint ownership", () => {
  it("keeps production inquiry journeys posting only to /api/inquiry", () => {
    for (const sourcePath of PRODUCTION_INQUIRY_FORM_SOURCES) {
      const source = read(sourcePath);
      expect(source, sourcePath).toContain("InquiryForm");
      expect(source, sourcePath).not.toContain('endpoint: "/api/contact"');
    }

    expect(read("src/components/forms/inquiry-form.tsx")).toContain(
      'endpoint: "/api/inquiry"',
    );
  });

  it("keeps legacy useContactForm off production contact and request-quote pages", () => {
    for (const sourcePath of PRODUCTION_CONTACT_PAGE_SOURCES) {
      const source = read(sourcePath);
      expect(source, sourcePath).not.toContain("useContactForm");
      expect(source, sourcePath).not.toContain("ContactFormContainer");
    }

    expect(read("src/app/[locale]/request-quote/page.tsx")).not.toContain(
      "useContactForm",
    );
  });

  it("keeps /api/inquiry as the only lead-writing route implementation", () => {
    const inquirySource = read("src/app/api/inquiry/route.ts");
    expect(inquirySource).toContain("processValidatedInquiry");
    expect(inquirySource).not.toContain("processLead(");
    expect(inquirySource).toContain('createCorsRateLimitedRoute(\n  "inquiry"');
  });

  it("keeps /api/contact as a non-writing 410 tombstone until D6e", () => {
    const routeSource = read("src/app/api/contact/route.ts");

    expect(routeSource).toContain("CONTACT_ENDPOINT_RETIRED");
    expect(routeSource).toContain("HTTP_GONE");
    expect(routeSource).not.toContain("safeParseJson");
    expect(routeSource).not.toContain("verifyLeadTurnstile");
    expect(routeSource).not.toContain("checkDistributedRateLimit");
    expect(routeSource).not.toContain("createCorsRateLimitedRoute");
    expect(routeSource).not.toContain("submitCanonicalContactSubmission");
    expect(routeSource).not.toContain("processLead");
    expect(routeSource).not.toContain("processValidatedInquiry");
    expect(routeSource).not.toContain("resendService");
    expect(routeSource).not.toContain("airtableService");
  });
});
