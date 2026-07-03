import { describe, expect, it } from "vitest";
import { generateMetadataForPath } from "@/lib/seo-metadata";
import { getProductMarketPath } from "@/config/paths/utils";
import {
  getSingleSitePublicSeoProfileId,
  shouldIndexPublicPageForProfile,
} from "@/config/single-site-seo";

describe("market metadata live integration", () => {
  it("noindexes north-america outside the default public SEO profile", async () => {
    const path = getProductMarketPath("north-america");
    const profileId = getSingleSitePublicSeoProfileId();

    expect(shouldIndexPublicPageForProfile("products", path, profileId)).toBe(
      false,
    );

    const metadata = generateMetadataForPath({
      locale: "en",
      pageType: "products",
      path,
      config: {
        title: "test",
        description: "test",
      },
    });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });

  it("page generateMetadata matches path-aware helper", async () => {
    const { generateMetadata } = await import("../page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", market: "north-america" }),
    });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });
});
