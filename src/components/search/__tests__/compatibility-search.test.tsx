/**
 * @vitest-environment jsdom
 * Tests for the global compatibility search modal.
 *
 * Importing `@/components/search/compatibility-search` transitively loads
 * `@/data/product-compatibility`, which runs Zod `.parse()` at module load.
 * The global test setup mocks zod, so we must unmock it here.
 *
 * next-intl's runtime translator does not resolve messages in this jsdom unit
 * environment (the repo pattern is to mock it), so we provide a real
 * `search` translator + locale through the standard module mock.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.unmock("zod");

const SEARCH_MESSAGES: Record<string, string> = {
  placeholder: "Search by part number, OEM model, or brand...",
  label: "Compatibility search",
  noResults: 'No results for "{query}"',
  modelsHeading: "OEM models",
  productsHeading: "Tucsenberg membranes",
  requestQuote: "Request quote",
  openHint: "Search ⌘K",
  close: "Close",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const template = SEARCH_MESSAGES[key] ?? key;
    if (!values) return template;
    return template.replace(/\{(\w+)\}/g, (_m, name: string) =>
      name in values ? values[name] : `{${name}}`,
    );
  },
  useLocale: () => "en",
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const { CompatibilitySearchModal } =
  await import("@/components/search/compatibility-search");

function renderModal(isOpen: boolean, onClose = vi.fn()) {
  return render(<CompatibilitySearchModal isOpen={isOpen} onClose={onClose} />);
}

describe("CompatibilitySearchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a searchbox when open", () => {
    renderModal(true);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("does not render a searchbox when closed", () => {
    renderModal(false);
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("typing a known part number yields a matching model result", async () => {
    renderModal(true);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "00223" },
    });
    expect(await screen.findByText(/9 inch Disc/i)).toBeInTheDocument();
  });

  it("shows a no-results message for an unknown query", async () => {
    renderModal(true);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "ZZZZZ" },
    });
    expect(await screen.findByText(/no results/i)).toBeInTheDocument();
  });

  it("does not search for queries shorter than two characters", async () => {
    renderModal(true);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "0" },
    });
    await waitFor(() => {
      expect(screen.queryByText(/9 inch Disc/i)).toBeNull();
      expect(screen.queryByText(/no results/i)).toBeNull();
    });
  });

  it("links product results to the canonical descriptive membrane URL, not the SKU slug", async () => {
    renderModal(true);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "TUC-D9-EPDM" },
    });

    const productLink = await screen.findByRole("link", {
      name: /9 inch disc EPDM membrane/i,
    });
    expect(productLink).toHaveAttribute(
      "href",
      "/membranes/9-inch-epdm-disc-replacement",
    );
    // The legacy SKU slug 308-redirects; search must never emit it directly.
    expect(productLink.getAttribute("href")).not.toContain("tuc-d9-epdm");
  });

  it("request-quote link carries the OEM brand display name so the RFQ keeps brand context", async () => {
    renderModal(true);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "00223" },
    });

    const quoteLinks = await screen.findAllByRole("link", {
      name: /request quote/i,
    });
    const sanitaireQuoteLink = quoteLinks.find((link) =>
      (link.getAttribute("href") ?? "").includes(
        `brand=${encodeURIComponent("Sanitaire")}`,
      ),
    );
    // Brand display name (not a raw slug) must reach the quote form so the
    // owner's RFQ record shows "Sanitaire", not "sanitaire" or nothing.
    expect(sanitaireQuoteLink).toBeDefined();
    const href = sanitaireQuoteLink?.getAttribute("href") ?? "";
    expect(href).toContain("/quote?");
    expect(href).not.toContain("brand=sanitaire&");
    expect(href).toContain("partNumber=");
    expect(href).toContain("model=");
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    renderModal(true, onClose);
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
