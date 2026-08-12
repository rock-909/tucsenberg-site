import { describe, expect, it } from "vitest";
import catalogMessages from "../../../messages/profiles/catalog/en/messages.json";
import {
  getProductSpecSheetDocuments,
  validateProductSpecSheetContracts,
} from "../../../scripts/product-spec-sheets";

describe("product spec sheets", () => {
  it("keeps the TB-AG quote timing aligned with the approved reply contract", () => {
    const document = getProductSpecSheetDocuments().find(
      ({ id }) => id === "tb-ag",
    );

    expect(document).toBeDefined();
    expect(document?.html).toContain(
      "We reply within 12 hours. If the details are sufficient, the reply includes a quote. Otherwise, we ask only for the missing essentials.",
    );
    expect(document?.html).not.toMatch(/quoted within 12 hours/iu);
    expect(document?.html).not.toMatch(/custom cut lists? within 48/iu);
  });

  it("keeps the TB-FB MOQ separate from model-specific carton quantities", () => {
    const document = getProductSpecSheetDocuments().find(
      ({ id }) => id === "tb-fb",
    );

    expect(document).toBeDefined();
    expect(document?.html).toContain("0.23 kg to 20 kg");
    expect(document?.html).toContain("MOQ 300 bags");
    expect(document?.html).not.toMatch(/six cartons/iu);
    expect(document?.html).toContain("50/carton");
    expect(document?.html).toContain("40/carton");
    expect(document?.html).toContain(
      "Flood-bag carton count is confirmed by model at quotation.",
    );
    expect(catalogMessages.home.faq.items.minimumOrder.answer).not.toMatch(
      /six cartons/iu,
    );
    expect(catalogMessages.home.faq.items.minimumOrder.answer).toContain(
      "carton count is confirmed by model at quotation",
    );
  });

  it("reports no critical buyer-copy contract findings", () => {
    expect(validateProductSpecSheetContracts()).toEqual([]);
  });
});
