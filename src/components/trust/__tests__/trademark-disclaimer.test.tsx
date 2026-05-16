import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// TrademarkDisclaimer reads the real Zod-parsed OEM brand catalog through
// `getOemBrandFacts()`. The global test setup mocks `zod`, which breaks the
// catalog parse on import, so we unmock it here (mirrors the
// product-compatibility catalog-facts tests).
vi.unmock("zod");

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(() =>
    Promise.resolve({
      legal: {
        trademark: {
          footer:
            "All referenced OEM names and part numbers ({brands}) are trademarks of their respective owners. Tucsenberg is an independent aftermarket manufacturer and is not affiliated with or endorsed by these companies.",
          brandNotice:
            "{brand} is a trademark of its respective owner. Tucsenberg is an independent aftermarket manufacturer and is not affiliated with {brand}.",
          inline:
            "OEM names are trademarks of their owners; Tucsenberg is an independent aftermarket manufacturer.",
        },
      },
    }),
  ),
}));

async function renderDisclaimer(
  props: Partial<{
    variant: "footer" | "brand-notice" | "inline";
    brandName: string;
  }> = {},
) {
  const { TrademarkDisclaimer } =
    await import("@/components/trust/trademark-disclaimer");
  const element = await TrademarkDisclaimer({
    locale: "en",
    variant: props.variant ?? "footer",
    ...(props.brandName ? { brandName: props.brandName } : {}),
  });
  return render(element);
}

describe("Feature: TrademarkDisclaimer primitive", () => {
  describe("Scenario: footer variant", () => {
    it("carries the shared testid and footer data-variant", async () => {
      await renderDisclaimer({ variant: "footer" });
      const root = screen.getByTestId("trademark-disclaimer");
      expect(root).toHaveAttribute("data-variant", "footer");
    });

    it("lists exactly the three real OEM brands", async () => {
      await renderDisclaimer({ variant: "footer" });
      const root = screen.getByTestId("trademark-disclaimer");
      expect(root).toHaveTextContent("Sanitaire, EDI, SSI Aeration");
    });

    it("never names the excluded fake brands", async () => {
      await renderDisclaimer({ variant: "footer" });
      const root = screen.getByTestId("trademark-disclaimer");
      expect(root.textContent ?? "").not.toMatch(/Aercor|Stamford|Nopon/i);
    });
  });

  describe("Scenario: brand-notice variant", () => {
    it("injects the single passed brand name", async () => {
      await renderDisclaimer({
        variant: "brand-notice",
        brandName: "Sanitaire",
      });
      const root = screen.getByTestId("trademark-disclaimer");
      expect(root).toHaveAttribute("data-variant", "brand-notice");
      expect(root).toHaveTextContent(
        "Sanitaire is a trademark of its respective owner.",
      );
      expect(root.textContent ?? "").not.toMatch(/EDI|SSI Aeration/);
    });
  });

  describe("Scenario: inline variant", () => {
    it("renders the compact one-liner", async () => {
      await renderDisclaimer({ variant: "inline" });
      const root = screen.getByTestId("trademark-disclaimer");
      expect(root).toHaveAttribute("data-variant", "inline");
      expect(root).toHaveTextContent(
        "OEM names are trademarks of their owners",
      );
    });
  });
});
