import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductFamilyContextNotice } from "@/components/contact/product-family-context-notice";
import { PRODUCT_FAMILY_CONTACT_INTENT } from "@/lib/contact/product-family-context";

const context = {
  intent: PRODUCT_FAMILY_CONTACT_INTENT,
  marketSlug: "north-america",
  familySlug: "couplings",
  marketLabel: "North America",
  familyLabel: "Couplings",
} as const;

describe("ProductFamilyContextNotice", () => {
  it("does not render without product-family context", () => {
    render(
      <ProductFamilyContextNotice context={null} label="Inquiry context" />,
    );

    expect(
      screen.queryByTestId("product-family-context-notice"),
    ).not.toBeInTheDocument();
  });

  it("uses a static StatusCallout without live-region semantics", () => {
    render(
      <ProductFamilyContextNotice context={context} label="Inquiry context" />,
    );

    const notice = screen.getByTestId("product-family-context-notice");
    expect(notice).toHaveAttribute("data-slot", "status-callout");
    expect(notice).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-status-callout",
    );
    expect(notice).not.toHaveAttribute("role");
    expect(notice).not.toHaveAttribute("aria-live");
    expect(notice).toHaveTextContent("Inquiry context");
    expect(notice).toHaveTextContent("North America / Couplings");
  });
});
