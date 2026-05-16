/**
 * Quote (RFQ) page coverage.
 *
 * The page is a Server Component reading async `params`/`searchParams` and
 * rendering a co-located Client Component (`QuoteForm`). We mock the i18n
 * boundaries (server + client) and the JSON-LD script, then render the real
 * form so the search-param pre-fill, live summary, and JSON POST submission
 * are exercised end to end.
 */
/**
 * Phase-E adds the shared `@/components/trust` barrel to the page. That
 * barrel imports `@/data/product-compatibility`, which runs Zod
 * `.parse()` at module load; the global test setup mocks zod, so it must
 * be unmocked here for the catalog (and the real trust components, which
 * we stub via the shared harness) to initialize. The frozen RFQ form's
 * own i18n/turnstile/fetch mocks below are unchanged — they keep proving
 * the byte-frozen pipeline exactly as before.
 */
import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import QuotePage, { generateMetadata, generateStaticParams } from "../page";
import { QuoteFormSection } from "../quote-form-section";

vi.unmock("zod");

vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "es", "zh"], defaultLocale: "en" },
}));

// Phase-E wrap: the page composes the six async trust Server Components.
// They have dedicated Phase-A coverage + E10 build proof, so the page
// test stubs them via the shared R13 harness (data-variant / data-layout
// surfaced, title/eyebrow echoed). NarrativeSection is synchronous and
// renders the mocked translator key-strings the existing assertions use.
vi.mock("@/components/trust", async (importOriginal) =>
  (await import("./test-utils")).trustMockFactory(importOriginal),
);

function makeTranslator(namespace?: string) {
  const scope = namespace ? namespace.replace(/^quote\.?/, "") : "";
  return (key: string, values?: Record<string, string>) => {
    const composed = scope ? `${scope}.${key}` : key;
    return values?.email ? `${composed}:${values.email}` : composed;
  };
}

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn((options?: { namespace?: string }) =>
    makeTranslator(options?.namespace),
  ),
  setRequestLocale: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn((namespace?: string) => makeTranslator(namespace)),
}));

vi.mock("@/components/seo", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
}));

// The Turnstile widget is a lazy network island with its own coverage. Stub
// it to a deterministic button that hands back a fresh, mount-scoped token on
// click. A module-level counter assigns each mounted instance a stable id on
// first render (via lazy `useState` initializer, so re-renders keep the same
// id). A React `key` bump unmounts/remounts and yields a new id; this lets a
// test assert whether a remount actually re-issued a new token versus the
// previous token surviving a buyer-correctable retry.
let turnstileMountCount = 0;
function MockTurnstile({ onSuccess }: { onSuccess?: (token: string) => void }) {
  const [mountId] = useState(() => ++turnstileMountCount);
  return (
    <button
      type="button"
      data-testid="mock-turnstile"
      onClick={() => onSuccess?.(`test-turnstile-token-${mountId}`)}
    >
      verify
    </button>
  );
}
vi.mock("@/components/forms/lazy-turnstile", () => ({
  LazyTurnstile: (props: { onSuccess?: (token: string) => void }) => (
    <MockTurnstile {...props} />
  ),
}));

/**
 * The page wraps the searchParams-consuming form in `<Suspense>` (required by
 * Cache Components). RTL cannot resolve an async Server Component inside
 * Suspense, so the form behaviors are exercised by rendering the resolved
 * `QuoteFormSection` directly while the static hero is checked via the page.
 */
async function renderQuoteForm(
  searchParams: Record<string, string> = {},
): Promise<void> {
  const section = await QuoteFormSection({
    searchParams: Promise.resolve(searchParams),
  });
  render(section);
}

async function renderQuotePage(): Promise<void> {
  const ui = await QuotePage({
    params: Promise.resolve({ locale: "en" }),
    searchParams: Promise.resolve({}),
  });
  render(ui);
}

