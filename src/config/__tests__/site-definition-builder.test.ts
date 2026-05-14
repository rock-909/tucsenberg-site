import { describe, expect, it } from "vitest";

import { defineSiteDefinition } from "@/config/site-definition-builder";
import type { SiteDefinition } from "@/config/site-types";

describe("defineSiteDefinition", () => {
  it("returns the original definition object without runtime conversion", () => {
    const definition: SiteDefinition = {
      key: "test-site",
      config: {
        baseUrl: "https://example.com",
        name: "Test Site",
        description: "Test site definition",
        seo: {
          titleTemplate: "%s | Test Site",
          defaultTitle: "Test Site",
          defaultDescription: "Test site definition",
          keywords: ["test"],
        },
        social: {
          twitter: "https://x.com/example",
          linkedin: "https://www.linkedin.com/company/example",
        },
        contact: {
          phone: "+1-555-0100",
          email: "hello@example.com",
        },
      },
      facts: {
        company: {
          name: "Test Site",
          established: 2020,
          yearsInBusiness: 4,
          employees: 10,
          location: {
            country: "Example Country",
            city: "Example City",
          },
        },
        contact: {
          phone: "+1-555-0100",
          email: "hello@example.com",
        },
        certifications: [],
        stats: {
          exportCountries: 1,
        },
        social: {
          linkedin: "https://www.linkedin.com/company/example",
          twitter: "https://x.com/example",
        },
        brandAssets: {
          logo: {
            status: "pending",
            horizontal: "/images/logo.svg",
            horizontalPng: "/images/logo.png",
            square: "/images/logo-square.svg",
            width: 200,
            height: 60,
          },
          productPhotos: {
            status: "pending",
          },
          ogImage: "/images/og-image.jpg",
          favicon: "/favicon.ico",
        },
      },
      productCatalog: {
        markets: [],
        families: [],
      },
      navigation: {
        main: [],
      },
      footerColumns: [],
    };

    expect(defineSiteDefinition(definition)).toBe(definition);
  });
});
