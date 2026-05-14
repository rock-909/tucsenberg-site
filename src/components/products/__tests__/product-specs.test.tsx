/**
 * @vitest-environment jsdom
 * Tests for ProductSpecs, ProductCertifications, and ProductTradeInfo components
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ProductCertifications,
  ProductSpecs,
  ProductTradeInfo,
} from "../product-specs";

describe("ProductSpecs", () => {
  const sampleSpecs = {
    Material: "Stainless Steel 304",
    Weight: "5.2 kg",
    Dimensions: "200 x 150 x 100 mm",
  };

  describe("basic rendering", () => {
    it("renders specs table with all entries", () => {
      render(<ProductSpecs specs={sampleSpecs} />);

      expect(screen.getByText("Material")).toBeInTheDocument();
      expect(screen.getByText("Stainless Steel 304")).toBeInTheDocument();
      expect(screen.getByText("Weight")).toBeInTheDocument();
      expect(screen.getByText("5.2 kg")).toBeInTheDocument();
      expect(screen.getByText("Dimensions")).toBeInTheDocument();
      expect(screen.getByText("200 x 150 x 100 mm")).toBeInTheDocument();
    });

    it('renders default title "Specifications"', () => {
      render(<ProductSpecs specs={sampleSpecs} />);

      expect(screen.getByText("Specifications")).toBeInTheDocument();
    });

    it("renders custom title", () => {
      render(<ProductSpecs specs={sampleSpecs} title="Technical Details" />);

      expect(screen.getByText("Technical Details")).toBeInTheDocument();
    });

    it("returns null for empty specs object", () => {
      const { container } = render(<ProductSpecs specs={{}} />);

      expect(container.firstChild).toBeNull();
    });

    it("renders definition list structure", () => {
      const { container } = render(<ProductSpecs specs={sampleSpecs} />);

      expect(container.querySelector("dl")).toBeInTheDocument();
      expect(container.querySelectorAll("dt")).toHaveLength(3);
      expect(container.querySelectorAll("dd")).toHaveLength(3);
    });
  });

  describe("custom className", () => {
    it("applies custom className to Card", () => {
      const { container } = render(
        <ProductSpecs specs={sampleSpecs} className="custom-specs-class" />,
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("custom-specs-class");
    });
  });

  describe("styling", () => {
    it("has overflow-hidden class on card", () => {
      const { container } = render(<ProductSpecs specs={sampleSpecs} />);

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("overflow-hidden");
    });

    it("has bg-muted/50 on header", () => {
      const { container } = render(<ProductSpecs specs={sampleSpecs} />);

      const header = container.querySelector('[data-slot="card-header"]');
      expect(header).toHaveClass("bg-muted/50");
    });
  });

  describe("edge cases", () => {
    it("handles single spec entry", () => {
      render(<ProductSpecs specs={{ Color: "Red" }} />);

      expect(screen.getByText("Color")).toBeInTheDocument();
      expect(screen.getByText("Red")).toBeInTheDocument();
    });

    it("handles spec values with special characters", () => {
      render(
        <ProductSpecs
          specs={{
            "Voltage Range": "110V-240V AC",
            Temperature: "-20°C to 60°C",
          }}
        />,
      );

      expect(screen.getByText("110V-240V AC")).toBeInTheDocument();
      expect(screen.getByText("-20°C to 60°C")).toBeInTheDocument();
    });

    it("handles many spec entries", () => {
      const manySpecs = Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [
          `Spec ${i + 1}`,
          `Value ${i + 1}`,
        ]),
      );
      render(<ProductSpecs specs={manySpecs} />);

      expect(screen.getByText("Spec 1")).toBeInTheDocument();
      expect(screen.getByText("Spec 20")).toBeInTheDocument();
    });
  });
});

describe("ProductCertifications", () => {
  const sampleCertifications = ["ISO 9001", "CE", "RoHS"];

  describe("basic rendering", () => {
    it("renders all certification badges", () => {
      render(<ProductCertifications certifications={sampleCertifications} />);

      expect(screen.getByText("ISO 9001")).toBeInTheDocument();
      expect(screen.getByText("CE")).toBeInTheDocument();
      expect(screen.getByText("RoHS")).toBeInTheDocument();
    });

    it('renders default title "Certifications"', () => {
      render(<ProductCertifications certifications={sampleCertifications} />);

      expect(screen.getByText("Certifications")).toBeInTheDocument();
    });

    it("renders custom title", () => {
      render(
        <ProductCertifications
          certifications={sampleCertifications}
          title="Quality Standards"
        />,
      );

      expect(screen.getByText("Quality Standards")).toBeInTheDocument();
    });

    it("returns null for empty certifications array", () => {
      const { container } = render(
        <ProductCertifications certifications={[]} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("hides title when empty string provided", () => {
      render(
        <ProductCertifications
          certifications={sampleCertifications}
          title=""
        />,
      );

      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("applies custom className to container", () => {
      const { container } = render(
        <ProductCertifications
          certifications={sampleCertifications}
          className="custom-certs-class"
        />,
      );

      expect(container.firstChild).toHaveClass("custom-certs-class");
    });
  });

  describe("badge styling", () => {
    it("badges are rendered in flex container", () => {
      const { container } = render(
        <ProductCertifications certifications={["ISO 9001"]} />,
      );

      // Badges are in a flex container with gap-2
      const flexContainer = container.querySelector(".flex.flex-wrap.gap-2");
      expect(flexContainer).toBeInTheDocument();
      expect(screen.getByText("ISO 9001")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles single certification", () => {
      render(<ProductCertifications certifications={["FDA"]} />);

      expect(screen.getByText("FDA")).toBeInTheDocument();
    });

    it("handles certifications with long names", () => {
      render(
        <ProductCertifications
          certifications={[
            "International Quality Management System ISO 9001:2015",
          ]}
        />,
      );

      expect(
        screen.getByText(
          "International Quality Management System ISO 9001:2015",
        ),
      ).toBeInTheDocument();
    });
  });
});

describe("ProductTradeInfo", () => {
  describe("basic rendering", () => {
    it("renders trade info with all fields", () => {
      render(
        <ProductTradeInfo
          moq="100 pcs"
          leadTime="15-20 days"
          supplyCapacity="5000 pcs/month"
          packaging="Carton"
          portOfLoading="Shanghai"
        />,
      );

      expect(screen.getByText("100 pcs")).toBeInTheDocument();
      expect(screen.getByText("15-20 days")).toBeInTheDocument();
      expect(screen.getByText("5000 pcs/month")).toBeInTheDocument();
      expect(screen.getByText("Carton")).toBeInTheDocument();
      expect(screen.getByText("Shanghai")).toBeInTheDocument();
    });

    it("renders default labels", () => {
      render(<ProductTradeInfo moq="100 pcs" leadTime="15 days" />);

      expect(screen.getByText("Minimum Order")).toBeInTheDocument();
      expect(screen.getByText("Lead Time")).toBeInTheDocument();
    });

    it('renders default title "Trade Information"', () => {
      render(<ProductTradeInfo moq="100 pcs" />);

      expect(screen.getByText("Trade Information")).toBeInTheDocument();
    });

    it("renders custom title", () => {
      render(<ProductTradeInfo moq="100 pcs" title="Business Terms" />);

      expect(screen.getByText("Business Terms")).toBeInTheDocument();
    });

    it("returns null when all fields are undefined", () => {
      const { container } = render(<ProductTradeInfo />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("custom labels", () => {
    it("renders custom MOQ label", () => {
      render(<ProductTradeInfo moq="50 units" labels={{ moq: "起订量" }} />);

      expect(screen.getByText("起订量")).toBeInTheDocument();
      expect(screen.getByText("50 units")).toBeInTheDocument();
    });

    it("renders custom lead time label", () => {
      render(
        <ProductTradeInfo leadTime="7 days" labels={{ leadTime: "交货期" }} />,
      );

      expect(screen.getByText("交货期")).toBeInTheDocument();
    });

    it("merges custom labels with defaults", () => {
      render(
        <ProductTradeInfo
          moq="100 pcs"
          supplyCapacity="5000/month"
          labels={{ moq: "Min Order" }}
        />,
      );

      expect(screen.getByText("Min Order")).toBeInTheDocument();
      expect(screen.getByText("Supply Capacity")).toBeInTheDocument();
    });
  });

  describe("partial fields", () => {
    it("renders only provided fields", () => {
      render(<ProductTradeInfo moq="100 pcs" />);

      expect(screen.getByText("Minimum Order")).toBeInTheDocument();
      expect(screen.getByText("100 pcs")).toBeInTheDocument();
      expect(screen.queryByText("Lead Time")).not.toBeInTheDocument();
    });

    it("renders MOQ and lead time only", () => {
      render(<ProductTradeInfo moq="50 sets" leadTime="10-14 days" />);

      expect(screen.getByText("50 sets")).toBeInTheDocument();
      expect(screen.getByText("10-14 days")).toBeInTheDocument();
      expect(screen.queryByText("Supply Capacity")).not.toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("applies custom className to Card", () => {
      const { container } = render(
        <ProductTradeInfo moq="100 pcs" className="custom-trade-class" />,
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("custom-trade-class");
    });
  });

  describe("definition list structure", () => {
    it("renders as definition list", () => {
      const { container } = render(
        <ProductTradeInfo moq="100 pcs" leadTime="7 days" />,
      );

      expect(container.querySelector("dl")).toBeInTheDocument();
      expect(container.querySelectorAll("dt")).toHaveLength(2);
      expect(container.querySelectorAll("dd")).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("handles all five fields", () => {
      const { container } = render(
        <ProductTradeInfo
          moq="100"
          leadTime="7d"
          supplyCapacity="1000"
          packaging="Box"
          portOfLoading="SH"
        />,
      );

      expect(container.querySelectorAll("dt")).toHaveLength(5);
    });

    it("handles special characters in values", () => {
      render(<ProductTradeInfo moq="≥100 pcs" leadTime="15-20 工作日" />);

      expect(screen.getByText("≥100 pcs")).toBeInTheDocument();
      expect(screen.getByText("15-20 工作日")).toBeInTheDocument();
    });
  });
});
