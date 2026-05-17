/**
 * Quote (RFQ) page — Phase-E narrative/trust WRAP coverage.
 *
 * Split out of `page.test.tsx` to keep that file under the repo test-size
 * bar (code-quality.md) and to make the shared R13 harness genuinely
 * consumed. The BYTE-FROZEN RFQ form assertions stay in `page.test.tsx`
 * with its local key-string translator (so the frozen pipeline keeps
 * proving exactly as before); the Phase-E wrap composition — narrative
 * sections, stubbed Phase-A trust primitives, privacy-only consent, and
 * the inline/footer trademark disclaimers — is proven here against the
 * REAL shipped EN critical bundle via `./test-utils`, so a dropped or
 * renamed copy leaf fails instead of silently passing on a key-string.
 */
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuotePage from "../page";
import { renderQuotePage } from "./test-utils";

vi.unmock("zod");

vi.mock("@/i18n/routing", async () =>
  (await import("./test-utils")).i18nRoutingFactory(),
);
// Phase-E composes the six async trust Server Components. They have
// dedicated Phase-A coverage + the E10 build proof, so the page test
// stubs them via the shared R13 harness (data-variant / data-layout /
// title surfaced). NarrativeSection is stubbed to echo title/body so the
// real shipped copy can be asserted.
vi.mock("@/components/trust", async (importOriginal) =>
  (await import("./test-utils")).trustMockFactory(
    importOriginal as () => Promise<typeof import("@/components/trust")>,
  ),
);
vi.mock("next-intl/server", async () =>
  (await import("./test-utils")).nextIntlServerFactory(),
);
vi.mock("next-intl", async () =>
  (await import("./test-utils")).nextIntlClientFactory(),
);
vi.mock("@/components/seo", async () =>
  (await import("./test-utils")).seoFactory(),
);
vi.mock("@/components/forms/lazy-turnstile", async () =>
  (await import("./test-utils")).lazyTurnstileFactory(),
);

const HERO_TITLE = "Request a Quote";
const INTAKE_BODY =
  "Tell us the part you are replacing. We confirm the compatibility path against your reviewed details and prepare a quote — no account, no sales call required.";
const SOFT_ENTRY_TITLE = "Not sure which membrane fits?";
const MATERIAL_GUIDANCE_TITLE = "Which membrane material to request";
const WHAT_HAPPENS_NEXT_TITLE = "What happens next";
const PROOF_TITLE = "Every request is checked against documented dimensions";
const BATCH_TITLE = "Batch traceability and sample options";
const ASSURANCE_NON_BINDING =
  "Quotes are non-binding until confirmed by a purchase order.";
const ASSURANCE_PRIVACY =
  "We use your details to review compatibility and prepare your quote. We do not sell your information, and we only share it with the service providers needed to process the request.";

describe("RFQ quote page — Phase-E narrative/trust wrap", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("frames the hero in a narrative intake section above everything", async () => {
    // Phase-E E2: the hero is framed by the shared narrative intake copy
    // and the soft-entry block stays below the intake and above the form.
    // Deleting the wrap or reordering fails here.
    const { container } = await renderQuotePage(QuotePage);

    expect(
      screen.getByRole("heading", { level: 1, name: HERO_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByText(INTAKE_BODY)).toBeInTheDocument();

    const order = (text: string) => {
      const el = screen.getByText(text);
      return Array.prototype.indexOf.call(container.querySelectorAll("*"), el);
    };
    expect(order(INTAKE_BODY)).toBeLessThan(order(SOFT_ENTRY_TITLE));
  });

  it("renders the material-decision guidance card below the form", async () => {
    // Phase-E E4: a NarrativeSection holding the shared
    // MaterialDecisionCard (default EPDM) renders after the RFQ form.
    const { container } = await renderQuotePage(QuotePage);

    expect(screen.getByText(MATERIAL_GUIDANCE_TITLE)).toBeInTheDocument();
    const card = screen.getByTestId("material-decision-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-default-material", "epdm");

    const order = (el: Element) =>
      Array.prototype.indexOf.call(container.querySelectorAll("*"), el);
    // The card sits below the suspended form region.
    const formRegion = container.querySelector('[class*="grid"]');
    if (formRegion) {
      expect(order(card)).toBeGreaterThan(order(formRegion));
    }
  });

  it("renders the what-happens-next SLA commitments stacked", async () => {
    // Phase-E E6: a whatHappensNext NarrativeSection holding the shared
    // SlaCommitments in the `stacked` layout.
    await renderQuotePage(QuotePage);

    expect(screen.getByText(WHAT_HAPPENS_NEXT_TITLE)).toBeInTheDocument();
    const sla = screen.getByTestId("sla-commitments");
    expect(sla).toBeInTheDocument();
    expect(sla).toHaveAttribute("data-layout", "stacked");
  });

  it("renders the compatibility-proof and batch-controls blocks", async () => {
    // Phase-E E7: a proof NarrativeSection holding the shared
    // CompatibilityProofBox, then a batch NarrativeSection holding the
    // shared BatchControlsBlock. Deleting either block or its wrap fails.
    await renderQuotePage(QuotePage);

    expect(screen.getByText(PROOF_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("compatibility-proof-box")).toBeInTheDocument();
    expect(screen.getByText(BATCH_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("batch-controls-block")).toBeInTheDocument();
  });

  it("renders non-binding + privacy assurances and a privacy-only consent", async () => {
    // Phase-E E8 (R5): the two assurances lines render, and the consent
    // line links ONLY the real privacy page. The CRR review-terms link is
    // intentionally NOT rendered in Phase E (Step 5 owns the CRR page);
    // its label must be absent and no link may target it.
    await renderQuotePage(QuotePage);

    expect(screen.getByText(ASSURANCE_NON_BINDING)).toBeInTheDocument();
    expect(screen.getByText(ASSURANCE_PRIVACY)).toBeInTheDocument();
    expect(screen.queryByText(/do not sell or share/i)).not.toBeInTheDocument();

    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" });
    expect(privacyLink).toHaveAttribute("href", "/privacy");

    // R5: the dual-link review-terms label/link must NOT be present.
    expect(
      screen.queryByText("Compatibility Review Terms"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Compatibility Review Terms" }),
    ).not.toBeInTheDocument();
  });

  it("renders the inline then footer trademark disclaimers at page bottom", async () => {
    // Phase-E E9 (R2): the OEM-referencing quote page ends with the
    // page-level inline trademark disclaimer followed by the footer one.
    // Both are the shared Phase-A primitive, distinguished by variant.
    await renderQuotePage(QuotePage);

    const disclaimers = screen.getAllByTestId("trademark-disclaimer");
    const variants = disclaimers.map((el) => el.getAttribute("data-variant"));
    expect(variants).toEqual(["inline", "footer"]);

    // Footer disclaimer is the last of the two (document order).
    const [inline, footer] = disclaimers;
    expect(
      inline.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
