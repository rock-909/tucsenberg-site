import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  BagProductDiagram,
  BoxwallProductDiagram,
  FrpProductDiagram,
  GateProductDiagram,
  TubeProductDiagram,
} from "@/constants/tucsenberg-product-page-types";
import { ABS_FLOOD_BARRIERS_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-abs-flood-barriers";
import {
  ProductDiagramPanel,
  ProductLineDiagram,
} from "@/components/products/product-diagrams";

const boxwallSentinel: BoxwallProductDiagram = {
  kind: "boxwall",
  ariaLabel: "SENTINEL BOXWALL ARIA",
  caption: "SENTINEL BOXWALL CAPTION",
  panelLabel: "SENTINEL PANEL",
  labels: {
    waterSide: "SENTINEL WATER",
    loadSealsBase: "SENTINEL LOAD SEALS",
    profile: "SENTINEL PROFILE",
    load: "SENTINEL LOAD",
    floodSide: "SENTINEL FLOOD",
    drySide: "SENTINEL DRY",
    heightRange: "40–90 cm",
  },
};

const gateSentinel: GateProductDiagram = {
  kind: "gate",
  ariaLabel: "SENTINEL GATE ARIA",
  caption: "SENTINEL GATE CAPTION",
  labels: {
    planks: "SENTINEL PLANKS",
    seal: "SENTINEL SEAL",
    post: "SENTINEL POST",
  },
};

const bagSentinel: BagProductDiagram = {
  kind: "bag",
  ariaLabel: "SENTINEL BAG ARIA",
  caption: "SENTINEL BAG CAPTION",
  labels: {
    shipsFlat: "SENTINEL SHIPS FLAT",
    addWater: "SENTINEL ADD WATER",
    activatedWeight: "SENTINEL ACTIVATED",
    stacking: "SENTINEL STACKING",
  },
};

const tubeSentinel: TubeProductDiagram = {
  kind: "tube",
  ariaLabel: "SENTINEL TUBE ARIA",
  caption: "SENTINEL TUBE CAPTION",
  labels: {
    waterSide: "SENTINEL TUBE WATER",
    skirtAndPins: "SENTINEL SKIRT",
    tubeConstruction: "SENTINEL TUBE BODY",
  },
};

const frpSentinel: FrpProductDiagram = {
  kind: "frp",
  ariaLabel: "SENTINEL FRP ARIA",
  caption: "SENTINEL FRP CAPTION",
  labels: {
    heightClass: "SENTINEL HEIGHT CLASS",
    profile: "SENTINEL FRP PROFILE",
    properties: "SENTINEL FRP PROPERTIES",
  },
};

const sentinelCases = [
  {
    name: "boxwall",
    diagram: boxwallSentinel,
    sentinelTexts: [
      "SENTINEL WATER",
      "SENTINEL LOAD SEALS",
      "SENTINEL PROFILE",
    ],
    embeddedEnglish: [
      "water side",
      "load seals the base",
      "interlocking ABS",
      // The height range is product data now, so a substituted value must win.
      "50–85 cm",
    ],
    dimensionTexts: ["40–90 cm"],
  },
  {
    name: "gate",
    diagram: gateSentinel,
    sentinelTexts: ["SENTINEL PLANKS", "SENTINEL SEAL", "SENTINEL POST"],
    embeddedEnglish: ["6063-T6 planks", "EPDM seal", "post"],
    dimensionTexts: ["180 mm"],
  },
  {
    name: "bag",
    diagram: bagSentinel,
    sentinelTexts: [
      "SENTINEL SHIPS FLAT",
      "SENTINEL ADD WATER",
      "SENTINEL ACTIVATED",
      "SENTINEL STACKING",
    ],
    embeddedEnglish: ["ships flat", "+ water", "stack like sandbags"],
    dimensionTexts: [] as string[],
  },
  {
    name: "tube",
    diagram: tubeSentinel,
    sentinelTexts: [
      "SENTINEL TUBE WATER",
      "SENTINEL SKIRT",
      "SENTINEL TUBE BODY",
    ],
    embeddedEnglish: ["water side", "skirt + pins", "PVC tube"],
    dimensionTexts: ["1 m"],
  },
  {
    name: "frp",
    diagram: frpSentinel,
    sentinelTexts: [
      "SENTINEL HEIGHT CLASS",
      "SENTINEL FRP PROFILE",
      "SENTINEL FRP PROPERTIES",
    ],
    embeddedEnglish: ["pultruded FRP", "corrosion-free"],
    dimensionTexts: [] as string[],
  },
] as const;

describe("ProductLineDiagram", () => {
  it.each(sentinelCases)(
    "renders $name sentinel labels instead of embedded English",
    ({ diagram, sentinelTexts, embeddedEnglish, dimensionTexts }) => {
      const { container } = render(<ProductLineDiagram diagram={diagram} />);

      for (const text of sentinelTexts) {
        expect(container).toHaveTextContent(text);
      }
      for (const text of embeddedEnglish) {
        expect(container).not.toHaveTextContent(text);
      }
      for (const text of dimensionTexts) {
        expect(container).toHaveTextContent(text);
      }
    },
  );
});

describe("ProductDiagramPanel", () => {
  it("renders panel label, caption, and aria label from diagram data", () => {
    render(<ProductDiagramPanel diagram={boxwallSentinel} />);

    const panel = screen.getByTestId("product-diagram");
    expect(within(panel).getByText("SENTINEL PANEL")).toBeVisible();
    expect(within(panel).getByText("SENTINEL BOXWALL CAPTION")).toBeVisible();
    expect(
      within(panel).getByRole("img", { name: "SENTINEL BOXWALL ARIA" }),
    ).toBeInTheDocument();
  });

  it("keeps the boxwall diagram as server-rendered SVG", () => {
    render(
      <ProductDiagramPanel diagram={ABS_FLOOD_BARRIERS_PRODUCT_PAGE.diagram} />,
    );

    const panel = screen.getByTestId("product-diagram");
    expect(
      within(panel).getByRole("img", {
        name: ABS_FLOOD_BARRIERS_PRODUCT_PAGE.diagram.ariaLabel,
      }),
    ).toBeInTheDocument();
    expect(panel.querySelector("canvas")).not.toBeInTheDocument();
  });
});
