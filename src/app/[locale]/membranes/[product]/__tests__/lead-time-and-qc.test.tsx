/**
 * C7: a text-only lead-time NarrativeSection (no table, no numeric bands)
 * followed by a QC section mounting the frozen BatchControlsBlock plus the
 * qc.sampleNote. The lead-time/QC region carries the unified word-form
 * "typically ship within one to two weeks" and none of the struck numeric
 * forms (digit day-bands, MOQ, quantity bands, 500+ pcs).
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductPage from "../page";
import {
  CANONICAL_D9_EPDM,
  renderProductPage,
  resolveMessage,
} from "./test-utils";

vi.unmock("zod");

vi.mock("next/navigation", async () =>
  (await import("./test-utils")).nextNavigationFactory(),
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

describe("Membrane product page — lead time + QC", () => {
  it("renders text-only lead time, the BatchControlsBlock and sample note with no numeric bands", async () => {
    const { container } = await renderProductPage(
      ProductPage,
      "en",
      CANONICAL_D9_EPDM,
    );

    const leadTitle = resolveMessage("en", "membraneProduct", "leadTime.title");
    const leadBody = resolveMessage("en", "membraneProduct", "leadTime.body");
    expect(screen.getByText(leadTitle)).toBeInTheDocument();
    expect(screen.getByText(leadBody)).toBeInTheDocument();

    expect(screen.getByTestId("batch-controls-block")).toBeInTheDocument();
    expect(
      screen.getByText(
        resolveMessage("en", "membraneProduct", "qc.sampleNote"),
      ),
    ).toBeInTheDocument();

    const pageText = container.textContent ?? "";
    expect(pageText).toContain("typically ship within one to two weeks");
    expect(pageText).not.toMatch(/\d+\s*[–-]\s*\d+\s*(day|days)/i);
    expect(pageText).not.toMatch(/\d+\s*day/i);
    expect(pageText).not.toMatch(/500\+?\s*(piece|pcs|pieces)/i);
    expect(pageText).not.toMatch(/\bMOQ\b/i);
    expect(pageText).not.toMatch(/quantity band|qty band/i);
  });
});
