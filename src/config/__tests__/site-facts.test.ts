import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SINGLE_SITE_FACTS } from "@/config/single-site";
import { siteFacts } from "@/config/site-facts";

describe("site-facts", () => {
  it("exports site facts with expected shape", () => {
    expect(siteFacts).toBeTruthy();
    expect(siteFacts).toBe(SINGLE_SITE_FACTS);

    expect(typeof siteFacts.company.name).toBe("string");
    expect(typeof siteFacts.company.established).toBe("number");
    expect(typeof siteFacts.company.yearsInBusiness).toBe("number");
    expect(siteFacts.company.yearsInBusiness).toBeGreaterThan(0);
    expect(typeof siteFacts.company.location.country).toBe("string");
    expect(typeof siteFacts.company.location.city).toBe("string");

    expect(typeof siteFacts.contact.phone).toBe("string");
    expect(typeof siteFacts.contact.email).toBe("string");

    expect(Array.isArray(siteFacts.certifications)).toBe(true);
    expect(typeof siteFacts.stats).toBe("object");
    expect(typeof siteFacts.social).toBe("object");
  });

  it("only exposes certification files that exist in public", () => {
    const missingCertificationFiles = siteFacts.certifications
      .flatMap((certification) =>
        certification.file
          ? [{ file: certification.file, name: certification.name }]
          : [],
      )
      .filter(({ file }) => {
        const publicRelativePath = file.replace(/^\//, "");
        const publicFilePath = path.resolve(
          process.cwd(),
          "public",
          publicRelativePath,
        );

        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Certification paths come from siteFacts and must be checked as declared.
        return !existsSync(publicFilePath);
      });

    expect(missingCertificationFiles).toEqual([]);
  });

  it("keeps owner-dependent public trust assets explicit during cutover", async () => {
    const {
      getPublicContactEmail,
      getPublicContactPhone,
      getPublicLogoPath,
      isPublicEmailConfigured,
      isPublicPhoneConfigured,
    } = await import("@/config/public-trust");

    expect(isPublicEmailConfigured("sales@example.com")).toBe(false);
    expect(isPublicEmailConfigured("sales@asterconveyor.example")).toBe(false);
    expect(isPublicEmailConfigured("hello@starter.dev")).toBe(true);
    expect(getPublicContactEmail("sales@example.com")).toBeUndefined();
    expect(
      getPublicContactEmail("sales@asterconveyor.example"),
    ).toBeUndefined();
    expect(getPublicContactEmail("hello@starter.dev")).toBe(
      "hello@starter.dev",
    );
    expect(isPublicPhoneConfigured("+86-518-0000-0000")).toBe(false);
    expect(isPublicPhoneConfigured("+1-312-555-0198")).toBe(false);
    expect(isPublicPhoneConfigured("+86-138-0013-8000")).toBe(true);
    expect(getPublicContactPhone("+86-518-0000-0000")).toBeUndefined();
    expect(getPublicContactPhone("+1-312-555-0198")).toBeUndefined();
    expect(getPublicContactPhone("+86-138-0013-8000")).toBe(
      "+86-138-0013-8000",
    );
    expect(siteFacts.brandAssets.logo.status).toBe("ready");
    expect(getPublicLogoPath(siteFacts.brandAssets.logo)).toBe(
      "/images/tucsenberg-logo.png",
    );
    expect(siteFacts.brandAssets.productPhotos.status).toBe("pending");
  });
});
