import { describe, expect, it } from "vitest";
import {
  buildProductFamilyContactHref,
  parseProductFamilyContactContext,
} from "@/lib/contact/product-family-context";

const messages = {
  catalog: {
    markets: {
      "abs-flood-barriers": {
        label: "ABS Interlocking Boxwall Flood Barriers",
      },
    },
    families: {
      "abs-flood-barriers": {
        "abs-boxwall": {
          label: "ABS boxwall units",
        },
      },
    },
  },
};

describe("product-family contact context", () => {
  it("builds a Contact href object with internal slugs only", () => {
    expect(
      buildProductFamilyContactHref({
        marketSlug: "abs-flood-barriers",
        familySlug: "abs-boxwall",
      }),
    ).toEqual({
      pathname: "/contact",
      query: {
        intent: "product-family",
        market: "abs-flood-barriers",
        family: "abs-boxwall",
      },
    });
  });

  it("parses valid product family context and resolves trusted labels", () => {
    const context = parseProductFamilyContactContext({
      searchParams: {
        intent: "product-family",
        market: "abs-flood-barriers",
        family: "abs-boxwall",
      },
      messages,
    });

    expect(context).toEqual({
      intent: "product-family",
      marketSlug: "abs-flood-barriers",
      familySlug: "abs-boxwall",
      marketLabel: "ABS Interlocking Boxwall Flood Barriers",
      familyLabel: "ABS boxwall units",
    });
  });

  it("ignores invalid family slugs", () => {
    const context = parseProductFamilyContactContext({
      searchParams: {
        intent: "product-family",
        market: "abs-flood-barriers",
        family: "<script>alert(1)</script>",
      },
      messages,
    });

    expect(context).toBeNull();
  });

  it("ignores wrong intents", () => {
    const context = parseProductFamilyContactContext({
      searchParams: {
        intent: "raw-message",
        market: "abs-flood-barriers",
        family: "abs-boxwall",
      },
      messages,
    });

    expect(context).toBeNull();
  });
});
