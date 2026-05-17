/**
 * Spec-strip data contract: the hero `<dl>` exposes only real data fields
 * (Diameter / Material / Type / SKU), the featured variant's diameter is
 * sourced from the frozen `getFeaturedProductFacts()` accessor, and no
 * struck non-data tokens (temperature band, mounting style) leak in.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductPage from "../page";
import {
  CANONICAL_D9_EPDM,
  renderProductPage,
  resolveMessage,
} from "./test-utils";

vi.unmock("zod");

vi.mock("next/navigation", async () =>
  (await import("./test-utils")).nextNavigationFactory(),
);
vi.mock("@/i18n/routing", async () =>
  (await import("./test-utils")).i18nRoutingFactory(),
);
vi.mock("next-intl/server", async () =>
  (await import("./test-utils")).nextIntlServerFactory(),
);
vi.mock("@/components/seo", async () =>
  (await import("./test-utils")).seoFactory(),
);
vi.mock("@/app/[locale]/membranes/[product]/compatibility-section", async () =>
  (await import("./test-utils")).compatibilitySectionFactory(),
);
vi.mock("@/components/trust", async (importOriginal) =>
  (await import("./test-utils")).trustMockFactory(importOriginal),
);

describe("Membrane product page — spec strip data contract", () => {
  it("exposes only Diameter/Material/Type/SKU sourced from real data", async () => {
    const { container } = await renderProductPage(
      ProductPage,
      "en",
      CANONICAL_D9_EPDM,
    );

    const dl = container.querySelector("dl");
    expect(dl).not.toBeNull();
    const labels = Array.from(
      dl!.querySelectorAll("dt"),
      (n) => n.textContent ?? "",
    );
    expect(labels).toEqual([
      resolveMessage("en", "membraneProduct", "hero.specBar.diameter"),
      resolveMessage("en", "membraneProduct", "hero.specBar.material"),
      resolveMessage("en", "membraneProduct", "hero.specBar.category"),
      resolveMessage("en", "membraneProduct", "hero.specBar.sku"),
    ]);

    // Real data values.
    expect(screen.getByText("TUC-D9-EPDM")).toBeInTheDocument();
    const dlText = dl!.textContent ?? "";
    expect(dlText).toMatch(/9"|228\.6\s*mm/);

    // Struck non-data tokens must not leak into the spec strip.
    expect(dlText).not.toMatch(/°C/);
    expect(dlText).not.toMatch(/\bthreaded\b|\bring\b|\bbayonet\b/i);
    expect(dlText).not.toMatch(/5\s*[–-]\s*45/);
  });
});
