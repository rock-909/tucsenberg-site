import { describe, it, expect, vi } from "vitest";

vi.unmock("zod");

import {
  getOEMBrandById,
  getOEMModelById,
  getProductGroupById,
  getProductVariantById,
  getCompatibleProducts,
  getCompatibleOEMModels,
  getOEMBrandModels,
  searchByPartNumber,
} from "@/data/queries";

describe("product data queries", () => {
  describe("getCompatibleProducts", () => {
    it("returns EPDM and TPU variants for Sanitaire Silver II 9-inch", () => {
      const results = getCompatibleProducts("sanitaire-silver-ii-9");

      expect(results.length).toBe(2);

      const skus = results.map((r) => r.variant.sku).sort();
      expect(skus).toEqual(["TUC-D9-EPDM", "TUC-D9-TPU"]);

      for (const result of results) {
        expect(result.group.id).toBe("9-inch-disc");
        expect(result.mapping.fitStatus).toBe("exact");
      }
    });

    it("returns empty array for nonexistent model", () => {
      const results = getCompatibleProducts("nonexistent-model-xyz");
      expect(results).toEqual([]);
    });
  });

  describe("getCompatibleOEMModels", () => {
    it("returns Sanitaire, EDI, SSI models for 9-inch EPDM disc", () => {
      const results = getCompatibleOEMModels("9-inch-disc-epdm");

      expect(results.length).toBeGreaterThanOrEqual(3);

      const brandIds = new Set(results.map((r) => r.brand.id));
      expect(brandIds).toContain("sanitaire");
      expect(brandIds).toContain("edi");
      expect(brandIds).toContain("ssi");
    });
  });

  describe("getOEMBrandModels", () => {
    it("returns all EDI models", () => {
      const models = getOEMBrandModels("edi");
      expect(models.length).toBeGreaterThanOrEqual(9);

      for (const model of models) {
        expect(model.brandId).toBe("edi");
      }
    });

    it("returns empty for nonexistent brand", () => {
      const models = getOEMBrandModels("nonexistent-brand");
      expect(models).toEqual([]);
    });
  });

  describe("searchByPartNumber", () => {
    it("finds EDI 00223 and returns 9-inch disc compatibility", () => {
      const results = searchByPartNumber("EDI 00223");

      expect(results.length).toBe(1);
      expect(results[0].model.id).toBe("sanitaire-silver-ii-9");
      expect(results[0].brand.id).toBe("sanitaire");
      expect(results[0].compatibleProducts.length).toBeGreaterThanOrEqual(2);

      const skus = results[0].compatibleProducts
        .map((cp) => cp.variant.sku)
        .sort();
      expect(skus).toContain("TUC-D9-EPDM");
      expect(skus).toContain("TUC-D9-TPU");
    });

    it("finds partial match on part number", () => {
      const results = searchByPartNumber("0022");
      expect(results.length).toBeGreaterThanOrEqual(1);

      const modelIds = results.map((r) => r.model.id);
      expect(modelIds).toContain("sanitaire-silver-ii-9");
    });

    it("returns empty for no match", () => {
      const results = searchByPartNumber("ZZZZZ");
      expect(results).toEqual([]);
    });

    it("is case-insensitive", () => {
      const results = searchByPartNumber("edi 00223");

      expect(results.length).toBe(1);
      expect(results[0].model.id).toBe("sanitaire-silver-ii-9");
    });
  });

  describe("lookup helpers", () => {
    it("getOEMBrandById returns Sanitaire", () => {
      const brand = getOEMBrandById("sanitaire");

      expect(brand).toBeDefined();
      expect(brand!.name).toBe("Sanitaire");
      expect(brand!.parentCompany).toBe("Xylem");
    });

    it("getOEMModelById returns Silver Series II", () => {
      const model = getOEMModelById("sanitaire-silver-ii-9");

      expect(model).toBeDefined();
      expect(model!.name).toBe("Silver Series II 9-inch");
      expect(model!.brandId).toBe("sanitaire");
    });

    it("getProductVariantById returns TUC-D9-EPDM", () => {
      const variant = getProductVariantById("9-inch-disc-epdm");

      expect(variant).toBeDefined();
      expect(variant!.sku).toBe("TUC-D9-EPDM");
      expect(variant!.material).toBe("epdm");
    });

    it("getProductGroupById returns 9-inch disc group", () => {
      const group = getProductGroupById("9-inch-disc");

      expect(group).toBeDefined();
      expect(group!.category).toBe("disc");
      expect(group!.variantIds).toContain("9-inch-disc-epdm");
      expect(group!.variantIds).toContain("9-inch-disc-tpu");
    });
  });
});
