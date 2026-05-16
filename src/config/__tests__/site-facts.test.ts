import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SINGLE_SITE_CONFIG,
  SINGLE_SITE_FACTS,
  SINGLE_SITE_KEY,
  SINGLE_SITE_NAVIGATION,
} from "@/config/single-site";
import {
  FEATURED_MEMBRANE_HREF,
  SINGLE_SITE_ROUTE_HREFS,
} from "@/config/single-site-links";
import { siteFacts } from "@/config/site-facts";

describe("site-facts", () => {
  it("uses the Tucsenberg identity shell", () => {
    expect(SINGLE_SITE_KEY).toBe("tucsenberg");
    expect(SINGLE_SITE_CONFIG.name).toBe("Tucsenberg");
    expect(siteFacts.company.name).toBe("Tucsenberg");
    expect(siteFacts.contact.email).toBe("sales@tucsenberg.com");
    expect(siteFacts.company.location.country).toBe("China");
  });

  it("points main navigation at the Step 4 membranes, compatibility, and quote routes", () => {
    expect(SINGLE_SITE_NAVIGATION.map((item) => item.key)).toEqual([
      "membranes",
      "compatibility",
      "materials",
      "quote",
    ]);
    expect(SINGLE_SITE_NAVIGATION.map((item) => item.href)).toEqual([
      FEATURED_MEMBRANE_HREF,
      "/compatible/sanitaire",
      SINGLE_SITE_ROUTE_HREFS.comingSoon,
      SINGLE_SITE_ROUTE_HREFS.quote,
    ]);
    // The featured membrane nav target is the canonical descriptive slug.
    expect(FEATURED_MEMBRANE_HREF).toBe(
      "/membranes/9-inch-epdm-disc-replacement",
    );
  });

  it("exports site facts with expected shape", () => {
    expect(siteFacts).toBeTruthy();
    expect(siteFacts).toBe(SINGLE_SITE_FACTS);

    expect(typeof siteFacts.company.name).toBe("string");
    expect(typeof siteFacts.company.established).toBe("number");
    expect(typeof siteFacts.company.yearsInBusiness).toBe("number");
    expect(siteFacts.company.yearsInBusiness).toBeGreaterThanOrEqual(0);
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

  it("keeps owner-dependent public trust assets in a safe interim state", async () => {
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
    expect(siteFacts.brandAssets.logo.status).toBe("pending");
    expect(getPublicLogoPath(siteFacts.brandAssets.logo)).toBeUndefined();
    expect(siteFacts.brandAssets.productPhotos.status).toBe("pending");
  });
});
