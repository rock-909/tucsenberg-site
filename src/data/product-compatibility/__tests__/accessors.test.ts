import { describe, expect, it, vi } from "vitest";
import {
  getProductCompatibility,
  getBrandCompatibility,
  getModelCompatibility,
} from "@/data/product-compatibility";

vi.unmock("zod");

describe("getProductCompatibility", () => {
  it("resolves a known variant slug", () => {
    expect(getProductCompatibility("tuc-d9-epdm")?.sku).toBe("TUC-D9-EPDM");
  });
  it("returns undefined for unknown slug", () => {
    expect(getProductCompatibility("nope")).toBeUndefined();
  });
});

describe("getBrandCompatibility", () => {
  it("resolves a known brand slug", () => {
    expect(getBrandCompatibility("sanitaire")?.brandName).toBe("Sanitaire");
  });
  it("returns undefined for unknown slug", () => {
    expect(getBrandCompatibility("nope")).toBeUndefined();
  });
});

describe("getModelCompatibility", () => {
  it("resolves a known model slug", () => {
    expect(
      getModelCompatibility("sanitaire-silver-series-ii-9-inch-disc")?.modelId,
    ).toBe("sanitaire-silver-series-ii-9-inch-disc");
  });
  it("returns undefined for unknown slug", () => {
    expect(getModelCompatibility("nope")).toBeUndefined();
  });
});
