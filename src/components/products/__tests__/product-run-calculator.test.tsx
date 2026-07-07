import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductRunCalculator } from "@/components/products/product-run-calculator";
import { ABS_FLOOD_BARRIERS_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-abs-flood-barriers";

const calculator = ABS_FLOOD_BARRIERS_PRODUCT_PAGE.calculator;

describe("ProductRunCalculator", () => {
  it("estimates straight units with ceiling rounding in metres and centimetres", () => {
    render(<ProductRunCalculator calculator={calculator} />);

    const input = screen.getByLabelText(calculator.inputLabel);
    fireEvent.change(input, { target: { value: "12" } });
    expect(screen.getByText("≈ 12 straight units")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(calculator.unitSelectLabel), {
      target: { value: "cm" },
    });
    fireEvent.change(input, { target: { value: "1010" } });
    expect(screen.getByText("≈ 11 straight units")).toBeInTheDocument();
  });

  it("carries the configuration into the RFQ link, quantities only", () => {
    render(<ProductRunCalculator calculator={calculator} />);

    const cta = screen.getByRole("link", { name: calculator.ctaLabel });
    expect(cta).toHaveAttribute(
      "href",
      `/request-quote?interest=${calculator.interest}`,
    );

    fireEvent.change(screen.getByLabelText(calculator.inputLabel), {
      target: { value: "12" },
    });

    const href = cta.getAttribute("href") ?? "";
    expect(href).toContain("interest=abs-flood-barriers");
    expect(decodeURIComponent(href)).toContain("estimated 12 straight units");
    // Quote funnel discipline: quantities only, never prices.
    expect(decodeURIComponent(href)).not.toMatch(/\$|price|USD/i);
  });

  it("shows no estimate for empty or non-positive input", () => {
    render(<ProductRunCalculator calculator={calculator} />);

    fireEvent.change(screen.getByLabelText(calculator.inputLabel), {
      target: { value: "0" },
    });
    expect(screen.queryByText(/≈/)).not.toBeInTheDocument();
  });
});
