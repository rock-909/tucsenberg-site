import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductFamilyContextNotice } from "@/components/contact/product-family-context-notice";
import { PRODUCT_FAMILY_CONTACT_INTENT } from "@/lib/contact/product-family-context";

describe("ProductFamilyContextNotice", () => {
  it("renders selected product context as a static notice", () => {
    render(
      <ProductFamilyContextNotice
        label="You are asking about:"
        context={{
          intent: PRODUCT_FAMILY_CONTACT_INTENT,
          marketSlug: "north-america",
          familySlug: "couplings",
          marketLabel: "North America",
          familyLabel: "Couplings",
        }}
      />,
    );

    const notice = screen.getByTestId("product-family-context-notice");

    expect(notice).toHaveTextContent("You are asking about:");
    expect(notice).toHaveTextContent("North America / Couplings");
    expect(notice).not.toHaveAttribute("role");
    expect(notice).not.toHaveAttribute("aria-live");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
