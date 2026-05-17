/**
 * The product page imports `@/data/product-compatibility`, which runs Zod
 * `.parse()` at module load. The global test setup mocks zod, so we must
 * unmock it here for the catalog to initialize.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductPage, { generateMetadata, generateStaticParams } from "../page";
import { CANONICAL_D9_EPDM, resolveMessage } from "./test-utils";

vi.unmock("zod");

// Local to the regression fence: this file (and only this file) asserts the
// SKU->canonical 308 target, so it owns a `permanentRedirect` spy. The
// shared harness `nextNavigationFactory` forwards the url to this spy then
// throws "NEXT_REDIRECT" — byte-identical behavior to the previous inline
// mock.
const { permanentRedirectMock } = vi.hoisted(() => ({
  permanentRedirectMock: vi.fn((_url: string) => {}),
}));

vi.mock("next/navigation", async () =>
  (await import("./test-utils")).nextNavigationFactory((url) =>
    permanentRedirectMock(url),
  ),
);
vi.mock("@/i18n/routing", async () =>
  (await import("./test-utils")).i18nRoutingFactory(),
);
vi.mock("next-intl/server", async () =>
  (await import("./test-utils")).nextIntlServerFactory(),
);
vi.mock("@/components/seo", async () =>
  (await import("./test-utils")).seoFactory(),
);
vi.mock("@/app/[locale]/membranes/[product]/compatibility-section", async () =>
  (await import("./test-utils")).compatibilitySectionFactory(),
);
vi.mock("@/components/trust", async (importOriginal) =>
  (await import("./test-utils")).trustMockFactory(importOriginal),
);

describe("Membrane product page", () => {
  it("generates a canonical descriptive param for every variant across locales", () => {
    const params = generateStaticParams();
    expect(params).toContainEqual({
      locale: "en",
      product: CANONICAL_D9_EPDM,
    });
    // The legacy SKU slug is a redirect source, never a generated param.
    expect(params).not.toContainEqual({
      locale: "en",
      product: "tuc-d9-epdm",
    });
    expect(
      params.filter((entry) => entry.locale === "en").length,
    ).toBeGreaterThan(1);
  });

  it("renders the spec bar and quote CTA for the canonical descriptive slug", async () => {
    const Page = await ProductPage({
      params: Promise.resolve({ locale: "en", product: CANONICAL_D9_EPDM }),
    });

    render(Page);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("EPDM")).toBeInTheDocument();
    expect(screen.getByText("TUC-D9-EPDM")).toBeInTheDocument();
    // `?sku=` keeps the real SKU for the RFQ; `?product=` uses the canonical slug.
    expect(
      screen.getByRole("link", { name: "Request Quote for This Part" }),
    ).toHaveAttribute(
      "href",
      `/quote?sku=TUC-D9-EPDM&product=${CANONICAL_D9_EPDM}`,
    );
  });

  it.each([
    { locale: "en", expected: "Disc" },
    { locale: "es", expected: "Disco" },
    { locale: "zh", expected: "盘式" },
  ])(
    "renders the spec-bar category from i18n ($locale -> $expected), never a hardcoded English literal",
    async ({ locale, expected }) => {
      const Page = await ProductPage({
        params: Promise.resolve({ locale, product: CANONICAL_D9_EPDM }),
      });
      const { container } = render(Page);

      expect(screen.getByText(expected)).toBeInTheDocument();

      if (locale !== "en") {
        // A `entry.category === "disc" ? "Disc" : "Tube"` regression would
        // leak the English literal onto /es and /zh.
        const dds = Array.from(container.querySelectorAll("dd")).map(
          (node) => node.textContent ?? "",
        );
        expect(dds).not.toContain("Disc");
        expect(dds).not.toContain("Tube");
      }
    },
  );

  it("permanently redirects the legacy SKU slug to the canonical descriptive URL", async () => {
    permanentRedirectMock.mockClear();
    await expect(
      ProductPage({
        params: Promise.resolve({ locale: "en", product: "tuc-d9-epdm" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(permanentRedirectMock).toHaveBeenCalledWith(
      `/en/membranes/${CANONICAL_D9_EPDM}`,
    );
  });

  it("preserves the locale prefix on the SKU redirect", async () => {
    permanentRedirectMock.mockClear();
    await expect(
      ProductPage({
        params: Promise.resolve({ locale: "es", product: "tuc-t62-tpu" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(permanentRedirectMock).toHaveBeenCalledWith(
      "/es/membranes/62-mm-tpu-tube-replacement",
    );
  });

  it("calls notFound() for an unknown slug", async () => {
    await expect(
      ProductPage({
        params: Promise.resolve({ locale: "en", product: "not-a-real-part" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  describe("generateMetadata", () => {
    it("emits a route-specific canonical on the descriptive slug, never the SKU slug", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: "en", product: CANONICAL_D9_EPDM }),
      });

      // Canonical/OG must be the descriptive-slug URL (the 308 redirect
      // target). A revert to `{ title, description }` drops alternates and
      // fails here; a canonical pointing at the SKU slug also fails.
      const canonical = metadata.alternates?.canonical;
      expect(canonical).toBe(
        `https://example.com/en/membranes/${CANONICAL_D9_EPDM}`,
      );
      expect(String(canonical)).not.toContain("tuc-d9-epdm");

      const openGraph = metadata.openGraph as unknown as { url?: string };
      expect(openGraph.url).toBe(
        `https://example.com/en/membranes/${CANONICAL_D9_EPDM}`,
      );
    });

    it("restricts hreflang to en + es (+ x-default) and never zh", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: "es", product: CANONICAL_D9_EPDM }),
      });

      expect(metadata.alternates?.canonical).toBe(
        `https://example.com/es/membranes/${CANONICAL_D9_EPDM}`,
      );
      expect(metadata.alternates?.languages).toEqual({
        en: `https://example.com/en/membranes/${CANONICAL_D9_EPDM}`,
        es: `https://example.com/es/membranes/${CANONICAL_D9_EPDM}`,
        "x-default": `https://example.com/en/membranes/${CANONICAL_D9_EPDM}`,
      });
      expect(metadata.alternates?.languages).not.toHaveProperty("zh");
    });

    it("keeps the localized title/description and stays indexable for public locales", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: "en", product: CANONICAL_D9_EPDM }),
      });

      // Title resolves from the entry name, description from i18n; merging
      // must not drop them.
      expect(typeof metadata.title).toBe("string");
      expect((metadata.title as string).length).toBeGreaterThan(0);
      expect(metadata.description).toBe(
        resolveMessage("en", "membraneProduct", "compatibility.description"),
      );
      expect(metadata.robots).toEqual(
        expect.objectContaining({ index: true, follow: true }),
      );
    });

    it("returns empty metadata for an unknown slug (no canonical added)", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: "en", product: "not-a-real-part" }),
      });

      expect(metadata).toEqual({});
    });
  });
});
