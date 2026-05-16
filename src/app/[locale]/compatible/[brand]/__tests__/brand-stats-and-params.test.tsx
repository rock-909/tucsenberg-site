/**
 * Step 4.1 Phase D — D2.
 *
 * Locks the fact-driven stats line and the frozen-fact-driven
 * `generateStaticParams`: every count comes from `getBrandPathStats`
 * (sanitaire = 5 paths / 3 EPDM / 2 TPU), never the fabricated
 * "6 documented"/"228" the content-stripped page carried, and the
 * generated brand slugs are exactly the three real OEM brands.
 */
import { describe, expect, it, vi } from "vitest";
import {
  i18nRoutingFactory,
  nextIntlServerFactory,
  nextNavigationFactory,
  renderBrandPage,
  seoFactory,
  trustMockFactory,
} from "./test-utils";

vi.unmock("zod");
vi.mock("next/navigation", () => nextNavigationFactory());
vi.mock("@/i18n/routing", () => i18nRoutingFactory());
vi.mock("next-intl/server", () => nextIntlServerFactory());
vi.mock("@/components/seo", () => seoFactory());
vi.mock("@/components/trust", async (importOriginal) =>
  trustMockFactory(importOriginal as never),
);

const { default: BrandPage, generateStaticParams } = await import("../page");

describe("Phase D D2 — fact-driven stats and frozen static params", () => {
  it("renders the brand-stats line from getBrandPathStats, not a literal", async () => {
    await renderBrandPage(BrandPage, "en", "sanitaire");

    const { screen } = await import("@testing-library/react");
    const line = screen.getByTestId("brand-stats");
    // sanitaire = 5 documented compatibility paths, 3 EPDM, 2 TPU.
    expect(line.textContent).toContain("5");
    expect(line.textContent).toContain("3");
    expect(line.textContent).toContain("2");
    expect(line.textContent).toMatch(/EPDM/);
    expect(line.textContent).toMatch(/TPU/);
    // The fabricated content-stripped numbers must be gone.
    expect(line.textContent).not.toMatch(/\b6\s+documented\b/i);
    expect(line.textContent).not.toContain("228");
  });

  it("generates static params for exactly the three real OEM brand slugs", () => {
    const params = generateStaticParams();
    const slugs = [...new Set(params.map((p) => p.brand))].sort();
    expect(slugs).toEqual(["edi", "sanitaire", "ssi-aeration"]);
    // Still one entry per (locale, brand) across all runtime locales.
    expect(params).toContainEqual({ locale: "en", brand: "sanitaire" });
    expect(params).toContainEqual({ locale: "es", brand: "edi" });
    expect(params).toContainEqual({ locale: "zh", brand: "ssi-aeration" });
  });
});
