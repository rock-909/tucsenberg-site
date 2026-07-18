import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (namespace?: string) => {
    if (namespace === "catalog.breadcrumb") {
      return (key: string) =>
        key === "products" ? "Products" : key === "home" ? "Home" : key;
    }

    return (key: string) => key;
  }),
}));

// Mock next-intl routing
vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
  Link: ({
    href,
    children,
    prefetch,
    ...props
  }: {
    href: string | { pathname: string; params: Record<string, string> };
    children: React.ReactNode;
    prefetch?: boolean;
  }) => {
    const resolvedHref =
      typeof href === "string"
        ? href
        : href.pathname.replace(
            /\[(\w+)\]/g,
            (_, key: string) => href.params[key] ?? key,
          );
    return (
      <a
        href={resolvedHref}
        {...props}
        data-prefetch={prefetch === undefined ? "default" : String(prefetch)}
      >
        {children}
      </a>
    );
  },
}));

vi.mock("@/config/paths", () => ({
  LOCALES_CONFIG: {
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
  SITE_CONFIG: {
    baseUrl: "https://www.example.com",
  },
}));

describe("CatalogBreadcrumb", () => {
  async function importComponent() {
    const mod = await import("../catalog-breadcrumb");
    return mod.CatalogBreadcrumb;
  }

  it("renders minimal breadcrumb for products overview (Home > Products)", async () => {
    const CatalogBreadcrumb = await importComponent();
    render(await CatalogBreadcrumb({}));

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();

    // Products is current page (not a link)
    const productsEl = screen.getByText("Products");
    expect(productsEl).toHaveAttribute("aria-current", "page");
  });

  it("renders two-level breadcrumb for market page (Home > Products > Market)", async () => {
    const CatalogBreadcrumb = await importComponent();
    const market = {
      slug: "north-america",
      label: "Primary Offer Example",
      standardLabel: "Example Standard A",
      description: "test",
      sizeSystem: "inch" as const,
      standardIds: [],
    };

    render(await CatalogBreadcrumb({ market }));

    // Home is a link
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");

    // Products is a link to /products
    const productsLink = screen.getByText("Products").closest("a");
    expect(productsLink).toHaveAttribute("href", "/products");

    // Market label is current page
    const marketEl = screen.getByText("Primary Offer Example");
    expect(marketEl).toHaveAttribute("aria-current", "page");
  });

  it("can opt the home breadcrumb out of automatic route prefetch", async () => {
    const CatalogBreadcrumb = await importComponent();
    render(await CatalogBreadcrumb({ homePrefetch: false }));

    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveAttribute("data-prefetch", "false");
  });

  it("can opt the products breadcrumb out of automatic route prefetch", async () => {
    const CatalogBreadcrumb = await importComponent();
    const market = {
      slug: "north-america",
      label: "Primary Offer Example",
      standardLabel: "Example Standard A",
      description: "test",
      sizeSystem: "inch" as const,
      standardIds: [],
    };

    render(await CatalogBreadcrumb({ market, productsPrefetch: false }));

    const productsLink = screen.getByText("Products").closest("a");
    expect(productsLink).toHaveAttribute("href", "/products");
    expect(productsLink).toHaveAttribute("data-prefetch", "false");
  });

  it("keeps market breadcrumb home prefetch default unless explicitly changed", async () => {
    const CatalogBreadcrumb = await importComponent();
    const market = {
      slug: "north-america",
      label: "Primary Offer Example",
      standardLabel: "Example Standard A",
      description: "test",
      sizeSystem: "inch" as const,
      standardIds: [],
    };

    render(await CatalogBreadcrumb({ market }));

    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveAttribute("data-prefetch", "default");

    const productsLink = screen.getByText("Products").closest("a");
    expect(productsLink).toHaveAttribute("href", "/products");
    expect(productsLink).toHaveAttribute("data-prefetch", "default");
  });

  it("renders JSON-LD BreadcrumbList structured data", async () => {
    const CatalogBreadcrumb = await importComponent();
    const market = {
      slug: "north-america",
      label: "Primary Offer Example",
      standardLabel: "Example Standard A",
      description: "test",
      sizeSystem: "inch" as const,
      standardIds: [],
    };

    const { container } = render(await CatalogBreadcrumb({ market }));

    const scriptTag = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(scriptTag).not.toBeNull();

    const jsonLd = JSON.parse(scriptTag!.textContent!);
    expect(jsonLd["@type"]).toBe("BreadcrumbList");
    expect(jsonLd.itemListElement).toHaveLength(3);
    expect(jsonLd.itemListElement[0].position).toBe(1);
    expect(jsonLd.itemListElement[0].name).toBe("Home");
    expect(jsonLd.itemListElement[1].name).toBe("Products");
    expect(jsonLd.itemListElement[2].name).toBe("Primary Offer Example");
  });
});
