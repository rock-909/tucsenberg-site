/**
 * Executable spec §4 fabrication guard. Renders the REAL
 * CompatibilitySection with the REAL canonical entry. Fit labels must come
 * only from the {Exact Fit, Verify Dimensions, Custom} i18n set resolved
 * via each model's actual fitStatus key; no fabricated model/part/fit
 * tokens may appear; real data tokens (a model name + an OEM part number
 * from the entry) must be present. Do NOT weaken this guard.
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompatibilitySection } from "../compatibility-section";
import { getProductCompatibilityByCanonicalSlug } from "@/data/product-compatibility";
import { CANONICAL_D9_EPDM, resolveMessage } from "./test-utils";

vi.unmock("zod");

// This file renders CompatibilitySection directly (not ProductPage), so it
// only needs the shared next-intl/server stub + the real-bundle
// `resolveMessage` (2-arg `(namespace, key)` form, defaults to the en
// bundle) from the shared harness.
vi.mock("next-intl/server", async () =>
  (await import("./test-utils")).nextIntlServerFactory(),
);

describe("CompatibilitySection — fabrication guard (spec §4)", () => {
  it("renders only canonical fit labels and real data, no fabricated tokens", async () => {
    const entry = getProductCompatibilityByCanonicalSlug(CANONICAL_D9_EPDM);
    expect(entry).toBeDefined();

    const Section = await CompatibilitySection({
      entry: entry!,
      locale: "en",
    });
    const { container } = render(Section);
    const text = container.textContent ?? "";

    // Every model's fit label resolves from the canonical i18n set.
    const allowedFitLabels = new Set([
      resolveMessage("membraneProduct", "compatibility.fitStatus.exact"),
      resolveMessage(
        "membraneProduct",
        "compatibility.fitStatus.verify-dimensions",
      ),
      resolveMessage("membraneProduct", "compatibility.fitStatus.custom"),
    ]);
    for (const model of entry!.compatibleOemModels) {
      const label = resolveMessage(
        "membraneProduct",
        `compatibility.fitStatus.${model.fitStatus}`,
      );
      expect(allowedFitLabels.has(label)).toBe(true);
      expect(text).toContain(label);
    }

    // Real data tokens are present.
    expect(text).toContain(entry!.compatibleOemModels[0]!.modelName);
    expect(text).toContain(entry!.compatibleOemModels[0]!.oemPartNumbers[0]!);

    // No fabricated compatibility tokens.
    for (const forbidden of [
      "TB-DSC-",
      "AFD350",
      "bayonet",
      "Recorded fit",
      "Custom review",
    ]) {
      expect(text).not.toContain(forbidden);
    }
    expect(text).not.toMatch(/\bSS-9\b/);
    expect(text).not.toMatch(/other.?batch/i);
  });
});