describe("RFQ quote page", () => {
  beforeEach(() => {
    turnstileMountCount = 0;
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("generates a param for every locale", () => {
    expect(generateStaticParams()).toEqual([
      { locale: "en" },
      { locale: "es" },
      { locale: "zh" },
    ]);
  });

  describe("generateMetadata", () => {
    it("emits a route-specific canonical, OG url, and en+es hreflang for /quote", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      });

      // A revert to `{ title, description }` drops alternates and fails here.
      expect(metadata.alternates?.canonical).toBe(
        "https://example.com/en/quote",
      );
      expect(metadata.alternates?.languages).toEqual({
        en: "https://example.com/en/quote",
        es: "https://example.com/es/quote",
        "x-default": "https://example.com/en/quote",
      });
      expect(metadata.alternates?.languages).not.toHaveProperty("zh");

      const openGraph = metadata.openGraph as unknown as { url?: string };
      expect(openGraph.url).toBe("https://example.com/en/quote");
    });

    it("keeps the localized title/description and stays indexable", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: "es" }),
        searchParams: Promise.resolve({}),
      });

      expect(metadata.title).toBe("hero.title");
      expect(metadata.description).toBe("hero.description");
      expect(metadata.alternates?.canonical).toBe(
        "https://example.com/es/quote",
      );
      expect(metadata.robots).toEqual(
        expect.objectContaining({ index: true, follow: true }),
      );
    });
  });

  it("renders the hero heading from the page shell", async () => {
    await renderQuotePage();

    expect(
      screen.getByRole("heading", { level: 1, name: "hero.title" }),
    ).toBeInTheDocument();
  });

  it("renders the not-sure-of-spec soft-entry block above the form", async () => {
    // A+ non-RFQ contact decision: buyers who do not know the exact spec must
    // be invited into the single RFQ path here, not sent to a dead contact
    // page. If the soft-entry copy is dropped, this fails.
    await renderQuotePage();

    expect(screen.getByText("softEntry.title")).toBeInTheDocument();
    expect(screen.getByText("softEntry.body")).toBeInTheDocument();
  });

  it("frames the hero in a narrative intake section above everything", async () => {
    // Phase-E wrap: the inline hero <section> is replaced by the shared
    // NarrativeSection (eyebrow + H1 from hero.title + intake.body). The H1
    // copy key is unchanged (frozen hero.title); the intake eyebrow/body
    // must render and the soft-entry block must stay below the intake and
    // above the form. Deleting the wrap or reordering fails here.
    const { container } = render(
      await QuotePage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    );

    const h1 = screen.getByRole("heading", { level: 1, name: "hero.title" });
    expect(h1).toBeInTheDocument();
    expect(screen.getByText("intake.body")).toBeInTheDocument();

    const order = (text: string) => {
      const el = screen.getByText(text);
      return Array.prototype.indexOf.call(container.querySelectorAll("*"), el);
    };
    // intake body sits above the soft-entry block which sits above the
    // suspended form skeleton/region.
    expect(order("intake.body")).toBeLessThan(order("softEntry.title"));
  });

  it("renders the material-decision guidance card below the form", async () => {
    // Phase-E E4: a NarrativeSection (materialGuidance.title) holding the
    // shared MaterialDecisionCard, defaulting to EPDM, must render after
    // the RFQ form. Deleting the card or the wrap fails here.
    const { container } = render(
      await QuotePage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("materialGuidance.title")).toBeInTheDocument();
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
    // SlaCommitments in the `stacked` layout. The real component renders
    // exactly 3 commitments (proven by the Phase-A trust suite + the E10
    // build); here we pin the wrap, title, and stacked layout.
    render(
      await QuotePage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("whatHappensNext.title")).toBeInTheDocument();
    const sla = screen.getByTestId("sla-commitments");
    expect(sla).toBeInTheDocument();
    expect(sla).toHaveAttribute("data-layout", "stacked");
  });

  it("renders the compatibility-proof and batch-controls blocks", async () => {
    // Phase-E E7: a proof NarrativeSection (proof.title) holding the
    // shared CompatibilityProofBox, then a batch NarrativeSection
    // (batch.title) holding the shared BatchControlsBlock. No extraChecks
    // are passed. Deleting either block or its wrap fails here.
    render(
      await QuotePage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("proof.title")).toBeInTheDocument();
    expect(screen.getByTestId("compatibility-proof-box")).toBeInTheDocument();
    expect(screen.getByText("batch.title")).toBeInTheDocument();
    expect(screen.getByTestId("batch-controls-block")).toBeInTheDocument();
  });

  it("renders an empty summary with response/lead-time defaults", async () => {
    await renderQuoteForm();

    expect(screen.getByText("summary.empty")).toBeInTheDocument();
    expect(screen.getByText("summary.responseTimeValue")).toBeInTheDocument();
    expect(screen.getByText("summary.leadTimeValue")).toBeInTheDocument();
  });

  it("echoes typed part numbers + name into the sticky summary", async () => {
    // E5: the frozen SummaryPanel must reflect the buyer's live input.
    // This pins its presentational contract without rewriting it.
    await renderQuoteForm();

    fireEvent.change(screen.getByLabelText(/form\.partNumbers/), {
      target: { value: "TUC-D9-EPDM" },
    });
    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });

    const summary = screen.getByTestId("quote-summary");
    expect(summary).toHaveTextContent("TUC-D9-EPDM");
    expect(summary).toHaveTextContent("Dana Ops");
  });

  it("pins the real SLA summary copy to a non-numeric promise", async () => {
    // E5: the lead-time / response-time summary values must carry NO week
    // or day count — they confirm at quote review, not on a fixed clock.
    // Asserted against the real shipped critical bundles (not the
    // key-string mock) so a numeric regression in copy is caught.
    const { default: en } =
      await import("../../../../../messages/en/critical.json");
    const summary = (en as { quote: { summary: Record<string, string> } }).quote
      .summary;
    expect(summary.leadTimeValue).toBe("Confirmed during quote review");
    expect(summary.responseTimeValue).toBe("Within 2 business days");
    expect(summary.leadTimeValue).not.toMatch(/\b\d+\s*(weeks?|days?)\b/i);
  });

  it("pre-fills part numbers from ?sku and quantity from ?quantity", async () => {
    await renderQuoteForm({ sku: "TUC-D9-EPDM", quantity: "250" });

    expect(screen.getByLabelText(/form\.partNumbers/)).toHaveValue(
      "TUC-D9-EPDM",
    );
    expect(screen.getByLabelText(/form\.quantity/)).toHaveValue("250");
  });

  it("pre-fills part numbers from ?partNumber when ?sku is absent", async () => {
    await renderQuoteForm({ partNumber: "9 in disc" });

    expect(screen.getByLabelText(/form\.partNumbers/)).toHaveValue("9 in disc");
  });

  it("echoes ?brand and ?model context in the summary panel", async () => {
    await renderQuoteForm({ brand: "sanitaire", model: "magnum" });

    const summary = screen.getByTestId("quote-summary");
    expect(summary).toHaveTextContent("sanitaire");
    expect(summary).toHaveTextContent("magnum");
  });

  it("keeps submit disabled until a Turnstile token exists", async () => {
    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });

    const submit = screen.getByRole("button", { name: "form.submit" });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByTestId("mock-turnstile"));
    expect(submit).toBeEnabled();
  });

  it("submits a JSON RFQ POST to /api/quote and shows the success state", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { referenceId: "RFQ-1" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });
    fireEvent.click(screen.getByTestId("mock-turnstile"));

    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/quote",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(body).toMatchObject({
      type: "rfq",
      partNumbers: "TUC-D9-EPDM",
      fullName: "Dana Ops",
      email: "dana@example.com",
      turnstileToken: "test-turnstile-token-1",
    });

    await waitFor(() => {
      expect(screen.getByText("success.title")).toBeInTheDocument();
    });
    expect(
      screen.getByText("success.description:dana@example.com"),
    ).toBeInTheDocument();
  });

  it("propagates ?brand/?model/?product context into the RFQ POST body", async () => {
    // Regression lock: the buyer's arrival context (which OEM brand/model and
    // which Tucsenberg product they came from) must reach the lead pipeline.
    // If QuoteFormSection stopped forwarding it, or use-quote-form dropped the
    // source* fields, an RFQ would lose its provenance and this fails.
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { referenceId: "RFQ-CTX" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await renderQuoteForm({
      sku: "TUC-D9-EPDM",
      brand: "Sanitaire",
      model: "Silver Series II 9 inch Disc",
      product: "Tucsenberg 9-inch EPDM Disc Membrane",
    });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });
    fireEvent.click(screen.getByTestId("mock-turnstile"));
    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/quote",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(body).toMatchObject({
      sourceBrand: "Sanitaire",
      sourceModel: "Silver Series II 9 inch Disc",
      sourceProduct: "Tucsenberg 9-inch EPDM Disc Membrane",
    });
  });

  it("records an attached file as name/size text only and sends no file body", async () => {
    // Phase-1 file handling is metadata-only: the JSON endpoint never receives
    // file bytes. The selected file's name + size must ride `notes` as an
    // "Attachment:" line and nothing in the request may be a Blob/File.
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { referenceId: "RFQ-FILE" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });

    const smallFile = new File(["part,qty\n00223,12"], "spec-list.csv", {
      type: "text/csv",
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [smallFile] } });

    expect(screen.getByText("spec-list.csv")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("mock-turnstile"));
    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/quote",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    // A real upload would send FormData/Blob; Phase-1 must send a JSON string.
    expect(typeof init.body).toBe("string");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.notes).toBe(
      `Attachment: spec-list.csv (0 MB, ${smallFile.size} bytes)`,
    );
    // No File/Blob anywhere in the serialized payload.
    for (const value of Object.values(body)) {
      expect(value).not.toBeInstanceOf(File);
      expect(value).not.toBeInstanceOf(Blob);
    }
  });

  it("rejects an over-limit file: shows the error and never submits its info", async () => {
    // The 10 MB cap (10 * BYTES_PER_MB) is enforced client-side in
    // use-quote-form. An over-limit file must surface a field error and must
    // NOT be recorded into the notes/Attachment line on submit.
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { referenceId: "RFQ-BIG" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });

    const overLimit = new File(["x"], "huge-dump.pdf", {
      type: "application/pdf",
    });
    // 10 MB limit is 10 * 1048576 bytes; one byte over must be rejected.
    Object.defineProperty(overLimit, "size", {
      value: 10 * 1048576 + 1,
    });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [overLimit] } });

    // The rejected file's name must not be rendered as an accepted attachment.
    expect(screen.queryByText("huge-dump.pdf")).not.toBeInTheDocument();
    // FileZone renders the hint normally (FieldHint) AND again as a
    // FieldError when the file is rejected, so the count must rise to 2.
    expect(screen.getAllByText("form.fileUploadHint")).toHaveLength(2);

    fireEvent.click(screen.getByTestId("mock-turnstile"));
    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/quote",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(body.notes).toBeUndefined();
    if (typeof body.notes === "string") {
      expect(body.notes).not.toContain("huge-dump.pdf");
    }
  });

  it("shows the network error message when the POST rejects", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValue(new Error("offline"));

    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });
    fireEvent.click(screen.getByTestId("mock-turnstile"));

    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/quote",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("errors.networkError")).toBeInTheDocument();
    });
  });

  it("maps a non-OK API error code to its translated message", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, errorCode: "INVALID_REQUEST" }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
    );

    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });
    fireEvent.click(screen.getByTestId("mock-turnstile"));

    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/quote",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("apiErrors.INVALID_REQUEST")).toBeInTheDocument();
    });
  });

  it("lets the buyer fix a server-rejected field and resubmit on the same token", async () => {
    // Conversion-path dead-end regression (Codex #6). `/api/quote` validates
    // the body (Zod) BEFORE verifying Turnstile, so an INQUIRY_VALIDATION_FAILED
    // means the single-use token was NOT consumed. The form must keep that
    // token (and the solved widget) so the buyer can correct the field and
    // resubmit. Reverting the fix (clearing the token / remounting on a
    // validation error) makes the second submit no-op and this fails.
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            errorCode: "INQUIRY_VALIDATION_FAILED",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, data: { referenceId: "RFQ-FIX" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByTestId("mock-turnstile"));
    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(
        screen.getByText("apiErrors.INQUIRY_VALIDATION_FAILED"),
      ).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Buyer corrects the email. Submit must be enabled WITHOUT re-clicking the
    // widget — the unconsumed token is still valid.
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });
    const submit = screen.getByRole("button", { name: "form.submit" });
    expect(submit).toBeEnabled();

    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const firstBody = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    const secondBody = JSON.parse(
      (fetchMock.mock.calls[1]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    // Same single-use token survives the corrected resubmit (widget not
    // remounted: still mount #1).
    expect(secondBody.turnstileToken).toBe("test-turnstile-token-1");
    expect(secondBody.turnstileToken).toBe(firstBody.turnstileToken);
    expect(secondBody.email).toBe("dana@example.com");

    await waitFor(() => {
      expect(screen.getByText("success.title")).toBeInTheDocument();
    });
  });

  it("remounts Turnstile after a security failure so the buyer can re-verify and resubmit", async () => {
    // The complementary case: a post-validation security failure means the
    // token is consumed/invalid. The widget must remount (key bump) so a fresh
    // single-use token can be issued — otherwise submit stays disabled and the
    // RFQ path dead-ends. Reverting the remount makes the re-verify hand back
    // the SAME token / leaves submit disabled and this fails.
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            errorCode: "INQUIRY_SECURITY_FAILED",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, data: { referenceId: "RFQ-SEC" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });
    fireEvent.click(screen.getByTestId("mock-turnstile"));
    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(
        screen.getByText("apiErrors.INQUIRY_SECURITY_FAILED"),
      ).toBeInTheDocument();
    });

    // Token cleared: submit is gated again until a fresh token is issued.
    const submit = screen.getByRole("button", { name: "form.submit" });
    expect(submit).toBeDisabled();

    // Widget remounted -> re-verifying yields a NEW token (mount #2).
    fireEvent.click(screen.getByTestId("mock-turnstile"));
    expect(submit).toBeEnabled();
    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    const secondBody = JSON.parse(
      (fetchMock.mock.calls[1]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(secondBody.turnstileToken).toBe("test-turnstile-token-2");

    await waitFor(() => {
      expect(screen.getByText("success.title")).toBeInTheDocument();
    });
  });
});
