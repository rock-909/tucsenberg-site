import { describe, expect, it } from "vitest";
import { PUBLIC_STATIC_PAGE_TYPES } from "@/config/pages.config";
import {
  DEFAULT_STARTER_PROFILE_ID,
  STARTER_PROFILE_IDS,
  STARTER_PROFILES,
  getStarterProfile,
  isStarterProfileId,
} from "@/config/starter-profiles";

const EXPECTED_PROFILE_IDS = [
  "minimal",
  "company-site",
  "b2b-lead",
  "catalog",
  "content-marketing",
  "showcase-full",
] as const;

describe("starter profile registry", () => {
  it("keeps catalog as the materialized default profile", () => {
    expect(STARTER_PROFILE_IDS).toEqual(EXPECTED_PROFILE_IDS);
    expect(DEFAULT_STARTER_PROFILE_ID).toBe("catalog");
    expect(getStarterProfile().id).toBe("catalog");
    expect(isStarterProfileId("catalog")).toBe(true);
    expect(isStarterProfileId("unknown")).toBe(false);
  });

  it("defines every profile exactly once", () => {
    expect(Object.keys(STARTER_PROFILES).sort()).toEqual(
      [...EXPECTED_PROFILE_IDS].sort(),
    );

    for (const profileId of STARTER_PROFILE_IDS) {
      expect(STARTER_PROFILES[profileId].id).toBe(profileId);
      expect(getStarterProfile(profileId)).toBe(STARTER_PROFILES[profileId]);
    }
  });

  it("keeps the default company-site profile focused but not lead-only", () => {
    const profile = getStarterProfile("company-site");

    expect(profile.staticPages).toEqual([
      "home",
      "about",
      "products",
      "blog",
      "resources",
      "contact",
      "privacy",
      "terms",
    ]);
    expect(profile.dynamicSurfaces).toEqual(["blogArticle"]);
    expect(profile.messageNamespaces).toEqual(
      expect.arrayContaining([
        "navigation",
        "footer",
        "home",
        "catalog",
        "blog",
        "article",
        "resources",
        "contact",
        "privacy",
        "terms",
      ]),
    );
    expect(profile.proofLanes).toEqual(["core-starter", "company-site"]);
    expect(profile.examplePacks).toEqual([]);

    for (const demoSurface of ["capabilities", "howItWorks", "customProject"]) {
      expect(profile.staticPages).not.toContain(demoSurface);
    }

    for (const demoNamespace of ["customProject", "themeDemo"]) {
      expect(profile.messageNamespaces).not.toContain(demoNamespace);
    }
  });

  it("keeps b2b-lead thin and free of demo-heavy surfaces", () => {
    const profile = getStarterProfile("b2b-lead");

    expect(profile.staticPages).toEqual([
      "home",
      "about",
      "contact",
      "privacy",
      "terms",
    ]);
    expect(profile.dynamicSurfaces).toEqual([]);
    expect(profile.messageNamespaces).toEqual(
      expect.arrayContaining(["navigation", "footer", "home", "contact"]),
    );
    expect(profile.proofLanes).toEqual(["core-starter", "b2b-lead"]);
    expect(profile.examplePacks).toEqual([]);

    for (const demoSurface of [
      "products",
      "blog",
      "resources",
      "capabilities",
      "howItWorks",
      "customProject",
    ]) {
      expect(profile.staticPages).not.toContain(demoSurface);
    }

    for (const demoNamespace of [
      "catalog",
      "products",
      "blog",
      "article",
      "resources",
      "customProject",
      "themeDemo",
    ]) {
      expect(profile.messageNamespaces).not.toContain(demoNamespace);
    }
  });

  it("maps optional catalog and content-marketing surfaces to opt-in profiles", () => {
    expect(getStarterProfile("catalog")).toMatchObject({
      staticPages: [
        "home",
        "products",
        "oemWholesale",
        "materialsGuide",
        "specificationsGuide",
        "about",
        "requestQuote",
        "contact",
        "warranty",
        "privacy",
        "terms",
      ],
      dynamicSurfaces: ["productMarket"],
      proofLanes: ["core-starter", "catalog"],
      examplePacks: ["catalog-examples"],
    });

    expect(getStarterProfile("content-marketing")).toMatchObject({
      staticPages: ["home", "blog", "about", "contact", "privacy", "terms"],
      dynamicSurfaces: ["blogArticle"],
      proofLanes: ["core-starter", "content-marketing"],
      examplePacks: ["content-marketing-examples"],
    });
  });

  it("keeps product market profiles tied to products and contact pages", () => {
    for (const profileId of STARTER_PROFILE_IDS) {
      const profile = getStarterProfile(profileId);

      if (!profile.dynamicSurfaces.includes("productMarket")) {
        continue;
      }

      expect(profile.staticPages).toContain("products");
      expect(profile.staticPages).toContain("contact");
    }
  });

  it("lets showcase-full own the current broad demo surface", () => {
    const profile = getStarterProfile("showcase-full");

    expect(profile.staticPages).toEqual([
      "home",
      "about",
      "products",
      "blog",
      "resources",
      "contact",
      "privacy",
      "terms",
      "capabilities",
      "howItWorks",
      "customProject",
    ]);
    expect(PUBLIC_STATIC_PAGE_TYPES).not.toContain("resources");
    expect(profile.dynamicSurfaces).toEqual(["productMarket", "blogArticle"]);
    expect(profile.messageNamespaces).toEqual(
      expect.arrayContaining([
        "catalog",
        "products",
        "blog",
        "article",
        "resources",
        "customProject",
      ]),
    );
    expect(profile.proofLanes).toEqual([
      "core-starter",
      "b2b-lead",
      "catalog",
      "content-marketing",
      "showcase-full",
    ]);
    expect(profile.examplePacks).toEqual([
      "catalog-examples",
      "content-marketing-examples",
      "showcase-full-demo",
    ]);
  });
});
