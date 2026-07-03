import { describe, expect, it } from "vitest";
import { SOURCE_RUNTIME_MESSAGE_PROFILE_ID } from "@/config/active-starter-profile";
import {
  getSingleSiteActiveRouteTargets,
  getSingleSiteHomeFinalCtaTargets,
  getSingleSiteHomeLinkTargets,
  SINGLE_SITE_HOME_LINK_TARGETS,
} from "@/config/single-site-links";
import { DEFAULT_STARTER_PROFILE_ID } from "@/config/starter-profiles";

describe("single-site home link targets", () => {
  it("uses the source runtime profile for singleton home link targets", () => {
    expect(SOURCE_RUNTIME_MESSAGE_PROFILE_ID).toBe("catalog");
    expect(SINGLE_SITE_HOME_LINK_TARGETS).toEqual(
      getSingleSiteHomeLinkTargets(SOURCE_RUNTIME_MESSAGE_PROFILE_ID),
    );
    expect(SINGLE_SITE_HOME_LINK_TARGETS).toEqual({
      contact: "/contact",
      oemWholesale: "/oem-wholesale",
      products: "/products",
      requestQuote: "/request-quote",
      primaryCta: "/request-quote",
      secondaryCta: "/oem-wholesale",
    });
    expect(SINGLE_SITE_HOME_LINK_TARGETS.blog).toBeUndefined();
  });

  it("keeps catalog as the default materialized profile", () => {
    expect(DEFAULT_STARTER_PROFILE_ID).toBe("catalog");
    expect(getSingleSiteHomeLinkTargets(DEFAULT_STARTER_PROFILE_ID)).toEqual({
      contact: "/contact",
      oemWholesale: "/oem-wholesale",
      products: "/products",
      requestQuote: "/request-quote",
      primaryCta: "/request-quote",
      secondaryCta: "/oem-wholesale",
    });
  });

  it("uses contact and about CTAs for the thin b2b-lead profile", () => {
    expect(getSingleSiteHomeLinkTargets("b2b-lead")).toEqual({
      contact: "/contact",
      about: "/about",
      primaryCta: "/contact",
      secondaryCta: "/about",
    });
  });

  it("does not invent contact or about CTAs for the minimal profile", () => {
    expect(getSingleSiteHomeLinkTargets("minimal")).toEqual({
      primaryCta: "/",
      secondaryCta: "/",
    });
  });

  it("can derive catalog product CTAs", () => {
    expect(getSingleSiteHomeLinkTargets("catalog")).toEqual({
      contact: "/contact",
      oemWholesale: "/oem-wholesale",
      products: "/products",
      requestQuote: "/request-quote",
      primaryCta: "/request-quote",
      secondaryCta: "/oem-wholesale",
    });
  });

  it("can expose active route targets separately from homepage CTA choices", () => {
    expect(getSingleSiteActiveRouteTargets("catalog")).toMatchObject({
      products: "/products",
      oemWholesale: "/oem-wholesale",
      requestQuote: "/request-quote",
      contact: "/contact",
      about: "/about",
    });
    expect(getSingleSiteActiveRouteTargets("minimal")).toEqual({});
  });

  it("derives final CTA targets from semantic route availability", () => {
    expect(getSingleSiteHomeFinalCtaTargets("catalog")).toEqual([
      { href: "/products", labelKey: "primary" },
      { href: "/request-quote", labelKey: "secondary" },
    ]);
    expect(getSingleSiteHomeFinalCtaTargets("b2b-lead")).toEqual([
      { href: "/contact", labelKey: "secondary" },
    ]);
    expect(getSingleSiteHomeFinalCtaTargets("minimal")).toEqual([]);
  });
});
