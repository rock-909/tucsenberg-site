import { describe, expect, it } from "vitest";
import { generateMetadataForPath } from "@/lib/seo-metadata";
import { getProductMarketPath } from "@/config/paths/utils";
import {
  getSingleSitePublicSeoProfileId,
  shouldIndexPublicPageForProfile,
} from "@/config/single-site-seo";

describe("market metadata live integration", () => {
  it("indexes current catalog product markets in the public SEO profile", async () => {
    const path = getProductMarketPath("abs-flood-barriers");
    const profileId = getSingleSitePublicSeoProfileId();

    expect(shouldIndexPublicPageForProfile("products", path, profileId)).toBe(
      true,
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

    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("page generateMetadata matches path-aware helper", async () => {
    const { generateMetadata } = await import("../page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", market: "abs-flood-barriers" }),
    });

    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });
});
