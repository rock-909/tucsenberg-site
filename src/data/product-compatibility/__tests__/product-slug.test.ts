/**
 * The slug helper imports `@/data/product-compatibility`, which runs Zod
 * `.parse()` at module load. The global test setup mocks zod, so we must
 * unmock it here for the catalog to initialize (mirrors accessors.test.ts).
 */
import { describe, expect, it, vi } from "vitest";
import { oemBrands, productVariants } from "@/data/product-compatibility";
import {
  canonicalProductSlug,
  getProductCompatibilityByCanonicalSlug,
  resolveCanonicalProductSlugFromSku,
} from "@/data/product-compatibility/product-slug";
import {
  FEATURED_COMPATIBLE_BRAND_HREF,
  FEATURED_MEMBRANE_HREF,
} from "@/config/single-site-links";

vi.unmock("zod");

// Linear-time kebab-case check (no nested quantifiers): only lowercase
// alphanumerics and single hyphens, no leading/trailing/double hyphen.
const KEBAB_CHARS = /^[a-z0-9-]+$/;

function isKebabCase(value: string): boolean {
  return (
    KEBAB_CHARS.test(value) &&
    !value.startsWith("-") &&
    !value.endsWith("-") &&
    !value.includes("--")
  );
}

describe("canonicalProductSlug", () => {
  it("derives a descriptive buyer slug for the 9-inch EPDM disc", () => {
    const variant = productVariants.find((v) => v.id === "tuc-d9-epdm");
    expect(variant).toBeDefined();
    expect(canonicalProductSlug(variant!)).toBe("9-inch-epdm-disc-replacement");
  });

  it("derives a descriptive buyer slug for the 9-inch TPU disc", () => {
    const variant = productVariants.find((v) => v.id === "tuc-d9-tpu");
    expect(variant).toBeDefined();
    expect(canonicalProductSlug(variant!)).toBe("9-inch-tpu-disc-replacement");
  });

  it("derives a mm-based slug for tube variants", () => {
    const variant = productVariants.find((v) => v.id === "tuc-t62-epdm");
    expect(variant).toBeDefined();
    expect(canonicalProductSlug(variant!)).toBe("62-mm-epdm-tube-replacement");
  });

  it("is deterministic", () => {
    for (const variant of productVariants) {
      expect(canonicalProductSlug(variant)).toBe(canonicalProductSlug(variant));
    }
  });

  it("produces lowercase kebab-case URL-safe slugs with no double/edge hyphens", () => {
    for (const variant of productVariants) {
      const slug = canonicalProductSlug(variant);
      expect(isKebabCase(slug)).toBe(true);
      expect(slug).toBe(slug.toLowerCase());
      expect(slug).toBe(encodeURIComponent(slug));
      expect(slug.endsWith("replacement")).toBe(true);
    }
  });

  it("is globally unique across every product variant", () => {
    const slugs = productVariants.map(canonicalProductSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("featured membrane href config equivalence", () => {
  it("the literal FEATURED_MEMBRANE_HREF matches the helper-derived canonical slug", () => {
    // single-site-links.ts declares the slug as a literal to keep the
    // product-compatibility barrel out of the hot nav/link import chain
    // (global Zod-mock). This guards that literal against drift from the
    // deterministic slug rule.
    const variant = productVariants.find((v) => v.id === "tuc-d9-epdm");
    expect(variant).toBeDefined();
    expect(FEATURED_MEMBRANE_HREF).toBe(
      `/membranes/${canonicalProductSlug(variant!)}`,
    );
  });

  it("the literal FEATURED_COMPATIBLE_BRAND_HREF matches a real oemBrands slug", () => {
    // single-site-links.ts declares the Sanitaire slug as a literal for the
    // same hot-import-chain / Zod-mock reason as the membrane slug. This guards
    // that literal against drift from the real compatibility catalog.
    const brandSlugs = oemBrands.map((brand) => brand.slug);
    expect(brandSlugs).toContain("sanitaire");
    expect(FEATURED_COMPATIBLE_BRAND_HREF).toBe("/compatible/sanitaire");
  });
});

describe("resolveCanonicalProductSlugFromSku", () => {
  it("maps the SKU data-layer slug to its canonical descriptive slug", () => {
    expect(resolveCanonicalProductSlugFromSku("tuc-d9-epdm")).toBe(
      "9-inch-epdm-disc-replacement",
    );
  });

  it("returns undefined for an unknown SKU slug", () => {
    expect(
      resolveCanonicalProductSlugFromSku("not-a-real-part"),
    ).toBeUndefined();
  });

  it("does not treat a canonical slug as a SKU slug", () => {
    expect(
      resolveCanonicalProductSlugFromSku("9-inch-epdm-disc-replacement"),
    ).toBeUndefined();
  });
});

describe("getProductCompatibilityByCanonicalSlug", () => {
  it("resolves a product entry by its canonical descriptive slug", () => {
    expect(
      getProductCompatibilityByCanonicalSlug("9-inch-epdm-disc-replacement")
        ?.sku,
    ).toBe("TUC-D9-EPDM");
  });

  it("returns undefined for the legacy SKU slug (not canonical)", () => {
    expect(
      getProductCompatibilityByCanonicalSlug("tuc-d9-epdm"),
    ).toBeUndefined();
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProductCompatibilityByCanonicalSlug("nope")).toBeUndefined();
  });

  it("resolves every variant via its canonical slug", () => {
    for (const variant of productVariants) {
      const entry = getProductCompatibilityByCanonicalSlug(
        canonicalProductSlug(variant),
      );
      expect(entry?.sku).toBe(variant.sku);
    }
  });
});
