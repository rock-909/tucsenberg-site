/**
 * Step 4.1 Phase D — D4 facet guard.
 *
 * The brand-compatibility filter must expose exactly two facets:
 * a 3-tab category tablist (All / Disc / Tube) and a single material
 * combobox. No membrane-class facet, no mount-style facet, no
 * fit-status combobox may be (re-)introduced. This guard fails loudly
 * if a future change widens the facet surface.
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

const { default: BrandPage } = await import("../page");

describe("Phase D D4 — facets locked to category + material only", () => {
  it("renders exactly one 3-tab category tablist and one material combobox", async () => {
    await renderBrandPage(BrandPage, "en", "sanitaire");
    const { screen } = await import("@testing-library/react");

    const tablists = screen.getAllByRole("tablist");
    expect(tablists).toHaveLength(1);
    expect(screen.getAllByRole("tab")).toHaveLength(3);

    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });

  it("does not expose any membrane-class, mount-style, or fit-status facet", async () => {
    await renderBrandPage(BrandPage, "en", "sanitaire");
    const { screen } = await import("@testing-library/react");

    expect(screen.queryByRole("tab", { name: /membrane class/i })).toBeNull();
    expect(screen.queryByRole("tab", { name: /mount style/i })).toBeNull();
    expect(screen.queryByRole("combobox", { name: /fit status/i })).toBeNull();
  });
});
